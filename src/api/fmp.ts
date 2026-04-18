/**
 * Financial Modeling Prep (FMP) API utilities for stock search and quote data.
 */

const API_KEY = import.meta.env.VITE_FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface StockSearchResult {
    symbol: string;
    name: string; // FMP uses 'name' instead of Finnhub's 'description'
    currency?: string;
    stockExchange?: string;
    exchangeShortName?: string;
}

/**
 * Raw financials fetched for a symbol.
 */
export interface FMPFundamentals {
    price: number | null;
}

/**
 * Search for stocks by ticker or company name.
 * @param query Search string (e.g., "MSFT" or "Microsoft")
 * @param limit Number of results to return (default is 10)
 * @returns Array of matching stocks
 */
export async function searchStocks(query: string, limit: number = 10): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(
            `${BASE_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`FMP search failed: ${response.status}`);
        }
        const data = await response.json();

        // FMP returns the array directly, not wrapped in a { result: [...] } object
        return data || [];
    } catch (error) {
        console.error('Failed to search stocks:', error);
        throw error;
    }
}

/**
 * Fetch the current stock price for a given ticker symbol.
 * Note: Free tier FMP prices are typically delayed by 15 minutes.
 * @param symbol Stock ticker (e.g., "MSFT")
 * @returns Current price or null if unavailable
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
    try {
        // quote-short is a lightweight endpoint perfect for just getting the price
        const response = await fetch(
            `${BASE_URL}/quote-short/${symbol}?apikey=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`FMP quote failed: ${response.status}`);
        }
        const data = await response.json();

        // FMP returns an array of quotes: [{ symbol: "MSFT", price: 310.2, volume: 12345 }]
        if (Array.isArray(data) && data.length > 0) {
            return data[0].price ?? null;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch stock price:', error);
        throw error;
    }
}

/**
 * Fetch stock price from FMP.
 * Returns null for price if unavailable.
 */
export async function getStockFundamentals(symbol: string): Promise<FMPFundamentals> {
    const price = await getStockPrice(symbol);
    console.log('[FMP] final fundamentals:', { symbol, price });
    return { price };
}
