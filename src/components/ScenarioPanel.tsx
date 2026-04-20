import React, { useState, useCallback } from 'react';
import { Scenario, Results } from '../types';

import { ScenarioMetaCard } from './scenario/ScenarioMetaCard';
import { AssumptionsCard } from './scenario/AssumptionsCard';
import { GrowthCard } from './scenario/GrowthCard';
import { ResultsCard } from './scenario/ResultsCard';


import { GrowthProjectionChart } from './scenario/GrowthProjectionChart';
import { FreeCashflowChart } from './scenario/FreeCashflowChart';

interface ScenarioPanelProps {
  sc: Scenario;
  index: number;
  totalScenarios: number;
  onUpdate: (id: number, changes: Partial<Scenario>) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  results: Results;
  currentUser: any;
}

export function ScenarioPanel({ sc, index, totalScenarios, onUpdate, onDelete, onDuplicate, results, currentUser }: ScenarioPanelProps) {
  const [ignoreTrackClickUntil, setIgnoreTrackClickUntil] = useState(0);
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());

  const handleSetHighlights = (keys: string[]) => {
    setHighlightedKeys(new Set(keys));
  };

  const handleClearHighlight = (key: string) => {
    setHighlightedKeys(prev => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const canDelete = totalScenarios > 1;

  const handleUpdate = useCallback((changes: Partial<Scenario>) => {
    // If the child component requests a reset, we handle the full reset logic here 
    // by calling createDefaultScenario in the parent, or if we pass the flag just reset the ID
    // Wait, the parent App.tsx didn't give us createDefaultScenario. 
    if ((changes as any)._resetRequest) {
      // Actually we just import createDefaultScenario and do it here:
      import('../utils/scenario').then(({ createDefaultScenario }) => {
        const fresh = createDefaultScenario();
        onUpdate(sc.id, { ...fresh, id: sc.id, showResetConfirm: false });
      });
      return;
    }

    onUpdate(sc.id, changes);
  }, [sc.id, onUpdate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-0 md:p-6">

      {/* ══ LEFT: INPUTS ══ */}
      <div className="lg:col-span-4 space-y-6">

        {/* Meta card */}
        <ScenarioMetaCard
          sc={sc}
          canDelete={canDelete}
          onDeleteClick={() => onDelete(sc.id)}
          onDuplicateClick={() => onDuplicate(sc.id)}
          onUpdate={handleUpdate}
        />

        {/* Assumptions Card */}
        <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
          <AssumptionsCard
            sc={sc}
            results={results}
            onUpdate={handleUpdate}
            highlightedKeys={highlightedKeys}
            onSetHighlights={handleSetHighlights}
            onClearHighlight={handleClearHighlight}
            currentUser={currentUser}
          />
        </div>

        {/* Growth Card */}
        <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
          <GrowthCard
            sc={sc}
            onUpdate={handleUpdate}
            ignoreTrackClickUntil={ignoreTrackClickUntil}
            setIgnoreTrackClickUntil={setIgnoreTrackClickUntil}
            highlightedKeys={highlightedKeys}
            onClearHighlight={handleClearHighlight}
          />
        </div>
      </div>

      {/* ══ RIGHT: RESULTS ══ */}
      <div className="lg:col-span-8 min-w-0">

        {/* Add an inner wrapper that handles the sticky behavior and viewport constraints */}
        <div className="space-y-6 lg:sticky lg:top-6">

          {/* Key metric cards */}
          <ResultsCard
            sc={sc}
            results={results}
          />

          {/* Growth Projection Chart */}
          {sc.dcfMethod !== 'Advanced DCF' && <GrowthProjectionChart sc={sc} results={results} />}

          {/* FCF Per Share Chart + Valuation Breakdown (Advanced DCF only) */}
          {sc.dcfMethod === 'Advanced DCF' && (
            <FreeCashflowChart sc={sc} results={results} onUpdate={handleUpdate} />
          )}

        </div>
      </div>
    </div>
  );
}
