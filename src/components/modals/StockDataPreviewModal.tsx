import React, { useState, useEffect } from 'react';
import { Toggle } from '../Toggle';
import { useScrollLock } from '../../hooks/useScrollLock';

export interface DataField {
    key: string;
    label: string;
    value: number | string;
    formatted: string;
}

interface StockDataPreviewModalProps {
    show: boolean;
    symbol: string;
    companyName: string;
    inMillions: boolean;
    fields: DataField[];
    onApply: (enabledKeys: string[]) => void;
    onClose: () => void;
}

export function StockDataPreviewModal({
    show, symbol, companyName, inMillions, fields, onApply, onClose
}: StockDataPreviewModalProps) {
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});

    useScrollLock(show);

    // Reset toggles whenever the field list changes (new stock selected)
    useEffect(() => {
        if (!show) return;
        const init: Record<string, boolean> = {};
        fields.forEach(f => { init[f.key] = true; });
        setEnabled(init);
    }, [fields, show]);

    if (!show) return null;

    const anyEnabled = fields.some(f => enabled[f.key]);

    const handleApply = () => {
        const enabledKeys = fields.filter(f => enabled[f.key]).map(f => f.key);
        onApply(enabledKeys);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/70 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
                {/* Header - Fixed */}
                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Apply Data</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Official SEC TTM data for{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {companyName} ({symbol})
                        </span>.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 py-2 custom-scrollbar">
                    {/* Field list */}
                    {fields.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">
                                No financial data found for this symbol.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700 mb-4">
                            {fields.map(field => (
                                <li key={field.key} className="flex items-center justify-between py-3 gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            {field.label}
                                        </p>
                                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                            {field.formatted}
                                            {inMillions && ['currentRevenue', 'currentMetricTotal', 'niCurrentMetricTotal', 'currentShares'].includes(field.key) && ' M'}
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={!!enabled[field.key]}
                                        onChange={() =>
                                            setEnabled(prev => ({ ...prev, [field.key]: !prev[field.key] }))
                                        }
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Actions - Fixed */}
                <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        {fields.length > 0 && (
                            <button
                                onClick={handleApply}
                                disabled={!anyEnabled}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer disabled:cursor-default"
                            >
                                Apply
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
