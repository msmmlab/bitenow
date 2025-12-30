-- Add activation_phone column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS activation_phone TEXT;
