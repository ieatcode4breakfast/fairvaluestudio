import React, { useState, useEffect } from 'react';
import { Toggle } from '../Toggle';
import { fetchTTMData } from '../../api/openrouter';
import { formatDynamicDecimal } from '../../utils/formatNumber';

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
    assetType?: string;
    exchange?: string;
    inMillions: boolean;
    fields: DataField[];
    onApply: (enabledKeys: string[], extraFields?: DataField[]) => void;
    onClose: () => void;
}

const SUPPORTED_TYPES = ['Common Stock', 'Equity', 'STK', 'ADR', 'REIT'];
const PREFERRED_EXCHANGES = ['Nasdaq', 'NYSE', 'TSX', 'TSXV', 'LSE', 'ASX'];

export function StockDataPreviewModal({
    show, symbol, companyName, assetType, exchange, inMillions, fields, onApply, onClose
}: StockDataPreviewModalProps) {
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});
    const [isFetchingAI, setIsFetchingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiFields, setAiFields] = useState<DataField[]>([]);

    // Reset toggles and AI state whenever the field list changes (new stock selected)
    useEffect(() => {
        if (!show) return;
        const init: Record<string, boolean> = {};
        fields.forEach(f => { init[f.key] = true; });
        setEnabled(init);
        setAiFields([]);
        setAiError(null);
        setIsFetchingAI(false);
    }, [fields, show]);

    if (!show) return null;

    const allFields = [...fields, ...aiFields];
    const anyEnabled = Object.values(allFields).some(f => enabled[f.key]);

    // Validation Logic
    const typeLabel = assetType || 'Unknown';
    const exchangeLabel = exchange || 'Unknown';

    const isETF = typeLabel.toUpperCase().includes('ETF') || typeLabel.toUpperCase().includes('FUND');
    const isSupportedType = SUPPORTED_TYPES.some(t =>
        typeLabel.toLowerCase().includes(t.toLowerCase())
    );
    const isPreferredExchange = PREFERRED_EXCHANGES.some(e =>
        exchangeLabel.toUpperCase().includes(e.toUpperCase())
    );

    const canUseAI = (isSupportedType || !assetType) && !isETF;

    const handleFetchAI = async () => {
        setIsFetchingAI(true);
        setAiError(null);
        try {
            const data = await fetchTTMData(symbol, companyName, exchange);

            // Formatting helper to ensure numeric values are rounded to sane precision
            const round = (v: number) => parseFloat(formatDynamicDecimal(v));
            const s = (v: number) => round(inMillions ? v / 1_000_000 : v);

            const newFields: DataField[] = [
                { key: 'currentRevenue', label: 'Revenue (TTM)', value: s(data.revenue), formatted: formatDynamicDecimal(s(data.revenue), true) },
                { key: 'currentMetricTotal', label: 'Free Cash Flow (TTM)', value: s(data.freeCashFlow), formatted: formatDynamicDecimal(s(data.freeCashFlow), true) },
                { key: 'currentMetricPerShare', label: 'FCF Per Share (TTM)', value: round(data.freeCashFlowPerShare), formatted: formatDynamicDecimal(data.freeCashFlowPerShare, true) },
                { key: 'niCurrentMetricTotal', label: 'Net Income (TTM)', value: s(data.netIncome), formatted: formatDynamicDecimal(s(data.netIncome), true) },
                { key: 'niCurrentMetricPerShare', label: 'Earnings Per Share (TTM)', value: round(data.earningsPerShare), formatted: formatDynamicDecimal(data.earningsPerShare, true) },
                { key: 'currentShares', label: 'Shares Outstanding', value: s(data.sharesOutstanding), formatted: formatDynamicDecimal(s(data.sharesOutstanding), true) },
            ];

            setAiFields(newFields);

            // Pre-toggle new AI fields to ON
            setEnabled(prev => {
                const next = { ...prev };
                newFields.forEach(f => { next[f.key] = true; });
                return next;
            });
        } catch (err: any) {
            console.error('AI fetch error:', err);
            setAiError(err.message || 'Failed to fetch AI data');
        } finally {
            setIsFetchingAI(false);
        }
    };

    const handleApply = () => {
        const enabledKeys = allFields.filter(f => enabled[f.key]).map(f => f.key);
        onApply(enabledKeys, aiFields);
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
                </p>

                {/* Field list */}
                {(fields.length === 0 && aiFields.length === 0) ? (
                    <div className="text-center py-6">
                        <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">
                            No market data found for this symbol.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-700 mb-4">
                        {allFields.map(field => (
                            <li key={field.key} className="flex items-center justify-between py-3 gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {field.label}
                                    </p>
                                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
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

                {/* AI Trigger Section */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                    {!canUseAI ? (
                        <div className="py-2 text-center">
                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500 italic">
                                AI search is not available for {isETF ? 'ETFs/Funds' : 'this asset type'}.
                            </p>
                        </div>
                    ) : aiFields.length === 0 && !isFetchingAI ? (
                        <div className="space-y-3">
                            <button
                                onClick={handleFetchAI}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <span>✨ Search Current Financial Data (AI)</span>
                            </button>

                            {!isPreferredExchange && exchange && (
                                <div className="flex items-center gap-1.5 justify-center px-2">
                                    <div className="flex-shrink-0">
                                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.21 0 2.128-1.333 1.514-2.394L13.514 6.394c-.614-1.061-2.314-1.061-2.928 0L3.086 17.606c-.614 1.061.304 2.394 1.514 2.394z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                                        Minor exchange: AI accuracy may vary.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : isFetchingAI ? (
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Deep-searching filings & transcripts...</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 justify-center py-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-semibold">Available Current Financial Data Loaded</span>
                        </div>
                    )}

                    {aiError && (
                        <p className="text-xs text-red-500 mt-2 text-center">{aiError}</p>
                    )}

                    <div className="mt-3 flex items-center justify-center gap-1.5">
                        <div className="flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.365-.796 1.485-.796 1.85 0l6.023 11.701c.33.741-.213 1.584-1.03 1.584H4.897c-.817 0-1.36-.843-1.03-1.584l6.022-11.701zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal italic">
                            AI can make mistakes. Please double-check accuracy.
                        </p>
                    </div>
                </div>

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
