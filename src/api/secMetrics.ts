/**
 * Prerequisites:
 * Node.js v18+ (for native fetch support) or a modern browser environment.
 * Run with: npx ts-node sec_metrics.ts
 */

// CRITICAL: The SEC will block your request if this is not updated to your actual info.
// CRITICAL: The SEC will block your request if this is not updated to your actual info.
const USER_AGENT = "FairValueStudio/1.0 (https://fairvaluestudio.app; admin@fairvaluestudio.app)";

interface SecFactValue {
    start?: string;
    end: string;
    val: number;
    form: string;
    fp: string;
    fy: number;
}

interface SecFactConcept {
    units: {
        [key: string]: SecFactValue[];
    };
}

interface SecCompanyFacts {
    facts: {
        "us-gaap": {
            [concept: string]: SecFactConcept;
        };
    };
}

/**
 * Helper to fetch CIK from Ticker
 */
async function getCikForTicker(ticker: string): Promise<string> {
    const BASE_URL = typeof window !== 'undefined' ? '/sec-www' : 'https://www.sec.gov';
    const url = `${BASE_URL}/files/company_tickers.json`;
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

    if (!response.ok) throw new Error(`Failed to fetch tickers: ${response.status}`);

    const data: Record<string, { ticker: string; cik_str: number }> = await response.json();

    for (const key in data) {
        if (data[key].ticker === ticker.toUpperCase()) {
            return String(data[key].cik_str).padStart(10, "0");
        }
    }
    throw new Error(`Ticker ${ticker} not found.`);
}

/**
 * Helper to extract the most recent reported value based on the end date of the period
 * Now searches across ALL tags to find the absolute latest data point.
 */
function getLatestValue(facts: any, possibleTags: string[], unit: string = "USD"): SecFactValue | null {
    let allPoints: SecFactValue[] = [];

    for (const tag of possibleTags) {
        const concept = facts["us-gaap"][tag] || facts["dei"][tag];
        if (concept && concept.units && concept.units[unit]) {
            allPoints = allPoints.concat(concept.units[unit]);
        }
    }

    if (allPoints.length === 0) return null;

    // Sort all data points by the period end date descending
    allPoints.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

    return allPoints[0];
}

/**
 * Helper to calculate Trailing Twelve Months (TTM) value.
 * Logic: (Current Year-to-Date) + (Prior Full Year) - (Prior Year-to-Date for same period)
 */
function calculateTTM(facts: any, tags: string[], unit: string = "USD"): number {
    let allPoints: SecFactValue[] = [];
    for (const tag of tags) {
        const concept = facts["us-gaap"][tag] || facts["dei"][tag];
        if (concept && concept.units && concept.units[unit]) {
            allPoints = allPoints.concat(concept.units[unit]);
        }
    }

    if (allPoints.length === 0) return 0;

    // Sort by end date descending
    allPoints.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

    const latest = allPoints[0];
    
    // If the latest is already a full year (FY) or we have no timeframe data, return the value as is
    if (latest.fp === "FY") return latest.val;

    // Find the prior full year
    const priorFY = allPoints.find(p => p.fy === latest.fy - 1 && p.fp === "FY");
    
    // Find the prior year's same period (e.g., if latest is 2024 Q2, find 2023 Q2)
    const priorYTD = allPoints.find(p => p.fy === latest.fy - 1 && p.fp === latest.fp);

    if (priorFY && priorYTD) {
        return latest.val + priorFY.val - priorYTD.val;
    }

    // Fallback: Just return the latest value if we can't calculate TTM
    return latest.val;
}

/**
 * Main execution function - Returns structured financial data
 */
export async function getSecFinancials(ticker: string): Promise<any> {
    try {
        const cik = await getCikForTicker(ticker);
        const BASE_URL = typeof window !== 'undefined' ? '/sec-api' : 'https://data.sec.gov';
        const factsUrl = `${BASE_URL}/api/xbrl/companyfacts/CIK${cik}.json`;
        const response = await fetch(factsUrl, { headers: { "User-Agent": USER_AGENT } });
        if (!response.ok) throw new Error(`Failed to fetch facts: ${response.status}`);

        const data: SecCompanyFacts = await response.json();
        const facts = data.facts;

        const revenueTags = ["Revenues", "SalesRevenueNet", "RevenueFromContractWithCustomerExcludingAssessedTax"];
        const netIncomeTags = ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"];
        const ocfTags = ["NetCashProvidedByUsedInOperatingActivities"];
        const capExTags = ["PaymentsToAcquirePropertyPlantAndEquipment"];

        const revenue = calculateTTM(facts, revenueTags);
        const netIncome = calculateTTM(facts, netIncomeTags);
        const ocf = calculateTTM(facts, ocfTags);
        const capEx = calculateTTM(facts, capExTags);


        const refFact = getLatestValue(facts, revenueTags);
        const fiscalYear = refFact ? refFact.fy : 0;
        const fiscalQuarter = refFact ? refFact.fp : "N/A";

        const freeCashFlow = ocf - capEx;
        
        return {
            revenue,
            netIncome,
            operatingCashFlow: ocf,
            capitalExpenditure: capEx,
            freeCashFlow,
            reportingPeriod: { year: fiscalYear, quarter: fiscalQuarter }
        };
    } catch (error) {
        console.error("Error retrieving financial metrics:", error);
        return null;
    }
}

// CLI Runner for testing: npx ts-node src/api/secMetrics.ts <TICKER>
if (typeof process !== 'undefined' && (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('secMetrics.ts'))) {
    const ticker = process.argv[2] || 'AAPL';
    getSecFinancials(ticker).then(data => {
        if (data) {
            console.log(`--- TTM Metrics for ${ticker.toUpperCase()} ---`);
            console.log(JSON.stringify(data, null, 2));
        }
    });
}
