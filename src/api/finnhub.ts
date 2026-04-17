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
        fetch(`${BASE_URL}/stock/metric?symbol=${encoded}&metric=all&preliminary=true&token=${API_KEY}`),
    ]);

    let price: number | null = null;
    let revenueTTM: number | null = null;
    let freeCashFlowTTM: number | null = null;
    let netIncomeTTM: number | null = null;
    let sharesOutstanding: number | null = null;

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
        try {
            const d = await priceRes.value.json();
            if (typeof d.c === 'number' && d.c > 0) price = d.c;
        } catch (error) {
            console.error('[Finnhub] Failed to parse price JSON:', error);
        }
    }

    if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        try {
            const d = await metricsRes.value.json();
            const m = d.metric ?? {};
            const s = d.series?.quarterly ?? {};

            // Helper to round to specified decimal places
            const round = (num: number, decimals = 2) => {
                const factor = 10 ** decimals;
                return Math.round(num * factor) / factor;
            };

            // Helper to sum last 4 quarters from a series if available
            const sumLast4 = (seriesArray: any[]) => {
                if (!Array.isArray(seriesArray) || seriesArray.length < 1) return null;
                // Sum up to 4 most recent entries
                const last4 = seriesArray.slice(0, 4);
                const sum = last4.reduce((acc, curr) => acc + (curr.v || 0), 0);
                return round(sum, 2);
            };

            // 1. SHARES OUTSTANDING - Most critical field for derivations
            // Always prioritize direct share count fields from Finnhub
            if (typeof m.shareOutstanding === 'number' && m.shareOutstanding > 0) {
                sharesOutstanding = round(m.shareOutstanding, 3);
            } else if (typeof m.sharesOutstanding === 'number' && m.sharesOutstanding > 0) {
                sharesOutstanding = round(m.sharesOutstanding, 3);
            } else if (Array.isArray(s.sharesOutstanding) && s.sharesOutstanding.length > 0) {
                sharesOutstanding = round(s.sharesOutstanding[0].v, 3);
            }

            // 2. REVENUE TTM
            if (typeof m.revenueTTM === 'number' && m.revenueTTM > 0) {
                revenueTTM = round(m.revenueTTM, 2);
            } else {
                // Fallback A: Sum series
                const sumRev = sumLast4(s.revenue);
                if (sumRev !== null) {
                    revenueTTM = sumRev;
                } else if (typeof m.revenuePerShareTTM === 'number' && sharesOutstanding !== null) {
                    // Fallback B: Derived (risky but better than nothing)
                    revenueTTM = round(m.revenuePerShareTTM * sharesOutstanding, 2);
                }
            }

            // 3. NET INCOME TTM
            if (typeof m.netIncomeTTM === 'number') {
                netIncomeTTM = round(m.netIncomeTTM, 2);
            } else {
                const sumNI = sumLast4(s.netIncome) || sumLast4(s.netProfitAfterTaxes);
                if (sumNI !== null) {
                    netIncomeTTM = sumNI;
                } else if (typeof m.epsTTM === 'number' && sharesOutstanding !== null) {
                    netIncomeTTM = round(m.epsTTM * sharesOutstanding, 2);
                }
            }

            // 4. FREE CASH FLOW TTM
            if (typeof m.freeCashFlowTTM === 'number') {
                freeCashFlowTTM = round(m.freeCashFlowTTM, 2);
            } else {
                // Try manual FCF calculation from series: (Operating CF - Capex)
                const opCF = sumLast4(s.operatingCashFlow) || sumLast4(s.cashFlowFromOperatingActivities);
                const capex = sumLast4(s.capex) || sumLast4(s.capitalExpenditure) || 0;
                
                if (opCF !== null) {
                    freeCashFlowTTM = round(opCF - Math.abs(capex), 2);
                } else {
                    // Fallback B: Derived from per-share
                    const cfps = m.freeCashFlowPerShareTTM ?? m.cashFlowPerShareTTM;
                    if (typeof cfps === 'number' && sharesOutstanding !== null) {
                        freeCashFlowTTM = round(cfps * sharesOutstanding, 2);
                    }
                }
            }

        } catch (error) {
            console.error('[Finnhub] Failed to parse metric JSON:', error);
        }
    }

    console.log('[Finnhub] final fundamentals:', { price, revenueTTM, freeCashFlowTTM, netIncomeTTM, sharesOutstanding });
    return { price, revenueTTM, freeCashFlowTTM, netIncomeTTM, sharesOutstanding };
}