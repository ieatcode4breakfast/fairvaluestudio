import React from 'react';
import { Scenario } from '../../types';
import { TrendingUp } from '../Icons';
import { NumericFormat } from '../NumericFormat';
import { Toggle } from '../Toggle';
import { INPUT_CLS, MAX_SPLITS } from '../../utils/constants';
import { getSimpleLabels } from '../../utils/summary';

interface GrowthCardProps {
  sc: Scenario;
  onUpdate: (changes: Partial<Scenario>) => void;
  ignoreTrackClickUntil: number;
  setIgnoreTrackClickUntil: (time: number) => void;
}

export function GrowthCard({ sc, onUpdate, ignoreTrackClickUntil, setIgnoreTrackClickUntil }: GrowthCardProps) {
  const upd = onUpdate;
  const valYears = Number(sc.years) || 0;
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const showSlider = !isSimple && valYears >= 3;
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
    setIgnoreTrackClickUntil(Date.now() + 500);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
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

  return (
    <>
      {/* ── SIMPLE: Growth section ── */}
      {isSimple && lbl && (
        <div className="p-6 pt-0 mt-6 border-t border-slate-100 relative">
          <h2 className="text-lg font-medium mb-4 mt-6 flex items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Current {lbl.metricName} {sc.simpleInMillions ? '(M)' : ''}</label>
                  <NumericFormat value={sc.simpleCurrentMetricTotal} onValueChange={v => upd({ simpleCurrentMetricTotal: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{lbl.metricName} Growth (%)</label>
                  <NumericFormat value={sc.simpleMetricGrowthRateTotal} onValueChange={v => upd({ simpleMetricGrowthRateTotal: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
        <div className="p-6 pt-0 mt-6 border-t border-slate-100 relative">
          <h2 className="text-lg font-medium mb-4 mt-6 flex items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
    </>
  );
}
