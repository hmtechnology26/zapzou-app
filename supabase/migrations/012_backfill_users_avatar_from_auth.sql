-- Backfill missing avatar/name in public.users from auth.users raw_user_meta_data.
-- Useful if the previous handle_auth_user_upsert() implementation wiped avatar/name.

UPDATE public.users u
SET
  avatar = COALESCE(
    NULLIF(a.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(a.raw_user_meta_data->>'picture', '')
  ),
  name = COALESCE(
    NULLIF(a.raw_user_meta_data->>'name', ''),
    NULLIF(a.raw_user_meta_data->>'full_name', ''),
    u.name
  ),
  updated_at = NOW()
FROM auth.users a
WHERE u.id = a.id
  AND (u.avatar IS NULL OR btrim(u.avatar) = '')
  AND COALESCE(
    NULLIF(a.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(a.raw_user_meta_data->>'picture', '')
  ) IS NOT NULL;

