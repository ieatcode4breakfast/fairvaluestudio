import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scenario, Results } from '../types';
import { NumericFormat } from './NumericFormat';
import { Toggle } from './Toggle';
import { Settings2, TrendingUp, DollarSign, Trash2, InfoIcon, ChevronDown, RotateCcw } from './Icons';
import { INPUT_CLS, MAX_SPLITS } from '../utils/constants';
import { formatCurrency, formatPercent } from '../utils/helpers';
import { getSimpleLabels } from '../utils/summary';
import { createDefaultScenario } from '../utils/scenario';

let ignoreTrackClickUntil = 0;

interface ScenarioPanelProps {
  sc: Scenario;
  index: number;
  totalScenarios: number;
  onUpdate: (id: number, changes: Partial<Scenario>) => void;
  onDelete: (id: number) => void;
  onResetAll: () => void;
  results: Results;
}

export function ScenarioPanel({ sc, index, totalScenarios, onUpdate, onDelete, onResetAll, results }: ScenarioPanelProps) {
  const valYears = Number(sc.years) || 0;
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const showSlider = !isSimple && valYears >= 3;
  const canDelete = totalScenarios > 1;

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  useEffect(() => {
    setDeleteConfirm(false);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }, [sc.id]);

  const handleDeleteClick = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(false), 3000);
    } else {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      onDelete(sc.id);
    }
  };

  const upd = useCallback((changes: Partial<Scenario>) => onUpdate(sc.id, changes), [sc.id, onUpdate]);
  const lbl = isSimple ? getSimpleLabels(sc) : null;

  /* ── Advanced phase split helpers ── */
  const handleAddSplit = (year: number) => {
    if (sc.splitYears.length >= MAX_SPLITS) return;
    if (year <= 1 || year >= valYears || sc.splitYears.includes(year)) return;
    const newSplits = [...sc.splitYears, year].sort((a, b) => a - b);
    const newIndex = newSplits.indexOf(year);
    const ins = (arr: any[]) => { const r = [...arr]; r.splice(newIndex + 1, 0, r[newIndex]); return r.slice(0, 10); };
    upd({
      splitYears: newSplits,
      metricGrowthRates: ins(sc.metricGrowthRates),
      metricGrowthRatesTotal: ins(sc.metricGrowthRatesTotal),
      revenueGrowthRates: ins(sc.revenueGrowthRates),
      finalMargins: ins(sc.finalMargins),
      sharesGrowthRates: ins(sc.sharesGrowthRates),
    });
  };

  const handleRemoveSplit = (year: number) => {
    ignoreTrackClickUntil = Date.now() + 500;
    const idx = sc.splitYears.indexOf(year);
    if (idx === -1) return;
    const rem = (arr: any[]) => { const r = [...arr]; r.splice(idx + 1, 1); r.push(r[r.length - 1]); return r.slice(0, 10); };
    upd({
      hoverYear: null,
      splitYears: sc.splitYears.filter(y => y !== year),
      metricGrowthRates: rem(sc.metricGrowthRates),
      metricGrowthRatesTotal: rem(sc.metricGrowthRatesTotal),
      revenueGrowthRates: rem(sc.revenueGrowthRates),
      finalMargins: rem(sc.finalMargins),
      sharesGrowthRates: rem(sc.sharesGrowthRates),
    });
  };

  /* ── Advanced phase input renderers ── */
  const renderAdvancedPerShare = () => {
    if (sc.splitYears.length > 0) return (
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {Array.from({ length: sc.splitYears.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : sc.splitYears[i - 1];
          const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
          return (
            <div key={i}>
              <label className="block text-sm font-medium text-slate-600 mb-1">FCF Growth Rate (Yrs {s}-{e}) (%)</label>
              <NumericFormat
                value={sc.metricGrowthRates[i]}
                onValueChange={v => { const n = [...sc.metricGrowthRates]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ metricGrowthRates: n }); }}
                className={INPUT_CLS}
              />
            </div>
          );
        })}
      </div>
    );
    return (
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">FCF Growth Rate (%)</label>
        <NumericFormat
          value={sc.metricGrowthRates[0]}
          onValueChange={v => { const n = [...sc.metricGrowthRates]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ metricGrowthRates: n }); }}
          className={INPUT_CLS}
        />
      </div>
    );
  };

  const renderAdvancedTotal = () => {
    if (sc.splitYears.length > 0) return (
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {Array.from({ length: sc.splitYears.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : sc.splitYears[i - 1];
          const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
          return (
            <div key={i}>
              <h3 className="text-sm font-medium text-slate-800 mb-2">Phase {i + 1} (Yrs {s}-{e})</h3>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">FCF Growth (%)</label>
                  <NumericFormat value={sc.metricGrowthRatesTotal[i]} onValueChange={v => { const n = [...sc.metricGrowthRatesTotal]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ metricGrowthRatesTotal: n }); }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Share Growth (%)</label>
                  <NumericFormat value={sc.sharesGrowthRates[i]} onValueChange={v => { const n = [...sc.sharesGrowthRates]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ sharesGrowthRates: n }); }} className={INPUT_CLS} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
    return (
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">FCF Growth (%)</label>
          <NumericFormat value={sc.metricGrowthRatesTotal[0]} onValueChange={v => { const n = [...sc.metricGrowthRatesTotal]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ metricGrowthRatesTotal: n }); }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Share Growth (%)</label>
          <NumericFormat value={sc.sharesGrowthRates[0]} onValueChange={v => { const n = [...sc.sharesGrowthRates]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ sharesGrowthRates: n }); }} className={INPUT_CLS} />
        </div>
      </div>
    );
  };

  const renderAdvancedRevenue = () => {
    if (sc.splitYears.length > 0) return (
      <div className="space-y-4 pt-4 border-t border-slate-100">
        {Array.from({ length: sc.splitYears.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : sc.splitYears[i - 1];
          const e = i === sc.splitYears.length ? valYears : sc.splitYears[i] - 1;
          return (
            <div key={i}>
              <h3 className="text-sm font-medium text-slate-800 mb-2">Phase {i + 1} (Yrs {s}-{e})</h3>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rev Growth (%)</label>
                  <NumericFormat value={sc.revenueGrowthRates[i]} onValueChange={v => { const n = [...sc.revenueGrowthRates]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ revenueGrowthRates: n }); }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">FCF Margin (%)</label>
                  <NumericFormat value={sc.finalMargins[i]} onValueChange={v => { const n = [...sc.finalMargins]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ finalMargins: n }); }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Share Growth (%)</label>
                  <NumericFormat value={sc.sharesGrowthRates[i]} onValueChange={v => { const n = [...sc.sharesGrowthRates]; n[i] = v.floatValue === undefined ? '' : v.floatValue; upd({ sharesGrowthRates: n }); }} className={INPUT_CLS} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
    return (
      <div className="grid grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rev Growth (%)</label>
          <NumericFormat value={sc.revenueGrowthRates[0]} onValueChange={v => { const n = [...sc.revenueGrowthRates]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ revenueGrowthRates: n }); }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">FCF Margin (%)</label>
          <NumericFormat value={sc.finalMargins[0]} onValueChange={v => { const n = [...sc.finalMargins]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ finalMargins: n }); }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Share Growth (%)</label>
          <NumericFormat value={sc.sharesGrowthRates[0]} onValueChange={v => { const n = [...sc.sharesGrowthRates]; n[0] = v.floatValue === undefined ? '' : v.floatValue; upd({ sharesGrowthRates: n }); }} className={INPUT_CLS} />
        </div>
      </div>
    );
  };

  const mosColor = results.marginOfSafety !== null ? (results.marginOfSafety > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const upsideColor = results.upside !== null ? (results.upside > 0 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-900';
  const irrColor = results.irr && results.irr > (Number(sc.discountRate) || 0) ? 'text-emerald-600' : 'text-slate-900';
  const maxYears = isSimple ? 10 : 50;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ══ LEFT: INPUTS ══ */}
      <div className="lg:col-span-4 space-y-6">

        {/* Meta card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {canDelete && (
            <button
              onClick={handleDeleteClick}
              className={`w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${deleteConfirm
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                }`}
            >
              <Trash2 className="w-4 h-4" />
              {deleteConfirm ? 'Are you sure? Click to confirm' : 'Delete Scenario'}
            </button>
          )}
          <button
            onClick={onResetAll}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Scenarios
          </button>

          <label className="block text-sm font-medium text-slate-600 mb-1">Scenario Name</label>
          <input
            type="text"
            value={sc.scenarioName}
            onChange={e => upd({ scenarioName: e.target.value })}
            maxLength={50}
            placeholder="e.g. AAPL - Base Case"
            className={INPUT_CLS}
          />

          <button
            onClick={() => {
              if (!sc.showResetConfirm) {
                upd({ showResetConfirm: true });
                setTimeout(() => onUpdate(sc.id, { showResetConfirm: false }), 3000);
              } else {
                const fresh = createDefaultScenario();
                onUpdate(sc.id, { ...fresh, id: sc.id, showResetConfirm: false });
              }
            }}
            className={`w-full mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${sc.showResetConfirm
              ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
          >
            {sc.showResetConfirm ? 'Are you sure? (Click to confirm)' : 'Reset Scenario'}
          </button>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-600 mb-1">Method</label>
            <select
              value={sc.dcfMethod}
              onChange={e => {
                const newMethod = e.target.value;
                const changes: Partial<Scenario> = { dcfMethod: newMethod };
                if (newMethod === 'Basic DCF') {
                  if (Number(sc.years) > 10) changes.years = 10;
                  if (sc.exitAssumptionType === 'Perpetuity Growth') changes.exitAssumptionType = 'Multiple';
                }
                upd(changes);
              }}
              className={INPUT_CLS}
            >
              <option value="Basic DCF">Basic DCF</option>
              <option value="Advanced DCF">Advanced DCF</option>
            </select>
          </div>

          {/* Basic DCF: Metric + Projection Method */}
          {isSimple && lbl && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Metric</label>
                <select value={sc.simpleMetricType} onChange={e => upd({ simpleMetricType: e.target.value })} className={INPUT_CLS}>
                  <option>Free Cash Flow</option>
                  <option>Net Income (Earnings)</option>
                  <option>Custom</option>
                </select>
              </div>
              {sc.simpleMetricType === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Custom Metric Name</label>
                  <input
                    type="text"
                    value={sc.simpleCustomMetric}
                    onChange={e => upd({ simpleCustomMetric: e.target.value })}
                    placeholder="e.g. EBITDA, Operating Cash Flow"
                    className={INPUT_CLS}
                  />
                </div>
              )}
              <div>
                {(() => {
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
                  return (
                    <select value={sc.simpleProjectionMethod} onChange={e => upd({ simpleProjectionMethod: e.target.value })} className={INPUT_CLS}>
                      <option value="Per Share">Per Share</option>
                      <option value="Metric, Share Count">{m1}, Share Count</option>
                      <option value="Revenue, Metric Margin, Share Count">Revenue, {m2} Margin, Share Count</option>
                    </select>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Advanced DCF: Projection Method */}
          {!isSimple && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <select value={sc.projectionMethod} onChange={e => upd({ projectionMethod: e.target.value })} className={INPUT_CLS}>
                <option value="Per Share Method">Per Share</option>
                <option value="Total FCF, Share Count">Total FCF, Share Count</option>
                <option value="Revenue, FCF Margin, Share Count">Revenue, FCF Margin, Share Count</option>
              </select>
            </div>
          )}
        </div>

        {/* ── COMBINED: Assumptions & Growth card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* General Assumptions Section */}
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-slate-400" /> General Assumptions
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Buy Price ($)</label>
                <NumericFormat value={sc.buyPrice} onValueChange={v => upd({ buyPrice: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Years to Forecast (Max {maxYears})</label>
                  <NumericFormat
                    value={sc.years}
                    onValueChange={v => {
                      let val = v.floatValue;
                      if (val !== undefined && val > maxYears) val = maxYears;
                      upd({ years: val === undefined ? '' : val });
                    }}
                    isAllowed={v => v.floatValue === undefined || v.floatValue <= maxYears}
                    className={INPUT_CLS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Discount Rate (%)</label>
                  <NumericFormat value={sc.discountRate} onValueChange={v => upd({ discountRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                </div>
              </div>

              {/* Terminal Value */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                  Terminal Value
                </label>
                <div className="space-y-2">
                  <select value={sc.exitAssumptionType} onChange={e => upd({ exitAssumptionType: e.target.value })} className={INPUT_CLS}>
                    <option value="Multiple">Exit Multiple</option>
                    <option value="Yield">Exit Yield (%)</option>
                    {!isSimple && <option value="Perpetuity Growth">Growth in Perpetuity (%)</option>}
                  </select>

                  {sc.exitAssumptionType === 'Multiple' && (
                    <NumericFormat value={sc.exitMultiple} onValueChange={v => upd({ exitMultiple: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  )}
                  {sc.exitAssumptionType === 'Yield' && (
                    <NumericFormat value={sc.exitYield} onValueChange={v => upd({ exitYield: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  )}
                  {sc.exitAssumptionType === 'Perpetuity Growth' && !isSimple && (
                    <div>
                      <NumericFormat value={sc.perpetuityGrowthRate} onValueChange={v => upd({ perpetuityGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                      <p className="text-xs text-slate-400 mt-1 italic">Implied Multiple: {results.effectiveMultiple.toFixed(2)}x</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── SIMPLE: Growth section ── */}
          {isSimple && lbl && (
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-400" /> Growth
              </h2>

              {sc.simpleProjectionMethod === 'Per Share' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{lbl.labelCurrentPerShare} ($)</label>
                    <NumericFormat value={sc.simpleCurrentMetricPerShare} onValueChange={v => upd({ simpleCurrentMetricPerShare: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{lbl.labelGrowthRate} (%)</label>
                    <NumericFormat value={sc.simpleMetricGrowthRate} onValueChange={v => upd({ simpleMetricGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  </div>
                </div>
              )}

              {sc.simpleProjectionMethod === 'Metric, Share Count' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Values in Millions</span>
                    <Toggle checked={sc.simpleInMillions} onChange={() => upd({ simpleInMillions: !sc.simpleInMillions })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Current {lbl.metricName} {sc.simpleInMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.simpleCurrentMetricTotal} onValueChange={v => upd({ simpleCurrentMetricTotal: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">{lbl.metricName} Growth (%)</label>
                      <NumericFormat value={sc.simpleMetricGrowthRateTotal} onValueChange={v => upd({ simpleMetricGrowthRateTotal: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares {sc.simpleInMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.simpleCurrentShares} onValueChange={v => upd({ simpleCurrentShares: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares Growth (%)</label>
                      <NumericFormat value={sc.simpleSharesGrowthRate} onValueChange={v => upd({ simpleSharesGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}

              {sc.simpleProjectionMethod === 'Revenue, Metric Margin, Share Count' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Values in Millions</span>
                    <Toggle checked={sc.simpleInMillions} onChange={() => upd({ simpleInMillions: !sc.simpleInMillions })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Current Revenue {sc.simpleInMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.simpleCurrentRevenue} onValueChange={v => upd({ simpleCurrentRevenue: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Revenue Growth (%)</label>
                      <NumericFormat value={sc.simpleRevenueGrowthRate} onValueChange={v => upd({ simpleRevenueGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Final {lbl.metricName} Margin (%)</label>
                    <NumericFormat value={sc.simpleFinalMargin} onValueChange={v => upd({ simpleFinalMargin: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares {sc.simpleInMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.simpleCurrentShares} onValueChange={v => upd({ simpleCurrentShares: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares Growth (%)</label>
                      <NumericFormat value={sc.simpleSharesGrowthRate} onValueChange={v => upd({ simpleSharesGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ADVANCED: Growth section ── */}
          {!isSimple && (
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-400" /> Growth
              </h2>

              {/* Current Metrics */}
              {sc.projectionMethod === 'Per Share Method' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current FCF Per Share ($)</label>
                    <NumericFormat value={sc.currentMetricPerShare} onValueChange={v => upd({ currentMetricPerShare: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                  </div>
                </div>
              )}

              {sc.projectionMethod === 'Total FCF, Share Count' && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Values in Millions</span>
                    <Toggle checked={sc.inMillions} onChange={() => upd({ inMillions: !sc.inMillions })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Current FCF {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.currentMetricTotal} onValueChange={v => upd({ currentMetricTotal: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.currentShares} onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}

              {sc.projectionMethod === 'Revenue, FCF Margin, Share Count' && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Values in Millions</span>
                    <Toggle checked={sc.inMillions} onChange={() => upd({ inMillions: !sc.inMillions })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Current Revenue {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.currentRevenue} onValueChange={v => upd({ currentRevenue: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat value={sc.currentShares} onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Phases Slider */}
              {showSlider && (
                <div className="mb-8 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-medium text-slate-800">Growth Phases</h3>
                    <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                      {sc.splitYears.length === 0 ? 'Single Phase' : `${sc.splitYears.length + 1} Phases`}
                    </span>
                  </div>
                  <div className="px-2 relative h-12">
                    <div
                      className={`absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-slate-200 rounded-lg ${sc.splitYears.length >= MAX_SPLITS ? 'cursor-default' : 'cursor-pointer'}`}
                      onMouseMove={(e) => {
                        if (sc.splitYears.length >= MAX_SPLITS) { upd({ hoverYear: null }); return; }
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const yr = Math.round(pct * (valYears - 1)) + 1;
                        upd({ hoverYear: (yr > 1 && yr < valYears && !sc.splitYears.includes(yr)) ? yr : null });
                      }}
                      onMouseLeave={() => upd({ hoverYear: null })}
                      onClick={(e) => {
                        if (Date.now() < ignoreTrackClickUntil) return;
                        if (sc.splitYears.length >= MAX_SPLITS) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const yr = Math.round(pct * (valYears - 1)) + 1;
                        if (yr > 1 && yr < valYears && !sc.splitYears.includes(yr)) {
                          handleAddSplit(yr);
                          upd({ hoverYear: null });
                        }
                      }}
                    >
                      {Array.from({ length: sc.splitYears.length + 1 }).map((_, i) => {
                        const s = i === 0 ? 1 : sc.splitYears[i - 1];
                        const e2 = i === sc.splitYears.length ? valYears : sc.splitYears[i];
                        const left = ((s - 1) / (valYears - 1)) * 100;
                        const width = ((e2 - s) / (valYears - 1)) * 100;
                        return <div key={i} className="absolute h-full bg-indigo-500 rounded-lg opacity-20" style={{ left: `${left}%`, width: `${width}%` }} />;
                      })}
                      {sc.hoverYear !== null && sc.splitYears.length < MAX_SPLITS && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-300 rounded-full z-0 pointer-events-none hidden [@media(hover:hover)]:block"
                          style={{ left: `${((sc.hoverYear - 1) / (valYears - 1)) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Add phase at Year {sc.hoverYear}
                          </div>
                        </div>
                      )}
                    </div>

                    {sc.splitYears.map((year, idx) => {
                      const left = ((year - 1) / (valYears - 1)) * 100;
                      return (
                        <div
                          key={`split-${idx}`}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-grab z-10 flex items-center justify-center group"
                          style={{ left: `${left}%` }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSplit(year);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            const now = Date.now();
                            const target = e.currentTarget as any;
                            const lastTap = Number(target.dataset.lastTap) || 0;
                            if (now - lastTap < 300) {
                              if (e.cancelable) e.preventDefault();
                              handleRemoveSplit(year);
                              target.dataset.lastTap = 0;
                              return;
                            }
                            target.dataset.lastTap = now;

                            if (e.cancelable) e.preventDefault();
                            const track = e.currentTarget.parentElement;
                            if (!track) return;
                            upd({ draggingIndex: idx });
                            const onMove = (mv: TouchEvent) => {
                              const rect = track.getBoundingClientRect();
                              const pct = Math.max(0, Math.min(1, (mv.touches[0].clientX - rect.left) / rect.width));
                              const newYr = Math.round(pct * (valYears - 1)) + 1;
                              const minYr = idx === 0 ? 2 : sc.splitYears[idx - 1] + 1;
                              const maxYr = idx === sc.splitYears.length - 1 ? valYears - 1 : sc.splitYears[idx + 1] - 1;
                              const clamped = Math.max(minYr, Math.min(maxYr, newYr));
                              upd({ splitYears: sc.splitYears.map((y, si) => si === idx ? clamped : y) });
                            };
                            const onUp = () => {
                              upd({ draggingIndex: null });
                              document.removeEventListener('touchmove', onMove);
                              document.removeEventListener('touchend', onUp);
                            };
                            document.addEventListener('touchmove', onMove, { passive: false });
                            document.addEventListener('touchend', onUp);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const track = e.currentTarget.parentElement;
                            if (!track) return;
                            upd({ draggingIndex: idx });
                            const onMove = (mv: MouseEvent) => {
                              const rect = track.getBoundingClientRect();
                              const pct = Math.max(0, Math.min(1, (mv.clientX - rect.left) / rect.width));
                              const newYr = Math.round(pct * (valYears - 1)) + 1;
                              const minYr = idx === 0 ? 2 : sc.splitYears[idx - 1] + 1;
                              const maxYr = idx === sc.splitYears.length - 1 ? valYears - 1 : sc.splitYears[idx + 1] - 1;
                              const clamped = Math.max(minYr, Math.min(maxYr, newYr));
                              upd({ splitYears: sc.splitYears.map((y, si) => si === idx ? clamped : y) });
                            };
                            const onUp = () => {
                              upd({ draggingIndex: null });
                              document.removeEventListener('mousemove', onMove);
                              document.removeEventListener('mouseup', onUp);
                            };
                            document.addEventListener('mousemove', onMove);
                            document.addEventListener('mouseup', onUp);
                          }}
                        >
                          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity ${sc.draggingIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            Year {year}
                          </div>
                        </div>
                      );
                    })}

                    <div className="absolute top-full left-0 right-0 flex justify-between text-xs text-slate-400 mt-2">
                      <span>1</span><span>{valYears}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-6 text-center">Click/tap track to add a phase split (max 10). Double-click/tap a dot to remove.</p>
                </div>
              )}

              {/* Phase Growth Inputs */}
              <div className={!showSlider ? "pt-6 border-t border-slate-100" : ""}>
                {sc.projectionMethod === 'Per Share Method' && renderAdvancedPerShare()}
                {sc.projectionMethod === 'Total FCF, Share Count' && renderAdvancedTotal()}
                {sc.projectionMethod === 'Revenue, FCF Margin, Share Count' && renderAdvancedRevenue()}
              </div>

            </div>
          )}
        </div>

      </div>{/* end left col */}

      {/* ══ RIGHT: RESULTS ══ */}
      <div className="lg:col-span-8 space-y-6">

        {/* Key metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-sm font-medium text-slate-500 mb-2">Intrinsic Value</div>
            <div className="text-5xl md:text-6xl font-light tracking-tight text-slate-900 truncate">{formatCurrency(results.intrinsicValueTotal)}</div>
            <div className="text-sm text-slate-400 mt-2">Total Present Value</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-sm font-medium text-slate-500 mb-2">Margin of Safety</div>
            <div className={`text-4xl font-light tracking-tight truncate ${mosColor}`}>{formatPercent(results.marginOfSafety)}</div>
            <div className="text-xs text-slate-400 mt-2">Discount to Intrinsic Value</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-sm font-medium text-slate-500 mb-2">Upside</div>
            <div className={`text-4xl font-light tracking-tight truncate ${upsideColor}`}>{formatPercent(results.upside)}</div>
            <div className="text-xs text-slate-400 mt-2">Potential return to Intrinsic Value</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-sm font-medium text-slate-500 mb-2">Internal Rate of Return (Annual Return)</div>
            <div className={`text-4xl font-light tracking-tight truncate ${irrColor}`}>{formatPercent(results.irr)}</div>
            <div className="text-xs text-slate-400 mt-2">At current buy price</div>
          </div>

          {isSimple && lbl && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-w-0">
              <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-1">
                Implied Growth Rate
                <button type="button" className="group relative focus:outline-none">
                  <InfoIcon className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none z-10">
                    {sc.simpleProjectionMethod === 'Per Share'
                      ? `The constant per-share growth rate required to justify the current buy price.`
                      : sc.simpleProjectionMethod === 'Metric, Share Count'
                        ? `The constant ${lbl.metricName.toLowerCase()} growth rate required to justify the current buy price.`
                        : `The constant revenue growth rate required to justify the current buy price.`}
                  </div>
                </button>
              </div>
              <div className="text-4xl font-light tracking-tight text-slate-900 truncate">{formatPercent(results.impliedGrowth)}</div>
              <div className="text-xs text-slate-400 mt-2">Reverse DCF</div>
            </div>
          )}
        </div>


        {/* Valuation Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-medium text-slate-800">Valuation Breakdown</h2>
            {isSimple && (
              <p className="text-sm text-slate-500 mt-2 flex items-start gap-2">
                <InfoIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                This Basic DCF method does not discount yearly cash flows. Instead, it treats the exit price at year {valYears || 'N'} as the sole cash flow, discounting it back to present value. This approach places greater emphasis on price appreciation rather and does not account for interim income.
              </p>
            )}
          </div>

          {isSimple && lbl && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Component</th>
                    <th className="px-6 py-3 text-right">Value Per Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{lbl.labelProjectedFinal} (Year {valYears})</td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(results.finalMetricPerShare)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      Terminal Value ({sc.exitAssumptionType === 'Multiple' ? 'Exit Multiple applied' : 'Exit Yield applied'})
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(results.terminalValuePerShare)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="px-6 py-4 text-slate-900">Present Value (Intrinsic Value)</td>
                    <td className="px-6 py-4 text-right text-indigo-600">{formatCurrency(results.intrinsicValueTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {!isSimple && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Component</th>
                    <th className="px-6 py-3 text-right">Value Per Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => upd({ showYearlyBreakdown: !sc.showYearlyBreakdown })}>
                    <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                       Present Value of Yearly Cash Flows
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${sc.showYearlyBreakdown ? 'rotate-180' : ''}`} />
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(results.pvOfCashFlows)}</td>
                  </tr>
                  {sc.showYearlyBreakdown && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={2} className="px-6 py-4">
                        <div className="space-y-1 text-sm text-slate-600 pl-4 border-l-2 border-indigo-100">
                          {results.yearlyDetails.map((d, i) => (
                            <div key={i} className="flex justify-between max-w-sm">
                              <span>Year {i + 1}: {formatCurrency(d.cf)}</span>
                              <span className="text-slate-400">(PV: {formatCurrency(d.pv)})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      Terminal Value ({sc.exitAssumptionType === 'Multiple' ? 'Exit Multiple' : sc.exitAssumptionType === 'Yield' ? 'Exit Yield' : 'Growth in Perpetuity'})
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(results.terminalValuePerShare)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">Present Value of Terminal Value</td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(results.presentValueTV)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-medium">
                    <td className="px-6 py-4 text-slate-900">Present Value (Intrinsic Value)</td>
                    <td className="px-6 py-4 text-right text-indigo-600">{formatCurrency(results.intrinsicValueTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>{/* end right col */}
    </div>
  );
}
