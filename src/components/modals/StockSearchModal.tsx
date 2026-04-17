import React, { useState, useEffect, useRef } from 'react';
import { Search } from '../Icons';
import { searchStocks, StockSearchResult, getStockFundamentals, FinnhubFundamentals } from '../../api/finnhub';

interface StockSearchModalProps {
    show: boolean;
    onClose: () => void;
    onSelect: (symbol: string, data: FinnhubFundamentals) => void;
}

export function StockSearchModal({ show, onClose, onSelect }: StockSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StockSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectingSymbol, setSelectingSymbol] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search effect
    useEffect(() => {
        if (!show) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (!query.trim()) {
            setResults([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        timeoutRef.current = setTimeout(async () => {
            try {
                const data = await searchStocks(query);
                setResults(data);
                if (data.length === 0) {
                    setError('No stocks found. Try a different ticker or company name.');
                }
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search. Check your connection and API key.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 1500); // 1.5 seconds delay

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query, show]);

    // Clear state when modal closes
    useEffect(() => {
        if (!show) {
            setQuery('');
            setResults([]);
            setLoading(false);
            setError(null);
            setSelectingSymbol(null);
        }
    }, [show]);

    const handleSelect = async (symbol: string) => {
        setSelectingSymbol(symbol);
        setError(null);
        try {
            const data = await getStockFundamentals(symbol);
            if (data.price === null) {
                setError('Could not retrieve a current price for this symbol.');
                setSelectingSymbol(null);
                return;
            }
            // Parent closes this modal and opens the preview modal
            onSelect(symbol, data);
        } catch (err) {
            console.error('Data fetch error:', err);
            setError('Failed to load data. Please try again.');
            setSelectingSymbol(null);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/70 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Search Stocks</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="(e.g., MSFT, Apple, Tesla, AMZN)"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors text-sm text-slate-900 dark:text-slate-100"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="max-h-64 overflow-y-auto">
                    {results.length > 0 ? (
                        <ul className="space-y-2">
                            {results.map((stock) => (
                                <li key={stock.symbol}>
                                    <button
                                        onClick={() => handleSelect(stock.symbol)}
                                        disabled={selectingSymbol !== null}
                                        className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-wait rounded-lg transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                    {stock.symbol}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {stock.description}
                                                </div>
                                            </div>
                                            {selectingSymbol === stock.symbol && (
                                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin ml-3 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : query && !loading && !error ? (
                        <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                            Start typing to search for stocks
                        </p>
                    ) : null}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}