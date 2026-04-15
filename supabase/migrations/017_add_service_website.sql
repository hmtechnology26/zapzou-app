ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS website_url TEXT;
