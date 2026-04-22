/**
 * openrouter.ts
 * Independent module to fetch TTM financial data using AI.
 */

import { supabase } from '../lib/supabase';

export interface TTMData {
    ticker: string;
    companyName: string;
    revenue: number;
    ebitda: number;
    ebitdaPerShare: number;
    freeCashFlow: number;
    freeCashFlowPerShare: number;
    operatingCashFlow: number;
    operatingCashFlowPerShare: number;
    netIncome: number;
    earningsPerShare: number;
    bookValue: number;
    bookValuePerShare: number;
    sharesOutstanding: number;
    currency: string;
    asOfDate: string;
    fiscalYear: number;
    fiscalQuarter: number;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/**
 * Fetches the number of AI search requests made by a user today (UTC)
 * AND their daily search limit from the database.
 */
export async function getAIUsageStatus(userId: string): Promise<{ count: number, limit: number }> {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch usage count
    const { count, error: usageError } = await supabase
        .from('ai_search_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`);

    if (usageError) {
        console.error('[OpenRouter] Error checking usage:', usageError);
    }

    // 2. Fetch user's limit
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('ai_search_limit')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error('[OpenRouter] Error fetching user limit:', userError);
    }

    return { 
        count: count || 0, 
        limit: userData?.ai_search_limit ?? 5 // Default to 5 if not set or error
    };
}

/**
 * Helper to parse AI-returned values with suffixes like "M" (Millions).
 * Example: "716900.00M" -> 716900000000
 */
function parseAISuffixValue(val: string | number | undefined | null): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    
    const cleanVal = val.toString().trim().toUpperCase();
    if (cleanVal.endsWith('M')) {
        return parseFloat(cleanVal.replace('M', '')) * 1000000;
    }
    if (cleanVal.endsWith('B')) {
        return parseFloat(cleanVal.replace('B', '')) * 1000000000;
    }
    return parseFloat(cleanVal) || 0;
}

/**
 * Fetches TTM financial data for a specific stock including per-share metrics.
 * @param ticker - The stock symbol (e.g., "AAPL")
 * @param companyName - The full name of the company (e.g., "Apple Inc.")
 * @param exchange - Optional exchange name (e.g., "NASDAQ")
 * @param userId - Optional ID of the user performing the search
 * @param targetPeriod - The most recent reporting period found on Finnhub
 */
export async function fetchTTMData(
    ticker: string, 
    companyName: string, 
    exchange?: string, 
    userId?: string,
    targetPeriod?: { year: number, quarter: number } | null
): Promise<TTMData> {
    if (!API_KEY) {
        throw new Error('VITE_OPENROUTER_API_KEY is not defined in .env.local');
    }

    const uppercaseTicker = ticker.toUpperCase();

    // ── 0. Get Server-Side Date (Global Truth) ─────────────────────────────
    let serverDate = new Date(); // Fallback
    try {
        const { data: timeData, error: timeError } = await supabase.rpc('get_server_time');
        if (timeData && !timeError) {
            serverDate = new Date(timeData);
            console.log(`[OpenRouter] Server Time synchronized: ${serverDate.toISOString()}`);
        }
    } catch (err) {
        console.warn('[OpenRouter] Failed to fetch server time, falling back to local clock.');
    }
    
    const currentDate = serverDate.toISOString().split('T')[0];

    // ── 0. Usage Limit Check ────────────────────────────────────────────────
    if (userId) {
        const { count, limit } = await getAIUsageStatus(userId);
        if (count >= limit) {
            throw new Error(`Daily AI search limit reached (${limit}/${limit}). Please try again tomorrow.`);
        }
    }

    // ── 1. Cache Check (Data-Driven) ────────────────────────────────────────
    try {
        const { data: cached, error: cacheError } = await supabase
            .from('ai_search_cache')
            .select('*')
            .eq('ticker', uppercaseTicker)
            .eq('company_name', companyName)
            .maybeSingle();

        if (cached && !cacheError && targetPeriod) {
            // Check if our cache is up-to-date with Finnhub's reported period
            const cacheFiscalYear = Number(cached.fiscal_year);
            const cacheFiscalQuarter = Number(cached.fiscal_quarter);
            
            const isUpToDate = cacheFiscalYear > targetPeriod.year || 
                              (cacheFiscalYear === targetPeriod.year && cacheFiscalQuarter >= targetPeriod.quarter);

            if (isUpToDate) {
                console.log(`[OpenRouter] Cache HIT (${cacheFiscalYear} Q${cacheFiscalQuarter}) for ${uppercaseTicker}`);
                
                // Log the search even if it was a cache hit (for usage tracking)
                if (userId) {
                    supabase.from('ai_search_logs').insert({
                        user_id: userId,
                        ticker: uppercaseTicker,
                        company_name: cached.company_name,
                        model_id: 'database-cache',
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                        response_json: cached,
                        status: 'success'
                    }).then(({ error }) => {
                        if (error) console.error('[OpenRouter] Failed to log cache hit:', error);
                    });
                }

                return {
                    ticker: uppercaseTicker,
                    companyName: cached.company_name,
                    revenue: Number(cached.revenue),
                    ebitda: Number(cached.ebitda || 0),
                    ebitdaPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.ebitda || 0) / Number(cached.shares_outstanding) : 0,
                    freeCashFlow: Number(cached.free_cash_flow),
                    freeCashFlowPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.free_cash_flow) / Number(cached.shares_outstanding) : 0,
                    operatingCashFlow: Number(cached.operating_cash_flow || 0),
                    operatingCashFlowPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.operating_cash_flow || 0) / Number(cached.shares_outstanding) : 0,
                    netIncome: Number(cached.net_income),
                    earningsPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.net_income) / Number(cached.shares_outstanding) : 0,
                    bookValue: Number(cached.book_value || 0),
                    bookValuePerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.book_value || 0) / Number(cached.shares_outstanding) : 0,
                    sharesOutstanding: Number(cached.shares_outstanding),
                    currency: cached.currency || 'USD',
                    asOfDate: cached.last_updated.split('T')[0],
                    fiscalYear: cacheFiscalYear,
                    fiscalQuarter: cacheFiscalQuarter,
                };
            } else {
                console.log(`[OpenRouter] Cache STALE (${cacheFiscalYear} Q${cacheFiscalQuarter} < Finnhub ${targetPeriod.year} Q${targetPeriod.quarter}) for ${uppercaseTicker}`);
            }
        } else if (cached && !cacheError && !targetPeriod) {
            console.log(`[OpenRouter] Finnhub reporting period missing. Forcing fresh AI fetch for ${uppercaseTicker}.`);
        }
    } catch (err) {
        console.warn('[OpenRouter] Cache check failed, proceeding with fresh fetch:', err);
    }

    // ── 2. AI Fetch (Cache Miss/Stale) ───────────────────────────────────────
    console.log(`[OpenRouter] Fetching TTM data for ${companyName} (${uppercaseTicker})${exchange ? ` on ${exchange}` : ''}...`);

    const context = exchange ? `${companyName} (${uppercaseTicker}) listed on the ${exchange}` : `${companyName} (${uppercaseTicker})`;

    const prompt = `
    Today's date is ${currentDate}.
    
    PERFORM AN EXHAUSTIVE DEEP SEARCH for the most recent Trailing Twelve Months (TTM) financial data for:
    ${context}

    Return EXACTLY these metrics in a flat JSON format:
    - "revenue": Net revenue (TTM)
    - "ebitda": EBITDA (TTM). If not explicitly stated, use (Operating Income + Depreciation & Amortization).
    - "freeCashFlow": Operating Cash Flow minus CAPEX (TTM)
    - "operatingCashFlow": Net Cash Provided by Operating Activities (TTM)
    - "netIncome": GAAP Net Income attributable to shareholders (TTM)
    - "bookValue": Total Shareholders' Equity / Total Equity (Latest available on balance sheet)
    - "sharesOutstanding": Total Diluted Shares Outstanding (Latest available)
    - "currency": The reported currency (e.g., "USD")
    - "fiscalYear": The fiscal year this data belongs to (e.g., 2024). Use the company's specific fiscal calendar.
    - "fiscalQuarter": The fiscal quarter the TTM period ends on (1, 2, 3, or 4).

    Constraints:
    - If a direct TTM figure is not stated, manually sum the last 4 reported quarters (10-Q).
    - Ensure billions are returned as raw billions (e.g., 5200000000).
    - Return ONLY the JSON object. No prose.
  `;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FairValue Studio',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar-pro-search',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a professional financial data extractor. Use the most recent company filings. Return the Fiscal Year and Quarter accurately based on the company\'s specific reporting calendar.' 
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from OpenRouter');
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            content = content.split('```')[1].split('```')[0];
        }
        
        const parsedData = JSON.parse(content.trim());

        const revenue = parseAISuffixValue(parsedData.revenue);
        const ebitda = parseAISuffixValue(parsedData.ebitda);
        const freeCashFlow = parseAISuffixValue(parsedData.freeCashFlow);
        const operatingCashFlow = parseAISuffixValue(parsedData.operatingCashFlow);
        const netIncome = parseAISuffixValue(parsedData.netIncome);
        const bookValue = parseAISuffixValue(parsedData.bookValue);
        const shares = parseAISuffixValue(parsedData.sharesOutstanding);
        const fiscalYear = Number(parsedData.fiscalYear);
        const fiscalQuarter = Number(parsedData.fiscalQuarter);

        const result: TTMData = {
            ticker: uppercaseTicker,
            companyName,
            revenue,
            ebitda,
            ebitdaPerShare: shares > 0 ? ebitda / shares : 0,
            freeCashFlow,
            freeCashFlowPerShare: shares > 0 ? freeCashFlow / shares : 0,
            operatingCashFlow,
            operatingCashFlowPerShare: shares > 0 ? operatingCashFlow / shares : 0,
            netIncome,
            earningsPerShare: shares > 0 ? netIncome / shares : 0,
            bookValue,
            bookValuePerShare: shares > 0 ? bookValue / shares : 0,
            sharesOutstanding: shares,
            currency: parsedData.currency || 'USD',
            asOfDate: currentDate,
            fiscalYear,
            fiscalQuarter,
        };

        // ── 3. Post-Fetch: Log Usage and Update Cache ────────────────────────
        
        if (userId) {
            const usageData = data.usage || {};
            supabase.from('ai_search_logs').insert({
                user_id: userId,
                ticker: uppercaseTicker,
                company_name: companyName,
                model_id: data.model || 'perplexity/sonar-pro-search',
                prompt_tokens: usageData.prompt_tokens || 0,
                completion_tokens: usageData.completion_tokens || 0,
                total_tokens: usageData.total_tokens || 0,
                response_json: parsedData,
                status: 'success'
            }).then(({ error }) => {
                if (error) console.error('[OpenRouter] Failed to log usage:', error);
            });
        }

        supabase.from('ai_search_cache').upsert({
            ticker: uppercaseTicker,
            company_name: companyName,
            revenue,
            ebitda,
            free_cash_flow: freeCashFlow,
            operating_cash_flow: operatingCashFlow,
            net_income: netIncome,
            book_value: bookValue,
            shares_outstanding: shares,
            currency: parsedData.currency || 'USD',
            fiscal_year: fiscalYear,
            fiscal_quarter: fiscalQuarter,
            last_updated: serverDate.toISOString()
        }, { onConflict: 'ticker,company_name' }).then(({ error }) => {
            if (error) console.error('[OpenRouter] Failed to update global cache:', error);
        });

        return result;
    } catch (error) {
        console.error('Error fetching TTM data via AI:', error);
        throw error;
    }
}
