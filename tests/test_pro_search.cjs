require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testModel(modelId) {
    console.log(`Testing model: ${modelId}`);
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: 'system', content: 'You are a financial analyst. Search the web for the latest TTM financial data. Return a JSON object with revenue, freeCashFlow, netIncome, and sharesOutstanding. Be persistent. If you find quarterly data, sum it up to estimate TTM.' },
                    { role: 'user', content: 'Get latest TTM data for Apple (AAPL).' }
                ],
                temperature: 0.1,
            }),
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await testModel('perplexity/sonar-pro-search');
}
// Forcing TSLA test
async function testTsla() {
    console.log('\n--- Testing TSLA with Pro Search ---');
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar-pro-search',
                messages: [
                    { role: 'system', content: 'You are a financial analyst. Search the web for the latest TTM financial data. Return a JSON object with revenue, freeCashFlow, netIncome, and sharesOutstanding. Be persistent. If you find quarterly data, sum it up to estimate TTM.' },
                    { role: 'user', content: 'Get latest TTM data for Tesla (TSLA).' }
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
testTsla();
