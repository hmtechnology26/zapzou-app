ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS import_source TEXT;

CREATE INDEX IF NOT EXISTS idx_services_import_source
ON public.services(import_source)
WHERE import_source IS NOT NULL;
