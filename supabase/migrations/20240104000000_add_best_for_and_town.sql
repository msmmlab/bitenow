-- Add best_for and town columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS best_for TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS town TEXT;

-- Update existing restaurants to have their town set if they don't (optional but good for data integrity)
-- This logic will be handled better by the new seeding script, but adding the column is the priority.
