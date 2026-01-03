-- SQL script to add rating and internationalPhoneNumber columns to the restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS rating NUMERIC,
ADD COLUMN IF NOT EXISTS "internationalPhoneNumber" TEXT;
