import React from 'react';
import { Results, Scenario } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/helpers';
import { getSimpleLabels } from '../../utils/summary';

interface ResultsCardProps {
  sc: Scenario;
  results: Results;
}

export function ResultsCard({ sc, results }: ResultsCardProps) {
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const lbl = isSimple ? getSimpleLabels(sc) : null;

  const mosColor = results.marginOfSafety !== null ? (results.marginOfSafety > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const upsideColor = results.upside !== null ? (results.upside > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const irrColor = results.irr && results.irr > (Number(sc.discountRate) || 0) ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 flex flex-col justify-between min-w-0">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Intrinsic Value</div>
        <div className="text-5xl md:text-6xl font-light tracking-tight text-slate-900 dark:text-slate-100 truncate">{formatCurrency(results.intrinsicValueTotal)}</div>
        <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Total Present Value</div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 flex flex-col justify-between min-w-0">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Margin of Safety</div>
        <div className={`text-4xl font-light tracking-tight truncate ${mosColor}`}>{formatPercent(results.marginOfSafety)}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Discount to Intrinsic Value</div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 flex flex-col justify-between min-w-0">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Upside</div>
        <div className={`text-4xl font-light tracking-tight truncate ${upsideColor}`}>{formatPercent(results.upside)}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Potential return to Intrinsic Value</div>
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 flex flex-col justify-between min-w-0">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Internal Rate of Return (Annual Return)</div>
        <div className={`text-4xl font-light tracking-tight truncate ${irrColor}`}>{formatPercent(results.irr)}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">At current buy price</div>
      </div>
    </div>
  );
}
