import "@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore: Deno URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define a shim for Deno to satisfy the IDE's TypeScript server
declare const Deno: any;

// SEC requires this. Replace with your info!
const SEC_USER_AGENT = "FairValueStudio dwayneletran17@gmail.com";

Deno.serve(async (req: Request) => {
  try {
    // 1. Connect to your own Supabase database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Get data from the SEC
    const response = await fetch("https://www.sec.gov/files/company_tickers_exchange.json", {
      headers: { "User-Agent": SEC_USER_AGENT }
    });
    
    const secData = await response.json();
    
    // 3. Transform data for Postgres
    const companies = secData.data.map((row: any[]) => ({
      cik: String(row[0]).padStart(10, '0'),
      name: row[1],
      ticker: row[2],
      exchange: row[3],
      updated_at: new Date().toISOString()
    }));

    // 4. Batch upload (Upsert) to your table
    // We do chunks of 1000 to avoid hitting memory limits
    const chunkSize = 1000;
    for (let i = 0; i < companies.length; i += chunkSize) {
      const chunk = companies.slice(i, i + chunkSize);
      const { error } = await supabase.from('sec_companies').upsert(chunk, { onConflict: 'cik' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ message: "Sync successful", count: companies.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("Sync Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { 
      headers: { "Content-Type": "application/json" },
      status: 500 
    })
  }
})
