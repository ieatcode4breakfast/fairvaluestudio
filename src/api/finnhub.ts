/**
 * Finnhub API utilities for stock search and quote data.
 */

const API_KEY = import.meta.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type?: string;
    exchange?: string;
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
        // The quote endpoint does not support the 'exchange' parameter. 
        // Using it can cause the API to return 0 or empty data for certain symbols.
        const response = await fetch(
            `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`Finnhub quote failed: ${response.status}`);
        }
        const data = await response.json();
        
        // Finnhub returns 0 if the symbol is not found or has no price data.
        // We treat 0 as null to trigger the fallback in marketData.ts.
        return (data.c && data.c !== 0) ? data.c : null;
    } catch (error) {
        console.error('Failed to fetch stock price:', error);
        return null;
    }
}

