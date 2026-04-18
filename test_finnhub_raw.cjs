require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function test() {
    const symbol = 'T';
    const encoded = encodeURIComponent(symbol);
    const response = await fetch(`${BASE_URL}/quote?symbol=${encoded}&token=${API_KEY}`);
    if (!response.ok) {
        console.error('Failed to fetch quote:', response.status);
        return;
    }
    const data = await response.json();
    console.log('Raw quote data for', symbol);
    console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);