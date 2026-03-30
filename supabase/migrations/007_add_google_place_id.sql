-- Add google_place_id column to environments table
-- Execute this in Supabase SQL Editor

ALTER TABLE public.environments 
ADD COLUMN IF NOT EXISTS google_place_id TEXT;

CREATE INDEX IF NOT EXISTS idx_environments_google_place_id 
ON public.environments(google_place_id);