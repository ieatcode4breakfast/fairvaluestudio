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

/**
 * Ensures that an object (usually from JSON/LocalStorage) conforms to the current Scenario structure.
 * Handles old field remapping and provides defaults for missing fields.
 */
export function migrateScenario(item: any): Scenario {
  const base = createDefaultScenario();
  
  const migrated: any = {
    ...base,
    ...item,
    // Ensure nested arrays are actually arrays (deep copy if needed)
    splitYears:             Array.isArray(item.splitYears)             ? [...item.splitYears]             : base.splitYears,
    metricGrowthRates:      Array.isArray(item.metricGrowthRates)      ? [...item.metricGrowthRates]      : base.metricGrowthRates,
    metricGrowthRatesTotal: Array.isArray(item.metricGrowthRatesTotal) ? [...item.metricGrowthRatesTotal] : base.metricGrowthRatesTotal,
    revenueGrowthRates:     Array.isArray(item.revenueGrowthRates)     ? [...item.revenueGrowthRates]     : base.revenueGrowthRates,
    finalMargins:           Array.isArray(item.finalMargins)           ? [...item.finalMargins]           : base.finalMargins,
    sharesGrowthRates:      Array.isArray(item.sharesGrowthRates)      ? [...item.sharesGrowthRates]      : base.sharesGrowthRates,
    
    // Reset transient UI state
    hoverYear: null,
    draggingIndex: null,
    showResetConfirm: false,
    showYearlyBreakdown: false,
  };

  // ── Migration Logic for legacy field names ──
  if (item.simpleCurrentMetricPerShare !== undefined && (item.currentMetricPerShare === '' || item.currentMetricPerShare === undefined)) {
    migrated.currentMetricPerShare = item.simpleCurrentMetricPerShare;
  }
  if (item.simpleCurrentMetricTotal !== undefined && (item.currentMetricTotal === '' || item.currentMetricTotal === undefined)) {
    migrated.currentMetricTotal = item.simpleCurrentMetricTotal;
  }
  if (item.simpleCurrentRevenue !== undefined && (item.currentRevenue === '' || item.currentRevenue === undefined)) {
    migrated.currentRevenue = item.simpleCurrentRevenue;
  }
  if (item.simpleCurrentShares !== undefined && (item.currentShares === '' || item.currentShares === undefined)) {
    migrated.currentShares = item.simpleCurrentShares;
  }
  if (item.simpleInMillions !== undefined) {
    migrated.inMillions = item.simpleInMillions;
  }

  return migrated as Scenario;
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
