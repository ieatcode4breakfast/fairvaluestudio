/**
 * OpenRouter API utility for fetching fundamentals using AI with web search.
 */

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1';

export interface AIFundamentals {
    revenueTTM: number | null;
    netIncomeTTM: number | null;
    freeCashFlowTTM: number | null;
    sharesOutstanding: number | null;
    source?: string;
}

/**
 * Fetch latest TTM financials using an AI model with web search grounding.
 * This is used to bypass the lag in traditional data providers.
 */
export async function getAIFundamentals(symbol: string): Promise<AIFundamentals | null> {
    if (!API_KEY) {
        console.warn('[OpenRouter] No API key found, skipping AI fetch.');
        return null;
    }

    const currentDate = new Date().toLocaleString();
    const prompt = `
Today is ${currentDate}. 

CRITICAL: Fetch the ABSOLUTE LATEST Trailing Twelve Month (TTM) financial data for "${symbol}". 

INSTRUCTIONS:
1. You MUST find data that includes the most recent fiscal period available as of ${currentDate}. (Check Yahoo Finance, Google Finance, and recent press releases).
2. If you find a discrepancy (e.g. $423B vs $435B for AAPL), ALWAYS prioritize the HIGHER, more recent figure as it indicates the latest quarter has been included in the TTM calculation.
3. I need exactly these 4 figures in MILLIONS of USD (integers):
   - "revenueTTM": Latest TTM Revenue.
   - "netIncomeTTM": Latest TTM Net Income.
   - "freeCashFlowTTM": Latest TTM Free Cash Flow.
   - "sharesOutstanding": Current Shares Outstanding (in millions).

Return ONLY a valid JSON object with these keys: "revenueTTM", "netIncomeTTM", "freeCashFlowTTM", "sharesOutstanding". 
NO MARKDOWN, NO EXPLANATION. Just the JSON.
`;

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://fairvalue.studio', // Optional, for OpenRouter tracking
                'X-Title': 'FairValue Studio',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar',
                messages: [
                    { role: 'user', content: prompt }
                ],
                // Perplexity models on OpenRouter are search-native; no tools array needed
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API failed: ${response.status} - ${err}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) return null;

        // Parse JSON safely
        const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());
        
        console.log(`[OpenRouter] AI fundamentals for ${symbol}:`, parsed);

        return {
            revenueTTM: typeof parsed.revenueTTM === 'number' ? parsed.revenueTTM : null,
            netIncomeTTM: typeof parsed.netIncomeTTM === 'number' ? parsed.netIncomeTTM : null,
            freeCashFlowTTM: typeof parsed.freeCashFlowTTM === 'number' ? parsed.freeCashFlowTTM : null,
            sharesOutstanding: typeof parsed.sharesOutstanding === 'number' ? parsed.sharesOutstanding : null,
        };
    } catch (error) {
        console.error('[OpenRouter] Failed to fetch fundamentals:', error);
        return null;
    }
}
