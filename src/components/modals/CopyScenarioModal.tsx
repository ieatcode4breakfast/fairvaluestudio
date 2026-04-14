import React, { useState } from 'react';
import { Scenario, ValuationMetadata } from '../../types';
import { Copy, ChevronLeft } from '../Icons';

interface CopyScenarioModalProps {
  show: boolean;
  setShow: (s: boolean) => void;
  scenario: Scenario;
  userValuations: ValuationMetadata[];
  loadedValuationId: string | null;
  isCopying: boolean;
  onCopyToThis: () => void;
  onCopyToOther: (targetValuationId: string) => Promise<void>;
  onNewValuation: () => void;
}

export function CopyScenarioModal({
  show, setShow, scenario, userValuations, loadedValuationId,
  isCopying, onCopyToThis, onCopyToOther, onNewValuation
}: CopyScenarioModalProps) {
  const [mode, setMode] = useState<'choice' | 'select'>('choice');
  const [selectedValuationId, setSelectedValuationId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!show) return null;

  const otherValuations = userValuations.filter(v => v.id !== loadedValuationId);

  const handleClose = () => {
    setMode('choice');
    setSelectedValuationId('');
    setError('');
    setSuccess(false);
    setShow(false);
  };

  const handleCopyToThis = () => {
    onCopyToThis();
    handleClose();
  };

  const handleCopyToOther = async () => {
    if (selectedValuationId === '__new__') {
      handleClose();
      onNewValuation();
      return;
    }

    if (!selectedValuationId) return;

    setError('');
    try {
      await onCopyToOther(selectedValuationId);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to copy scenario');
    }
  };

  const scenarioLabel = scenario.scenarioName || 'Untitled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">

        {/* Success state */}
        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Scenario Copied!</h3>
            <p className="text-sm text-slate-500">
              "{scenarioLabel}" has been copied to{' '}
              <span className="font-medium text-slate-700">
                {userValuations.find(v => v.id === selectedValuationId)?.valuationName || 'the target valuation'}
              </span>.
            </p>
          </div>
        ) : mode === 'choice' ? (
          /* Choice mode */
          <>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Copy Scenario</h3>
                <p className="text-sm text-slate-500 mt-0.5">Where would you like to copy "{scenarioLabel}"?</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                onClick={handleCopyToThis}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-all group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">Copy to This Valuation</div>
                  <div className="text-xs text-slate-400 mt-0.5">Duplicate the scenario within the current valuation</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (otherValuations.length === 0) {
                    // Only "New Valuation" is available — go straight to select mode
                  }
                  setMode('select');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-left transition-all group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">Copy to Another Valuation</div>
                  <div className="text-xs text-slate-400 mt-0.5">Send a copy to a different valuation</div>
                </div>
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
            </div>
          </>
        ) : (
          /* Select mode */
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setMode('choice'); setSelectedValuationId(''); setError(''); }}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-semibold text-slate-900">Copy to Another Valuation</h3>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Select a destination for "{scenarioLabel}":
            </p>

            <select
              value={selectedValuationId}
              onChange={(e) => { setSelectedValuationId(e.target.value); setError(''); }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm mb-2"
              autoFocus
            >
              <option value="" disabled>— Select a valuation —</option>
              <option value="__new__">+ New Valuation</option>
              {otherValuations.map(v => (
                <option key={v.id} value={v.id}>{v.valuationName}</option>
              ))}
            </select>

            {error && (
              <p className="text-sm text-red-600 mt-2 mb-2 text-center">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button
                onClick={handleCopyToOther}
                disabled={!selectedValuationId || isCopying}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isCopying ? 'Copying...' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
