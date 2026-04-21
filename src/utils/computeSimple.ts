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

export function computeSimple(sc: Scenario): Results {
  if (isScenarioIncomplete(sc)) return NULL_RESULTS;

  const valBuyPrice    = Number(sc.buyPrice)    || 0;
  const valYears       = Number(sc.years)       || 0;
  const valDiscountRate= Number(sc.discountRate)|| 0;
  const valExitMultiple= Number(sc.exitMultiple)|| 0;
  const valExitYield   = Number(sc.exitYield)   || 0;
  const r = valDiscountRate / 100;

  const effectiveMultiple = sc.exitAssumptionType === 'Multiple'
    ? valExitMultiple
    : (valExitYield > 0 ? 100 / valExitYield : 0);

  let finalMetricPerShare = 0;
  let baseCFPerShare      = 0;

  // ── Field Selection Logic ──
  let metricPerShare: number | string | '' = sc.currentMetricPerShare;
  let metricTotal:    number | string | '' = sc.currentMetricTotal;
  let metricMargin:   number | string | '' = sc.simpleFinalMargin;

  if (sc.simpleMetricType === 'Net Income (Earnings)') {
    metricPerShare = sc.niCurrentMetricPerShare;
    metricTotal    = sc.niCurrentMetricTotal;
    metricMargin   = sc.niFinalMargin;
  } else if (sc.simpleMetricType === 'Custom') {
    metricPerShare = sc.customCurrentMetricPerShare;
    metricTotal    = sc.customCurrentMetricTotal;
    metricMargin   = sc.customFinalMargin;
  }

  if (sc.simpleProjectionMethod === 'Per Share') {
    const valCurrent = Number(metricPerShare) || 0;
    const valGrowth  = Number(sc.simpleMetricGrowthRate)      || 0;
    finalMetricPerShare = valCurrent * Math.pow(1 + valGrowth / 100, valYears);
    baseCFPerShare      = valCurrent;

  } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
    const valTotal   = Number(metricTotal)    || 0;
    const valGrowth  = Number(sc.simpleMetricGrowthRateTotal) || 0;
    const valShares  = Number(sc.currentShares)         || 0;
    const valSGrowth = Number(sc.simpleSharesGrowthRate)      || 0;
    const finalTotal  = valTotal  * Math.pow(1 + valGrowth  / 100, valYears);
    const finalShares = valShares * Math.pow(1 + valSGrowth / 100, valYears);
    finalMetricPerShare = finalShares !== 0 ? finalTotal / finalShares : 0;
    baseCFPerShare      = valShares  !== 0 ? valTotal   / valShares   : 0;

  } else {
    const valRevenue = Number(sc.currentRevenue)    || 0;
    const valRGrowth = Number(sc.simpleRevenueGrowthRate) || 0;
    const valMargin  = Number(metricMargin)       || 0;
    const valShares  = Number(sc.currentShares)     || 0;
    const valSGrowth = Number(sc.simpleSharesGrowthRate)  || 0;
    const finalRev    = valRevenue * Math.pow(1 + valRGrowth / 100, valYears);
    const finalShares = valShares  * Math.pow(1 + valSGrowth / 100, valYears);
    finalMetricPerShare = finalShares !== 0 ? (finalRev * (valMargin / 100)) / finalShares : 0;
    baseCFPerShare = 0;
  }

  const terminalValuePerShare = finalMetricPerShare * effectiveMultiple;
  const intrinsicValueTotal   = valYears !== 0
    ? terminalValuePerShare / Math.pow(1 + r, valYears)
    : terminalValuePerShare;

  let irr = null;
  if (valBuyPrice > 0 && terminalValuePerShare > 0 && valYears > 0) {
    irr = (Math.pow(terminalValuePerShare / valBuyPrice, 1 / valYears) - 1) * 100;
  }

  let impliedGrowth = null;
  if (valYears > 0 && valBuyPrice > 0 && effectiveMultiple > 0) {
    const targetTV               = valBuyPrice * Math.pow(1 + r, valYears);
    const targetFinalMetricPS    = targetTV / effectiveMultiple;

    if (sc.simpleProjectionMethod === 'Per Share' && baseCFPerShare > 0) {
      impliedGrowth = (Math.pow(targetFinalMetricPS / baseCFPerShare, 1 / valYears) - 1) * 100;

    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      const valShares  = Number(sc.currentShares) || 0;
      const valSGrowth = Number(sc.simpleSharesGrowthRate) || 0;
      const valTotal   = Number(sc.currentMetricTotal) || 0;
      const finalShares = valShares * Math.pow(1 + valSGrowth / 100, valYears);
      const targetFinalTotal = targetFinalMetricPS * finalShares;
      if (valTotal > 0) {
        impliedGrowth = (Math.pow(targetFinalTotal / valTotal, 1 / valYears) - 1) * 100;
      }

    } else {
      const valRevenue = Number(sc.currentRevenue)    || 0;
      const valMargin  = Number(sc.simpleFinalMargin)       || 0;
      const valShares  = Number(sc.currentShares)     || 0;
      const valSGrowth = Number(sc.simpleSharesGrowthRate)  || 0;
      const finalShares = valShares * Math.pow(1 + valSGrowth / 100, valYears);
      if (valRevenue > 0 && valMargin > 0) {
        const targetFinalMetricTotal = targetFinalMetricPS * finalShares;
        const targetFinalRevenue     = targetFinalMetricTotal / (valMargin / 100);
        impliedGrowth = (Math.pow(targetFinalRevenue / valRevenue, 1 / valYears) - 1) * 100;
      }
    }
  }

  const marginOfSafety = (intrinsicValueTotal > 0 && valBuyPrice > 0)
    ? ((intrinsicValueTotal - valBuyPrice) / intrinsicValueTotal) * 100 : null;
  const upside = valBuyPrice > 0
    ? ((intrinsicValueTotal - valBuyPrice) / valBuyPrice) * 100 : null;

  return {
    finalMetricPerShare,
    terminalValuePerShare,
    intrinsicValueTotal,
    irr,
    impliedGrowth,
    marginOfSafety,
    upside,
    pvOfCashFlows: 0,
    presentValueTV: intrinsicValueTotal,
    yearlyDetails: [],
    effectiveMultiple,
  };
}
