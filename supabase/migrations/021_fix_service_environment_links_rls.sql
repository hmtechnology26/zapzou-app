-- =====================================================
-- 21. CORRIGIR RLS DA SERVICE_ENVIRONMENT_LINKS
-- Permite que qualquer usuário (autenticado ou anônimo)
-- leia os links de serviço-ambiente para serviços
-- que o usuário já pode ver (status = active AND is_active)
-- =====================================================

BEGIN;

-- Drop existing restrictive policy
DROP POLICY IF EXISTS service_environment_links_select ON public.service_environment_links;

-- Create new permissive SELECT policy for public access
-- Allows reading links for any service that is publicly visible
CREATE POLICY service_environment_links_select
ON public.service_environment_links
FOR SELECT
USING (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = service_environment_links.service_id
           AND s.status = 'active'
           AND s.is_active = true
    )
    OR public.is_user_moderator_of_environment(auth.uid(), service_environment_links.environment_id)
);

-- Grant SELECT to anon role as well
GRANT SELECT ON public.service_environment_links TO anon;
GRANT SELECT ON public.service_environment_links TO authenticated;

COMMIT;
