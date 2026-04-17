import { Scenario } from '../types';
import { genId } from './genId';

export function createDefaultScenario(): Scenario {
  return {
    id: genId(),
    scenarioName: '',
    dcfMethod: 'Basic DCF',

    // ── Shared general assumptions ──
    buyPrice: '',
    years: 5,
    discountRate: 10,

    // ── Shared exit assumptions ──
    exitAssumptionType: 'Multiple',
    exitMultiple: '',
    exitYield: '',
    perpetuityGrowthRate: '',

    // ── Basic DCF fields ──
    simpleProjectionMethod: 'Per Share',
    simpleMetricType: 'Free Cash Flow',
    simpleCustomMetric: '',
    simpleCurrentMetricPerShare: '',
    simpleMetricGrowthRate: '',
    simpleCurrentMetricTotal: '',
    simpleMetricGrowthRateTotal: '',
    simpleCurrentRevenue: '',
    simpleRevenueGrowthRate: '',
    simpleFinalMargin: '',
    simpleCurrentShares: '',
    simpleSharesGrowthRate: '',
    simpleInMillions: true,

    // ── Advanced DCF fields ──
    splitYears: [],
    hoverYear: null,
    draggingIndex: null,
    projectionMethod: 'Per Share Method',
    currentMetricPerShare: '',
    metricGrowthRates:      ['', '', '', '', '', '', '', '', '', ''],
    currentMetricTotal: '',
    metricGrowthRatesTotal: ['', '', '', '', '', '', '', '', '', ''],
    currentRevenue: '',
    revenueGrowthRates:     ['', '', '', '', '', '', '', '', '', ''],
    finalMargins:           ['', '', '', '', '', '', '', '', '', ''],
    inMillions: true,
    currentShares: '',
    sharesGrowthRates:      ['', '', '', '', '', '', '', '', '', ''],

    // ── UI state ──
    showResetConfirm: false,
    showYearlyBreakdown: false,
  };
}

export function cloneScenario(src: Scenario): Scenario {
  return {
    ...src,
    id: genId(),
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
