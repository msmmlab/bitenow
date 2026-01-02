-- Run this in your Supabase SQL Editor to support Google Places integration and Opening Hours
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS opening_hours_json JSONB;

-- Refresh schema cache if needed (Supabase usually handles this, 
-- but sometimes an explicit reload of the UI or a query is needed)
