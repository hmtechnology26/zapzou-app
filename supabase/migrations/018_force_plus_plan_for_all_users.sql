-- Until further notice, every user must be Plus.
-- This migration enforces Plus as the only default for new and existing users.

-- 1) Database default on users.plan
ALTER TABLE public.users
  ALTER COLUMN plan SET DEFAULT 'plus';

-- 2) Safety trigger default when plan is null
CREATE OR REPLACE FUNCTION public.trg_users_fill_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.plan IS NULL THEN
        NEW.plan := 'plus';
    END IF;

    IF NEW.role IS NULL THEN
        NEW.role := 'user';
    END IF;

    RETURN NEW;
END;
$$;

-- 3) Auth sync trigger must create users as Plus
CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name   TEXT;
  v_avatar TEXT;
BEGIN
  v_name := NULLIF(NEW.raw_user_meta_data->>'name', '');
  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  INSERT INTO public.users (id, email, name, avatar, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_name, split_part(NEW.email, '@', 1)),
    v_avatar,
    'user',
    'plus'
  )
  ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email,
         name = COALESCE(v_name, public.users.name, split_part(EXCLUDED.email, '@', 1)),
         avatar = COALESCE(v_avatar, public.users.avatar),
         updated_at = NOW();

  RETURN NEW;
END;
$$;

-- 4) Defensive fallback in effective plan resolution
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_user_id UUID)
RETURNS plan_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan plan_type;
BEGIN
    SELECT s.plan
      INTO v_plan
      FROM public.subscriptions s
     WHERE s.user_id = p_user_id
       AND s.status = 'active'
       AND (s.expires_at IS NULL OR s.expires_at > NOW())
     ORDER BY s.started_at DESC
     LIMIT 1;

    IF v_plan IS NOT NULL THEN
        RETURN v_plan;
    END IF;

    SELECT u.plan
      INTO v_plan
      FROM public.users u
     WHERE u.id = p_user_id;

    RETURN COALESCE(v_plan, 'plus');
END;
$$;

-- 5) Backfill all existing users to Plus
UPDATE public.users
SET plan = 'plus'
WHERE plan IS DISTINCT FROM 'plus';
