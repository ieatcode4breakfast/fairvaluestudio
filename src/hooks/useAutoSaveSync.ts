import { useEffect, useRef } from 'react';
import { supabase, updateValuation, getScenarios } from '../api';
import { Scenario, User, ValuationMetadata } from '../types';
import { createDefaultScenario } from '../utils/scenario';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from '../utils/constants';

export function useAutoSaveSync(
  loadedValuationId: string | null,
  currentUser: User | null,
  userValuations: ValuationMetadata[],
  scenarios: Scenario[],
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>,
  currentCleaned: string,
  isDirty: boolean,
  setLastSavedState: React.Dispatch<React.SetStateAction<string>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>
) {
  const ignoreNextSaveRef = useRef(false);

  // Realtime subscription effect
  useEffect(() => {
    if (!loadedValuationId) return;

    const channel = supabase.channel(`public:valuations:id=eq.${loadedValuationId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'valuations', filter: `id=eq.${loadedValuationId}` },
        async () => {
          try {
            const loadedScenarios = await getScenarios(loadedValuationId);
            if (loadedScenarios && loadedScenarios.length > 0) {
              const capped = loadedScenarios.slice(0, MAX_SCENARIOS);
              const mappedOut = capped.map(item => {
                const base = createDefaultScenario();
                return {
                  ...base,
                  ...item,
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

              const incomingCleaned = JSON.stringify(mappedOut.map(sc => {
                const copy: any = { ...sc };
                TRANSIENT_KEYS.forEach(k => delete copy[k]);
                return copy;
              }));

              if (incomingCleaned !== currentCleaned) {
                ignoreNextSaveRef.current = true;
                setScenarios(mappedOut);
                setLastSavedState(incomingCleaned);
              }
            }
          } catch (error) {
            console.error("Failed to sync realtime changes", error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadedValuationId, currentCleaned, setScenarios, setLastSavedState]);

  // Auto-save effect
  useEffect(() => {
    if (!isDirty || !loadedValuationId || !currentUser) return;
    if (ignoreNextSaveRef.current) {
      ignoreNextSaveRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const valName = userValuations.find(v => v.id === loadedValuationId)?.valuationName || 'valuation';
        const cleaned = JSON.parse(currentCleaned);
        await updateValuation(loadedValuationId, valName, cleaned);
        setLastSavedState(currentCleaned);
      } catch (e) {
        console.error("Auto-save failed:", e);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isDirty, currentCleaned, loadedValuationId, currentUser, userValuations, setLastSavedState, setIsSaving]);

  return { ignoreNextSaveRef };
}
