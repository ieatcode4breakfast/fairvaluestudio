/**
 * Finnhub API utilities for stock search and quote data.
 */

const API_KEY = import.meta.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type?: string;
}

/**
 * Raw financials fetched for a symbol. All monetary values are in millions (Finnhub standard).
 */
export interface FinnhubFundamentals {
    price: number | null;
    revenueTTM: number | null;        // millions
    freeCashFlowTTM: number | null;   // millions (can be negative)
    netIncomeTTM: number | null;      // millions (can be negative)
    sharesOutstanding: number | null; // millions
}

/**
 * Search for stocks by ticker or company name.
 * @param query Search string (e.g., "MSFT" or "Microsoft")
 * @returns Array of matching stocks
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(
            `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`
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
 * @param symbol Stock ticker (e.g., "MSFT")
 * @returns Current price (c field) or null if unavailable
 */
export async function getStockPrice(symbol: string): Promise<number | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`Finnhub quote failed: ${response.status}`);
        }
        const data = await response.json();
        // c = current price, may be 0 for invalid symbol
        return data.c ?? null;
    } catch (error) {
        console.error('Failed to fetch stock price:', error);
        throw error;
    }
}

/**
 * Fetch stock price + key TTM fundamentals in parallel.
 * Monetary values returned are in millions (Finnhub standard).
 * Returns null for any field that is unavailable or invalid.
 */
export async function getStockFundamentals(symbol: string): Promise<FinnhubFundamentals> {
    const encoded = encodeURIComponent(symbol);

    const [priceRes, metricsRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/quote?symbol=${encoded}&token=${API_KEY}`),
        fetch(`${BASE_URL}/stock/metric?symbol=${encoded}&metric=all&token=${API_KEY}`),
    ]);

    let price: number | null = null;
    let revenueTTM: number | null = null;
    let freeCashFlowTTM: number | null = null;
    let netIncomeTTM: number | null = null;
    let sharesOutstanding: number | null = null;

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
        const priceResponse = priceRes.value;
        console.log('[Finnhub] price response:', {
            ok: priceResponse.ok,
            status: priceResponse.status,
            statusText: priceResponse.statusText,
            url: priceResponse.url,
        });
        try {
            const d = await priceResponse.json();
            console.log('[Finnhub] price data:', d);
            if (typeof d.c === 'number' && d.c > 0) price = d.c;
        } catch (error) {
            console.error('[Finnhub] Failed to parse price JSON:', error);
        }
    }

    if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const metricResponse = metricsRes.value;
        console.log('[Finnhub] metric response:', {
            ok: metricResponse.ok,
            status: metricResponse.status,
            statusText: metricResponse.statusText,
            url: metricResponse.url,
        });
        try {
            const d = await metricResponse.json();
            console.log('[Finnhub] metric data:', d);
            const m = d.metric ?? {};
            console.log('[Finnhub] metric object keys:', Object.keys(m));
            console.log('[Finnhub] metric object (raw):', JSON.stringify(m, null, 2));

            // Helper to round to specified decimal places
            const round = (num: number, decimals = 2) => {
                const factor = 10 ** decimals;
                return Math.round(num * factor) / factor;
            };

            // Extract per‑share metrics and market cap (round to 2 decimal places)
            const revenuePerShareTTM = typeof m.revenuePerShareTTM === 'number' ? round(m.revenuePerShareTTM, 2) : undefined;
            const epsTTM = typeof m.epsTTM === 'number' ? round(m.epsTTM, 2) : undefined;
            const cashFlowPerShareTTM = typeof m.cashFlowPerShareTTM === 'number' ? round(m.cashFlowPerShareTTM, 2) : undefined;
            const freeCashFlowPerShareTTM = typeof m.freeCashFlowPerShareTTM === 'number' ? round(m.freeCashFlowPerShareTTM, 2) : undefined;
            const marketCap = m.marketCapitalization;

            // Calculate shares outstanding (millions of shares)
            if (typeof marketCap === 'number' && marketCap > 0 && price !== null && price > 0) {
                sharesOutstanding = round(marketCap / price, 3);
            }

            // Derive raw TTM values (in millions)
            if (typeof revenuePerShareTTM === 'number' && revenuePerShareTTM > 0 && sharesOutstanding !== null) {
                revenueTTM = round(revenuePerShareTTM * sharesOutstanding, 2);
            }
            if (typeof epsTTM === 'number' && sharesOutstanding !== null) {
                netIncomeTTM = round(epsTTM * sharesOutstanding, 2);
            }
            // Prefer free cash flow per share, fallback to cash flow per share
            const cashFlowPerShare = freeCashFlowPerShareTTM ?? cashFlowPerShareTTM;
            if (typeof cashFlowPerShare === 'number' && sharesOutstanding !== null) {
                freeCashFlowTTM = round(cashFlowPerShare * sharesOutstanding, 2);
            }

            // Fallback to direct fields if they exist (some symbols may have them)
            if (typeof m.revenueTTM === 'number' && m.revenueTTM > 0) revenueTTM = round(m.revenueTTM, 2);
            if (typeof m.freeCashFlowTTM === 'number') freeCashFlowTTM = round(m.freeCashFlowTTM, 2);
            if (typeof m.netIncomeTTM === 'number') netIncomeTTM = round(m.netIncomeTTM, 2);
            if (typeof m.shareOutstanding === 'number' && m.shareOutstanding > 0) sharesOutstanding = round(m.shareOutstanding, 3);
        } catch (error) {
            console.error('[Finnhub] Failed to parse metric JSON:', error);
        }
    }

    console.log('[Finnhub] final fundamentals:', { price, revenueTTM, freeCashFlowTTM, netIncomeTTM, sharesOutstanding });
    return { price, revenueTTM, freeCashFlowTTM, netIncomeTTM, sharesOutstanding };
}