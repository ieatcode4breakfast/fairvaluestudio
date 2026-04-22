import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Scenario, Results } from '../../types';
import { formatCurrency, formatCompactNumber } from '../../utils/helpers';
import { ChevronDown } from '../Icons';

interface FreeCashflowChartProps {
  sc: Scenario;
  results: Results;
  onUpdate: (changes: Partial<Scenario>) => void;
}

export function FreeCashflowChart({ sc, results, onUpdate }: FreeCashflowChartProps) {
  const valYears = Number(sc.years) || 0;
  const { yearlyDetails } = results;

  const terminalTypeLabel = sc.exitAssumptionType === 'Multiple'
    ? 'Exit Multiple'
    : sc.exitAssumptionType === 'Yield'
      ? 'Exit Yield'
      : 'Growth in Perpetuity';

  if (valYears === 0 || yearlyDetails.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 p-8 text-center">
        <div className="text-slate-400 dark:text-slate-500">
          No projection data available. Set a valid number of years and growth assumptions.
        </div>
      </div>
    );
  }

  const chartData = yearlyDetails.map((d) => ({
    year: d.year,
    displayYear: `Year ${d.year}`,
    fcfPerShare: d.cf,
    presentValue: d.pv,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden select-none">
      <div className="pt-5 px-5 pb-0 lg:pt-4 lg:px-6 lg:pb-0 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Yearly Cash Flow Per Share Projection</h3>
        
        {/* Integrated Breakdown Accordion */}
        <div 
          className="mt-3 py-3 border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer -mx-5 lg:-mx-6 px-5 lg:px-6"
          onClick={() => onUpdate({ showYearlyBreakdown: !sc.showYearlyBreakdown })}
        >
          <div className="flex justify-between items-center text-sm">
            <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 ml-4">
              Intrinsic Value (Present Value of Cash Flows)
              <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${sc.showYearlyBreakdown ? 'rotate-180' : ''}`} />
            </div>
            <div className="text-right text-indigo-600 dark:text-indigo-400 font-bold">
              {formatCurrency(results.intrinsicValueTotal)}
            </div>
          </div>
        </div>

        {/* Integrated Detail List */}
        {sc.showYearlyBreakdown && (
          <div className="mt-1 pt-3 pb-4 border-t border-slate-100 dark:border-slate-700 -mx-5 lg:-mx-6 px-5 lg:px-6 bg-slate-50/30 dark:bg-slate-700/30">
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900">
              {results.yearlyDetails.map((d, i) => (
                <div key={i} className="flex justify-between w-full py-0.5">
                  <span>Year {d.year}: {formatCurrency(d.cf)}</span>
                  <span className="text-slate-400 dark:text-slate-500">(PV: {formatCurrency(d.pv)})</span>
                </div>
              ))}
              <div className="flex justify-between w-full pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Terminal Value ({terminalTypeLabel}): {formatCurrency(results.terminalValuePerShare)}</span>
                <span className="text-slate-400 dark:text-slate-500">(PV: {formatCurrency(results.presentValueTV)})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 lg:p-6">
        <div className="h-[280px] sm:h-auto sm:aspect-[2.1/1]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              accessibilityLayer={false}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="displayYear"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => formatCompactNumber(value)}
                width={55}
              />
              <Tooltip
                wrapperStyle={{
                  maxWidth: 'calc(100vw - 80px)',
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word',
                  zIndex: 1000,
                }}
                contentStyle={{
                  padding: '1rem',
                  whiteSpace: 'normal',
                }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{label}</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between gap-4 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Cash Flow Per Share:</span>
                            <span className="text-xs font-bold text-blue-500">{formatCurrency(data.fcfPerShare)}</span>
                          </div>
                          <div className="flex justify-between gap-4 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Present Value:</span>
                            <span className="text-xs font-bold text-violet-500">{formatCurrency(data.presentValue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => (
                  <span className="text-slate-500 dark:text-slate-400">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="fcfPerShare"
                name="Cash Flow Per Share"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="presentValue"
                name="Present Value"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>Hover over points to see Cash Flow Per Share and its present value.</p>
        </div>
      </div>
    </div>
  );
}
