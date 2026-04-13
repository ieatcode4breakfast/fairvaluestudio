import React, { useState, useCallback } from 'react';
import { Scenario, Results } from '../types';

import { ScenarioMetaCard } from './scenario/ScenarioMetaCard';
import { AssumptionsCard } from './scenario/AssumptionsCard';
import { GrowthCard } from './scenario/GrowthCard';
import { ResultsCard } from './scenario/ResultsCard';
import { YearlyBreakdown } from './scenario/YearlyBreakdown';

interface ScenarioPanelProps {
  sc: Scenario;
  index: number;
  totalScenarios: number;
  onUpdate: (id: number, changes: Partial<Scenario>) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  results: Results;
}

export function ScenarioPanel({ sc, index, totalScenarios, onUpdate, onDelete, onDuplicate, results }: ScenarioPanelProps) {
  const [ignoreTrackClickUntil, setIgnoreTrackClickUntil] = useState(0);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">

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

        {/* COMBINED: Assumptions & Growth card wrapper */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          <AssumptionsCard
            sc={sc}
            results={results}
            onUpdate={handleUpdate}
          />

          <GrowthCard
            sc={sc}
            onUpdate={handleUpdate}
            ignoreTrackClickUntil={ignoreTrackClickUntil}
            setIgnoreTrackClickUntil={setIgnoreTrackClickUntil}
          />

        </div>
      </div>

      {/* ══ RIGHT: RESULTS ══ */}
      <div className="lg:col-span-8 space-y-6">

        {/* Key metric cards */}
        <ResultsCard
          sc={sc}
          results={results}
        />

        {/* Valuation Breakdown */}
        <YearlyBreakdown
          sc={sc}
          results={results}
          onUpdate={handleUpdate}
        />

      </div>
    </div>
  );
}
