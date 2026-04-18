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

    // ── Basic DCF fields (Growth assumptions only) ──
    simpleProjectionMethod: 'Per Share',
    simpleMetricType: 'Free Cash Flow',
    simpleCustomMetric: '',
    simpleMetricGrowthRate: '',
    simpleMetricGrowthRateTotal: '',
    simpleRevenueGrowthRate: '',
    simpleFinalMargin: '',
    simpleSharesGrowthRate: '',

    // ── Isolated Metric fields (Basic DCF) ──
    niCurrentMetricPerShare: '',
    niCurrentMetricTotal: '',
    niFinalMargin: '',
    customCurrentMetricPerShare: '',
    customCurrentMetricTotal: '',
    customFinalMargin: '',

    // ── Advanced DCF fields (Growth assumptions only) ──
    splitYears: [],
    hoverYear: null,
    draggingIndex: null,
    projectionMethod: 'Per Share Method',
    metricGrowthRates:      ['', '', '', '', '', '', '', '', '', ''],
    metricGrowthRatesTotal: ['', '', '', '', '', '', '', '', '', ''],
    revenueGrowthRates:     ['', '', '', '', '', '', '', '', '', ''],
    finalMargins:           ['', '', '', '', '', '', '', '', '', ''],
    sharesGrowthRates:      ['', '', '', '', '', '', '', '', '', ''],

    // ── Unified "Current" fields ──
    currentMetricPerShare: '',
    currentMetricTotal: '',
    currentRevenue: '',
    currentShares: '',
    inMillions: true,

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
