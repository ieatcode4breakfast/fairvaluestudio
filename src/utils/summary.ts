import { Scenario, Results } from '../types';
import { formatCurrency, formatPercent } from './helpers';

export function getSimpleLabels(sc: Scenario) {
  if (sc.simpleMetricType === 'Net Income (Earnings)') {
    return {
      metricName: 'Net Income',
      labelCurrentPerShare: 'Current EPS',
      labelGrowthRate: 'EPS Growth',
      labelMargin: 'Net Income Margin',
      labelProjectedFinal: 'Projected Final Earnings',
      labelExitMultiple: sc.simpleProjectionMethod === 'Per Share' ? 'Exit Multiple (x EPS)' : 'Exit Multiple (x Net Income)',
    };
  }
  if (sc.simpleMetricType === 'Operating Cash Flow') {
    return {
      metricName: 'OCF',
      labelCurrentPerShare: 'Current OCF Per Share',
      labelGrowthRate: 'OCF Growth',
      labelMargin: 'OCF Margin',
      labelProjectedFinal: 'Projected Final OCF',
      labelExitMultiple: 'Exit Multiple (x OCF)',
    };
  }
  if (sc.simpleMetricType === 'EBITDA') {
    return {
      metricName: 'EBITDA',
      labelCurrentPerShare: 'Current EBITDA Per Share',
      labelGrowthRate: 'EBITDA Growth',
      labelMargin: 'EBITDA Margin',
      labelProjectedFinal: 'Projected Final EBITDA',
      labelExitMultiple: 'Exit Multiple (x EBITDA)',
    };
  }
  if (sc.simpleMetricType === 'Book Value') {
    return {
      metricName: 'Book Value',
      labelCurrentPerShare: 'Current Book Value Per Share',
      labelGrowthRate: 'Book Value Growth',
      labelMargin: '', // Not used
      labelProjectedFinal: 'Projected Final Book Value',
      labelExitMultiple: 'Exit Multiple (x Book Value)',
    };
  }
  return {
    metricName: 'FCF',
    labelCurrentPerShare: 'Current FCF Per Share',
    labelGrowthRate: 'FCF Growth',
    labelMargin: 'FCF Margin',
    labelProjectedFinal: 'Projected Final FCF',
    labelExitMultiple: 'Exit Multiple (x FCF)',
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
    let metricTotal: number | string | '' = sc.currentMetricTotal;
    let metricMargin: number | string | '' = sc.simpleFinalMargin;

    if (sc.simpleMetricType === 'Net Income (Earnings)') {
      metricPerShare = sc.niCurrentMetricPerShare;
      metricTotal = sc.niCurrentMetricTotal;
      metricMargin = sc.niFinalMargin;
    } else if (sc.simpleMetricType === 'Operating Cash Flow') {
      metricPerShare = sc.ocfPerShare;
      metricTotal = sc.operatingCashflow;
      metricMargin = sc.ocfFinalMargin;
    } else if (sc.simpleMetricType === 'EBITDA') {
      metricPerShare = sc.ebitdaPerShare;
      metricTotal = sc.ebitda;
      metricMargin = sc.ebitdaFinalMargin;
    } else if (sc.simpleMetricType === 'Book Value') {
      metricPerShare = sc.bookValue;
    }

    const effectiveProjectionMethod = sc.simpleMetricType === 'Book Value' ? 'Per Share' : sc.simpleProjectionMethod;

    if (effectiveProjectionMethod === 'Per Share') {
      methodInputs =
        `${lbl.labelCurrentPerShare}: ${formatCurrency(Number(metricPerShare) || 0)}\n` +
        `${lbl.labelGrowthRate}: ${sc.simpleMetricGrowthRate}%\n`;
    } else if (effectiveProjectionMethod === 'Metric, Share Count') {
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
    } else if (sc.simpleMetricType === 'Operating Cash Flow') {
      m1 = 'OCF';
      m2 = 'OCF';
    } else if (sc.simpleMetricType === 'EBITDA') {
      m1 = 'EBITDA';
      m2 = 'EBITDA';
    }

    let metricsLabel = '';
    if (effectiveProjectionMethod === 'Per Share') {
      metricsLabel = `${lbl.metricName}, Per Share`;
    } else if (effectiveProjectionMethod === 'Metric, Share Count') {
      metricsLabel = `${lbl.metricName}, ${m1}, Share Count`;
    } else if (effectiveProjectionMethod === 'Revenue, Metric Margin, Share Count') {
      metricsLabel = `Revenue, ${m2} Margin, Share Count`;
    }

    return (
      header +
      `Method: Basic DCF\n\n` +
      `[ Inputs ]\n` +
      `Buy Price: ${formatCurrency(Number(sc.buyPrice) || 0)}\n` +
      `Years: ${sc.years}\n` +
      `Desired Yearly Return: ${sc.discountRate}%\n` +
      `Metrics: ${metricsLabel}\n` +
      methodInputs +
      exitStr + `\n\n` +
      `[ Outputs ]\n` +
      `Intrinsic Value: ${formatCurrency(res.intrinsicValueTotal)}\n` +
      `Margin of Safety: ${formatPercent(res.marginOfSafety)}\n` +
      `Upside: ${formatPercent(res.upside)}\n` +
      `Yearly Return: ${formatPercent(res.irr)}\n\n` +
      `[ Breakdown ]\n` +
      `${lbl.labelProjectedFinal} (Year ${valYears}): ${formatCurrency(res.finalMetricPerShare)}\n` +
      `Terminal Value: ${formatCurrency(res.terminalValuePerShare)}\n` +
      `Present Value (Intrinsic Value): ${formatCurrency(res.intrinsicValueTotal)}\n`
    );
  }

  let phaseInputs = '';
  if (sc.projectionMethod === 'Per Share Method') {
    phaseInputs = `Current Free Cash Flow Per Share: ${formatCurrency(Number(sc.currentMetricPerShare) || 0)}\n`;
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
