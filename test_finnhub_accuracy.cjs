require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function test() {
    const symbol = 'T';
    const encoded = encodeURIComponent(symbol);
    const response = await fetch(`${BASE_URL}/quote?symbol=${encoded}&token=${API_KEY}`);

    if (response.ok) {
        try {
            const d = await response.json();
            const price = (typeof d.c === 'number' && d.c > 0) ? d.c : null;
            console.log('\n--- Results ---');
            console.log('price:', price);
        } catch (error) {
            console.error('[Finnhub] Failed to parse price JSON:', error);
        }
    } else {
        console.error('Finnhub quote failed:', response.status);
    }
}

test().catch(console.error);