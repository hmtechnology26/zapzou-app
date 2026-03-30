-- Prevent auth.users trigger sync from wiping profile fields (avatar/name) when
-- raw_user_meta_data does not include them on subsequent updates.
--
-- NOTE: The trigger on auth.users must already exist (or be created manually):
--   CREATE TRIGGER on_auth_user_created
--   AFTER INSERT OR UPDATE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_auth_user_upsert();

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
    'free'
  )
  ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email,
         name = COALESCE(v_name, public.users.name, split_part(EXCLUDED.email, '@', 1)),
         avatar = COALESCE(v_avatar, public.users.avatar),
         updated_at = NOW();

  RETURN NEW;
END;
$$;

