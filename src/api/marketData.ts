import * as finnhub from './finnhub';

export interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type?: string;
    exchange?: string;
}

export interface UnifiedFundamentals {
    price: number | null;
    reportingPeriod?: { year: number; quarter: number } | null;
}

/**
 * Unified search that uses Finnhub.
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    console.log(`[UnifiedSearch] Searching for "${query}"...`);
    
    try {
        const finnhubResults = await finnhub.searchStocks(query);
        if (finnhubResults && finnhubResults.length > 0) {
            console.log(`[UnifiedSearch] Results found via Finnhub (${finnhubResults.length})`);
            return finnhubResults;
        }
    } catch (error) {
        console.error(`[UnifiedSearch] Finnhub search failed:`, error);
    }

    return [];
}

/**
 * Unified fundamentals that uses Finnhub.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    console.log(`[UnifiedData] Fetching fundamentals for ${symbol}...`);

    try {
        const finnhubData = await finnhub.getStockFundamentals(symbol);
        if (finnhubData && finnhubData.price !== null && finnhubData.price !== 0) {
            console.log(`[UnifiedData] Price found via Finnhub: ${finnhubData.price}`);
            return finnhubData;
        }
    } catch (error) {
        console.error(`[UnifiedData] Finnhub fetch failed:`, error);
    }

    return { price: null };
}
