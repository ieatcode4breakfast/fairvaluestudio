import { Scenario, Results } from '../types';
import { isScenarioIncomplete } from './helpers';

const NULL_RESULTS: Results = {
  finalMetricPerShare: 0,
  terminalValuePerShare: 0,
  intrinsicValueTotal: 0,
  irr: null,
  impliedGrowth: null,
  marginOfSafety: null,
  upside: null,
  pvOfCashFlows: 0,
  presentValueTV: 0,
  yearlyDetails: [],
  effectiveMultiple: 0,
};

export function computeAdvanced(sc: Scenario): Results {
  if (isScenarioIncomplete(sc)) return NULL_RESULTS;

  const valBuyPrice              = Number(sc.buyPrice)              || 0;
  const valYears                 = Number(sc.years)                 || 0;
  const valDiscountRate          = Number(sc.discountRate)          || 0;
  const valCurrentMetricPerShare = Number(sc.currentMetricPerShare) || 0;
  const valMetricGrowthRates     = sc.metricGrowthRates.map(v => Number(v) || 0);
  const valCurrentMetricTotal    = Number(sc.currentMetricTotal)    || 0;
  const valMetricGrowthRatesTotal= sc.metricGrowthRatesTotal.map(v => Number(v) || 0);
  const valCurrentRevenue        = Number(sc.currentRevenue)        || 0;
  const valRevenueGrowthRates    = sc.revenueGrowthRates.map(v => Number(v) || 0);
  const valFinalMargins          = sc.finalMargins.map(v => Number(v) || 0);
  const valCurrentShares         = Number(sc.currentShares)         || 0;
  const valSharesGrowthRates     = sc.sharesGrowthRates.map(v => Number(v) || 0);
  const valExitMultiple          = Number(sc.exitMultiple)          || 0;
  const valExitYield             = Number(sc.exitYield)             || 0;
  const valPerpetuityGrowthRate  = Number(sc.perpetuityGrowthRate)  || 0;
  const r      = valDiscountRate / 100;
  const g_perp = valPerpetuityGrowthRate / 100;

  let effectiveMultiple = 0;
  if      (sc.exitAssumptionType === 'Multiple')    effectiveMultiple = valExitMultiple;
  else if (sc.exitAssumptionType === 'Yield')       effectiveMultiple = valExitYield > 0 ? 100 / valExitYield : 0;
  else effectiveMultiple = (r - g_perp) > 0 ? (1 + g_perp) / (r - g_perp) : 0;

  let finalMetricPerShare = 0, pvOfCashFlows = 0;
  const yearlyDetails = [];
  let curCF     = valCurrentMetricPerShare;
  let curTotal  = valCurrentMetricTotal;
  let curRev    = valCurrentRevenue;
  let curShares = valCurrentShares;

  for (let i = 1; i <= valYears; i++) {
    let cfForYear  = 0;
    let phaseIndex = 0;
    for (let s = 0; s < sc.splitYears.length; s++) {
      if (i >= sc.splitYears[s]) phaseIndex = s + 1; else break;
    }
    if (sc.projectionMethod === 'Per Share Method') {
      curCF     = curCF * (1 + (valMetricGrowthRates[phaseIndex] || 0) / 100);
      cfForYear = curCF;
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      curTotal  = curTotal * (1 + (valMetricGrowthRatesTotal[phaseIndex] || 0) / 100);
      curShares = curShares * (1 + (valSharesGrowthRates[phaseIndex] || 0) / 100);
      cfForYear = curShares !== 0 ? curTotal / curShares : 0;
    } else {
      curRev    = curRev * (1 + (valRevenueGrowthRates[phaseIndex] || 0) / 100);
      const cfTotal = curRev * ((valFinalMargins[phaseIndex] || 0) / 100);
      curShares = curShares * (1 + (valSharesGrowthRates[phaseIndex] || 0) / 100);
      cfForYear = curShares !== 0 ? cfTotal / curShares : 0;
    }
    const pv = cfForYear / Math.pow(1 + r, i);
    pvOfCashFlows += pv;
    yearlyDetails.push({ year: i, cf: cfForYear, pv });
    if (i === valYears) finalMetricPerShare = cfForYear;
  }

  const terminalValuePerShare = finalMetricPerShare * effectiveMultiple;
  const presentValueTV        = valYears !== 0 ? terminalValuePerShare / Math.pow(1 + r, valYears) : terminalValuePerShare;
  const intrinsicValueTotal   = pvOfCashFlows + presentValueTV;

  let irr = null;
  if (valBuyPrice > 0 && valYears > 0) {
    let low = -0.9, high = 10;
    for (let i = 0; i < 200; i++) {
      const mid = (low + high) / 2;
      let npv = -valBuyPrice;
      for (let j = 1; j <= valYears; j++) {
        const cf       = yearlyDetails[j - 1].cf;
        const terminal = j === valYears ? terminalValuePerShare : 0;
        npv += (cf + terminal) / Math.pow(1 + mid, j);
      }
      if (npv > 0) low = mid; else high = mid;
    }
    irr = low * 100;
  }

  const marginOfSafety = (intrinsicValueTotal > 0 && valBuyPrice > 0)
    ? ((intrinsicValueTotal - valBuyPrice) / intrinsicValueTotal) * 100 : null;
  const upside = valBuyPrice > 0
    ? ((intrinsicValueTotal - valBuyPrice) / valBuyPrice) * 100 : null;

  return {
    finalMetricPerShare, terminalValuePerShare, presentValueTV,
    pvOfCashFlows, intrinsicValueTotal, irr,
    impliedGrowth: null,
    marginOfSafety, upside, yearlyDetails, effectiveMultiple,
  };
}
