import { Scenario } from '../types';

export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
};

export const formatCompactNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

const MILLION = 1_000_000;

/**
 * convertMillions
 * Helper to scale values when toggling "Values in Millions"
 */
export const convertMillions = (
  value: number | string | undefined | null,
  fromMillions: boolean,
  toMillions: boolean
): number | string => {
  if (value === '' || value === undefined || value === null) return '';
  const num = Number(value);
  if (isNaN(num)) return '';

  if (fromMillions && !toMillions) return num * MILLION;
  if (!fromMillions && toMillions) return num / MILLION;
  return num;
};

export function getIncompleteField(sc: Scenario): string | null {
  const isBlank = (v: any): boolean => 
    v === '' || v === null || v === undefined || (typeof v === 'number' && isNaN(v));

  // 1. Universal required fields
  if (isBlank(sc.buyPrice)) return 'Buy Price';
  if (isBlank(sc.years)) return 'Years';
  if (isBlank(sc.discountRate)) return 'Discount Rate';

  // 2. Terminal Value check
  if (sc.exitAssumptionType === 'Multiple') {
    if (isBlank(sc.exitMultiple)) return 'Exit Multiple';
  } else if (sc.exitAssumptionType === 'Yield') {
    if (isBlank(sc.exitYield)) return 'Exit Yield';
  } else {
    if (isBlank(sc.perpetuityGrowthRate)) return 'Perpetuity Growth Rate';
  }

  // 3. Method-specific checks
  if (sc.dcfMethod === 'Basic DCF') {
    let val: any = sc.currentMetricPerShare;
    let label = 'Current Metric';

    if (sc.simpleMetricType === 'Net Income (Earnings)') {
      val = sc.niCurrentMetricPerShare;
      label = 'Net Income (EPS)';
    } else if (sc.simpleMetricType === 'Operating Cash Flow') {
      val = sc.ocfPerShare;
      label = 'OCF Per Share';
    } else if (sc.simpleMetricType === 'EBITDA') {
      val = sc.ebitdaPerShare;
      label = 'EBITDA Per Share';
    } else if (sc.simpleMetricType === 'Book Value') {
      val = sc.bookValue;
      label = 'Book Value';
    }

    if (isBlank(val)) return label;
    if (isBlank(sc.simpleMetricGrowthRate)) return 'Growth Rate';

    if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      if (isBlank(sc.currentShares)) return 'Shares Outstanding';
      if (isBlank(sc.simpleSharesGrowthRate)) return 'Shares Growth';
    } else if (sc.simpleProjectionMethod === 'Revenue, Metric Margin, Share Count') {
      if (isBlank(sc.currentRevenue)) return 'Current Revenue';
      if (isBlank(sc.simpleRevenueGrowthRate)) return 'Revenue Growth';
      if (isBlank(sc.currentShares)) return 'Shares Outstanding';
      if (isBlank(sc.simpleSharesGrowthRate)) return 'Shares Growth';
      
      let m: any = sc.simpleFinalMargin;
      if (sc.simpleMetricType === 'Net Income (Earnings)') m = sc.niFinalMargin;
      else if (sc.simpleMetricType === 'Operating Cash Flow') m = sc.ocfFinalMargin;
      else if (sc.simpleMetricType === 'EBITDA') m = sc.ebitdaFinalMargin;
      if (isBlank(m)) return 'Final Margin';
    }
  } else {
    // Advanced DCF
    const numPhases = sc.splitYears.length + 1;
    if (sc.projectionMethod === 'Per Share Method') {
      if (isBlank(sc.currentMetricPerShare)) return 'Current Metric (PS)';
      if (sc.metricGrowthRates.slice(0, numPhases).some(isBlank)) return 'Growth Rate (Phases)';
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      if (isBlank(sc.currentMetricTotal)) return 'Current Metric (Total)';
      if (isBlank(sc.currentShares)) return 'Current Shares';
      if (sc.metricGrowthRatesTotal.slice(0, numPhases).some(isBlank)) return 'Growth Rate (Phases)';
      if (sc.sharesGrowthRates.slice(0, numPhases).some(isBlank)) return 'Shares Growth (Phases)';
    } else {
      // Revenue Method
      if (isBlank(sc.currentRevenue)) return 'Current Revenue';
      if (isBlank(sc.currentShares)) return 'Current Shares';
      if (sc.revenueGrowthRates.slice(0, numPhases).some(isBlank)) return 'Revenue Growth (Phases)';
      if (sc.finalMargins.slice(0, numPhases).some(isBlank)) return 'Margins (Phases)';
      if (sc.sharesGrowthRates.slice(0, numPhases).some(isBlank)) return 'Shares Growth (Phases)';
    }
  }

  return null;
}

export function isScenarioIncomplete(sc: Scenario): boolean {
  return getIncompleteField(sc) !== null;
}
