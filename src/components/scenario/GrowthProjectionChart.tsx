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
import { Scenario } from '../../types';
import { getYearlyProjection, ProjectionPoint } from '../../utils/projection';
import { formatCurrency } from '../../utils/helpers';

interface GrowthProjectionChartProps {
  sc: Scenario;
}

export function GrowthProjectionChart({ sc }: GrowthProjectionChartProps) {
  const projection = getYearlyProjection(sc);
  const valYears = Number(sc.years) || 0;
  const buyPrice = Number(sc.buyPrice) || 0;

  // Calculate effective multiple (P/E or 100/Yield)
  const valExitMultiple = Number(sc.exitMultiple) || 0;
  const valExitYield = Number(sc.exitYield) || 0;
  const effectiveMultiple = sc.exitAssumptionType === 'Multiple'
    ? valExitMultiple
    : (valExitYield > 0 ? 100 / valExitYield : 0);

  if (valYears === 0 || projection.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 p-8 text-center">
        <div className="text-slate-400 dark:text-slate-500">
          No projection data available. Set a valid number of years and growth assumptions.
        </div>
      </div>
    );
  }

  // Prepare data for chart: focus on sellPrice and yearlyReturn
  const chartData = projection.map((point) => {
    const sellPrice = point.metricPerShare * effectiveMultiple;
    let yearlyReturn = null;
    if (buyPrice > 0 && sellPrice > 0 && point.year > 0) {
      yearlyReturn = (Math.pow(sellPrice / buyPrice, 1 / point.year) - 1) * 100;
    }

    return {
      year: point.year,
      displayYear: `Year ${point.year}`,
      sellPrice,
      yearlyReturn,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Return Projection</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Projected sell price and yearly return based on current buy price ({formatCurrency(buyPrice)})
        </p>
      </div>
      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                tickFormatter={(value) => formatCurrency(value)}
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{label}</div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between gap-8">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Sell Price:</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatCurrency(data.sellPrice)}</span>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex justify-between gap-8">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Yearly Return:</span>
                              <span className="text-xs font-bold text-emerald-600">
                                {data.yearlyReturn !== null ? `${data.yearlyReturn.toFixed(2)}%` : 'N/A'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              (if sold at this price in Year {data.year})
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="sellPrice"
                name="Sell Price"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>
            Hover over points to see projected sell price and annual return potential.
          </p>
        </div>
      </div>
    </div>
  );
}