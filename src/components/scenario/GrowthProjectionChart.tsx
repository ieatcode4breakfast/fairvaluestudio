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
import { getYearlyProjection, ProjectionPoint } from '../../utils/projection';
import { formatCurrency, formatCompactNumber } from '../../utils/helpers';

interface GrowthProjectionChartProps {
  sc: Scenario;
  results: Results;
}

export function GrowthProjectionChart({ sc, results }: GrowthProjectionChartProps) {
  const projection = getYearlyProjection(sc);
  const valYears = Number(sc.years) || 0;
  const buyPrice = Number(sc.buyPrice) || 0;
  const isBasic = sc.dcfMethod === 'Basic DCF';
  
  // Use calculated yearly return (IRR) for compounding
  const yearlyReturnPercent = results.irr ?? 0;
  const yearlyReturnRate = yearlyReturnPercent / 100;

  // Intrinsic value growth at discount rate
  const discountRatePercent = Number(sc.discountRate) || 0;
  const discountRate = discountRatePercent / 100;
  const intrinsicValueToday = results.intrinsicValueTotal ?? 0;

  // Determine dynamic labels for the formula
  let metricLabel = 'Metric';
  if (isBasic) {
    if (sc.simpleMetricType === 'Net Income (Earnings)') metricLabel = 'Earnings';
    else if (sc.simpleMetricType === 'Custom') metricLabel = sc.simpleCustomMetric || 'Custom Metric';
    else metricLabel = 'FCF';
  } else {
    metricLabel = 'FCF';
  }

  const exitTypeLabel = sc.exitAssumptionType === 'Perpetuity Growth' ? 'Multiple (Implied)' : sc.exitAssumptionType;
  const operator = sc.exitAssumptionType === 'Yield' ? '/' : '*';


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

  // Prepare data for chart: focus on compounded price using yearly return
  const chartData = projection.map((point) => {
    let sellPrice = 0;
    let yearlyReturn = null;
    
    if (point.year === 0) {
      // Year 0: show buy price (current price)
      sellPrice = buyPrice;
      yearlyReturn = 0; // 0% return at Year 0
    } else {
      // Year 1+: compound buy price by yearly return
      sellPrice = buyPrice * Math.pow(1 + yearlyReturnRate, point.year);
      yearlyReturn = yearlyReturnPercent; // constant yearly return
    }

    // Intrinsic value growing at discount rate
    const intrinsicValue = intrinsicValueToday * Math.pow(1 + discountRate, point.year);

    // Yearly return based on intrinsic value (CAGR from buy price to intrinsic value)
    let intrinsicYearlyReturn = null;
    if (buyPrice !== 0) {
      if (point.year === 0) {
        // Instantaneous return from buy price to intrinsic value today
        intrinsicYearlyReturn = (intrinsicValue / buyPrice - 1) * 100;
      } else {
        // Annualized CAGR
        intrinsicYearlyReturn = (Math.pow(intrinsicValue / buyPrice, 1 / point.year) - 1) * 100;
      }
    }

    return {
      year: point.year,
      displayYear: point.year === 0 ? 'Today' : `Year ${point.year}`,
      sellPrice,
      yearlyReturn,
      intrinsicValue,
      intrinsicYearlyReturn,
    };
  });


  return (
    <div className="bg-white dark:bg-slate-800 rounded-none md:rounded-2xl shadow-sm border-y border-x-0 md:border-x border-slate-100 dark:border-slate-700 overflow-hidden select-none">
      <div className="p-5 lg:px-6 lg:py-4 border-b border-slate-100 dark:border-slate-700">


        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Return Projection</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compounded price growth at yearly return of {yearlyReturnPercent.toFixed(2)}% based on current buy price of {formatCurrency(buyPrice)}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Final Stock Price = {formatCurrency(results.terminalValuePerShare ?? 0)} (Final {metricLabel} Per Share {operator} Exit {exitTypeLabel})
        </p>
      </div>
      <div className="p-5 lg:p-6">


        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">{label}</div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between gap-8">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {data.year === 0 ? 'Buy Price' : data.year === valYears ? 'Final Stock Price' : 'Compounded Price'}:
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatCurrency(data.sellPrice)}</span>
                          </div>

                          {data.year !== 0 && (
                            <div className="flex flex-col">
                              <div className="flex justify-between gap-8">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Yearly Return:</span>
                                <span className="text-xs font-bold text-emerald-600">
                                  {data.yearlyReturn !== null ? `${data.yearlyReturn.toFixed(2)}%` : 'N/A'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="h-2"></div>

                          {data.year !== valYears && (
                            <>
                              <div className="flex justify-between gap-8">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Intrinsic Value:
                                </span>
                                <span className="text-xs font-bold text-purple-600">{formatCurrency(data.intrinsicValue)}</span>
                              </div>

                              {data.intrinsicYearlyReturn !== null && (
                                <div className="flex justify-between gap-8">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Yearly Return (based on Intrinsic Value):</span>
                                  <span className="text-xs font-bold text-purple-600">
                                    {data.intrinsicYearlyReturn.toFixed(2)}%
                                  </span>
                                </div>
                              )}
                            </>
                          )}
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
                name="Compounded Price"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="intrinsicValue"
                name="Intrinsic Value (Discount Rate)"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>
            Hover over points to see compounded price and yearly return.
          </p>
        </div>
      </div>
    </div>
  );
}