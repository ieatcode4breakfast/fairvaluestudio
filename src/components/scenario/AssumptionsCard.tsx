import React from 'react';
import { Scenario, Results } from '../../types';
import { Settings2 } from '../Icons';
import { NumericFormat } from '../NumericFormat';
import { INPUT_CLS } from '../../utils/constants';

interface AssumptionsCardProps {
  sc: Scenario;
  results: Results;
  onUpdate: (changes: Partial<Scenario>) => void;
}

export function AssumptionsCard({ sc, results, onUpdate }: AssumptionsCardProps) {
  const maxYears = sc.dcfMethod === 'Basic DCF' ? 10 : 50;

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-slate-400" /> General Assumptions
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Buy Price ($)</label>
          <NumericFormat value={sc.buyPrice} onValueChange={v => onUpdate({ buyPrice: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Years to Forecast (Max {maxYears})</label>
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
            <label className="block text-sm font-medium text-slate-600 mb-1">Discount Rate (%)</label>
            <NumericFormat value={sc.discountRate} onValueChange={v => onUpdate({ discountRate: v.floatValue === undefined ? '' : v.floatValue })} className={INPUT_CLS} />
          </div>
        </div>

        {/* Terminal Value */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
            Terminal Value
          </label>
          <div className="space-y-2">
            <select value={sc.exitAssumptionType} onChange={e => onUpdate({ exitAssumptionType: e.target.value })} className={INPUT_CLS}>
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
    </div>
  );
}
