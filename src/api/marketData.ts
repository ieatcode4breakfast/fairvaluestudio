import { supabase } from '../lib/supabase';
import * as finnhub from './finnhub';
import { getSecFinancials } from './secMetrics';

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
    console.log(`[UnifiedSearch] Searching for "${query}" via Database...`);
    
    if (!query.trim()) return [];

    try {
        // Search by ticker (exact or partial) or name (partial)
        const { data, error } = await supabase
            .from('sec_companies')
            .select('ticker, name, exchange')
            .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
            console.log(`[UnifiedSearch] Results found via Database (${data.length})`);
            return data.map(item => ({
                symbol: item.ticker,
                description: item.name,
                exchange: item.exchange,
                type: 'Common Stock' // Defaulting to Common Stock as per SEC filings context
            }));
        }
    } catch (error) {
        console.error(`[UnifiedSearch] Database search failed:`, error);
        return [];
    }

    return [];
}

/**
 * Unified fundamentals that combines Finnhub price and SEC TTM financials.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    console.log(`[UnifiedData] Fetching unified data for ${symbol}...`);

    try {
        // Run Finnhub (Price + Profile) and SEC (Financials) in parallel
        const [price, profile, secData] = await Promise.all([
            finnhub.getStockPrice(symbol),
            finnhub.getCompanyProfile(symbol),
            getSecFinancials(symbol)
        ]);

        console.log(`[UnifiedData] Results for ${symbol}: Price=${price}, Profile=${profile ? 'Success' : 'Failed'}, SEC=${secData ? 'Success' : 'Failed'}`);

        return {
            price,
            ...secData,
            // Override SEC shares with Finnhub's more current sharesOutstanding
            sharesOutstanding: profile?.shareOutstanding ? profile.shareOutstanding * 1000000 : secData?.sharesOutstanding
        };
    } catch (error) {
        console.error(`[UnifiedData] Unified fetch failed for ${symbol}:`, error);
    }

    return { price: null };
}
