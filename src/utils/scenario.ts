import { Scenario } from '../types';
import { genId } from './genId';

export function createDefaultScenario(): Scenario {
  return {
    id: genId(),
    scenarioName: '',
    dcfMethod: 'Basic DCF',

    // ── Shared general assumptions ──
    buyPrice: 100,
    years: 5,
    discountRate: 10,

    // ── Shared exit assumptions ──
    exitAssumptionType: 'Multiple',
    exitMultiple: 10,
    exitYield: 10,
    perpetuityGrowthRate: 2,

    // ── Basic DCF fields ──
    simpleProjectionMethod: 'Per Share',
    simpleMetricType: 'Free Cash Flow',
    simpleCustomMetric: '',
    simpleCurrentMetricPerShare: 10,
    simpleMetricGrowthRate: 10,
    simpleCurrentMetricTotal: 500,
    simpleMetricGrowthRateTotal: 10,
    simpleCurrentRevenue: 1000,
    simpleRevenueGrowthRate: 10,
    simpleFinalMargin: 20,
    simpleCurrentShares: 100,
    simpleSharesGrowthRate: -2.5,
    simpleInMillions: true,

    // ── Advanced DCF fields ──
    splitYears: [],
    hoverYear: null,
    draggingIndex: null,
    projectionMethod: 'Per Share Method',
    currentMetricPerShare: 10,
    metricGrowthRates:      [10, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    currentMetricTotal: 500,
    metricGrowthRatesTotal: [10, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    currentRevenue: 1000,
    revenueGrowthRates:     [10, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    finalMargins:           [20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    inMillions: true,
    currentShares: 100,
    sharesGrowthRates:      [-2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5, -2.5],

    // ── UI state ──
    showResetConfirm: false,
    showYearlyBreakdown: false,
  };
}

export function cloneScenario(src: Scenario): Scenario {
  return {
    ...src,
    id: genId(),
    scenarioName: '',
    splitYears:             [...src.splitYears],
    metricGrowthRates:      [...src.metricGrowthRates],
    metricGrowthRatesTotal: [...src.metricGrowthRatesTotal],
    revenueGrowthRates:     [...src.revenueGrowthRates],
    finalMargins:           [...src.finalMargins],
    sharesGrowthRates:      [...src.sharesGrowthRates],
    hoverYear: null,
    draggingIndex: null,
    showResetConfirm: false,
    showYearlyBreakdown: false,
  };
}
