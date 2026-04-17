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
}

/**
 * Search for stocks by ticker or company name.
 * @param query Search string (e.g., "MSFT" or "Microsoft")
 * @returns Array of matching stocks
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(
            `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`
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
 * @param symbol Stock ticker (e.g., "MSFT")
 * @returns Current price (c field) or null if unavailable
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`Finnhub quote failed: ${response.status}`);
        }
        const data = await response.json();
        // c = current price, may be 0 for invalid symbol
        return data.c ?? null;
    } catch (error) {
        console.error('Failed to fetch stock price:', error);
        throw error;
    }
}