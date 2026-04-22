import yf from 'https://esm.sh/yahoo-finance2?target=deno'

// Robust instantiation logic for Deno/esm.sh
let yahooFinance: any;
if (typeof yf === 'function') {
  yahooFinance = new (yf as any)();
} else if (yf && (yf as any).YahooFinance) {
  yahooFinance = new (yf as any).YahooFinance();
} else {
  yahooFinance = yf;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { symbol } = await req.json()
    
    if (!symbol) {
      throw new Error("Ticker symbol is required.")
    }

    console.log(`[get-ttm] Fetching summary for ${symbol}...`)

    // quoteSummary provides the deep financials
    const results = await yahooFinance.quoteSummary(symbol, {
      modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
    })

    // Return the RAW data for inspection
    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`[get-ttm] Error:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})