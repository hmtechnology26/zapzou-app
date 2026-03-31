-- =====================================================
-- 15. RPC PARA MODERAÇÃO DE MEMBROS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pending_environment_members(
    p_environment_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    created_at TIMESTAMPTZ,
    name TEXT,
    avatar_url TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_environment_id IS NULL THEN
        RETURN;
    END IF;

    IF NOT public.is_user_moderator_of_environment(auth.uid(), p_environment_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        em.id,
        em.user_id,
        em.created_at,
        u.name,
        u.avatar,
        u.email
    FROM public.environment_members em
    JOIN public.users u ON u.id = em.user_id
    WHERE em.environment_id = p_environment_id
      AND em.status = 'pending'
    ORDER BY em.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_environment_members(UUID) TO authenticated;
