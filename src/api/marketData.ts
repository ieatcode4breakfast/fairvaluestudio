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
    ebitda?: number;
    sharesOutstanding?: number;
    marketCap?: number;
    peRatio?: number;
    eps?: number;
    reportingPeriod?: { year: number; quarter: string } | null;
}

/**
 * Checks if the cache date is after the most recent 5 PM UTC.
 */
function isCacheFresh(updatedAtStr: string): boolean {
    const updatedAt = new Date(updatedAtStr);
    const now = new Date();
    
    const threshold = new Date(now);
    // 22:00 UTC is 5:00 PM in UTC-5 (EST)
    threshold.setUTCHours(22, 0, 0, 0);
    
    // If it's currently before 5 PM EST, the most recent 5 PM EST was yesterday
    if (now < threshold) {
        threshold.setUTCDate(threshold.getUTCDate() - 1);
    }
    
    return updatedAt >= threshold;
}

/**
 * Unified search that uses Finnhub.
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
 * Unified fundamentals that uses a Supabase cache + Yahoo Finance Edge Function.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    const cleanSymbol = symbol.toUpperCase();
    console.log(`[UnifiedData] Checking cache for ${cleanSymbol}...`);

    try {
        // 1. Check Supabase Cache
        const { data: cached, error: cacheError } = await supabase
            .from('stock_cache')
            .select('*')
            .eq('symbol', cleanSymbol)
            .maybeSingle();

        if (cacheError) {
            console.warn(`[UnifiedData] Cache query error (Expected if table is missing or API is syncing):`, cacheError);
        }

        if (cached && isCacheFresh(cached.updated_at)) {
            console.log(`[UnifiedData] Cache HIT for ${cleanSymbol} (Updated: ${cached.updated_at})`);
            return cached.data as UnifiedFundamentals;
        }

        console.log(`[UnifiedData] Cache MISS or STALE for ${cleanSymbol}. Fetching from Edge Function...`);

        // 2. Fetch from get-ttm Edge Function (Yahoo Finance)
        // Note: Using localhost for local dev, should use VITE_SUPABASE_URL in production
        const functionUrl = import.meta.env.DEV 
            ? 'http://localhost:54321/functions/v1/get-ttm'
            : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ttm`;

        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Supabase functions locally don't need auth if served with --no-verify-jwt
                // but in production they need the anon key
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ symbol: cleanSymbol })
        });

        if (!response.ok) {
            throw new Error(`Edge Function failed: ${response.statusText}`);
        }

        const raw = await response.json();
        
        // 3. Map Yahoo Finance Summary to UnifiedFundamentals
        const financial = raw.financialData || {};
        const stats = raw.defaultKeyStatistics || {};
        const summary = raw.summaryDetail || {};

        const unified: UnifiedFundamentals = {
            price: financial.currentPrice || summary.regularMarketPrice || null,
            revenue: financial.totalRevenue,
            freeCashFlow: financial.freeCashflow,
            operatingCashFlow: financial.operatingCashflow,
            ebitda: financial.ebitda,
            sharesOutstanding: stats.sharesOutstanding || summary.sharesOutstanding,
            marketCap: summary.marketCap,
            peRatio: summary.trailingPE,
            eps: stats.trailingEps,
            reportingPeriod: null // Yahoo summary doesn't give a single clear period easily
        };

        // 4. Update Cache
        const { error: upsertError } = await supabase
            .from('stock_cache')
            .upsert({
                symbol: cleanSymbol,
                data: unified,
                updated_at: new Date().toISOString()
            });

        if (upsertError) console.error(`[UnifiedData] Cache update failed:`, upsertError);

        return unified;

    } catch (error) {
        console.error(`[UnifiedData] Unified fetch failed for ${cleanSymbol}:`, error);
        return { price: null };
    }
}
