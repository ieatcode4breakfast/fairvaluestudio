/**
 * Financial Modeling Prep (FMP) API utilities for stock search and quote data.
 */

const API_KEY = import.meta.env.VITE_FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface StockSearchResult {
    symbol: string;
    name: string;
    description: string; // Added for compatibility with Finnhub-based UI
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
        console.log(`[FMP] Searching for: "${query}" (Free Tier)`);
        
        // FMP Free Tier often works best with the 'stable' path and 'search-symbol' endpoint
        const url = `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(query)}&limit=${limit}&apikey=${API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'No error body');
            console.error(`[FMP] Search failed with status ${response.status}:`, errorBody);
            throw new Error(`FMP search failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[FMP] Search results received: ${Array.isArray(data) ? data.length : 0} items`);

        // FMP returns an array. Map 'name' to 'description' for UI compatibility.
        return (data || []).map((item: any) => ({
            ...item,
            description: item.name || item.symbol || '' // Use symbol as description if name is missing
        }));
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
        // We use the 'stable' path as /api/v3/ is now a legacy endpoint for quotes
        const response = await fetch(
            `https://financialmodelingprep.com/stable/quote/${symbol}?apikey=${API_KEY}`
        );
        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'No error body');
            console.error(`[FMP] Quote failed with status ${response.status}:`, errorBody);
            throw new Error(`FMP quote failed: ${response.status}`);
        }
        const data = await response.json();

        // FMP returns an array of quotes: [{ symbol: "AZO", price: 3100.2, ... }]
        if (Array.isArray(data) && data.length > 0) {
            console.log(`[FMP] Successfully fetched price for ${symbol}:`, data[0].price);
            return data[0].price ?? null;
        }
        
        console.warn(`[FMP] No quote data returned for ${symbol}`);
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
