/**
 * Financial Modeling Prep (FMP) API utilities.
 */

const API_KEY = import.meta.env.VITE_FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/api/v3'; 
// Note: Stable endpoints often use 'stable' in the path, but standard is v3 or v4.
// Based on the user's reference: https://financialmodelingprep.com/stable/...

export interface FmpTTMData {
    revenue: number;
    netIncome: number;
    ebitda: number;
    operatingIncome: number;
    operatingCashFlow: number;
    capitalExpenditure: number;
    freeCashFlow: number;
    sharesOutstanding: number;
    reportingPeriod: { year: number; quarter: string } | null;
}

/**
 * Fetch Trailing Twelve Months (TTM) financials from FMP.
 */
export async function getFmpTTM(symbol: string): Promise<FmpTTMData | null> {
    try {
        const url = (endpoint: string) => `https://financialmodelingprep.com/stable/${endpoint}?symbol=${symbol}&apikey=${API_KEY}`;

        const [incomeRes, cashFlowRes] = await Promise.all([
            fetch(url('income-statement-ttm')).then(r => r.ok ? r.json() : null),
            fetch(url('cash-flow-statement-ttm')).then(r => r.ok ? r.json() : null)
        ]);

        if (!incomeRes || !incomeRes[0] || !cashFlowRes || !cashFlowRes[0]) {
            console.error(`[FMP] Incomplete TTM data for ${symbol}`);
            return null;
        }

        const inc = incomeRes[0];
        const cf = cashFlowRes[0];

        return {
            revenue: inc.revenue || 0,
            netIncome: inc.netIncome || 0,
            ebitda: inc.ebitda || 0,
            operatingIncome: inc.operatingIncome || 0,
            operatingCashFlow: cf.operatingCashFlow || cf.netCashProvidedByOperatingActivities || 0,
            capitalExpenditure: Math.abs(cf.capitalExpenditure || cf.investmentsInPropertyPlantAndEquipment || 0),
            freeCashFlow: cf.freeCashFlow || 0,
            sharesOutstanding: inc.weightedAverageShsOutDil || inc.weightedAverageShsOut || 0,
            reportingPeriod: {
                year: parseInt(inc.fiscalYear),
                quarter: inc.period
            }
        };
    } catch (error) {
        console.error(`[FMP] Failed to fetch TTM data for ${symbol}:`, error);
        return null;
    }
}
