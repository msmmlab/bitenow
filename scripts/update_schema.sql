-- Run this in your Supabase SQL Editor to support the new geocoding metadata

ALTER TABLE restaurants 
ADD COLUMN coords_source TEXT,
ADD COLUMN coords_accuracy TEXT;
