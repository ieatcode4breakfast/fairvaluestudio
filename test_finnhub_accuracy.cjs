require('dotenv').config({ path: '.env.local' });
const API_KEY = process.env.VITE_FINHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

async function test() {
    const symbol = 'T';
    const encoded = encodeURIComponent(symbol);
    const [priceRes, metricsRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/quote?symbol=${encoded}&token=${API_KEY}`),
        fetch(`${BASE_URL}/stock/metric?symbol=${encoded}&metric=all&preliminary=true&token=${API_KEY}`),
    ]);

    let price = null;
    let revenueTTM = null;
    let freeCashFlowTTM = null;
    let netIncomeTTM = null;
    let sharesOutstanding = null;

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
        try {
            const d = await priceRes.value.json();
            if (typeof d.c === 'number' && d.c > 0) price = d.c;
        } catch (error) {
            console.error('[Finnhub] Failed to parse price JSON:', error);
        }
    }

    if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        try {
            const d = await metricsRes.value.json();
            const m = d.metric ?? {};
            const s = d.series?.quarterly ?? {};

            console.log('Enterprise Value:', m.enterpriseValue);
            console.log('evRevenueTTM:', m.evRevenueTTM);
            console.log('marketCapitalization:', m.marketCapitalization);
            console.log('revenuePerShareTTM:', m.revenuePerShareTTM);
            console.log('netProfitMarginTTM:', m.netProfitMarginTTM);

            // Helper to round
            const round = (num, decimals = 2) => {
                const factor = 10 ** decimals;
                return Math.round(num * factor) / factor;
            };

            // Helper to sum last 4 quarters
            const sumLast4 = (seriesArray) => {
                if (!Array.isArray(seriesArray) || seriesArray.length < 1) return null;
                const last4 = seriesArray.slice(0, 4);
                const sum = last4.reduce((acc, curr) => acc + (curr.v || 0), 0);
                return round(sum, 2);
            };

            // 1. SHARES OUTSTANDING
            if (typeof m.shareOutstanding === 'number' && m.shareOutstanding > 0) {
                sharesOutstanding = round(m.shareOutstanding, 3);
            } else if (typeof m.sharesOutstanding === 'number' && m.sharesOutstanding > 0) {
                sharesOutstanding = round(m.sharesOutstanding, 3);
            } else if (Array.isArray(s.sharesOutstanding) && s.sharesOutstanding.length > 0) {
                sharesOutstanding = round(s.sharesOutstanding[0].v, 3);
            } else {
                const mCap = m.marketCapitalization ?? m.marketCap;
                if (typeof mCap === 'number' && mCap > 0 && price !== null && price > 0) {
                    sharesOutstanding = round(mCap / price, 3);
                }
            }

            // 2. REVENUE TTM (new logic)
            if (typeof m.enterpriseValue === 'number' && typeof m.evRevenueTTM === 'number' && m.evRevenueTTM > 0) {
                revenueTTM = round(m.enterpriseValue / m.evRevenueTTM, 2);
                console.log('Revenue TTM via enterpriseValue / evRevenueTTM:', revenueTTM);
            } else if (typeof m.revenueTTM === 'number' && m.revenueTTM > 0) {
                revenueTTM = round(m.revenueTTM, 2);
                console.log('Revenue TTM direct:', revenueTTM);
            } else {
                const sumRev = sumLast4(s.revenue);
                if (sumRev !== null) {
                    revenueTTM = sumRev;
                    console.log('Revenue TTM via sum series:', revenueTTM);
                } else if (typeof m.revenuePerShareTTM === 'number' && sharesOutstanding !== null) {
                    revenueTTM = round(m.revenuePerShareTTM * sharesOutstanding, 2);
                    console.log('Revenue TTM via per-share:', revenueTTM);
                }
            }

            // 3. NET INCOME TTM
            if (typeof m.netIncomeTTM === 'number') {
                netIncomeTTM = round(m.netIncomeTTM, 2);
                console.log('Net Income TTM direct:', netIncomeTTM);
            } else {
                const sumNI = sumLast4(s.netIncome) || sumLast4(s.netProfitAfterTaxes);
                if (sumNI !== null) {
                    netIncomeTTM = sumNI;
                    console.log('Net Income TTM via sum series:', netIncomeTTM);
                } else if (typeof m.epsTTM === 'number' && sharesOutstanding !== null) {
                    netIncomeTTM = round(m.epsTTM * sharesOutstanding, 2);
                    console.log('Net Income TTM via eps:', netIncomeTTM);
                } else if (typeof m.netProfitMarginTTM === 'number' && revenueTTM !== null) {
                    netIncomeTTM = round(revenueTTM * m.netProfitMarginTTM / 100, 2);
                    console.log('Net Income TTM via margin:', netIncomeTTM);
                }
            }

            // 4. FREE CASH FLOW TTM
            if (typeof m.freeCashFlowTTM === 'number') {
                freeCashFlowTTM = round(m.freeCashFlowTTM, 2);
            } else {
                const opCF = sumLast4(s.operatingCashFlow) || sumLast4(s.cashFlowFromOperatingActivities);
                const capex = sumLast4(s.capex) || sumLast4(s.capitalExpenditure) || 0;
                if (opCF !== null) {
                    freeCashFlowTTM = round(opCF - Math.abs(capex), 2);
                } else {
                    const cfps = m.freeCashFlowPerShareTTM ?? m.cashFlowPerShareTTM;
                    if (typeof cfps === 'number' && sharesOutstanding !== null) {
                        freeCashFlowTTM = round(cfps * sharesOutstanding, 2);
                    }
                }
            }

            console.log('\n--- Results ---');
            console.log('price:', price);
            console.log('sharesOutstanding:', sharesOutstanding);
            console.log('revenueTTM:', revenueTTM);
            console.log('netIncomeTTM:', netIncomeTTM);
            console.log('freeCashFlowTTM:', freeCashFlowTTM);

            // Actual values from user
            console.log('\nActual revenue: 125,650 (million)');
            console.log('Actual shares: 7,180 (million)');
            console.log('Difference revenue:', revenueTTM ? (revenueTTM - 125650).toFixed(2) : 'N/A');
            console.log('Difference shares:', sharesOutstanding ? (sharesOutstanding - 7180).toFixed(2) : 'N/A');

        } catch (error) {
            console.error('[Finnhub] Failed to parse metric JSON:', error);
        }
    }
}

test().catch(console.error);