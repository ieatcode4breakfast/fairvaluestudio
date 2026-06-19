import { useState, useCallback, useEffect } from 'react';
import { Scenario } from '../types';
import { createDefaultScenario, cloneScenario, migrateScenario } from '../utils/scenario';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from '../utils/constants';
import { genId } from '../utils/genId';
import { User } from '../types';

const LOCAL_STORAGE_KEY = 'fairvalue_scenarios';

export function loadInitialScenarios(): Scenario[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
          const capped = parsed.slice(0, MAX_SCENARIOS);
        return capped.map(item => migrateScenario(item));
      }
    }
  } catch (err) {
    console.error('Failed to load scenarios from local storage:', err);
  }
  return [createDefaultScenario()];
}

export function useScenarios(currentUser: User | null) {
  const [scenarios, setScenarios] = useState<Scenario[]>(loadInitialScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<number>(() => scenarios[0]?.id || 0);

  // We expose this so that other hooks/components know what the clean stringified state is
  const getCleanedScenariosString = useCallback((scs: Scenario[]) => {
    return JSON.stringify(scs.map(sc => {
      const copy: any = { ...sc };
      TRANSIENT_KEYS.forEach(k => delete copy[k]);
      return copy;
    }));
  }, []);

  const [lastSavedState, setLastSavedState] = useState<string>(() => getCleanedScenariosString(scenarios));
  const currentCleaned = getCleanedScenariosString(scenarios);
  const isDirty = currentCleaned !== lastSavedState;

  // Guest localStorage persistence — write on every scenarios change when not logged in
  useEffect(() => {
    if (currentUser) return; // logged-in users persist via Supabase
    try {
      const cleaned = scenarios.map(sc => {
        const copy: any = { ...sc };
        TRANSIENT_KEYS.forEach(k => delete copy[k]);
        return copy;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [scenarios, currentUser]);

  const updateScenario = useCallback((id: number, changes: Partial<Scenario>) => {
    setScenarios(prev => prev.map(sc => {
      if (sc.id !== id) return sc;
      const merged = { ...sc, ...changes } as Scenario;
      if ('years' in changes || 'dcfMethod' in changes) {
        const maxY = merged.dcfMethod === 'Basic DCF' ? 10 : 50;
        if (Number(merged.years) > maxY) merged.years = maxY;
      }
      // Phase trimming is intentionally deferred to onBlur (via _trimPhases flag).
      // This prevents mid-typing keystrokes (e.g. typing "1" before "10") from
      // prematurely nuking phases. sc.years still updates live for chart reactivity.
      if ((changes as any)._trimPhases) {
        const valYears = Number(merged.years) || 0;
        const prevSplitCount = merged.splitYears.length;
        merged.splitYears = merged.splitYears.filter(y => y < valYears).sort((a, b) => a - b);
        const removedCount = prevSplitCount - merged.splitYears.length;
        if (removedCount > 0) {
          // Trim trailing rate array entries to match the new phase count.
          // Years increasing needs no action — the last phase stretches automatically.
          const keepCount = merged.splitYears.length + 1;
          const trim = (arr: any[]) => arr.slice(0, keepCount);
          merged.metricGrowthRates      = trim(merged.metricGrowthRates);
          merged.metricGrowthRatesTotal = trim(merged.metricGrowthRatesTotal);
          merged.revenueGrowthRates     = trim(merged.revenueGrowthRates);
          merged.finalMargins           = trim(merged.finalMargins);
          merged.sharesGrowthRates      = trim(merged.sharesGrowthRates);
        }
      }
      return merged;
    }));
  }, []);

  const deleteScenario = useCallback((id: number) => {
    const idx = scenarios.findIndex(sc => sc.id === id);
    if (idx === -1) return;
    const next = scenarios.filter(sc => sc.id !== id);
    setScenarios(next);
    if (id === activeScenarioId && next.length > 0) {
      setActiveScenarioId(next[Math.max(0, idx - 1)].id);
    }
  }, [scenarios, activeScenarioId]);

  const addScenario = useCallback(() => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const newSc = createDefaultScenario();
    setScenarios([...scenarios, newSc]);
    setActiveScenarioId(newSc.id);
  }, [scenarios, activeScenarioId]);

  const duplicateScenario = useCallback((id: number) => {
    const srcIndex = scenarios.findIndex(sc => sc.id === id);
    if (srcIndex === -1 || scenarios.length >= MAX_SCENARIOS) return;
    const newSc = cloneScenario(scenarios[srcIndex]);
    newSc.id = genId();
    newSc.scenarioName = `${newSc.scenarioName || 'Untitled'} (Copy)`;
    const copyScenarios = [...scenarios];
    copyScenarios.splice(srcIndex + 1, 0, newSc);
    setScenarios(copyScenarios);
    setActiveScenarioId(newSc.id);
  }, [scenarios]);

  const onReorder = (newOrder: Scenario[]) => {
    setScenarios(newOrder);
  };

  return {
    scenarios,
    setScenarios,
    activeScenarioId,
    setActiveScenarioId,
    lastSavedState,
    setLastSavedState,
    currentCleaned,
    isDirty,
    getCleanedScenariosString,

    // Actions
    updateScenario,
    deleteScenario,
    addScenario,
    duplicateScenario,
    onReorder,
  };
}
