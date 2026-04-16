import React from 'react';
import { Results, Scenario } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { InfoIcon, ChevronDown } from '../Icons';
import { getSimpleLabels } from '../../utils/summary';

interface YearlyBreakdownProps {
  sc: Scenario;
  results: Results;
  onUpdate: (changes: Partial<Scenario>) => void;
}

export function YearlyBreakdown({ sc, results, onUpdate }: YearlyBreakdownProps) {
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const valYears = Number(sc.years) || 0;
  const lbl = isSimple ? getSimpleLabels(sc) : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Valuation Breakdown</h2>
        {isSimple && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            This Basic DCF method does not discount yearly cash flows. Instead, it treats the exit price at year {valYears || 'N'} as the sole cash flow, discounting it back to present value. This approach places greater emphasis on price appreciation rather and does not account for interim income.
          </p>
        )}
      </div>

      {isSimple && lbl && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3">Component</th>
                <th className="px-6 py-3 text-right">Value Per Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{lbl.labelProjectedFinal} (Year {valYears})</td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(results.finalMetricPerShare)}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  Terminal Value ({sc.exitAssumptionType === 'Multiple' ? 'Exit Multiple applied' : 'Exit Yield applied'})
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(results.terminalValuePerShare)}</td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700 font-medium">
                <td className="px-6 py-4 text-slate-900 dark:text-slate-200">Present Value (Intrinsic Value)</td>
                <td className="px-6 py-4 text-right text-indigo-600 dark:text-indigo-400">{formatCurrency(results.intrinsicValueTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!isSimple && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3">Component</th>
                <th className="px-6 py-3 text-right">Value Per Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => onUpdate({ showYearlyBreakdown: !sc.showYearlyBreakdown })}>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                   Present Value of Yearly Cash Flows
                  <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${sc.showYearlyBreakdown ? 'rotate-180' : ''}`} />
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(results.pvOfCashFlows)}</td>
              </tr>
              {sc.showYearlyBreakdown && (
                <tr className="bg-slate-50/30 dark:bg-slate-700/30">
                  <td colSpan={2} className="px-6 py-4">
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900">
                      {results.yearlyDetails.map((d, i) => (
                        <div key={i} className="flex justify-between max-w-sm">
                          <span>Year {i + 1}: {formatCurrency(d.cf)}</span>
                          <span className="text-slate-400 dark:text-slate-500">(PV: {formatCurrency(d.pv)})</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  Terminal Value ({sc.exitAssumptionType === 'Multiple' ? 'Exit Multiple' : sc.exitAssumptionType === 'Yield' ? 'Exit Yield' : 'Growth in Perpetuity'})
                </td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(results.terminalValuePerShare)}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">Present Value of Terminal Value</td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{formatCurrency(results.presentValueTV)}</td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-700 font-medium">
                <td className="px-6 py-4 text-slate-900 dark:text-slate-200">Present Value (Intrinsic Value)</td>
                <td className="px-6 py-4 text-right text-indigo-600 dark:text-indigo-400">{formatCurrency(results.intrinsicValueTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
