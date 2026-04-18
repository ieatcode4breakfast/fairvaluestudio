import React, { useState } from 'react';
import { Scenario, Results } from '../../types';
import { Settings2, Search } from '../Icons';
import { StockSearchModal } from '../modals/StockSearchModal';
import { StockDataPreviewModal, DataField } from '../modals/StockDataPreviewModal';
import { NumericFormat } from '../NumericFormat';
import { INPUT_CLS, SELECT_CLS } from '../../utils/constants';
import { UnifiedFundamentals } from '../../api/marketData';
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
function computeFields(_sc: Scenario, data: UnifiedFundamentals): DataField[] {
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
  const [pendingCompanyName, setPendingCompanyName] = useState('');
  const [pendingAssetType, setPendingAssetType] = useState<string | undefined>();
  const [pendingExchange, setPendingExchange] = useState<string | undefined>();
  const [previewFields, setPreviewFields] = useState<DataField[]>([]);

  // Called when the user selects a ticker in StockSearchModal.
  // sc is already current at the time the search button was clicked,
  // so computeFields correctly reflects the active scenario config.
  const handleStockSelect = (symbol: string, companyName: string, data: UnifiedFundamentals, assetType?: string, exchange?: string) => {
    const fields = computeFields(sc, data);
    setPendingSymbol(symbol);
    setPendingCompanyName(companyName);
    setPendingAssetType(assetType);
    setPendingExchange(exchange);
    setPreviewFields(fields);
    setShowStockSearch(false);
    setShowPreview(true);
  };

  // Called when the user hits Apply in the preview modal.
  const handleApply = (enabledKeys: string[], aiFields: DataField[] = []) => {
    const changes: Partial<Scenario> = {};
    
    // Merge standard preview fields and AI fields
    const allFields = [...previewFields, ...aiFields];
    
    allFields.forEach(field => {
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
    setPendingCompanyName('');
    setPendingAssetType(undefined);
    setPendingExchange(undefined);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewFields([]);
    setPendingSymbol('');
    setPendingCompanyName('');
    setPendingAssetType(undefined);
    setPendingExchange(undefined);
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
        companyName={pendingCompanyName}
        assetType={pendingAssetType}
        exchange={pendingExchange}
        inMillions={sc.inMillions}
        fields={previewFields}
        onApply={handleApply}
        onClose={handlePreviewClose}
      />
    </div>
  );
}
