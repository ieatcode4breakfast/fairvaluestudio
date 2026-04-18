import React, { useState } from 'react';
import { Scenario, Results } from '../types';
import { ChevronDown, ChevronUp } from './Icons';

interface Props {
  scenarios: Scenario[];
  allResults: Results[];
}

export function ScenarioComparisonTable({ scenarios, allResults }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden mt-5 mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Compare Scenarios</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3">Scenario Name</th>
                <th className="p-3 text-right">Intrinsic Value</th>
                <th className="p-3 text-right">Margin of Safety</th>
                <th className="p-3 text-right">Upside</th>
                <th className="p-3 text-right">IRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {scenarios.map((sc, i) => {
                const res = allResults[i];
                const iv = res?.intrinsicValueTotal ?? 0;
                const mos = res?.marginOfSafety ?? 0;
                const upside = res?.upside ?? 0;
                const irr = res?.irr ?? 0;

                const mosColor = mos > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
                const upsideColor = upside > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
                const irrColor = irr > (Number(sc.discountRate) || 0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300';

                return (
                  <tr key={sc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-300 whitespace-nowrap">
                      {sc.scenarioName || `Scenario ${i + 1}`}
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-800 dark:text-slate-300 text-right whitespace-nowrap">
                      {iv.toFixed(2)}
                    </td>
                    <td className={`p-3 text-sm font-medium text-right whitespace-nowrap ${mosColor}`}>
                      {mos.toFixed(1)}%
                    </td>
                    <td className={`p-3 text-sm font-medium text-right whitespace-nowrap ${upsideColor}`}>
                      {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
                    </td>
                    <td className={`p-3 text-sm font-medium text-right whitespace-nowrap ${irrColor}`}>
                      {irr.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
