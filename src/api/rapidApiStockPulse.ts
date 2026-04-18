/**
 * RapidAPI Stock Pulse (Yahoo Finance 127) API utilities.
 */

const API_KEY = import.meta.env.VITE_RAPIDAPI_STOCKPULSE_KEY;
const API_HOST = import.meta.env.VITE_RAPIDAPI_STOCKPULSE_HOST;
const BASE_URL = `https://${API_HOST}`;

export interface StockSearchResult {
    symbol: string;
    description: string;
    type?: string;
    exchange?: string;
}

export interface StockPulseFundamentals {
    price: number | null;
}

/**
 * Search for stocks by ticker or company name.
 * Uses the /search/{query} endpoint.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(`${BASE_URL}/search/${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`RapidAPI search failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Map data.quotes to our StockSearchResult interface
        // We use shortname or longname for the description
        return (data.quotes || []).map((q: any) => ({
            symbol: q.symbol,
            description: q.shortname || q.longname || q.symbol,
            type: q.quoteType,
            exchange: q.exchDisp
        }));
    } catch (error) {
        console.error('Failed to search stocks (RapidAPI):', error);
        throw error;
    }
}

/**
 * Fetch the current stock price for a given ticker symbol.
 * Uses the /price/{symbol} endpoint.
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
    try {
        const response = await fetch(`${BASE_URL}/price/${symbol.toLowerCase()}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`RapidAPI price fetch failed: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract raw price from regularMarketPrice.raw
        return data.regularMarketPrice?.raw ?? null;
    } catch (error) {
        console.error('Failed to fetch stock price (RapidAPI):', error);
        throw error;
    }
}

/**
 * Fetch stock price from RapidAPI.
 * Returns null for price if unavailable.
 */
export async function getStockFundamentals(symbol: string): Promise<StockPulseFundamentals> {
    const price = await getStockPrice(symbol);
    console.log('[RapidAPI] final fundamentals:', { symbol, price });
    return { price };
}
