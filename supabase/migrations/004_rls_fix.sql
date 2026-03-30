BEGIN;

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_read_own ON public.users;
DROP POLICY IF EXISTS users_insert_service_role ON public.users;
DROP POLICY IF EXISTS users_insert_service ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_read_own ON public.users
FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY users_insert_service ON public.users
FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY users_update_own ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

COMMIT;