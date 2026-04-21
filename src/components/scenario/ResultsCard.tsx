import React, { useState } from 'react';
import { Results, Scenario } from '../../types';
import { formatCurrency, formatPercent, isScenarioIncomplete } from '../../utils/helpers';
import { getSimpleLabels } from '../../utils/summary';
import { ChevronDown } from 'lucide-react';


interface ResultsCardProps {
  sc: Scenario;
  results: Results;
}

export function ResultsCard({ sc, results }: ResultsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSimple = sc.dcfMethod === 'Basic DCF';
  const lbl = isSimple ? getSimpleLabels(sc) : null;
  const incomplete = isScenarioIncomplete(sc);

  const mosColor = results.marginOfSafety !== null ? (results.marginOfSafety > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const upsideColor = results.upside !== null ? (results.upside > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const irrColor = results.irr && results.irr > (Number(sc.discountRate) || 0) ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Main Metric: Intrinsic Value */}
      <div 
        className="p-5 lg:p-6 lg:md:p-8 border-b border-slate-100 dark:border-slate-700 cursor-pointer sm:cursor-default transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/30 sm:hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 select-text">
              Intrinsic Value
              {incomplete && <span className="text-red-500 ml-1.5 text-xs font-normal">(inputs incomplete)</span>}
            </div>
            <div className="text-5xl md:text-6xl font-light tracking-tight text-slate-900 dark:text-slate-100 truncate select-text">
              {formatCurrency(incomplete ? null : results.intrinsicValueTotal)}
            </div>
          </div>
          <div className={`sm:hidden transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-6 h-6 text-slate-400" />
          </div>
        </div>

        <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          {isSimple
            ? `The price you have to pay for a yearly return of ${formatPercent(Number(sc.discountRate) || 0)}`
            : 'Total Present Value'}
        </div>
      </div>


      {/* Secondary Metrics Grid */}
      <div className={`${isExpanded ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-700 border-t sm:border-t-0 border-slate-100 dark:border-slate-700`}>

        {/* Margin of Safety */}
        <div className="px-5 py-2.5 lg:px-6 lg:py-3 lg:md:px-8 lg:md:py-4 flex flex-col justify-between min-w-0">


          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 select-text">Margin of Safety</div>
            <div className={`text-3xl font-light tracking-tight truncate select-text ${mosColor}`}>
              {formatPercent(results.marginOfSafety)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">Discount</div>
        </div>

        {/* Upside */}
        <div className="px-5 py-2.5 lg:px-6 lg:py-3 lg:md:px-8 lg:md:py-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 select-text">Upside</div>
            <div className={`text-3xl font-light tracking-tight truncate select-text ${upsideColor}`}>
              {formatPercent(results.upside)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">To intrinsic value</div>
        </div>

        {/* IRR */}
        <div className="px-5 py-2.5 lg:px-6 lg:py-3 lg:md:px-8 lg:md:py-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 select-text">
              {isSimple ? 'Yearly Return' : 'Internal Rate of Return (IRR)'}
            </div>
            <div className={`text-3xl font-light tracking-tight truncate select-text ${irrColor}`}>
              {formatPercent(results.irr)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider">Return</div>
        </div>
      </div>
    </div>
  );
}
