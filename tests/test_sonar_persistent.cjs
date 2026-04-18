require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testPrompt(promptPrefix) {
    console.log(`Testing with prompt prefix: ${promptPrefix}`);
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar',
                messages: [
                    { role: 'system', content: 'You are a financial data extractor. You must ALWAYS return a single, valid JSON object with no prose. If data is missing, perform multiple searches or check different financial reports (10-K, 10-Q). If TTM is not directly available, approximate it by summing the last 4 quarters.' },
                    { role: 'user', content: promptPrefix + ' for Alphabet (GOOGL).' }
                ],
                temperature: 0.1,
            }),
        });
        const data = await response.json();
        console.log(data.choices[0].message.content);
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await testPrompt('Get latest TTM data including Revenue, Free Cash Flow, Net Income, and Shares Outstanding. Use different queries if needed to find all 4 metrics.');
}
run();
