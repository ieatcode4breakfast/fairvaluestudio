/**
 * openrouter.ts
 * Independent module to fetch TTM financial data using AI.
 */

import { supabase } from '../lib/supabase';

export interface TTMData {
    ticker: string;
    companyName: string;
    revenue: number;
    freeCashFlow: number;
    netIncome: number;
    sharesOutstanding: number;
    freeCashFlowPerShare: number;
    earningsPerShare: number;
    currency: string;
    asOfDate: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/**
 * Fetches TTM financial data for a specific stock including per-share metrics.
 * Uses the current date in the prompt to ensure AI grounding is up-to-date.
 * @param ticker - The stock symbol (e.g., "AAPL")
 * @param companyName - The full name of the company (e.g., "Apple Inc.")
 * @param exchange - Optional exchange name (e.g., "NASDAQ")
 * @param userId - Optional ID of the user performing the search
 */
export async function fetchTTMData(ticker: string, companyName: string, exchange?: string, userId?: string): Promise<TTMData> {
    if (!API_KEY) {
        throw new Error('VITE_OPENROUTER_API_KEY is not defined in .env.local');
    }

    const uppercaseTicker = ticker.toUpperCase();
    const currentDate = new Date().toISOString().split('T')[0];

    // ── 1. Cache Check (Server-Side Filtered via View) ─────────────────────
    try {
        const { data: cached, error: cacheError } = await supabase
            .from('ai_search_cache_fresh')
            .select('*')
            .eq('ticker', uppercaseTicker)
            .single();

        if (cached && !cacheError) {
            console.log(`[OpenRouter] Cache HIT (Server-Side Verified) for ${uppercaseTicker}`);
            
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
                freeCashFlow: Number(cached.free_cash_flow),
                netIncome: Number(cached.net_income),
                sharesOutstanding: Number(cached.shares_outstanding),
                freeCashFlowPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.free_cash_flow) / Number(cached.shares_outstanding) : 0,
                earningsPerShare: Number(cached.shares_outstanding) > 0 ? Number(cached.net_income) / Number(cached.shares_outstanding) : 0,
                currency: cached.currency || 'USD',
                asOfDate: cached.last_updated.split('T')[0],
            };
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

    You must find and return exactly these 4 metrics in a flat JSON format with these exact keys:
    - "revenue": Net revenue (TTM)
    - "freeCashFlow": Operating Cash Flow minus CAPEX (TTM)
    - "netIncome": GAAP Net Income (TTM)
    - "sharesOutstanding": Total Diluted Shares Outstanding (Latest available)
    - "currency": The reported currency (e.g., "USD")

    Constraints:
    - If a direct TTM figure is not stated, manually sum the last 4 reported quarters (10-Q).
    - All numeric values must be raw numbers (no "B" or "M" suffixes).
    - IMPORTANT: DOUBLE-CHECK YOUR SCALE. Ensure billions are returned as billions (e.g., $5.2B should be 5200000000, NOT 52000000).
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
                        content: 'You are a professional financial data extractor. Your goal is to provide 100% accurate, grounded financial data for valuation models. You ALWAYS return a single JSON object. If a metric is missing from the first source, you MUST keep searching through filings, earnings call transcripts, or investor relations pages until you find it or can calculate it from quarterly data.' 
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
        
        // Clean up markdown code blocks if present
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            content = content.split('```')[1].split('```')[0];
        }
        
        const parsedData = JSON.parse(content.trim());

        const revenue = Number(parsedData.revenue);
        const freeCashFlow = Number(parsedData.freeCashFlow);
        const netIncome = Number(parsedData.netIncome);
        const shares = Number(parsedData.sharesOutstanding);

        const result: TTMData = {
            ticker: uppercaseTicker,
            companyName,
            revenue,
            freeCashFlow,
            netIncome,
            sharesOutstanding: shares,
            freeCashFlowPerShare: shares > 0 ? freeCashFlow / shares : 0,
            earningsPerShare: shares > 0 ? netIncome / shares : 0,
            currency: parsedData.currency || 'USD',
            asOfDate: currentDate,
        };

        // ── 3. Post-Fetch: Log Usage and Update Cache ────────────────────────
        
        // Log successful usage asynchronously
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

        // Update global cache asynchronously (to the main table)
        supabase.from('ai_search_cache').upsert({
            ticker: uppercaseTicker,
            company_name: companyName,
            revenue,
            free_cash_flow: freeCashFlow,
            net_income: netIncome,
            shares_outstanding: shares,
            currency: parsedData.currency || 'USD',
            last_updated: new Date().toISOString()
        }).then(({ error }) => {
            if (error) console.error('[OpenRouter] Failed to update global cache:', error);
        });

        return result;
    } catch (error) {
        console.error('Error fetching TTM data via AI:', error);
        throw error;
    }
}
