-- Add recommendation fields to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS formality_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS walk_in_friendliness TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS service_speed TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS price_risk TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS best_times TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS known_for_bullets TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS booking_likely BOOLEAN DEFAULT false;
