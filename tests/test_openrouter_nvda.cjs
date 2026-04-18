require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function fetchTTMData(ticker, companyName) {
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

    console.log(`Verifying NVDA with Perplexity Sonar Pro...`);

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'FairValue Studio Verification',
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

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        // Clean up markdown code blocks
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            content = content.split('```')[1].split('```')[0];
        }
        
        const parsedData = JSON.parse(content.trim());
        return parsedData;
    } catch (err) {
        console.error('Fetch failed:', err);
        throw err;
    }
}

fetchTTMData('NVDA', 'Nvidia Corporation')
    .then(res => {
        console.log('\nFinal Grounded Data for NVDA:');
        console.table(res);
    })
    .catch(console.error);
