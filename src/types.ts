export interface Scenario {
  id: number;
  scenarioName: string;
  dcfMethod: string;

  buyPrice: number | '';
  years: number | '';
  discountRate: number | '';

  exitAssumptionType: string;
  exitMultiple: number | '';
  exitYield: number | '';
  perpetuityGrowthRate: number | '';

  simpleProjectionMethod: string;
  simpleMetricType: string;
  simpleCustomMetric: string;
  simpleCurrentMetricPerShare: number | '';
  simpleMetricGrowthRate: number | '';
  simpleCurrentMetricTotal: number | '';
  simpleMetricGrowthRateTotal: number | '';
  simpleCurrentRevenue: number | '';
  simpleRevenueGrowthRate: number | '';
  simpleFinalMargin: number | '';
  simpleCurrentShares: number | '';
  simpleSharesGrowthRate: number | '';
  simpleInMillions: boolean;

  splitYears: number[];
  hoverYear: number | null;
  draggingIndex: number | null;
  projectionMethod: string;
  currentMetricPerShare: number | '';
  metricGrowthRates: (number | '')[];
  currentMetricTotal: number | '';
  metricGrowthRatesTotal: (number | '')[];
  currentRevenue: number | '';
  revenueGrowthRates: (number | '')[];
  finalMargins: (number | '')[];
  inMillions: boolean;
  currentShares: number | '';
  sharesGrowthRates: (number | '')[];

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
}

export interface ValuationMetadata {
  id: string;
  valuationName: string;
}

