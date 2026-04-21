import React, { useState, useEffect } from 'react';
import { Toggle } from '../Toggle';
import { fetchTTMData, getAIUsageStatus } from '../../api/openrouter';
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
    isGuest?: boolean;
    userId?: string;
    reportingPeriod?: { year: number; quarter: number } | null;
}

const SUPPORTED_TYPES = ['Common Stock', 'Equity', 'STK', 'ADR', 'REIT'];
const PREFERRED_EXCHANGES = ['Nasdaq', 'NYSE'];

export function StockDataPreviewModal({
    show, symbol, companyName, assetType, exchange, inMillions, fields, onApply, onClose, isGuest, userId, reportingPeriod
}: StockDataPreviewModalProps) {
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});
    const [isFetchingAI, setIsFetchingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiFields, setAiFields] = useState<DataField[]>([]);
    const [usageCount, setUsageCount] = useState<number>(0);
    const [usageLimit, setUsageLimit] = useState<number>(5);
    const [loadedFiscal, setLoadedFiscal] = useState<{ year: number; quarter: number } | null>(null);

    // Reset toggles and AI state whenever the field list changes (new stock selected)
    useEffect(() => {
        if (!show) return;
        const init: Record<string, boolean> = {};
        fields.forEach(f => { init[f.key] = true; });
        setEnabled(init);
        setAiFields([]);
        setAiError(null);
        setIsFetchingAI(false);
        setLoadedFiscal(null);

        // Fetch usage status for the user
        if (userId) {
            getAIUsageStatus(userId).then(status => {
                setUsageCount(status.count);
                setUsageLimit(status.limit);
            });
        }
    }, [fields, show, userId]);

    if (!show) return null;

    const allFields = [...fields, ...aiFields];
    const anyEnabled = allFields.some(f => enabled[f.key]);

    // Validation Logic
    const typeLabel = assetType || 'Unknown';
    const exchangeLabel = exchange || 'Unknown';

    const isETF = typeLabel.toUpperCase().includes('ETF') || typeLabel.toUpperCase().includes('FUND');
    const isSupportedType = SUPPORTED_TYPES.some(t =>
        typeLabel.toLowerCase().includes(t.toLowerCase())
    );

    const canUseAI = (isSupportedType || !assetType) && !isETF && !isGuest;

    const handleFetchAI = async () => {
        if (isGuest) return;
        setIsFetchingAI(true);
        setAiError(null);
        try {
            // Pass the reportingPeriod to handle smart caching
            const data = await fetchTTMData(symbol, companyName, exchange, userId, reportingPeriod);

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
            if (data.fiscalYear && data.fiscalQuarter) {
                setLoadedFiscal({ year: data.fiscalYear, quarter: data.fiscalQuarter });
            }

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
            if (userId) {
                getAIUsageStatus(userId).then(status => {
                    setUsageCount(status.count);
                    setUsageLimit(status.limit);
                });
            }
        }
    };

    const handleApply = () => {
        const enabledKeys = allFields.filter(f => enabled[f.key]).map(f => f.key);
        onApply(enabledKeys, aiFields);
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
                        Available data for{' '}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {companyName} ({symbol})
                        </span>.
                    </p>
                </div>

            <div className="flex-1 overflow-y-auto p-6 py-2 custom-scrollbar">

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

            </div>

                {/* Actions - Fixed */}
                <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {/* AI Trigger Section */}
                    {!isGuest && (
                        <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
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
                                        disabled={usageCount >= usageLimit}
                                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                                    >
                                        <span>
                                            {usageCount >= usageLimit
                                                ? 'Daily AI Limit Reached'
                                                : '✨ AI Query Current Financial Data'}
                                        </span>
                                    </button>

                                    <div className="text-center">
                                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            Quota: {Math.max(0, usageLimit - usageCount)} of {usageLimit} searches remaining today
                                        </p>
                                    </div>
                                </div>
                            ) : isFetchingAI ? (
                                <div className="flex flex-col items-center justify-center py-2">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Deep-searching filings & transcripts...</p>
                                </div>
                            ) : (
                                <div className="text-center py-1">
                                    {loadedFiscal && (
                                        <div className="mb-3 flex items-center gap-2 justify-center py-1 px-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                            <div className="text-indigo-600 dark:text-indigo-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-tighter">
                                                Latest Reported: {loadedFiscal.year} Q{loadedFiscal.quarter}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-xs font-semibold">Financial Data Loaded</span>
                                    </div>
                                </div>
                            )}

                            {aiError && (
                                <p className="text-xs text-red-500 mt-2 text-center">{aiError}</p>
                            )}

                            <div className="mt-3 flex items-center justify-center text-center">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal text-center">
                                    ⚠️ AI can make mistakes. Please double-check accuracy.
                                </p>
                            </div>
                        </div>
                    )}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    {(fields.length > 0 || aiFields.length > 0) && (
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
