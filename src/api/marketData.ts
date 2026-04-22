import { supabase } from '../lib/supabase';
import * as finnhub from './finnhub';
import { getFmpTTM } from './fmp';

export interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type?: string;
    exchange?: string;
}

export interface UnifiedFundamentals {
    price: number | null;
    revenue?: number;
    netIncome?: number;
    operatingCashFlow?: number;
    capitalExpenditure?: number;
    freeCashFlow?: number;
    sharesOutstanding?: number;
    reportingPeriod?: { year: number; quarter: string } | null;
}

/**
 * Unified search that uses the local database (sec_companies).
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    console.log(`[UnifiedSearch] Searching for "${query}" via Finnhub...`);
    
    if (!query.trim()) return [];

    try {
        const results = await finnhub.searchStocks(query);
        return results.map(item => ({
            symbol: item.symbol,
            description: item.description,
            exchange: item.exchange,
            type: item.type
        }));
    } catch (error) {
        console.error(`[UnifiedSearch] Finnhub search failed:`, error);
        return [];
    }
}

/**
 * Unified fundamentals that combines Finnhub price and SEC TTM financials.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    console.log(`[UnifiedData] Fetching unified data for ${symbol} (Finnhub + FMP)...`);

    try {
        // Run Finnhub (Price) and FMP (Financials) in parallel
        const [price, fmpData] = await Promise.all([
            finnhub.getStockPrice(symbol),
            getFmpTTM(symbol)
        ]);

        console.log(`[UnifiedData] Results for ${symbol}: Price=${price}, FMP=${fmpData ? 'Success' : 'Failed'}`);

        return {
            price,
            ...fmpData,
            sharesOutstanding: fmpData?.sharesOutstanding || 0
        };
    } catch (error) {
        console.error(`[UnifiedData] Unified fetch failed for ${symbol}:`, error);
    }

    return { price: null };
}
