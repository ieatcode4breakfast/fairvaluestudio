import React, { useState } from 'react';
import { Scenario, Results } from '../../types';
import { Settings2, Search } from '../Icons';
import { StockSearchModal } from '../modals/StockSearchModal';
import { StockDataPreviewModal, DataField } from '../modals/StockDataPreviewModal';
import { NumericFormat } from '../NumericFormat';
import { INPUT_CLS, SELECT_CLS } from '../../utils/constants';
import { FinnhubFundamentals } from '../../api/finnhub';
import { formatDynamicDecimal } from '../../utils/formatNumber';

interface AssumptionsCardProps {
  sc: Scenario;
  results: Results;
  onUpdate: (changes: Partial<Scenario>) => void;
}

// ---------------------------------------------------------------------------
// computeFields
// Builds the list of DataFields that will be shown in the preview modal.
// Respects the current inMillions / simpleInMillions flag so labels and values
// match exactly what is displayed in GrowthCard inputs.
// ---------------------------------------------------------------------------
function computeFields(sc: Scenario, data: FinnhubFundamentals): DataField[] {
  const fields: DataField[] = [];

  // ── Buy Price (always present if price was fetched) ──────────────────────
  if (data.price !== null) {
    const v = formatDynamicDecimal(data.price);
    fields.push({
      key: 'buyPrice',
      label: 'Buy Price',
      value: v,
      formatted: formatDynamicDecimal(data.price, true),
    });
  }

  const isBasic = sc.dcfMethod === 'Basic DCF';

  if (isBasic) {
    const inM = sc.simpleInMillions;

    // ── Basic – Per Share ──────────────────────────────────────────────────
    if (sc.simpleProjectionMethod === 'Per Share') {
      if (sc.simpleMetricType === 'Free Cash Flow') {
        if (data.freeCashFlowTTM !== null && data.sharesOutstanding !== null && data.sharesOutstanding > 0) {
          const v = data.freeCashFlowTTM / data.sharesOutstanding;
          const fv = formatDynamicDecimal(v);
          fields.push({
            key: 'simpleCurrentMetricPerShare',
            label: 'Current FCF Per Share',
            value: fv,
            formatted: formatDynamicDecimal(v, true),
          });
        }
      } else if (sc.simpleMetricType === 'Net Income (Earnings)') {
        if (data.netIncomeTTM !== null && data.sharesOutstanding !== null && data.sharesOutstanding > 0) {
          const v = data.netIncomeTTM / data.sharesOutstanding;
          const fv = formatDynamicDecimal(v);
          fields.push({
            key: 'simpleCurrentMetricPerShare',
            label: 'Current EPS',
            value: fv,
            formatted: formatDynamicDecimal(v, true),
          });
        }
      }

      // ── Basic – Metric, Share Count ───────────────────────────────────────
    } else if (sc.simpleProjectionMethod === 'Metric, Share Count') {
      if (sc.simpleMetricType === 'Free Cash Flow' && data.freeCashFlowTTM !== null) {
        const label = inM ? 'Current FCF (M)' : 'Current FCF';
        const v = inM ? data.freeCashFlowTTM : data.freeCashFlowTTM * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'simpleCurrentMetricTotal', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      } else if (sc.simpleMetricType === 'Net Income (Earnings)' && data.netIncomeTTM !== null) {
        const label = inM ? 'Current Net Income (M)' : 'Current Net Income';
        const v = inM ? data.netIncomeTTM : data.netIncomeTTM * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'simpleCurrentMetricTotal', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
      if (data.sharesOutstanding !== null) {
        const label = inM ? 'Shares (M)' : 'Shares';
        const v = inM ? data.sharesOutstanding : data.sharesOutstanding * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'simpleCurrentShares', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }

      // ── Basic – Revenue, Metric Margin, Share Count ────────────────────────
    } else if (sc.simpleProjectionMethod === 'Revenue, Metric Margin, Share Count') {
      if (data.revenueTTM !== null) {
        const label = inM ? 'Current Revenue (M)' : 'Current Revenue';
        const v = inM ? data.revenueTTM : data.revenueTTM * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'simpleCurrentRevenue', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
      if (data.sharesOutstanding !== null) {
        const label = inM ? 'Shares (M)' : 'Shares';
        const v = inM ? data.sharesOutstanding : data.sharesOutstanding * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'simpleCurrentShares', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
    }

  } else {
    // ── Advanced DCF ────────────────────────────────────────────────────────
    const inM = sc.inMillions;

    // Advanced – Per Share Method
    if (sc.projectionMethod === 'Per Share Method') {
      if (data.freeCashFlowTTM !== null && data.sharesOutstanding !== null && data.sharesOutstanding > 0) {
        const v = data.freeCashFlowTTM / data.sharesOutstanding;
        const fv = formatDynamicDecimal(v);
        fields.push({
          key: 'currentMetricPerShare',
          label: 'Current FCF Per Share',
          value: fv,
          formatted: formatDynamicDecimal(v, true),
        });
      }

      // Advanced – Total FCF, Share Count
    } else if (sc.projectionMethod === 'Total FCF, Share Count') {
      if (data.freeCashFlowTTM !== null) {
        const label = inM ? 'Current FCF (M)' : 'Current FCF';
        const v = inM ? data.freeCashFlowTTM : data.freeCashFlowTTM * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'currentMetricTotal', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
      if (data.sharesOutstanding !== null) {
        const label = inM ? 'Shares (M)' : 'Shares';
        const v = inM ? data.sharesOutstanding : data.sharesOutstanding * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'currentShares', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }

      // Advanced – Revenue, FCF Margin, Share Count
    } else if (sc.projectionMethod === 'Revenue, FCF Margin, Share Count') {
      if (data.revenueTTM !== null) {
        const label = inM ? 'Current Revenue (M)' : 'Current Revenue';
        const v = inM ? data.revenueTTM : data.revenueTTM * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'currentRevenue', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
      if (data.sharesOutstanding !== null) {
        const label = inM ? 'Shares (M)' : 'Shares';
        const v = inM ? data.sharesOutstanding : data.sharesOutstanding * 1_000_000;
        const fv = formatDynamicDecimal(v);
        fields.push({ key: 'currentShares', label, value: fv, formatted: formatDynamicDecimal(v, true) });
      }
    }
  }

  return fields;
}

// ---------------------------------------------------------------------------
// AssumptionsCard
// ---------------------------------------------------------------------------
export function AssumptionsCard({ sc, results, onUpdate }: AssumptionsCardProps) {
  const maxYears = sc.dcfMethod === 'Basic DCF' ? 10 : 50;

  // Stock search modal
  const [showStockSearch, setShowStockSearch] = useState(false);
  const [buyPriceHighlighted, setBuyPriceHighlighted] = useState(false);

  // Data preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [pendingSymbol, setPendingSymbol] = useState('');
  const [previewFields, setPreviewFields] = useState<DataField[]>([]);

  // Called when the user selects a ticker in StockSearchModal.
  // sc is already current at the time the search button was clicked,
  // so computeFields correctly reflects the active scenario config.
  const handleStockSelect = (symbol: string, data: FinnhubFundamentals) => {
    const fields = computeFields(sc, data);
    setPendingSymbol(symbol);
    setPreviewFields(fields);
    setShowStockSearch(false);
    setShowPreview(true);
  };

  // Called when the user hits Apply in the preview modal.
  const handleApply = (enabledKeys: string[]) => {
    const changes: Partial<Scenario> = {};
    previewFields.forEach(field => {
      if (enabledKeys.includes(field.key)) {
        (changes as any)[field.key] = field.value;
      }
    });
    onUpdate(changes);
    if (enabledKeys.includes('buyPrice')) {
      setBuyPriceHighlighted(true);
    }
    setShowPreview(false);
    setPreviewFields([]);
    setPendingSymbol('');
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewFields([]);
    setPendingSymbol('');
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-slate-400" /> General Assumptions
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
        <div>
          <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Buy Price</label>
          <NumericFormat
            value={sc.buyPrice}
            onValueChange={v => onUpdate({ buyPrice: v.floatValue === undefined ? '' : v.floatValue })}
            className={buyPriceHighlighted
              ? INPUT_CLS.replace('border-slate-200 dark:border-slate-700', 'border-indigo-400 dark:border-indigo-500')
              : INPUT_CLS
            }
            onFocus={() => setBuyPriceHighlighted(false)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Years to Forecast (Max {maxYears})</label>
            <NumericFormat
              value={sc.years}
              onValueChange={v => {
                let val = v.floatValue;
                if (val !== undefined && val > maxYears) val = maxYears;
                onUpdate({ years: val === undefined ? '' : val });
              }}
              isAllowed={v => v.floatValue === undefined || v.floatValue <= maxYears}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Discount Rate (%)</label>
            <NumericFormat value={sc.discountRate} onValueChange={v => onUpdate({ discountRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
          </div>
        </div>

        {/* Terminal Value */}
        <div>
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
      </div>

      {/* Step 1: Search modal */}
      <StockSearchModal
        show={showStockSearch}
        onClose={() => setShowStockSearch(false)}
        onSelect={handleStockSelect}
      />

      {/* Step 2: Preview + apply modal */}
      <StockDataPreviewModal
        show={showPreview}
        symbol={pendingSymbol}
        fields={previewFields}
        onApply={handleApply}
        onClose={handlePreviewClose}
      />
    </div>
  );
}
