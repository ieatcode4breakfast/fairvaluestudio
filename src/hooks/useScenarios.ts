import { useState, useCallback, useRef, useEffect } from 'react';
import { Scenario } from '../types';
import { createDefaultScenario, cloneScenario, migrateScenario } from '../utils/scenario';
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

  const [draggedTabIndex, setDraggedTabIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverRowIndices, setDragOverRowIndices] = useState<number[]>([]);
  const pendingIndexRef = useRef<number | null>(null);
  const dragOverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (draggedTabIndex === null || !tabsContainerElement) return;

    // Use relative container coordinates to ignore CSS transforms applied globally
    const containerRect = tabsContainerElement.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const tabElements = Array.from(tabsContainerElement.querySelectorAll('button[data-tab-index]')) as HTMLButtonElement[];
    if (tabElements.length === 0) return;

    // 1. Identify all unique rows (offsetTop)
    const uniqueRowTops = Array.from(new Set(tabElements.map(t => t.offsetTop))).sort((a, b) => a - b);
    
    // 2. Find the row closest to the current mouseY
    const closestRowTop = uniqueRowTops.reduce((prev, curr) => 
      Math.abs(curr - mouseY) < Math.abs(prev - mouseY) ? curr : prev
    );

    // 3. Filter tabs to only those on this specific row
    const rowTabs = tabElements.filter(t => Math.abs(t.offsetTop - closestRowTop) < 5);

    let closestIndex = dragOverIndex;
    let minDistanceX = Number.POSITIVE_INFINITY;

    // 4. Find the closest tab on this row based on mouseX
    rowTabs.forEach((tab) => {
      const indexAttr = tab.getAttribute('data-tab-index');
      if (!indexAttr) return;

      const index = parseInt(indexAttr, 10);
      
      // Still using offsetLeft (static) to ignore visual transformations (jitter fix)
      const tabCenterX = tab.offsetLeft + tab.offsetWidth / 2;
      const distanceX = Math.abs(mouseX - tabCenterX);

      if (distanceX < minDistanceX) {
        minDistanceX = distanceX;
        closestIndex = index;
      }
    });

    if (closestIndex !== null && closestIndex !== dragOverIndex) {
      if (closestIndex !== pendingIndexRef.current) {
        pendingIndexRef.current = closestIndex;
        if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
        dragOverTimeoutRef.current = setTimeout(() => {
          setDragOverIndex(closestIndex);

          // Calculate Row Indices for shifting (only current target row)
          const targetTab = tabElements.find(t => t.getAttribute('data-tab-index') === String(closestIndex));
          if (targetTab) {
            const targetTop = targetTab.offsetTop;
            const sameRow: number[] = [];
            tabElements.forEach(t => {
              const idxAttr = t.getAttribute('data-tab-index');
              if (idxAttr && Math.abs(t.offsetTop - targetTop) < 5) {
                sameRow.push(parseInt(idxAttr, 10));
              }
            });
            setDragOverRowIndices(sameRow);
          }
        }, 100);
      }
    } else if (closestIndex === null) {
      pendingIndexRef.current = null;
      if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
      setDragOverRowIndices([]);
    }
  }, [draggedTabIndex, dragOverIndex]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
    pendingIndexRef.current = null;
    setDragOverRowIndices([]);

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
    setActiveScenarioId(draggedItem.id);
    setDraggedTabIndex(null);
    setDragOverIndex(null);

    setDropSuccessIndex(dragOverIndex);
    setTimeout(() => setDropSuccessIndex(null), 800);

    setShowReorderToast(true);
    setTimeout(() => setShowReorderToast(false), 2000);
  }, [scenarios, draggedTabIndex, dragOverIndex]);

  const handleDragEnd = () => {
    if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
    pendingIndexRef.current = null;
    setDraggedTabIndex(null);
    setDragOverIndex(null);
    setDragOverRowIndices([]);
    setDropSuccessIndex(null);
    setShowReorderToast(false);
  };

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

    // Drag and drop states
    draggedTabIndex,
    dragOverIndex,
    dragOverRowIndices,
    dropSuccessIndex,
    showReorderToast,

    // Drag handlers
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
