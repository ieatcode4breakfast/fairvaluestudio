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

export function isScenarioEmpty(sc: Scenario): boolean {
  const hasName = sc.scenarioName && sc.scenarioName.trim() !== '';
  const hasBuyPrice = sc.buyPrice !== '';
  
  // Check meaningful "Current" metrics
  const hasCurrentMetric = 
    sc.currentMetricPerShare !== '' || 
    sc.currentMetricTotal !== '' || 
    sc.currentRevenue !== '' || 
    sc.currentShares !== '';

  const hasNiMetric = 
    sc.niCurrentMetricPerShare !== '' ||
    sc.niCurrentMetricTotal !== '' ||
    sc.niFinalMargin !== '';

  const hasCustomMetric =
    sc.customCurrentMetricPerShare !== '' ||
    sc.customCurrentMetricTotal !== '' ||
    sc.customFinalMargin !== '';

  // Check growth rates (Advanced)
  const hasMetricGrowth = sc.metricGrowthRates.some(r => r !== '');
  const hasMetricGrowthTotal = sc.metricGrowthRatesTotal.some(r => r !== '');
  const hasRevenueGrowth = sc.revenueGrowthRates.some(r => r !== '');
  const hasFinalMargin = sc.finalMargins.some(r => r !== '');
  const hasSharesGrowth = sc.sharesGrowthRates.some(r => r !== '');

  // Check growth rates (Basic)
  const hasSimpleGrowth = 
    sc.simpleMetricGrowthRate !== '' ||
    sc.simpleMetricGrowthRateTotal !== '' ||
    sc.simpleRevenueGrowthRate !== '' ||
    sc.simpleFinalMargin !== '' ||
    sc.simpleSharesGrowthRate !== '';

  return !hasName && !hasBuyPrice && !hasCurrentMetric && 
         !hasNiMetric && !hasCustomMetric &&
         !hasMetricGrowth && !hasMetricGrowthTotal && 
         !hasRevenueGrowth && !hasFinalMargin && !hasSharesGrowth &&
         !hasSimpleGrowth;
}
