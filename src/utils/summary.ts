import { Scenario, Results } from '../types';
import { formatCurrency, formatPercent } from './helpers';

export function getSimpleLabels(sc: Scenario) {
  const mt = sc.simpleMetricType;
  const metricName = mt === 'Net Income (Earnings)'
    ? 'Net Income'
    : mt === 'Custom'
    ? (sc.simpleCustomMetric || 'Custom Metric')
    : 'Free Cash Flow';
  const isNI = mt === 'Net Income (Earnings)';
  return {
    metricName,
    labelCurrentPerShare:  isNI ? 'Current Earnings Per Share' : `Current ${metricName} Per Share`,
    labelGrowthRate:       isNI ? 'Earnings Per Share Growth Rate' : `${metricName} Growth Rate`,
    labelProjectedFinal:   isNI ? 'Projected Final Earnings' : `Projected Final ${metricName}`,
    labelExitMultiple:     (isNI && sc.simpleProjectionMethod === 'Per Share')
                             ? 'Exit Multiple (x Earnings Per Share)'
                             : `Exit Multiple (x ${metricName})`,
  };
}

export function buildSummaryText(sc: Scenario, res: Results, index: number) {
  const valYears = Number(sc.years) || 0;
  const header =
    `════════════════════════════\n` +
    `SCENARIO ${index + 1}${sc.scenarioName ? ` — ${sc.scenarioName}` : ''}\n` +
    `════════════════════════════\n\n`;

  const exitStr = sc.exitAssumptionType === 'Multiple'
    ? `Exit Multiple: ${sc.exitMultiple}x`
    : sc.exitAssumptionType === 'Yield'
    ? `Exit Yield: ${sc.exitYield}%`
    : `Growth in Perpetuity: ${sc.perpetuityGrowthRate}%`;

  if (sc.dcfMethod === 'Basic DCF') {
    const lbl = getSimpleLabels(sc);
    let methodInputs = '';

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
      methodInputs =
        `${lbl.labelCurrentPerShare}: ${formatCurrency(Number(metricPerShare) || 0)}\n` +
        `${lbl.labelGrowthRate}: ${sc.simpleMetricGrowthRate}%\n`;
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      methodInputs =
        `Current ${lbl.metricName}: ${formatCurrency(Number(metricTotal) || 0)}${sc.inMillions ? ' M' : ''}\n` +
        `${lbl.metricName} Growth Rate: ${sc.simpleMetricGrowthRateTotal}%\n` +
        `Shares: ${sc.currentShares}${sc.inMillions ? ' M' : ''}\n` +
        `Shares Growth: ${sc.simpleSharesGrowthRate}%\n`;
    } else {
      methodInputs =
        `Current Revenue: ${formatCurrency(Number(sc.currentRevenue) || 0)}${sc.inMillions ? ' M' : ''}\n` +
        `Revenue Growth: ${sc.simpleRevenueGrowthRate}%\n` +
        `Final ${lbl.metricName} Margin: ${metricMargin}%\n` +
        `Shares: ${sc.currentShares}${sc.inMillions ? ' M' : ''}\n` +
        `Shares Growth: ${sc.simpleSharesGrowthRate}%\n`;
    }

    let m1 = 'Metric';
    let m2 = 'Metric';
    if (sc.simpleMetricType === 'Free Cash Flow') {
      m1 = 'Total FCF';
      m2 = 'FCF';
    } else if (sc.simpleMetricType === 'Net Income (Earnings)') {
      m1 = 'Net Income';
      m2 = 'Net Income';
    } else if (sc.simpleMetricType === 'Custom') {
      m1 = sc.simpleCustomMetric || 'Custom Metric';
      m2 = sc.simpleCustomMetric || 'Custom Metric';
    }

    let metricsLabel = '';
    if (sc.simpleProjectionMethod === 'Per Share') {
      metricsLabel = `${lbl.metricName}, Per Share`;
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      metricsLabel = `${lbl.metricName}, ${m1}, Share Count`;
    } else if (sc.simpleProjectionMethod === 'Revenue, Metric Margin, Share Count') {
      metricsLabel = `Revenue, ${m2} Margin, Share Count`;
    }

    return (
      header +
      `Method: Basic DCF\n\n` +
      `[ Inputs ]\n` +
      `Buy Price: ${formatCurrency(Number(sc.buyPrice) || 0)}\n` +
      `Years: ${sc.years}\n` +
      `Discount Rate: ${sc.discountRate}%\n` +
      `Metrics: ${metricsLabel}\n` +
      methodInputs +
      exitStr + `\n\n` +
      `[ Outputs ]\n` +
      `Intrinsic Value: ${formatCurrency(res.intrinsicValueTotal)}\n` +
      `Margin of Safety: ${formatPercent(res.marginOfSafety)}\n` +
      `Upside: ${formatPercent(res.upside)}\n` +
      `IRR: ${formatPercent(res.irr)}\n` +
      `Implied Growth Rate: ${formatPercent(res.impliedGrowth)}\n\n` +
      `[ Breakdown ]\n` +
      `${lbl.labelProjectedFinal} (Year ${valYears}): ${formatCurrency(res.finalMetricPerShare)}\n` +
      `Terminal Value: ${formatCurrency(res.terminalValuePerShare)}\n` +
      `Present Value (Intrinsic Value): ${formatCurrency(res.intrinsicValueTotal)}\n`
    );
  }

  let phaseInputs = '';
  if (sc.projectionMethod === 'Per Share Method') {
    phaseInputs = `Current FCF Per Share: ${formatCurrency(Number(sc.currentMetricPerShare) || 0)}\n`;
    if (sc.splitYears.length > 0) {
      for (let i = 0; i <= sc.splitYears.length; i++) {
        const s = i === 0 ? 1 : sc.splitYears[i - 1];
        const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
        phaseInputs += `FCF Growth Rate (Yrs ${s}-${e}): ${sc.metricGrowthRates[i]}%\n`;
      }
    } else {
      phaseInputs += `FCF Growth Rate: ${sc.metricGrowthRates[0]}%\n`;
    }
  } else if (sc.projectionMethod === 'Total FCF, Share Count') {
    phaseInputs = `Current FCF: ${formatCurrency(Number(sc.currentMetricTotal) || 0)}${sc.inMillions ? ' M' : ''}\n`;
    if (sc.splitYears.length > 0) {
      for (let i = 0; i <= sc.splitYears.length; i++) {
        const s = i === 0 ? 1 : sc.splitYears[i - 1];
        const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
        phaseInputs += `FCF Growth (Yrs ${s}-${e}): ${sc.metricGrowthRatesTotal[i]}%\nShare Growth (Yrs ${s}-${e}): ${sc.sharesGrowthRates[i]}%\n`;
      }
    } else {
      phaseInputs += `FCF Growth: ${sc.metricGrowthRatesTotal[0]}%\nShare Growth: ${sc.sharesGrowthRates[0]}%\n`;
    }
    phaseInputs += `Shares: ${sc.currentShares}${sc.inMillions ? ' M' : ''}\n`;
  } else {
    phaseInputs = `Current Revenue: ${formatCurrency(Number(sc.currentRevenue) || 0)}${sc.inMillions ? ' M' : ''}\n`;
    if (sc.splitYears.length > 0) {
      for (let i = 0; i <= sc.splitYears.length; i++) {
        const s = i === 0 ? 1 : sc.splitYears[i - 1];
        const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
        phaseInputs += `Rev Growth (Yrs ${s}-${e}): ${sc.revenueGrowthRates[i]}%\nFCF Margin (Yrs ${s}-${e}): ${sc.finalMargins[i]}%\nShare Growth (Yrs ${s}-${e}): ${sc.sharesGrowthRates[i]}%\n`;
      }
    } else {
      phaseInputs += `Rev Growth: ${sc.revenueGrowthRates[0]}%\nFCF Margin: ${sc.finalMargins[0]}%\nShare Growth: ${sc.sharesGrowthRates[0]}%\n`;
    }
    phaseInputs += `Shares: ${sc.currentShares}${sc.inMillions ? ' M' : ''}\n`;
  }

  let advMetricsLabel = '';
  if (sc.projectionMethod === 'Per Share Method') {
    advMetricsLabel = 'Free Cash Flow, Per Share';
  } else if (sc.projectionMethod === 'Total FCF, Share Count') {
    advMetricsLabel = 'Free Cash Flow, Total FCF, Share Count';
  } else {
    advMetricsLabel = 'Revenue, FCF Margin, Share Count';
  }

  return (
    header +
    `Method: Advanced DCF\n\n` +
    `[ Inputs ]\n` +
    `Buy Price: ${formatCurrency(Number(sc.buyPrice) || 0)}\n` +
    `Years: ${sc.years}\n` +
    `Discount Rate: ${sc.discountRate}%\n` +
    `Metrics: ${advMetricsLabel}\n` +
    phaseInputs +
    exitStr + `\n\n` +
    `[ Outputs ]\n` +
    `Intrinsic Value: ${formatCurrency(res.intrinsicValueTotal)}\n` +
    `Margin of Safety: ${formatPercent(res.marginOfSafety)}\n` +
    `Upside: ${formatPercent(res.upside)}\n` +
    `IRR: ${formatPercent(res.irr)}\n\n` +
    `[ Breakdown ]\n` +
    `PV of Yearly CFs: ${formatCurrency(res.pvOfCashFlows)}\n` +
    `PV of Terminal Value: ${formatCurrency(res.presentValueTV)}\n` +
    `Intrinsic Value: ${formatCurrency(res.intrinsicValueTotal)}\n\n` +
    `[ Yearly Projections ]\n` +
    res.yearlyDetails.map(d => `Year ${d.year}: ${formatCurrency(d.cf)} (PV: ${formatCurrency(d.pv)})`).join('\n') +
    '\n'
  );
}
