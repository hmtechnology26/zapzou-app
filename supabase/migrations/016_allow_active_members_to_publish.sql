-- =====================================================
-- 16. MEMBROS APROVADOS PODEM PUBLICAR SEM BLOQUEIO EXTRA
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_publish_in_environment(
    p_user_id UUID,
    p_environment_id UUID,
    p_latitude NUMERIC,
    p_longitude NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_environment_type environment_type;
    v_environment_status environment_status;
    v_env_lat NUMERIC;
    v_env_lon NUMERIC;
    v_membership_status member_status;
    v_distance NUMERIC;
BEGIN
    SELECT e.type, e.status, e.latitude, e.longitude
      INTO v_environment_type, v_environment_status, v_env_lat, v_env_lon
      FROM public.environments e
     WHERE e.id = p_environment_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_environment_status <> 'active' THEN
        RETURN FALSE;
    END IF;

    SELECT em.status
      INTO v_membership_status
      FROM public.environment_members em
     WHERE em.user_id = p_user_id
       AND em.environment_id = p_environment_id;

    IF v_membership_status IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_membership_status = 'active' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
