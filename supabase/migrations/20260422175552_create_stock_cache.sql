-- Create the stock_cache table to store Yahoo Finance data
CREATE TABLE IF NOT EXISTS public.stock_cache (
    symbol TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Optional but recommended)
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (assuming this is a public cache)
-- Adjust these policies if you want stricter control
CREATE POLICY "Allow public read access" ON public.stock_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update" ON public.stock_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.stock_cache
    FOR UPDATE USING (true);
