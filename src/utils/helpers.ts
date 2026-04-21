export const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPercent = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

export const formatCompactNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  
  // Use absolute value for comparison
  const absNum = Math.abs(num);
  
  // Keep standard format if under 10,000
  if (absNum < 10000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }


  const suffixes = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];

  for (let i = 0; i < suffixes.length; i++) {
    if (absNum >= suffixes[i].value) {
      const formatted = (num / suffixes[i].value).toFixed(2) + suffixes[i].symbol;
      return formatted;
    }
  }

  return num.toFixed(2);
};

const MILLION = 1_000_000;


export const convertMillions = (
  currentValue: number | '',
  fromMillions: boolean,
  toMillions: boolean
): number | '' => {
  if (currentValue === '' || currentValue === 0) return currentValue;
  const num = Number(currentValue);
  if (fromMillions && !toMillions) return num * MILLION;
  if (!fromMillions && toMillions) return num / MILLION;
  return num;
};

const isBlank = (v: number | string | ''): boolean => v === '';
const anyBlank = (...vals: (number | string | '')[]): boolean => vals.some(isBlank);

export function isScenarioIncomplete(sc: import('../types').Scenario): boolean {
  // Universal required fields
  if (anyBlank(sc.buyPrice, sc.years, sc.discountRate)) return true;

  // Exit assumption required fields
  if (sc.exitAssumptionType === 'Multiple' && isBlank(sc.exitMultiple)) return true;
  if (sc.exitAssumptionType === 'Yield' && isBlank(sc.exitYield)) return true;
  if (sc.exitAssumptionType === 'Perpetuity Growth' && isBlank(sc.perpetuityGrowthRate)) return true;

  if (sc.dcfMethod === 'Basic DCF') {
    // Metric-specific current value fields
    if (sc.simpleProjectionMethod === 'Per Share') {
      const metricPerShare = sc.simpleMetricType === 'Net Income (Earnings)'
        ? sc.niCurrentMetricPerShare
        : sc.simpleMetricType === 'Custom'
        ? sc.customCurrentMetricPerShare
        : sc.currentMetricPerShare;
      if (anyBlank(metricPerShare, sc.simpleMetricGrowthRate)) return true;
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      const metricTotal = sc.simpleMetricType === 'Net Income (Earnings)'
        ? sc.niCurrentMetricTotal
        : sc.simpleMetricType === 'Custom'
        ? sc.customCurrentMetricTotal
        : sc.currentMetricTotal;
      if (anyBlank(metricTotal, sc.simpleMetricGrowthRateTotal, sc.currentShares, sc.simpleSharesGrowthRate)) return true;
    } else {
      const metricMargin = sc.simpleMetricType === 'Net Income (Earnings)'
        ? sc.niFinalMargin
        : sc.simpleMetricType === 'Custom'
        ? sc.customFinalMargin
        : sc.simpleFinalMargin;
      if (anyBlank(sc.currentRevenue, sc.simpleRevenueGrowthRate, metricMargin, sc.currentShares, sc.simpleSharesGrowthRate)) return true;
    }
  } else {
    // Advanced DCF
    if (sc.projectionMethod === 'Per Share Method') {
      if (isBlank(sc.currentMetricPerShare)) return true;
      if (sc.metricGrowthRates.some(isBlank)) return true;
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      if (anyBlank(sc.currentMetricTotal, sc.currentShares)) return true;
      if (sc.metricGrowthRatesTotal.some(isBlank) || sc.sharesGrowthRates.some(isBlank)) return true;
    } else {
      if (anyBlank(sc.currentRevenue, sc.currentShares)) return true;
      if (sc.revenueGrowthRates.some(isBlank) || sc.finalMargins.some(isBlank) || sc.sharesGrowthRates.some(isBlank)) return true;
    }
  }

  return false;
}
