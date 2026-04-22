import React, { useState, useRef, useEffect } from 'react';
import { Scenario, Results } from '../../types';
import { Settings2, Search, InfoIcon, TrendingUp, Trash2, RotateCcw, Copy } from '../Icons';
import { Tooltip } from '../Tooltip';
import { StockSearchModal } from '../modals/StockSearchModal';
import { StockDataPreviewModal, DataField } from '../modals/StockDataPreviewModal';
import { NumericFormat } from '../NumericFormat';
import { Toggle } from '../Toggle';
import { INPUT_CLS, SELECT_CLS, MAX_SPLITS, BLANK_GLOW_CLS } from '../../utils/constants';
import { UnifiedFundamentals } from '../../api/marketData';
import { formatDynamicDecimal } from '../../utils/formatNumber';
import { getSimpleLabels } from '../../utils/summary';
import { convertMillions } from '../../utils/helpers';

interface AssumptionsCardProps {
  sc: Scenario;
  results: Results;
  onUpdate: (changes: Partial<Scenario>) => void;
  highlightedKeys: Set<string>;
  onSetHighlights: (keys: string[]) => void;
  onClearHighlight: (key: string) => void;
  currentUser: any;
  ignoreTrackClickUntil: number;
  setIgnoreTrackClickUntil: (time: number) => void;
  // MetaCard props
  canDelete: boolean;
  onDeleteClick: () => void;
  onDuplicateClick: () => void;
}

// ---------------------------------------------------------------------------
// computeFields
// Builds the list of DataFields that will be shown in the preview modal.
// Respects the current inMillions / simpleInMillions flag so labels and values
// match exactly what is displayed in GrowthCard inputs.
// ---------------------------------------------------------------------------
function computeFields(sc: Scenario, data: UnifiedFundamentals): DataField[] {
  const fields: DataField[] = [];
  const inMillions = sc.inMillions;

  // Helper to format values based on millions flag
  const round = (v: number) => parseFloat(formatDynamicDecimal(v));
  const s = (v: number) => round(inMillions ? v / 1_000_000 : v);

  // 1. Buy Price
  if (data.price !== null) {
    const roundedPrice = parseFloat(formatDynamicDecimal(data.price));
    fields.push({
      key: 'buyPrice',
      label: 'Buy Price',
      value: roundedPrice,
      formatted: formatDynamicDecimal(roundedPrice, true),
    });
  }

  // 2. Revenue
  if (data.revenue) {
    fields.push({
      key: 'currentRevenue',
      label: 'Revenue',
      value: s(data.revenue),
      formatted: formatDynamicDecimal(s(data.revenue), true),
    });
  }

  // 3. Net Income
  if (data.netIncome) {
    fields.push({
      key: 'niCurrentMetricTotal',
      label: 'Net Income',
      value: s(data.netIncome),
      formatted: formatDynamicDecimal(s(data.netIncome), true),
    });
  }

  // 4. Earnings Per Share
  if (data.eps) {
    fields.push({
      key: 'niCurrentMetricPerShare',
      label: 'Earnings Per Share',
      value: round(data.eps),
      formatted: formatDynamicDecimal(data.eps, true),
    });
  }

  // 5. Free Cash Flow
  if (data.freeCashFlow) {
    fields.push({
      key: 'currentMetricTotal',
      label: 'Free Cash Flow',
      value: s(data.freeCashFlow),
      formatted: formatDynamicDecimal(s(data.freeCashFlow), true),
    });
  }

  // 6. Free Cash Flow Per Share
  if (data.fcfPerShare) {
    fields.push({
      key: 'currentMetricPerShare',
      label: 'Free Cash Flow Per Share',
      value: round(data.fcfPerShare),
      formatted: formatDynamicDecimal(data.fcfPerShare, true),
    });
  }

  // 7. Operating Cash Flow
  if (data.operatingCashFlow) {
    fields.push({
      key: 'operatingCashflow',
      label: 'Operating Cash Flow',
      value: s(data.operatingCashFlow),
      formatted: formatDynamicDecimal(s(data.operatingCashFlow), true),
    });
  }

  // 8. Operating Cash Flow Per Share
  if (data.ocfPerShare) {
    fields.push({
      key: 'ocfPerShare',
      label: 'Operating Cash Flow Per Share',
      value: round(data.ocfPerShare),
      formatted: formatDynamicDecimal(data.ocfPerShare, true),
    });
  }

  // 9. EBITDA
  if (data.ebitda) {
    fields.push({
      key: 'ebitda',
      label: 'EBITDA',
      value: s(data.ebitda),
      formatted: formatDynamicDecimal(s(data.ebitda), true),
    });
  }

  // 10. EBITDA Per Share
  if (data.ebitdaPerShare) {
    fields.push({
      key: 'ebitdaPerShare',
      label: 'EBITDA Per Share',
      value: round(data.ebitdaPerShare),
      formatted: formatDynamicDecimal(data.ebitdaPerShare, true),
    });
  }

  // 11. Book Value
  if (data.bookValue) {
    fields.push({
      key: 'bookValue',
      label: 'Book Value',
      value: round(data.bookValue),
      formatted: formatDynamicDecimal(data.bookValue, true),
    });
  }

  // 12. Shares Outstanding
  if (data.sharesOutstanding) {
    fields.push({
      key: 'currentShares',
      label: 'Shares Outstanding',
      value: s(data.sharesOutstanding),
      formatted: formatDynamicDecimal(s(data.sharesOutstanding), true),
    });
  }

  return fields;
}

// ---------------------------------------------------------------------------
// AssumptionsCard
// ---------------------------------------------------------------------------
export function AssumptionsCard({
  sc, results, onUpdate, highlightedKeys, onSetHighlights, onClearHighlight, currentUser,
  ignoreTrackClickUntil, setIgnoreTrackClickUntil,
  canDelete, onDeleteClick, onDuplicateClick,
}: AssumptionsCardProps) {
  const upd = onUpdate;

  /* ── Delete confirm logic (from MetaCard) ── */
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
      onDeleteClick();
    }
  };

  const maxYears = sc.dcfMethod === 'Basic DCF' ? 10 : 50;
  const valYears = Number(sc.years) || 0;
  const isSimple = sc.dcfMethod === 'Basic DCF';
  const showSlider = !isSimple && valYears >= 3;
  const lbl = isSimple ? getSimpleLabels(sc) : null;
  const effectiveSplits = sc.splitYears.filter(y => y < valYears);

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
    if (effectiveSplits.length > 0) return (
      <div className="space-y-4">
        {Array.from({ length: effectiveSplits.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : effectiveSplits[i - 1];
          const e = i === effectiveSplits.length ? valYears : effectiveSplits[i] - 1;
          return (
            <div key={i}>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Phase {i + 1} (Yrs {s}-{e})</h3>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">FCF Growth Rate (%)</label>
              <NumericFormat
                value={sc.metricGrowthRates[i]}
                onValueChange={v => {
                  const val = v.floatValue === undefined ? '' : v.floatValue;
                  const n = [...sc.metricGrowthRates];
                  n[i] = val;
                  const changes: Partial<Scenario> = { metricGrowthRates: n };
                  if (i === 0) changes.simpleMetricGrowthRate = val;
                  upd(changes);
                }}
                className={INPUT_CLS}
              />
            </div>
          );
        })}
      </div>
    );
    return (
      <div>
        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">FCF Growth Rate (%)</label>
        <NumericFormat
          value={sc.metricGrowthRates[0]}
          onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.metricGrowthRates];
            n[0] = val;
            upd({ metricGrowthRates: n, simpleMetricGrowthRate: val });
          }}
          className={INPUT_CLS}
        />
      </div>
    );
  };

  const renderAdvancedTotal = () => {
    if (effectiveSplits.length > 0) return (
      <div className="space-y-4">
        {Array.from({ length: effectiveSplits.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : effectiveSplits[i - 1];
          const e = i === effectiveSplits.length ? valYears : effectiveSplits[i] - 1;
          return (
            <div key={i}>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Phase {i + 1} (Yrs {s}-{e})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">FCF Growth (%)</label>
                  <NumericFormat value={sc.metricGrowthRatesTotal[i]} onValueChange={v => {
                    const val = v.floatValue === undefined ? '' : v.floatValue;
                    const n = [...sc.metricGrowthRatesTotal];
                    n[i] = val;
                    const changes: Partial<Scenario> = { metricGrowthRatesTotal: n };
                    if (i === 0) changes.simpleMetricGrowthRateTotal = val;
                    upd(changes);
                  }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Share Growth (%)</label>
                  <NumericFormat value={sc.sharesGrowthRates[i]} onValueChange={v => {
                    const val = v.floatValue === undefined ? '' : v.floatValue;
                    const n = [...sc.sharesGrowthRates];
                    n[i] = val;
                    const changes: Partial<Scenario> = { sharesGrowthRates: n };
                    if (i === 0) changes.simpleSharesGrowthRate = val;
                    upd(changes);
                  }} className={INPUT_CLS} />
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
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">FCF Growth (%)</label>
          <NumericFormat value={sc.metricGrowthRatesTotal[0]} onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.metricGrowthRatesTotal];
            n[0] = val;
            upd({ metricGrowthRatesTotal: n, simpleMetricGrowthRateTotal: val });
          }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Share Growth (%)</label>
          <NumericFormat value={sc.sharesGrowthRates[0]} onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.sharesGrowthRates];
            n[0] = val;
            upd({ sharesGrowthRates: n, simpleSharesGrowthRate: val });
          }} className={INPUT_CLS} />
        </div>
      </div>
    );
  };

  const renderAdvancedRevenue = () => {
    if (effectiveSplits.length > 0) return (
      <div className="space-y-4">
        {Array.from({ length: effectiveSplits.length + 1 }).map((_, i) => {
          const s = i === 0 ? 1 : effectiveSplits[i - 1];
          const e = i === effectiveSplits.length ? valYears : effectiveSplits[i] - 1;
          return (
            <div key={i}>
              <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">Phase {i + 1} (Yrs {s}-{e})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rev Growth (%)</label>
                  <NumericFormat value={sc.revenueGrowthRates[i]} onValueChange={v => {
                    const val = v.floatValue === undefined ? '' : v.floatValue;
                    const n = [...sc.revenueGrowthRates];
                    n[i] = val;
                    const changes: Partial<Scenario> = { revenueGrowthRates: n };
                    if (i === 0) changes.simpleRevenueGrowthRate = val;
                    upd(changes);
                  }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Margin (%)</label>
                  <NumericFormat value={sc.finalMargins[i]} onValueChange={v => {
                    const val = v.floatValue === undefined ? '' : v.floatValue;
                    const n = [...sc.finalMargins];
                    n[i] = val;
                    const changes: Partial<Scenario> = { finalMargins: n };
                    if (i === 0) changes.simpleFinalMargin = val;
                    upd(changes);
                  }} className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Share Growth (%)</label>
                  <NumericFormat value={sc.sharesGrowthRates[i]} onValueChange={v => {
                    const val = v.floatValue === undefined ? '' : v.floatValue;
                    const n = [...sc.sharesGrowthRates];
                    n[i] = val;
                    const changes: Partial<Scenario> = { sharesGrowthRates: n };
                    if (i === 0) changes.simpleSharesGrowthRate = val;
                    upd(changes);
                  }} className={INPUT_CLS} />
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
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rev Growth (%)</label>
          <NumericFormat value={sc.revenueGrowthRates[0]} onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.revenueGrowthRates];
            n[0] = val;
            upd({ revenueGrowthRates: n, simpleRevenueGrowthRate: val });
          }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Margin (%)</label>
          <NumericFormat value={sc.finalMargins[0]} onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.finalMargins];
            n[0] = val;
            upd({ finalMargins: n, simpleFinalMargin: val });
          }} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Share Growth (%)</label>
          <NumericFormat value={sc.sharesGrowthRates[0]} onValueChange={v => {
            const val = v.floatValue === undefined ? '' : v.floatValue;
            const n = [...sc.sharesGrowthRates];
            n[0] = val;
            upd({ sharesGrowthRates: n, simpleSharesGrowthRate: val });
          }} className={INPUT_CLS} />
        </div>
      </div>
    );
  };
  // Stock search modal
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [searchModalKey, setSearchModalKey] = useState(0);

  const handleSearchClose = () => {
    setShowStockSearch(false);
    // Incrementing key forces a reset the next time it opens
    setSearchModalKey(prev => prev + 1);
  };

  // Data preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [pendingSymbol, setPendingSymbol] = useState('');
  const [pendingCompanyName, setPendingCompanyName] = useState('');
  const [previewFields, setPreviewFields] = useState<DataField[]>([]);

  // Called when the user selects a ticker in StockSearchModal.
  // sc is already current at the time the search button was clicked,
  // so computeFields correctly reflects the active scenario config.
  const handleStockSelect = (symbol: string, companyName: string, data: UnifiedFundamentals, assetType?: string, exchange?: string) => {
    const fields = computeFields(sc, data);
    setPendingSymbol(symbol);
    setPendingCompanyName(companyName);
    setPreviewFields(fields);
    setShowStockSearch(false);
    setShowPreview(true);
  };

  const handleApply = (enabledKeys: string[]) => {
    const changes: Partial<Scenario> = {};

    previewFields.forEach(field => {
      if (enabledKeys.includes(field.key)) {
        // Map keys to their corresponding Scenario fields
        (changes as any)[field.key] = field.value;
      }
    });
    onUpdate(changes);

    // Set highlights for all successfully applied fields
    onSetHighlights(enabledKeys);

    // Reset search modal state so it's fresh next time search is opened
    setSearchModalKey(prev => prev + 1);
    handlePreviewClose();
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewFields([]);
    setPendingSymbol('');
    setPendingCompanyName('');
  };

  const handlePreviewCancel = () => {
    handlePreviewClose();
    setShowStockSearch(true);
  };

  return (
    <div className="p-5 lg:p-6">

      {/* ── Scenario Name & Actions ── */}
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Scenario Name</label>
      <input
        type="text"
        value={sc.scenarioName}
        onChange={e => onUpdate({ scenarioName: e.target.value })}
        maxLength={50}
        placeholder="e.g. AAPL - Base Case"
        className={`${INPUT_CLS} ${!sc.scenarioName ? BLANK_GLOW_CLS : ''}`}
      />

      <div className="space-y-3 mt-3">
        <button
          onClick={onDuplicateClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800 transition-colors cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          Copy Scenario
        </button>
        <button
          onClick={() => {
            if (!sc.showResetConfirm) {
              onUpdate({ showResetConfirm: true });
              setTimeout(() => onUpdate({ showResetConfirm: false }), 3000);
            } else {
              onUpdate({ _resetRequest: true } as any);
            }
          }}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${sc.showResetConfirm
            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
            }`}
        >
          <RotateCcw className="w-4 h-4" />
          {sc.showResetConfirm ? 'Are you sure? (Click to confirm)' : 'Reset Scenario'}
        </button>
        {canDelete && (
          <button
            onClick={handleDeleteClick}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${deleteConfirm
              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
              : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800'
              }`}
          >
            <Trash2 className="w-4 h-4" />
            {deleteConfirm ? 'Are you sure? Click to confirm' : 'Delete Scenario'}
          </button>
        )}
      </div>

      {/* ── Method & Metric ── */}
      <div className={`mt-4 space-y-4 ${!isSimple ? 'pt-4 border-t border-slate-100 dark:border-slate-700' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Method</label>
          <select
            value={sc.dcfMethod}
            onChange={e => {
              const newMethod = e.target.value;
              const changes: Partial<Scenario> = { dcfMethod: newMethod as any };
              if (newMethod === 'Basic DCF') {
                if (Number(sc.years) > 10) changes.years = 10;
                if (sc.exitAssumptionType === 'Perpetuity Growth') changes.exitAssumptionType = 'Multiple';
              }
              onUpdate(changes);
            }}
            className={SELECT_CLS}
          >
            <option value="Basic DCF">Basic DCF</option>
            <option value="Advanced DCF">Advanced DCF</option>
          </select>
        </div>

        {sc.dcfMethod === 'Basic DCF' && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                Metric
                <Tooltip content="Name your own metric">
                  <InfoIcon className="w-3.5 h-3.5 text-slate-400 hover:text-slate-500 transition-colors" />
                </Tooltip>
              </label>
              <select value={sc.simpleMetricType} onChange={e => onUpdate({ simpleMetricType: e.target.value })} className={SELECT_CLS}>
                <option>Free Cash Flow</option>
                <option>Net Income (Earnings)</option>
                <option>Operating Cash Flow</option>
                <option>EBITDA</option>
                <option>Book Value</option>
              </select>
            </div>
            {sc.simpleMetricType !== 'Book Value' && (
              <div>
                {(() => {
                  let m1 = 'Metric';
                  let m2 = 'Metric';
                  if (sc.simpleMetricType === 'Free Cash Flow') { m1 = 'Total FCF'; m2 = 'FCF'; }
                  else if (sc.simpleMetricType === 'Net Income (Earnings)') { m1 = 'Net Income'; m2 = 'Net Income'; }
                  else if (sc.simpleMetricType === 'Operating Cash Flow') { m1 = 'OCF'; m2 = 'OCF'; }
                  else if (sc.simpleMetricType === 'EBITDA') { m1 = 'EBITDA'; m2 = 'EBITDA'; }
                  return (
                    <select value={sc.simpleProjectionMethod} onChange={e => onUpdate({ simpleProjectionMethod: e.target.value })} className={SELECT_CLS}>
                      <option value="Per Share">Per Share</option>
                      <option value="Metric, Share Count">{m1}, Share Count</option>
                      <option value="Revenue, Metric Margin, Share Count">Revenue, {m2} Margin, Share Count</option>
                    </select>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {sc.dcfMethod !== 'Basic DCF' && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Metric</label>
            <select value={sc.projectionMethod} onChange={e => onUpdate({ projectionMethod: e.target.value })} className={SELECT_CLS}>
              <option value="Per Share Method">Per Share</option>
              <option value="Total FCF, Share Count">Total FCF, Share Count</option>
              <option value="Revenue, FCF Margin, Share Count">Revenue, FCF Margin, Share Count</option>
            </select>
          </div>
        )}

        {/* Years to Forecast & Discount Rate */}
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Years to Forecast <span className="text-[10px] text-slate-400 opacity-70">(Max {maxYears})</span>
          </label>
          <NumericFormat
            value={sc.years}
            onValueChange={v => {
              let val = v.floatValue;
              if (val !== undefined && val > maxYears) val = maxYears;
              onUpdate({ years: val === undefined ? '' : val });
            }}
            isAllowed={v => v.floatValue === undefined || v.floatValue <= maxYears}
            onBlur={() => onUpdate({ _trimPhases: true } as any)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            {sc.dcfMethod === 'Basic DCF' ? 'Desired Return (%)' : 'Discount Rate (%)'}
            <Tooltip content="The rate used to discount future cash flows to the present. This can also be considered your Desired Yearly Return.">
              <InfoIcon className="w-3.5 h-3.5 text-slate-400 hover:text-slate-500 transition-colors" />
            </Tooltip>
          </label>
          <NumericFormat
            value={sc.discountRate}
            onValueChange={v => onUpdate({ discountRate: v.floatValue === undefined ? '' : v.floatValue })}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* ── Assumptions ── */}
      <h2 className="text-lg font-medium mt-6 mb-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-400" /> Assumptions
        </div>
        <button
          onClick={() => setShowStockSearch(true)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          title="Load Stock Data"
        >
          <Search className="w-5 h-5 text-slate-400" />
        </button>
      </h2>
      <div className="space-y-4">
        {/* Buy Price */}
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Buy Price</label>
          <NumericFormat
            value={sc.buyPrice}
            onValueChange={v => onUpdate({ buyPrice: v.floatValue === undefined ? '' : v.floatValue })}
            className={highlightedKeys.has('buyPrice')
              ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
              : INPUT_CLS
            }
            onFocus={() => onClearHighlight('buyPrice')}
          />
        </div>

        {/* Book Value */}
        {isSimple && sc.simpleMetricType === 'Book Value' && (
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Book Value</label>
            <NumericFormat
              value={sc.bookValue}
              onValueChange={v => onUpdate({ bookValue: v.floatValue === undefined ? '' : v.floatValue })}
              className={highlightedKeys.has('bookValue')
                ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                : INPUT_CLS
              }
              onFocus={() => onClearHighlight('bookValue')}
            />
          </div>
        )}

        {/* ── SIMPLE: Growth section ── */}
        {isSimple && lbl && (() => {
          let keyPerShare: keyof Scenario = 'currentMetricPerShare';
          let keyTotal: keyof Scenario = 'currentMetricTotal';
          let keyMargin: keyof Scenario = 'simpleFinalMargin';

          if (sc.simpleMetricType === 'Net Income (Earnings)') {
            keyPerShare = 'niCurrentMetricPerShare';
            keyTotal = 'niCurrentMetricTotal';
            keyMargin = 'niFinalMargin';
          } else if (sc.simpleMetricType === 'Operating Cash Flow') {
            keyPerShare = 'ocfPerShare';
            keyTotal = 'operatingCashflow';
            keyMargin = 'ocfFinalMargin';
          } else if (sc.simpleMetricType === 'EBITDA') {
            keyPerShare = 'ebitdaPerShare';
            keyTotal = 'ebitda';
            keyMargin = 'ebitdaFinalMargin';
          } else if (sc.simpleMetricType === 'Book Value') {
            keyPerShare = 'bookValue';
          }

          const effectiveProjectionMethod = sc.simpleMetricType === 'Book Value' ? 'Per Share' : sc.simpleProjectionMethod;

          return (
            <div className="space-y-4">
              {effectiveProjectionMethod === 'Per Share' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{lbl.labelCurrentPerShare}</label>
                    <NumericFormat
                      value={sc[keyPerShare] as any}
                      onValueChange={v => upd({ [keyPerShare]: v.floatValue === undefined ? '' : v.floatValue } as Partial<Scenario>)}
                      className={highlightedKeys.has(keyPerShare as string)
                        ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                        : INPUT_CLS
                      }
                      onFocus={() => onClearHighlight(keyPerShare as string)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{lbl.labelGrowthRate} (%)</label>
                    <NumericFormat value={sc.simpleMetricGrowthRate} onValueChange={v => {
                      const val = v.floatValue === undefined ? '' : v.floatValue;
                      const changes: Partial<Scenario> = { simpleMetricGrowthRate: val };
                      if (sc.simpleMetricType === 'Free Cash Flow') {
                        const n = [...sc.metricGrowthRates];
                        n[0] = val;
                        changes.metricGrowthRates = n;
                      }
                      upd(changes);
                    }} className={INPUT_CLS} />
                  </div>
                </div>
              )}

              {effectiveProjectionMethod === 'Metric, Share Count' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Values in Millions</span>
                    <Toggle checked={sc.inMillions} onChange={() => {
                      const newFlag = !sc.inMillions;
                      upd({
                        inMillions: newFlag,
                        [keyTotal]: convertMillions(sc[keyTotal] as any, sc.inMillions, newFlag),
                        currentShares: convertMillions(sc.currentShares as any, sc.inMillions, newFlag),
                        currentRevenue: convertMillions(sc.currentRevenue as any, sc.inMillions, newFlag),
                      } as any);
                    }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current {lbl.metricName} {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat
                        value={sc[keyTotal] as any}
                        onValueChange={v => upd({ [keyTotal]: v.floatValue === undefined ? '' : v.floatValue } as Partial<Scenario>)}
                        className={highlightedKeys.has(keyTotal as string)
                          ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                          : INPUT_CLS
                        }
                        onFocus={() => onClearHighlight(keyTotal as string)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{lbl.metricName} Growth (%)</label>
                      <NumericFormat value={sc.simpleMetricGrowthRateTotal} onValueChange={v => {
                        const val = v.floatValue === undefined ? '' : v.floatValue;
                        const changes: Partial<Scenario> = { simpleMetricGrowthRateTotal: val };
                        if (sc.simpleMetricType === 'Free Cash Flow') {
                          const n = [...sc.metricGrowthRatesTotal];
                          n[0] = val;
                          changes.metricGrowthRatesTotal = n;
                        }
                        upd(changes);
                      }} className={INPUT_CLS} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat
                        value={sc.currentShares}
                        onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })}
                        className={highlightedKeys.has('currentShares')
                          ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                          : INPUT_CLS
                        }
                        onFocus={() => onClearHighlight('currentShares')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares Growth (%)</label>
                      <NumericFormat value={sc.simpleSharesGrowthRate} onValueChange={v => {
                        const val = v.floatValue === undefined ? '' : v.floatValue;
                        const n = [...sc.sharesGrowthRates];
                        n[0] = val;
                        upd({ simpleSharesGrowthRate: val, sharesGrowthRates: n });
                      }} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}

              {effectiveProjectionMethod === 'Revenue, Metric Margin, Share Count' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Values in Millions</span>
                    <Toggle checked={sc.inMillions} onChange={() => {
                      const newFlag = !sc.inMillions;
                      upd({
                        inMillions: newFlag,
                        [keyTotal]: convertMillions(sc[keyTotal] as any, sc.inMillions, newFlag),
                        currentShares: convertMillions(sc.currentShares as any, sc.inMillions, newFlag),
                        currentRevenue: convertMillions(sc.currentRevenue as any, sc.inMillions, newFlag),
                      } as any);
                    }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Revenue {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat
                        value={sc.currentRevenue}
                        onValueChange={v => upd({ currentRevenue: v.floatValue === undefined ? '' : v.floatValue })}
                        className={highlightedKeys.has('currentRevenue')
                          ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                          : INPUT_CLS
                        }
                        onFocus={() => onClearHighlight('currentRevenue')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Revenue Growth (%)</label>
                      <NumericFormat value={sc.simpleRevenueGrowthRate} onValueChange={v => {
                        const val = v.floatValue === undefined ? '' : v.floatValue;
                        const changes: Partial<Scenario> = { simpleRevenueGrowthRate: val };
                        if (sc.simpleMetricType === 'Free Cash Flow') {
                          const n = [...sc.revenueGrowthRates];
                          n[0] = val;
                          changes.revenueGrowthRates = n;
                        }
                        upd(changes as any);
                      }} className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Final {lbl.metricName} Margin (%)</label>
                    <NumericFormat value={sc[keyMargin] as any} onValueChange={v => {
                      const val = v.floatValue === undefined ? '' : v.floatValue;
                      const changes: any = { [keyMargin]: val };
                      if (sc.simpleMetricType === 'Free Cash Flow') {
                        const n = [...sc.finalMargins];
                        n[0] = val;
                        changes.finalMargins = n;
                      }
                      upd(changes);
                    }} className={INPUT_CLS} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                      <NumericFormat
                        value={sc.currentShares}
                        onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })}
                        className={highlightedKeys.has('currentShares')
                          ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                          : INPUT_CLS
                        }
                        onFocus={() => onClearHighlight('currentShares')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares Growth (%)</label>
                      <NumericFormat value={sc.simpleSharesGrowthRate} onValueChange={v => {
                        const val = v.floatValue === undefined ? '' : v.floatValue;
                        const n = [...sc.sharesGrowthRates];
                        n[0] = val;
                        upd({ simpleSharesGrowthRate: val, sharesGrowthRates: n });
                      }} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Terminal Value */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-2">
            Terminal Value
          </label>
          <div className="space-y-2">
            <select value={sc.exitAssumptionType} onChange={e => onUpdate({ exitAssumptionType: e.target.value })} className={SELECT_CLS}>
              <option value="Multiple">Exit Multiple</option>
              <option value="Yield">Exit Yield (%)</option>
              {sc.dcfMethod !== 'Basic DCF' && <option value="Perpetuity Growth">Growth in Perpetuity (%)</option>}
            </select>

            {sc.exitAssumptionType === 'Multiple' && (
              <NumericFormat value={sc.exitMultiple} onValueChange={v => onUpdate({ exitMultiple: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
            )}
            {sc.exitAssumptionType === 'Yield' && (
              <NumericFormat value={sc.exitYield} onValueChange={v => onUpdate({ exitYield: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
            )}
            {sc.exitAssumptionType === 'Perpetuity Growth' && sc.dcfMethod !== 'Basic DCF' && (
              <div>
                <NumericFormat value={sc.perpetuityGrowthRate} onValueChange={v => onUpdate({ perpetuityGrowthRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
                <p className="text-xs text-slate-400 mt-1 italic">Implied Multiple: {results.effectiveMultiple.toFixed(2)}x</p>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Growth (If Advanced DCF) */}
        {!isSimple && (
          <div className="space-y-6">
            {/* Current Metrics */}
            {sc.projectionMethod === 'Per Share Method' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Free Cash Flow Per Share</label>
                  <NumericFormat
                    value={sc.currentMetricPerShare}
                    onValueChange={v => upd({ currentMetricPerShare: v.floatValue === undefined ? '' : v.floatValue })}
                    className={highlightedKeys.has('currentMetricPerShare')
                      ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                      : INPUT_CLS
                    }
                    onFocus={() => onClearHighlight('currentMetricPerShare')}
                  />
                </div>
              </div>
            )}

            {sc.projectionMethod === 'Total FCF, Share Count' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Values in Millions</span>
                  <Toggle checked={sc.inMillions} onChange={() => {
                    const newFlag = !sc.inMillions;
                    upd({
                      inMillions: newFlag,
                      currentMetricTotal: convertMillions(sc.currentMetricTotal as any, sc.inMillions, newFlag),
                      currentShares: convertMillions(sc.currentShares as any, sc.inMillions, newFlag),
                      currentRevenue: convertMillions(sc.currentRevenue as any, sc.inMillions, newFlag),
                    });
                  }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current FCF {sc.inMillions ? '(M)' : ''}</label>
                    <NumericFormat
                      value={sc.currentMetricTotal}
                      onValueChange={v => upd({ currentMetricTotal: v.floatValue === undefined ? '' : v.floatValue })}
                      className={highlightedKeys.has('currentMetricTotal')
                        ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                        : INPUT_CLS
                      }
                      onFocus={() => onClearHighlight('currentMetricTotal')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                    <NumericFormat
                      value={sc.currentShares}
                      onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })}
                      className={highlightedKeys.has('currentShares')
                        ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                        : INPUT_CLS
                      }
                      onFocus={() => onClearHighlight('currentShares')}
                    />
                  </div>
                </div>
              </div>
            )}

            {sc.projectionMethod === 'Revenue, FCF Margin, Share Count' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Values in Millions</span>
                  <Toggle checked={sc.inMillions} onChange={() => {
                    const newFlag = !sc.inMillions;
                    upd({
                      inMillions: newFlag,
                      currentMetricTotal: convertMillions(sc.currentMetricTotal as any, sc.inMillions, newFlag),
                      currentShares: convertMillions(sc.currentShares as any, sc.inMillions, newFlag),
                      currentRevenue: convertMillions(sc.currentRevenue as any, sc.inMillions, newFlag),
                    });
                  }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Revenue {sc.inMillions ? '(M)' : ''}</label>
                    <NumericFormat
                      value={sc.currentRevenue}
                      onValueChange={v => upd({ currentRevenue: v.floatValue === undefined ? '' : v.floatValue })}
                      className={highlightedKeys.has('currentRevenue')
                        ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                        : INPUT_CLS
                      }
                      onFocus={() => onClearHighlight('currentRevenue')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Shares {sc.inMillions ? '(M)' : ''}</label>
                    <NumericFormat
                      value={sc.currentShares}
                      onValueChange={v => upd({ currentShares: v.floatValue === undefined ? '' : v.floatValue })}
                      className={highlightedKeys.has('currentShares')
                        ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
                        : INPUT_CLS
                      }
                      onFocus={() => onClearHighlight('currentShares')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Growth Phases Slider */}
            {showSlider && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    Growth Phases
                  </h2>
                  <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                    {effectiveSplits.length === 0 ? 'Single Phase' : `${effectiveSplits.length + 1} Phases`}
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
                    {Array.from({ length: effectiveSplits.length + 1 }).map((_, i) => {
                      const s = i === 0 ? 1 : effectiveSplits[i - 1];
                      const e2 = i === effectiveSplits.length ? valYears : effectiveSplits[i];
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

                  {effectiveSplits.map((year, idx) => {
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
                            const minYr = idx === 0 ? 2 : effectiveSplits[idx - 1] + 1;
                            const maxYr = idx === effectiveSplits.length - 1 ? valYears - 1 : effectiveSplits[idx + 1] - 1;
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
                            const minYr = idx === 0 ? 2 : effectiveSplits[idx - 1] + 1;
                            const maxYr = idx === effectiveSplits.length - 1 ? valYears - 1 : effectiveSplits[idx + 1] - 1;
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
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity ${sc.draggingIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          Year {year}
                        </div>
                      </div>
                    );
                  })}

                  <div className="absolute top-full left-0 right-0 flex justify-between text-xs text-slate-400 mt-2">
                    <span>1</span><span>{valYears}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-6 text-center">Click/tap track to add a phase split. Double-click dots to remove.</p>
              </div>
            )}

            {/* Phase Growth Inputs */}
            <div className={!showSlider ? "pt-2" : "pt-4"}>
              {sc.projectionMethod === 'Per Share Method' && renderAdvancedPerShare()}
              {sc.projectionMethod === 'Total FCF, Share Count' && renderAdvancedTotal()}
              {sc.projectionMethod === 'Revenue, FCF Margin, Share Count' && renderAdvancedRevenue()}
            </div>
          </div>
        )}
      </div>

      {/* Step 1: Search modal */}
      <StockSearchModal
        key={searchModalKey}
        show={showStockSearch}
        onClose={handleSearchClose}
        onSelect={handleStockSelect}
      />

      {/* Step 2: Preview + apply modal */}
      <StockDataPreviewModal
        show={showPreview}
        symbol={pendingSymbol}
        companyName={pendingCompanyName}
        inMillions={sc.inMillions}
        fields={previewFields}
        onApply={handleApply}
        onClose={handlePreviewCancel}
      />
    </div>
  );
}
