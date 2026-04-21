import { Scenario } from '../types';

export interface ProjectionPoint {
  year: number;
  metricPerShare: number; // The primary metric (Free Cash Flow Per Share, EPS, etc.)
  revenue?: number;       // Revenue per share (if applicable)
  shares?: number;        // Shares outstanding (in millions)
  cashFlow?: number;      // Cash flow per share (same as metricPerShare for Per Share Method)
  presentValue?: number;  // Present value of cash flow
  growthRate?: number;    // Applied growth rate for this year
}

/**
 * Generate yearly projection data for a given scenario.
 * Works for both Advanced DCF (multi‑phase growth) and Basic DCF (simple compounding).
 */
export function getYearlyProjection(sc: Scenario): ProjectionPoint[] {
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const valYears = Number(sc.years) || 0;
  if (valYears <= 0) return [];

  if (isSimple) {
    return getSimpleProjection(sc);
  } else {
    return getAdvancedProjection(sc);
  }
}

// ----------------------------------------------------------------------------
// Basic DCF (simple compounding)
// ----------------------------------------------------------------------------
function getSimpleProjection(sc: Scenario): ProjectionPoint[] {
  const valYears = Number(sc.years) || 0;
  const valCurrentMetricPerShare = Number(sc.currentMetricPerShare) || 0;
  const valCurrentMetricTotal = Number(sc.currentMetricTotal) || 0;
  const valCurrentRevenue = Number(sc.currentRevenue) || 0;
  const valCurrentShares = Number(sc.currentShares) || 0;

  // Determine which metric we are projecting
  let metricPerShare: number | string | '' = sc.currentMetricPerShare;
  let metricTotal: number | string | '' = sc.currentMetricTotal;
  let metricMargin: number | string | '' = sc.simpleFinalMargin;

  if (sc.simpleMetricType === 'Net Income (Earnings)') {
    metricPerShare = sc.niCurrentMetricPerShare;
    metricTotal = sc.niCurrentMetricTotal;
    metricMargin = sc.niFinalMargin;
  } else if (sc.simpleMetricType === 'Custom') {
    metricPerShare = sc.customCurrentMetricPerShare;
    metricTotal = sc.customCurrentMetricTotal;
    metricMargin = sc.customFinalMargin;
  }

  const valMetricPerShare = Number(metricPerShare) || 0;
  const valMetricTotal = Number(metricTotal) || 0;
  const valMargin = Number(metricMargin) || 0;

  const valGrowth = Number(sc.simpleMetricGrowthRate) || 0;
  const valGrowthTotal = Number(sc.simpleMetricGrowthRateTotal) || 0;
  const valRevenueGrowth = Number(sc.simpleRevenueGrowthRate) || 0;
  const valSharesGrowth = Number(sc.simpleSharesGrowthRate) || 0;

  const points: ProjectionPoint[] = [];

  // Add Year 0 (current values, no compounding)
  let year0MetricPerShare = 0;
  let year0Revenue = 0;
  let year0Shares = valCurrentShares;

  if (sc.simpleProjectionMethod === 'Per Share') {
    year0MetricPerShare = valMetricPerShare;
  } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
    year0MetricPerShare = valCurrentShares !== 0 ? valMetricTotal / valCurrentShares : 0;
  } else {
    // Revenue & margin method
    year0Revenue = valCurrentRevenue;
    year0MetricPerShare = valCurrentShares !== 0 ? (valCurrentRevenue * (valMargin / 100)) / valCurrentShares : 0;
  }

  points.push({
    year: 0,
    metricPerShare: year0MetricPerShare,
    revenue: year0Revenue,
    shares: year0Shares,
    growthRate: 0,
  });

  for (let year = 1; year <= valYears; year++) {
    let metricPerShare = 0;
    let revenue = 0;
    let shares = 0;

    if (sc.simpleProjectionMethod === 'Per Share') {
      // Compound the per‑share metric
      metricPerShare = valMetricPerShare * Math.pow(1 + valGrowth / 100, year);
      shares = valCurrentShares * Math.pow(1 + valSharesGrowth / 100, year);
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      // Compound total metric and shares separately
      const total = valMetricTotal * Math.pow(1 + valGrowthTotal / 100, year);
      shares = valCurrentShares * Math.pow(1 + valSharesGrowth / 100, year);
      metricPerShare = shares !== 0 ? total / shares : 0;
    } else {
      // Revenue & margin method
      const totalRevenue = valCurrentRevenue * Math.pow(1 + valRevenueGrowth / 100, year);
      const totalMetric = totalRevenue * (valMargin / 100);
      shares = valCurrentShares * Math.pow(1 + valSharesGrowth / 100, year);
      metricPerShare = shares !== 0 ? totalMetric / shares : 0;
      revenue = totalRevenue;
    }

    points.push({
      year,
      metricPerShare,
      revenue,
      shares,
      growthRate: sc.simpleProjectionMethod === 'Per Share' ? valGrowth :
        sc.simpleProjectionMethod === 'Metric, Share Count' ? valGrowthTotal :
          valRevenueGrowth,
    });
  }

  return points;
}

// ----------------------------------------------------------------------------
// Advanced DCF (multi‑phase growth, multiple projection methods)
// ----------------------------------------------------------------------------
function getAdvancedProjection(sc: Scenario): ProjectionPoint[] {
  const valYears = Number(sc.years) || 0;
  const valCurrentMetricPerShare = Number(sc.currentMetricPerShare) || 0;
  const valCurrentMetricTotal = Number(sc.currentMetricTotal) || 0;
  const valCurrentRevenue = Number(sc.currentRevenue) || 0;
  const valCurrentShares = Number(sc.currentShares) || 0;

  const valMetricGrowthRates = sc.metricGrowthRates.map((v: string | number | '') => Number(v) || 0);
  const valMetricGrowthRatesTotal = sc.metricGrowthRatesTotal.map((v: string | number | '') => Number(v) || 0);
  const valRevenueGrowthRates = sc.revenueGrowthRates.map((v: string | number | '') => Number(v) || 0);
  const valFinalMargins = sc.finalMargins.map((v: string | number | '') => Number(v) || 0);
  const valSharesGrowthRates = sc.sharesGrowthRates.map((v: string | number | '') => Number(v) || 0);

  const splitYears = sc.splitYears;

  let curCF = valCurrentMetricPerShare;
  let curTotal = valCurrentMetricTotal;
  let curRev = valCurrentRevenue;
  let curShares = valCurrentShares;

  const points: ProjectionPoint[] = [];

  // Add Year 0 (current values, no growth applied)
  let year0MetricPerShare = 0;
  let year0Revenue = 0;
  let year0Shares = valCurrentShares;

  if (sc.projectionMethod === 'Per Share Method') {
    year0MetricPerShare = valCurrentMetricPerShare;
  } else if (sc.projectionMethod === 'Total FCF, Share Count') {
    year0MetricPerShare = valCurrentShares !== 0 ? valCurrentMetricTotal / valCurrentShares : 0;
  } else {
    // Revenue & margin method
    year0Revenue = valCurrentRevenue;
    const cfTotal = valCurrentRevenue * ((valFinalMargins[0] || 0) / 100);
    year0MetricPerShare = valCurrentShares !== 0 ? cfTotal / valCurrentShares : 0;
  }

  points.push({
    year: 0,
    metricPerShare: year0MetricPerShare,
    revenue: year0Revenue,
    shares: year0Shares,
    cashFlow: year0MetricPerShare,
    growthRate: 0,
  });

  for (let year = 1; year <= valYears; year++) {
    // Determine which growth phase this year belongs to
    let phaseIndex = 0;
    for (let s = 0; s < splitYears.length; s++) {
      if (year >= splitYears[s]) phaseIndex = s + 1; else break;
    }

    let metricPerShare = 0;
    let revenue = 0;
    let shares = curShares;

    if (sc.projectionMethod === 'Per Share Method') {
      curCF = curCF * (1 + (valMetricGrowthRates[phaseIndex] || 0) / 100);
      metricPerShare = curCF;
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      curTotal = curTotal * (1 + (valMetricGrowthRatesTotal[phaseIndex] || 0) / 100);
      curShares = curShares * (1 + (valSharesGrowthRates[phaseIndex] || 0) / 100);
      metricPerShare = curShares !== 0 ? curTotal / curShares : 0;
      shares = curShares;
    } else {
      // Revenue & margin method
      curRev = curRev * (1 + (valRevenueGrowthRates[phaseIndex] || 0) / 100);
      const cfTotal = curRev * ((valFinalMargins[phaseIndex] || 0) / 100);
      curShares = curShares * (1 + (valSharesGrowthRates[phaseIndex] || 0) / 100);
      metricPerShare = curShares !== 0 ? cfTotal / curShares : 0;
      revenue = curRev;
      shares = curShares;
    }

    points.push({
      year,
      metricPerShare,
      revenue,
      shares,
      cashFlow: metricPerShare,
      growthRate: sc.projectionMethod === 'Per Share Method' ? valMetricGrowthRates[phaseIndex] :
        sc.projectionMethod === 'Total FCF, Share Count' ? valMetricGrowthRatesTotal[phaseIndex] :
          valRevenueGrowthRates[phaseIndex],
    });
  }

  return points;
}