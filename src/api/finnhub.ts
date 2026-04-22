/**
 * Finnhub API utilities for stock search and quote data.
 */

const API_KEY = import.meta.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type?: string;
    exchange?: string;
}

/**
 * Raw financials fetched for a symbol.
 */
export interface FinnhubFundamentals {
    price: number | null;
    reportingPeriod?: { year: number; quarter: number } | null;
}

/**
 * Search for stocks by ticker or company name.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(
            `${BASE_URL}/search?q=${encodeURIComponent(query)}&exchange=US&token=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`Finnhub search failed: ${response.status}`);
        }
        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error('Failed to search stocks:', error);
        throw error;
    }
}

/**
 * Fetch the current stock price for a given ticker symbol.
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/quote?symbol=${symbol}&exchange=US&token=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`Finnhub quote failed: ${response.status}`);
        }
        const data = await response.json();
        return data.c ?? null;
    } catch (error) {
        console.error('Failed to fetch stock price:', error);
        throw error;
    }
}

/**
 * Fetch stock price and latest reporting period from Finnhub in parallel.
 * Returns null for price/period if unavailable.
 */
export async function getStockFundamentals(symbol: string): Promise<FinnhubFundamentals> {
    try {
        const [price, financials] = await Promise.all([
            getStockPrice(symbol),
            fetch(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&exchange=US&token=${API_KEY}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
        ]);

        let reportingPeriod = null;
        if (financials?.series?.quarterly?.eps?.[0]) {
            const latest = financials.series.quarterly.eps[0];
            let year = latest.year;
            let quarter = latest.quarter;

            // Fallback: Parse the 'period' date string (e.g. "2024-12-31") if convenience fields are missing
            if ((!year || !quarter) && latest.period) {
                const dateParts = latest.period.split('-');
                if (dateParts.length >= 2) {
                    year = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10);
                    quarter = Math.floor((month - 1) / 3) + 1;
                }
            }

            if (year && quarter) {
                reportingPeriod = { year, quarter };
            }
        }

        console.log('[Finnhub] final fundamentals:', { symbol, price, reportingPeriod });
        return { price, reportingPeriod };
    } catch (error) {
        console.error('Failed to fetch stock fundamentals:', error);
        return { price: null, reportingPeriod: null };
    }
}
