import { useState, useCallback, useRef, useEffect } from 'react';
import { Scenario } from '../types';
import { createDefaultScenario, cloneScenario } from '../utils/scenario';
import { MAX_SCENARIOS, TRANSIENT_KEYS } from '../utils/constants';
import { genId } from '../utils/genId';
import { User } from '../types';

export const LOCAL_STORAGE_KEY = 'fairvalue_scenarios';

export function loadInitialScenarios(): Scenario[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
          const capped = parsed.slice(0, MAX_SCENARIOS);
        return capped.map(item => {
          const base = createDefaultScenario();
          const migrated: any = {
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

          // ── Migration Logic ──
          if (item.simpleCurrentMetricPerShare !== undefined && (item.currentMetricPerShare === '' || item.currentMetricPerShare === undefined)) {
            migrated.currentMetricPerShare = item.simpleCurrentMetricPerShare;
          }
          if (item.simpleCurrentMetricTotal !== undefined && (item.currentMetricTotal === '' || item.currentMetricTotal === undefined)) {
            migrated.currentMetricTotal = item.simpleCurrentMetricTotal;
          }
          if (item.simpleCurrentRevenue !== undefined && (item.currentRevenue === '' || item.currentRevenue === undefined)) {
            migrated.currentRevenue = item.simpleCurrentRevenue;
          }
          if (item.simpleCurrentShares !== undefined && (item.currentShares === '' || item.currentShares === undefined)) {
            migrated.currentShares = item.simpleCurrentShares;
          }
          if (item.simpleInMillions !== undefined) {
             migrated.inMillions = item.simpleInMillions;
          }

          return migrated as Scenario;
        }) as Scenario[];
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

  // Drag state
  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropSuccessIndex, setDropSuccessIndex] = useState<number | null>(null);
  const [showReorderToast, setShowReorderToast] = useState(false);

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
      if ('years' in changes) {
        const valYears = Number(merged.years) || 0;
        merged.splitYears = merged.splitYears.filter(y => y < valYears).sort((a, b) => a - b);
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

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    setDraggedTabIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, tabsContainerElement: HTMLDivElement | null) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }

    if (draggedTabIndex === null || !tabsContainerElement) return;

    const tabElements = Array.from(tabsContainerElement.querySelectorAll('button[data-tab-index]')) as HTMLButtonElement[];
    let closestIndex = dragOverIndex;
    let minDistance = Number.POSITIVE_INFINITY;

    tabElements.forEach((tab) => {
      const indexAttr = tab.getAttribute('data-tab-index');
      if (!indexAttr) return;

      const index = parseInt(indexAttr, 10);
      const rect = tab.getBoundingClientRect();
      const tabCenter = rect.left + rect.width / 2;
      const distance = Math.abs(e.clientX - tabCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== null && closestIndex !== dragOverIndex) {
      setDragOverIndex(closestIndex);
    }
  }, [draggedTabIndex, dragOverIndex]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedTabIndex === null || dragOverIndex === null || draggedTabIndex === dragOverIndex) {
      setDragOverIndex(null);
      setDraggedTabIndex(null);
      return;
    }

    const newScenarios = [...scenarios];
    const draggedItem = newScenarios[draggedTabIndex];
    newScenarios.splice(draggedTabIndex, 1);
    newScenarios.splice(dragOverIndex, 0, draggedItem);

    setScenarios(newScenarios);
    setDraggedTabIndex(null);
    setDragOverIndex(null);

    setDropSuccessIndex(dragOverIndex);
    setTimeout(() => setDropSuccessIndex(null), 800);

    setShowReorderToast(true);
    setTimeout(() => setShowReorderToast(false), 2000);
  }, [scenarios, draggedTabIndex, dragOverIndex]);

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setDropSuccessIndex(null);
    setShowReorderToast(false);
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

    // Drag and drop states
    draggedTabIndex,
    dragOverIndex,
    dropSuccessIndex,
    showReorderToast,

    // Drag handlers
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
