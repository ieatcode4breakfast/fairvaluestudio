import { useState, useCallback, useEffect, useRef } from 'react';
import { ValuationMetadata, User, Scenario } from '../types';
import { getUserValuations, getScenarios, createValuation, deleteValuation, renameValuation, updateLastActiveValuation } from '../api';
import { createDefaultScenario } from '../utils/scenario';
import { genId } from '../utils/genId';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from '../utils/constants';

export function useValuations(
  currentUser: User | null,
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>,
  setActiveScenarioId: React.Dispatch<React.SetStateAction<number>>,
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>
) {
  const [userValuations, setUserValuations] = useState<ValuationMetadata[]>([]);
  const [hasFetchedValuations, setHasFetchedValuations] = useState(false);
  const [loadedValuationId, setLoadedValuationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const loadedValuationRef = useRef<string | null>(null);

  // Load user valuations when user logs in
  useEffect(() => {
    if (currentUser) {
      getUserValuations(currentUser.id).then(vals => {
        setUserValuations(vals);
        setHasFetchedValuations(true);
      }).catch(err => {
        console.error(err);
        setHasFetchedValuations(true);
      });
    } else {
      setUserValuations([]);
      setHasFetchedValuations(false);
    }
  }, [currentUser]);

  // Sync loadedValuationId to backend for user persistence
  useEffect(() => {
    if (loadedValuationRef.current !== loadedValuationId && currentUser && loadedValuationId) {
      updateLastActiveValuation(currentUser.id, loadedValuationId);
    }
    loadedValuationRef.current = loadedValuationId;
  }, [loadedValuationId, currentUser]);

  const handleLoadValuation = useCallback(async (valuationId: string) => {
    try {
      const loadedScenarios = await getScenarios(valuationId);
      const capped = loadedScenarios.slice(0, MAX_SCENARIOS);
      const loaded = capped.map(item => {
        const base = createDefaultScenario();
        return {
          ...base,
          ...item,
          id: genId(),
          splitYears: Array.isArray(item.splitYears) ? [...item.splitYears] : base.splitYears,
          metricGrowthRates: Array.isArray(item.metricGrowthRates) ? [...item.metricGrowthRates] : base.metricGrowthRates,
          metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
          revenueGrowthRates: Array.isArray(item.revenueGrowthRates) ? [...item.revenueGrowthRates] : base.revenueGrowthRates,
          finalMargins: Array.isArray(item.finalMargins) ? [...item.finalMargins] : base.finalMargins,
          sharesGrowthRates: Array.isArray(item.sharesGrowthRates) ? [...item.sharesGrowthRates] : base.sharesGrowthRates,
          hoverYear: null,
          draggingIndex: null,
          showResetConfirm: false,
          showYearlyBreakdown: false,
        };
      }) as Scenario[];
      setScenarios(loaded);
      setActiveScenarioId(loaded[0]?.id || 0);
      setLoadedValuationId(valuationId);

      const cleaned = loaded.map(sc => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach(k => delete copy[k]);
        return copy;
      });
      setLastSavedState(JSON.stringify(cleaned));
    } catch (error) {
      console.error('Failed to load valuation:', error);
    }
  }, [setScenarios, setActiveScenarioId, setLastSavedState]);

  const handleCreateNewValuation = async (newValuationName: string, newScenarios: Scenario[]) => {
    if (!currentUser || !newValuationName.trim()) return null;
    setIsSaving(true);
    try {
      const newId = await createValuation(currentUser.id, newValuationName.trim(), newScenarios);
      setUserValuations(prev => [...prev, { id: newId, valuationName: newValuationName.trim() }]);
      await handleLoadValuation(newId);
      return newId;
    } catch (e) {
      console.error('Failed to create new valuation', e);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteValuation = useCallback(async (onEmpty: () => void) => {
    if (!currentUser || !loadedValuationId) return;

    try {
      const deletedIndex = userValuations.findIndex(v => v.id === loadedValuationId);
      await deleteValuation(loadedValuationId);
      const remaining = userValuations.filter(val => val.id !== loadedValuationId);
      setUserValuations(remaining);

      if (remaining.length > 0) {
        const nextIndex = Math.max(0, deletedIndex - 1);
        handleLoadValuation(remaining[nextIndex].id);
      } else {
        onEmpty();
      }
    } catch (error) {
      console.error('Failed to delete valuation:', error);
    }
  }, [currentUser, loadedValuationId, userValuations, handleLoadValuation]);

  const handleRenameValuation = async (newName: string) => {
    if (!loadedValuationId || !newName.trim()) return;
    try {
      await renameValuation(loadedValuationId, newName.trim());
      setUserValuations(prev => prev.map(v => v.id === loadedValuationId ? { ...v, valuationName: newName.trim() } : v));
    } catch (err) {
      console.error(err);
    }
  };

  return {
    userValuations,
    setUserValuations,
    hasFetchedValuations,
    loadedValuationId,
    setLoadedValuationId,
    isSaving,
    setIsSaving,
    handleLoadValuation,
    handleCreateNewValuation,
    handleDeleteValuation,
    handleRenameValuation
  };
}
