-- Drop services.environment_id column and migrate all logic to service_environment_links

-- 1. Drop index on services.environment_id
DROP INDEX IF EXISTS public.idx_services_environment;

-- 2. Update can_user_create_service function to use junction table
CREATE OR REPLACE FUNCTION public.can_user_create_service(
  p_user_id UUID,
  p_environment_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_exclude_service_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_plan_limit INT;
  v_current_count INT;
  v_environment_type TEXT;
BEGIN
  IF p_user_id IS NULL OR p_environment_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check user's plan limit
  SELECT COALESCE(up.service_limit, 5) INTO v_plan_limit
  FROM public.user_plans up
  WHERE up.user_id = p_user_id;

  -- Count current services for this user in this environment via junction table
  SELECT COUNT(*) INTO v_current_count
  FROM public.services s
  JOIN public.service_environment_links sel ON sel.service_id = s.id
  WHERE s.provider_id = p_user_id
    AND sel.environment_id = p_environment_id
    AND s.is_active = TRUE
    AND (p_exclude_service_id IS NULL OR s.id != p_exclude_service_id);

  IF v_current_count >= v_plan_limit THEN
    RETURN FALSE;
  END IF;

  -- Get environment type for additional checks
  SELECT e.type INTO v_environment_type
  FROM public.environments e
  WHERE e.id = p_environment_id;

  -- Church-specific limit check
  IF v_environment_type = 'church' THEN
    IF NOT public.is_user_active_member_of_environment(p_user_id, p_environment_id) THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update trigger function on services that references environment_id
CREATE OR REPLACE FUNCTION public.handle_new_service() RETURNS TRIGGER AS $$
DECLARE
  v_environment_id UUID;
BEGIN
  -- Get the first linked environment from the junction table
  SELECT sel.environment_id INTO v_environment_id
  FROM public.service_environment_links sel
  WHERE sel.service_id = COALESCE(NEW.id, OLD.id)
  LIMIT 1;

  -- Auto-approve membership if user created a service in that environment
  IF v_environment_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    UPDATE public.environment_members
    SET status = 'active'
    WHERE user_id = NEW.provider_id
      AND environment_id = v_environment_id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update RLS policies for reports table (references s.environment_id via services)
DROP POLICY IF EXISTS reports_read_moderator ON public.reports;
CREATE POLICY reports_read_moderator ON public.reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.service_environment_links sel ON sel.service_id = s.id
    WHERE s.id = reports.service_id
      AND public.is_user_moderator_of_environment(auth.uid(), sel.environment_id)
  )
);

DROP POLICY IF EXISTS reports_update_moderator ON public.reports;
CREATE POLICY reports_update_moderator ON public.reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.service_environment_links sel ON sel.service_id = s.id
    WHERE s.id = reports.service_id
      AND public.is_user_moderator_of_environment(auth.uid(), sel.environment_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.service_environment_links sel ON sel.service_id = s.id
    WHERE s.id = reports.service_id
      AND public.is_user_moderator_of_environment(auth.uid(), sel.environment_id)
  )
);

-- 5. Update RLS policies for services table (remove environment_id references)
DROP POLICY IF EXISTS services_insert_own ON public.services;
CREATE POLICY services_insert_own ON public.services FOR INSERT
WITH CHECK (
  provider_id = auth.uid()
);

DROP POLICY IF EXISTS services_update_own ON public.services;
CREATE POLICY services_update_own ON public.services FOR UPDATE
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- 6. Drop the column
ALTER TABLE public.services DROP COLUMN IF EXISTS environment_id;
