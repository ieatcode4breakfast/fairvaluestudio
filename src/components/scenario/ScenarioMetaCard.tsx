import React, { useState, useRef, useEffect } from 'react';
import { Scenario } from '../../types';
import { Trash2, RotateCcw, Copy } from '../Icons';
import { INPUT_CLS, SELECT_CLS } from '../../utils/constants';

interface ScenarioMetaCardProps {
  sc: Scenario;
  canDelete: boolean;
  onDeleteClick: () => void;
  onDuplicateClick: () => void;
  onUpdate: (changes: Partial<Scenario>) => void;
}

export function ScenarioMetaCard({ sc, canDelete, onDeleteClick, onDuplicateClick, onUpdate }: ScenarioMetaCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  useEffect(() => {
    setDeleteConfirm(false);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }, [sc.id]);

  const handleDeleteClick = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(false), 3000);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      onDeleteClick();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Scenario Name</label>
      <input
        type="text"
        value={sc.scenarioName}
        onChange={e => onUpdate({ scenarioName: e.target.value })}
        maxLength={50}
        placeholder="e.g. AAPL - Base Case"
        className={INPUT_CLS}
      />

      <button
        onClick={onDuplicateClick}
        className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800 transition-colors"
      >
        <Copy className="w-4 h-4" />
        Copy Scenario
      </button>

      <button
        onClick={() => {
          if (!sc.showResetConfirm) {
            onUpdate({ showResetConfirm: true });
            setTimeout(() => onUpdate({ showResetConfirm: false }), 3000);
          } else {
            // we let the parent handle the FULL reset because we need createDefaultScenario. Wait, parent doesn't handle the inner reset right now!
            // No problem, we can pass a special flag or the parent has the scenario. let App handle it or we do it here.
            // Better to handle reset here. But `createDefaultScenario` requires genId. I will just dispatch an event:
            onUpdate({ _resetRequest: true } as any);
          }
        }}
        className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${sc.showResetConfirm
          ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
          }`}
      >
        <RotateCcw className="w-4 h-4" />
        {sc.showResetConfirm ? 'Are you sure? (Click to confirm)' : 'Reset Scenario'}
      </button>

      {canDelete && (
        <button
          onClick={handleDeleteClick}
          className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${deleteConfirm
            ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
            : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800'
            }`}
        >
          <Trash2 className="w-4 h-4" />
          {deleteConfirm ? 'Are you sure? Click to confirm' : 'Delete Scenario'}
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Method</label>
        <select
          value={sc.dcfMethod}
          onChange={e => {
            const newMethod = e.target.value;
            const changes: Partial<Scenario> = { dcfMethod: newMethod as any };
            if (newMethod === 'Basic DCF') {
              if (Number(sc.years) > 10) changes.years = 10;
              if (sc.exitAssumptionType === 'Perpetuity Growth') changes.exitAssumptionType = 'Multiple';
            }
            onUpdate(changes);
          }}
          className={SELECT_CLS}
        >
          <option value="Basic DCF">Basic DCF</option>
          <option value="Advanced DCF">Advanced DCF</option>
        </select>
      </div>

      {sc.dcfMethod === 'Basic DCF' && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Metric</label>
            <select value={sc.simpleMetricType} onChange={e => onUpdate({ simpleMetricType: e.target.value })} className={SELECT_CLS}>
              <option>Free Cash Flow</option>
              <option>Net Income (Earnings)</option>
              <option>Custom</option>
            </select>
          </div>
          {sc.simpleMetricType === 'Custom' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Custom Metric Name</label>
              <input
                type="text"
                value={sc.simpleCustomMetric}
                onChange={e => onUpdate({ simpleCustomMetric: e.target.value })}
                placeholder="e.g. EBITDA, Operating Cash Flow"
                className={INPUT_CLS}
              />
            </div>
          )}
          <div>
            {(() => {
              let m1 = 'Metric';
              let m2 = 'Metric';
              if (sc.simpleMetricType === 'Free Cash Flow') {
                m1 = 'Total FCF';
                m2 = 'FCF';
              } else if (sc.simpleMetricType === 'Net Income (Earnings)') {
                m1 = 'Net Income';
                m2 = 'Net Income';
              } else if (sc.simpleMetricType === 'Custom') {
                m1 = sc.simpleCustomMetric || 'Custom Metric';
                m2 = sc.simpleCustomMetric || 'Custom Metric';
              }
              return (
                <select value={sc.simpleProjectionMethod} onChange={e => onUpdate({ simpleProjectionMethod: e.target.value })} className={SELECT_CLS}>
                  <option value="Per Share">Per Share</option>
                  <option value="Metric, Share Count">{m1}, Share Count</option>
                  <option value="Revenue, Metric Margin, Share Count">Revenue, {m2} Margin, Share Count</option>
                </select>
              );
            })()}
          </div>
        </div>
      )}

      {sc.dcfMethod !== 'Basic DCF' && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <select value={sc.projectionMethod} onChange={e => onUpdate({ projectionMethod: e.target.value })} className={SELECT_CLS}>
            <option value="Per Share Method">Per Share</option>
            <option value="Total FCF, Share Count">Total FCF, Share Count</option>
            <option value="Revenue, FCF Margin, Share Count">Revenue, FCF Margin, Share Count</option>
          </select>
        </div>
      )}
    </div>
  );
}
