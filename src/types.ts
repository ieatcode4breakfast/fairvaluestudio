export interface Scenario {
  id: number;
  scenarioName: string;
  dcfMethod: string;

  buyPrice: number | string | '';
  years: number | string | '';
  discountRate: number | string | '';

  exitAssumptionType: string;
  exitMultiple: number | string | '';
  exitYield: number | string | '';
  perpetuityGrowthRate: number | string | '';

  simpleProjectionMethod: string;
  simpleMetricType: string;
  simpleCustomMetric: string;
  simpleMetricGrowthRate: number | string | '';
  simpleMetricGrowthRateTotal: number | string | '';
  simpleRevenueGrowthRate: number | string | '';
  simpleFinalMargin: number | string | '';
  simpleSharesGrowthRate: number | string | '';

  // ── Isolated Metric fields (Basic DCF) ──
  niCurrentMetricPerShare: number | string | '';
  niCurrentMetricTotal: number | string | '';
  niFinalMargin: number | string | '';
  customCurrentMetricPerShare: number | string | '';
  customCurrentMetricTotal: number | string | '';
  customFinalMargin: number | string | '';

  splitYears: number[];
  hoverYear: number | null;
  draggingIndex: number | null;
  projectionMethod: string;
  currentMetricPerShare: number | string | '';
  metricGrowthRates: (number | string | '')[];
  currentMetricTotal: number | string | '';
  metricGrowthRatesTotal: (number | string | '')[];
  currentRevenue: number | string | '';
  revenueGrowthRates: (number | string | '')[];
  finalMargins: (number | string | '')[];
  inMillions: boolean;
  currentShares: number | string | '';
  sharesGrowthRates: (number | string | '')[];

  ebitda: number | string | '';
  operatingCashflow: number | string | '';
  ebitdaPerShare: number | string | '';
  ocfPerShare: number | string | '';

  showResetConfirm: boolean;
  showYearlyBreakdown: boolean;
}

export interface Results {
  finalMetricPerShare: number;
  terminalValuePerShare: number;
  intrinsicValueTotal: number;
  irr: number | null;
  impliedGrowth: number | null;
  marginOfSafety: number | null;
  upside: number | null;
  pvOfCashFlows: number;
  presentValueTV: number;
  yearlyDetails: { year: number; cf: number; pv: number }[];
  effectiveMultiple: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  lastActiveValuationId?: string;
  notes?: string;
}

export interface ValuationMetadata {
  id: string;
  valuationName: string;
}

