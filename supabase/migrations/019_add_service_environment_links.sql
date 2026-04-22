-- Allow each service to be linked to multiple environments
CREATE TABLE IF NOT EXISTS public.service_environment_links (
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (service_id, environment_id)
);

CREATE INDEX IF NOT EXISTS idx_service_environment_links_environment
    ON public.service_environment_links(environment_id);

CREATE INDEX IF NOT EXISTS idx_service_environment_links_created_by
    ON public.service_environment_links(created_by);

ALTER TABLE public.service_environment_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_environment_links_select ON public.service_environment_links;
CREATE POLICY service_environment_links_select
ON public.service_environment_links
FOR SELECT
USING (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = service_environment_links.service_id
           AND s.provider_id = auth.uid()
    )
    OR public.is_user_moderator_of_environment(auth.uid(), service_environment_links.environment_id)
);

DROP POLICY IF EXISTS service_environment_links_insert ON public.service_environment_links;
CREATE POLICY service_environment_links_insert
ON public.service_environment_links
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = service_environment_links.service_id
           AND s.provider_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1
          FROM public.environment_members em
         WHERE em.user_id = auth.uid()
           AND em.environment_id = service_environment_links.environment_id
           AND em.status = 'active'
    )
);

DROP POLICY IF EXISTS service_environment_links_delete ON public.service_environment_links;
CREATE POLICY service_environment_links_delete
ON public.service_environment_links
FOR DELETE
USING (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = service_environment_links.service_id
           AND s.provider_id = auth.uid()
    )
    OR public.is_user_moderator_of_environment(auth.uid(), service_environment_links.environment_id)
);

GRANT SELECT, INSERT, DELETE
ON public.service_environment_links
TO authenticated;

-- Backfill current primary environment as initial link
INSERT INTO public.service_environment_links (service_id, environment_id, created_by)
SELECT s.id, s.environment_id, s.provider_id
  FROM public.services s
 WHERE s.environment_id IS NOT NULL
ON CONFLICT (service_id, environment_id) DO NOTHING;
