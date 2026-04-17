import React, { useState, useEffect } from 'react';
import { Toggle } from '../Toggle';

export interface DataField {
    key: string;
    label: string;
    value: number;
    formatted: string;
}

interface StockDataPreviewModalProps {
    show: boolean;
    symbol: string;
    fields: DataField[];
    onApply: (enabledKeys: string[]) => void;
    onClose: () => void;
}

export function StockDataPreviewModal({ show, symbol, fields, onApply, onClose }: StockDataPreviewModalProps) {
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});

    // Reset toggles to all-on whenever the field list changes (new stock selected)
    useEffect(() => {
        const init: Record<string, boolean> = {};
        fields.forEach(f => { init[f.key] = true; });
        setEnabled(init);
    }, [fields]);

    if (!show) return null;

    const anyEnabled = Object.values(enabled).some(Boolean);

    const handleApply = () => {
        const enabledKeys = fields.filter(f => enabled[f.key]).map(f => f.key);
        onApply(enabledKeys);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/70 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Apply Data</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Available data for{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{symbol}</span>.
                    {' '}Choose what to load.
                </p>

                {/* Field list */}
                {fields.length === 0 ? (
                    <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                        No compatible financial data found for this symbol.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700 mb-6">
                        {fields.map(field => (
                            <li key={field.key} className="flex items-center justify-between py-3 gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {field.label}
                                    </p>
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 font-mono">
                                        {field.formatted}
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

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    {fields.length > 0 && (
                        <button
                            onClick={handleApply}
                            disabled={!anyEnabled}
                            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
