/**
 * openrouter.ts
 * Independent module to fetch TTM financial data using AI.
 */

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
 */
export async function fetchTTMData(ticker: string, companyName: string): Promise<TTMData> {
    if (!API_KEY) {
        throw new Error('VITE_OPENROUTER_API_KEY is not defined in .env.local');
    }

    // Get the current date first to include it in the prompt
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `
    Today's date is ${currentDate}.
    
    PERFORM AN EXHAUSTIVE DEEP SEARCH for the most recent Trailing Twelve Months (TTM) financial data for:
    Company Name: ${companyName}
    Ticker: ${ticker}

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

        return {
            ticker: ticker.toUpperCase(),
            companyName,
            revenue,
            freeCashFlow,
            netIncome,
            sharesOutstanding: shares,
            freeCashFlowPerShare: shares > 0 ? freeCashFlow / shares : 0,
            earningsPerShare: shares > 0 ? netIncome / shares : 0,
            currency: parsedData.currency || 'USD',
            asOfDate: currentDate, // Use the same date generated at the start
        };
    } catch (error) {
        console.error('Error fetching TTM data via AI:', error);
        throw error;
    }
}
