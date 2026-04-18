require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function fetchTTMData(ticker, companyName) {
    if (!API_KEY) {
        throw new Error('VITE_OPENROUTER_API_KEY is not defined in .env.local');
    }

    const prompt = `
    Fetch the most recent Trailing Twelve Months (TTM) financial data for:
    Company Name: ${companyName}
    Ticker: ${ticker}

    Return exactly these four metrics in a flat JSON format with these exact keys:
    - "revenue" (TTM)
    - "freeCashFlow" (TTM)
    - "netIncome" (TTM)
    - "sharesOutstanding" (Current)
    - "currency" (e.g., "USD")

    Constraints:
    - Ground your response in the latest available public financial filings.
    - All numeric values must be raw numbers (no "B" or "M" suffixes).
    - Include a "currency" field (e.g., "USD").
    - Return ONLY the JSON object. No prose.
  `;

    console.log(`Sending request for ${companyName} (${ticker}) using model perplexity/sonar...`);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'FairValue Studio Test',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar',
                messages: [
                    { role: 'system', content: 'You are a financial data extractor. You must ALWAYS return a single, valid JSON object with no prose. If data is missing, provide your best grounded estimate based on the latest filings.' },
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
        console.log('Raw output from AI:', content);
        
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
        };
    } catch (error) {
        console.error('Error fetching TTM data via AI:', error);
        throw error;
    }
}

async function runTest() {
    try {
        const result = await fetchTTMData('META', 'Meta Platforms');
        console.log('\nFinal Results:');
        console.table(result);
    } catch (err) {
        console.error('Test failed:', err);
    }
}

runTest();
