import * as finnhub from './finnhub';
import * as rapidApi from './rapidApiStockPulse';

export interface StockSearchResult {
    symbol: string;
    description: string;
}

export interface UnifiedFundamentals {
    price: number | null;
}

/**
 * Unified search that tries Finnhub first, then falls back to RapidAPI Stock Pulse.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    console.log(`[UnifiedSearch] Searching for "${query}"...`);
    
    // 1. Try Finnhub
    try {
        const finnhubResults = await finnhub.searchStocks(query);
        if (finnhubResults && finnhubResults.length > 0) {
            console.log(`[UnifiedSearch] Results found via Finnhub (${finnhubResults.length})`);
            return finnhubResults;
        }
        console.log(`[UnifiedSearch] No results from Finnhub, falling back to RapidAPI...`);
    } catch (error) {
        console.warn(`[UnifiedSearch] Finnhub search failed, falling back to RapidAPI...`, error);
    }

    // 2. Fallback to RapidAPI
    try {
        const rapidResults = await rapidApi.searchStocks(query);
        console.log(`[UnifiedSearch] Results found via RapidAPI (${rapidResults.length})`);
        return rapidResults;
    } catch (error) {
        console.error(`[UnifiedSearch] RapidAPI search failed as well:`, error);
        return [];
    }
}

/**
 * Unified fundamentals that tries Finnhub first, then falls back to RapidAPI.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    console.log(`[UnifiedData] Fetching fundamentals for ${symbol}...`);

    // 1. Try Finnhub
    try {
        const finnhubData = await finnhub.getStockFundamentals(symbol);
        if (finnhubData && finnhubData.price !== null && finnhubData.price !== 0) {
            console.log(`[UnifiedData] Price found via Finnhub: ${finnhubData.price}`);
            return finnhubData;
        }
        console.log(`[UnifiedData] No price from Finnhub (null or zero), falling back to RapidAPI...`);
    } catch (error) {
        console.warn(`[UnifiedData] Finnhub fetch failed, falling back to RapidAPI...`, error);
    }

    // 2. Fallback to RapidAPI
    try {
        const rapidData = await rapidApi.getStockFundamentals(symbol);
        console.log(`[UnifiedData] Price results from RapidAPI: ${rapidData.price}`);
        return rapidData;
    } catch (error) {
        console.error(`[UnifiedData] RapidAPI fetch failed as well:`, error);
        return { price: null };
    }
}
