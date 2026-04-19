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

  if (valYears === 0 || projection.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 p-8 text-center">
        <div className="text-slate-400 dark:text-slate-500">
          No projection data available. Set a valid number of years and growth assumptions.
        </div>
      </div>
    );
  }

  // Determine chart title and metric label based on scenario configuration
  const getMetricLabel = () => {
    if (sc.dcfMethod === 'Basic DCF') {
      if (sc.simpleMetricType === 'Net Income (Earnings)') return 'Earnings Per Share (EPS)';
      if (sc.simpleMetricType === 'Custom') return 'Custom Metric Per Share';
      return 'Free Cash Flow Per Share';
    } else {
      if (sc.projectionMethod === 'Per Share Method') return 'Free Cash Flow Per Share';
      if (sc.projectionMethod === 'Total FCF, Share Count') return 'Free Cash Flow Per Share';
      return 'Metric Per Share';
    }
  };

  const metricLabel = getMetricLabel();

  // Prepare data for chart: include metricPerShare and optionally revenue & shares
  const chartData = projection.map((point) => ({
    year: `Year ${point.year}`,
    metricPerShare: point.metricPerShare,
    revenue: point.revenue || 0,
    shares: point.shares || 0,
  }));

  // Determine which lines to show
  const showRevenue = projection.some(p => p.revenue && p.revenue > 0);
  const showShares = projection.some(p => p.shares && p.shares > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Growth Projection</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Projected {metricLabel.toLowerCase()} over {valYears} years
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
                dataKey="year"
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
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any, name: any) => [
                  formatCurrency(value),
                  name === 'metricPerShare' ? metricLabel :
                    name === 'revenue' ? 'Revenue' : 'Shares Outstanding',
                ]}
                labelStyle={{ fontWeight: 600, color: '#475569' }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={10}
                formatter={(value: any) => (
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {value === 'metricPerShare' ? metricLabel :
                      value === 'revenue' ? 'Revenue' : 'Shares Outstanding'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="metricPerShare"
                name="metricPerShare"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
              {showRevenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
              {showShares && (
                <Line
                  type="monotone"
                  dataKey="shares"
                  name="shares"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>
            Hover over points to see exact values. The chart shows the projected growth of the selected metric based on your input assumptions.
          </p>
        </div>
      </div>
    </div>
  );
}