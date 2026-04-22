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
    eps?: number;
    freeCashFlow?: number;
    fcfPerShare?: number;
    operatingCashFlow?: number;
    ocfPerShare?: number;
    ebitda?: number;
    ebitdaPerShare?: number;
    bookValue?: number;
    sharesOutstanding?: number;
}

/**
 * Maps raw Yahoo Finance data and Finnhub price to our UnifiedFundamentals interface.
 */
function mapToUnified(yahoo: any, finnhubPrice: number | null): UnifiedFundamentals {
    const y = yahoo || {};
    const financial = y.financialData || {};
    const stats = y.defaultKeyStatistics || {};
    const summary = y.summaryDetail || {};

    // Yahoo data is often wrapped in objects like { raw: 123.45, fmt: "123.45" }
    const v = (obj: any) => (obj && typeof obj === 'object' && 'raw' in obj) ? obj.raw : obj;

    const shares = v(stats.sharesOutstanding) || v(summary.sharesOutstanding) || 0;
    const ni = v(financial.netIncomeToCommon) || v(stats.netIncomeToCommon) || null;
    const fcf = v(financial.freeCashflow) || null;
    const ocf = v(financial.operatingCashflow) || null;
    const ebitda = v(financial.ebitda) || null;

    return {
        // Price: Finnhub only (no fallback to Yahoo)
        price: finnhubPrice,
        
        // Totals
        revenue: v(financial.totalRevenue),
        netIncome: ni,
        freeCashFlow: fcf,
        operatingCashFlow: ocf,
        ebitda: ebitda,
        
        // Per Share
        eps: v(stats.trailingEps) || (ni && shares ? ni / shares : null),
        fcfPerShare: (fcf && shares) ? fcf / shares : null,
        ocfPerShare: (ocf && shares) ? ocf / shares : null,
        ebitdaPerShare: (ebitda && shares) ? ebitda / shares : null,
        bookValue: v(stats.bookValue),
        
        // Base
        sharesOutstanding: shares
    };
}

/**
 * Checks if the cache date is after the most recent 5 PM EST (22:00 UTC).
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
 * Unified fundamentals that always fetches live price from Finnhub,
 * but uses a Supabase cache for Yahoo Finance financials.
 */
export async function getStockFundamentals(symbol: string): Promise<UnifiedFundamentals> {
    const primarySymbol = symbol.toUpperCase();
    const yahooSymbol = primarySymbol.replace(/\./g, '-');

    // 1. Always start fetching the live price immediately
    console.log(`[UnifiedData] Initiating live price fetch for ${primarySymbol}...`);
    const pricePromise = finnhub.getStockPrice(primarySymbol).catch(() => null);

    try {
        // 2. Check Cache for Yahoo Data
        const { data: cached, error: cacheError } = await supabase
            .from('stock_cache')
            .select('*')
            .eq('symbol', primarySymbol)
            .maybeSingle();

        if (cacheError) console.warn(`[UnifiedData] Cache query error:`, cacheError);

        let rawYahoo: any;
        
        if (cached && isCacheFresh(cached.updated_at) && cached.data?.yahoo) {
            console.log(`[UnifiedData] Yahoo Cache HIT for ${primarySymbol}. Using cached financials.`);
            rawYahoo = cached.data.yahoo;
        } else {
            console.log(`[UnifiedData] Yahoo Cache MISS or STALE for ${primarySymbol}. Fetching live financials...`);
            
            const functionUrl = import.meta.env.DEV 
                ? 'http://localhost:54321/functions/v1/get-ttm'
                : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-ttm`;

            const edgeRes = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ symbol: yahooSymbol })
            });

            if (!edgeRes.ok) {
                throw new Error(`Edge Function failed: ${edgeRes.statusText}`);
            }

            rawYahoo = await edgeRes.json();
            
            // 3. Update Cache with new Yahoo data (async, don't wait)
            supabase.from('stock_cache').upsert({
                symbol: primarySymbol,
                data: { yahoo: rawYahoo },
                updated_at: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.error(`[UnifiedData] Cache update failed for ${primarySymbol}:`, error);
            });
        }

        // 4. Combine live price with (cached or live) Yahoo data
        const finnhubPrice = await pricePromise;
        return mapToUnified(rawYahoo, finnhubPrice);

    } catch (error) {
        console.error(`[UnifiedData] Hybrid fetch failed for ${primarySymbol}:`, error);
        // Fallback: at least try to return the live price if we have it
        const fallbackPrice = await pricePromise;
        return { price: fallbackPrice };
    }
}
