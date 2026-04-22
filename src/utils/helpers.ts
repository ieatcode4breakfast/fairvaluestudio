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
      let val: any = sc.currentMetricPerShare;
      if (sc.simpleMetricType === 'Net Income (Earnings)') val = sc.niCurrentMetricPerShare;
      else if (sc.simpleMetricType === 'Operating Cash Flow') val = sc.ocfPerShare;
      else if (sc.simpleMetricType === 'EBITDA') val = sc.ebitdaPerShare;
      else if (sc.simpleMetricType === 'Book Value') val = sc.bookValue;

      if (anyBlank(val, sc.simpleMetricGrowthRate)) return true;
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      let val: any = sc.currentMetricTotal;
      if (sc.simpleMetricType === 'Net Income (Earnings)') val = sc.niCurrentMetricTotal;
      else if (sc.simpleMetricType === 'Operating Cash Flow') val = sc.operatingCashflow;
      else if (sc.simpleMetricType === 'EBITDA') val = sc.ebitda;

      if (anyBlank(val, sc.simpleMetricGrowthRateTotal, sc.currentShares, sc.simpleSharesGrowthRate)) return true;
    } else {
      let valMargin: any = sc.simpleFinalMargin;
      if (sc.simpleMetricType === 'Net Income (Earnings)') valMargin = sc.niFinalMargin;
      else if (sc.simpleMetricType === 'Operating Cash Flow') valMargin = sc.ocfFinalMargin;
      else if (sc.simpleMetricType === 'EBITDA') valMargin = sc.ebitdaFinalMargin;

      if (anyBlank(sc.currentRevenue, sc.simpleRevenueGrowthRate, valMargin, sc.currentShares, sc.simpleSharesGrowthRate)) return true;
    }
  } else {
    // Advanced DCF - Only validate ACTIVE phases
    const numPhases = sc.splitYears.length + 1;
    if (sc.projectionMethod === 'Per Share Method') {
      if (isBlank(sc.currentMetricPerShare)) return true;
      if (sc.metricGrowthRates.slice(0, numPhases).some(isBlank)) return true;
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      if (anyBlank(sc.currentMetricTotal, sc.currentShares)) return true;
      if (sc.metricGrowthRatesTotal.slice(0, numPhases).some(isBlank) || sc.sharesGrowthRates.slice(0, numPhases).some(isBlank)) return true;
    } else {
      if (anyBlank(sc.currentRevenue, sc.currentShares)) return true;
      if (sc.revenueGrowthRates.slice(0, numPhases).some(isBlank) || sc.finalMargins.slice(0, numPhases).some(isBlank) || sc.sharesGrowthRates.slice(0, numPhases).some(isBlank)) return true;
    }
  }

  return false;
}
