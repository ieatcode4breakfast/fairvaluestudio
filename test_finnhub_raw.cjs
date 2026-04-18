require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function test() {
    const symbol = 'T';
    const encoded = encodeURIComponent(symbol);
    const response = await fetch(`${BASE_URL}/stock/metric?symbol=${encoded}&metric=all&preliminary=true&token=${API_KEY}`);
    if (!response.ok) {
        console.error('Failed to fetch metrics:', response.status);
        return;
    }
    const data = await response.json();
    console.log('Raw metric data for', symbol);
    console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);