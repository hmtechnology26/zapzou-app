-- =====================================================
-- RESTAURAR POLÍTICAS RLS ORIGINAIS
-- Execute no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Habilitar RLS em todas as tabelas
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Dropar políticas existentes
-- =====================================================

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_service_role ON public.users;

DROP POLICY IF EXISTS environments_read_active ON public.environments;

DROP POLICY IF EXISTS environment_members_select_own ON public.environment_members;
DROP POLICY IF EXISTS environment_members_select_moderator ON public.environment_members;
DROP POLICY IF EXISTS environment_members_insert_own ON public.environment_members;
DROP POLICY IF EXISTS environment_members_update_own ON public.environment_members;
DROP POLICY IF EXISTS environment_members_update_moderator ON public.environment_members;

DROP POLICY IF EXISTS services_read_public_active ON public.services;
DROP POLICY IF EXISTS services_read_own ON public.services;
DROP POLICY IF EXISTS services_insert_own ON public.services;
DROP POLICY IF EXISTS services_update_own ON public.services;
DROP POLICY IF EXISTS services_delete_own ON public.services;

DROP POLICY IF EXISTS reviews_read_public ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;

DROP POLICY IF EXISTS subscriptions_read_own ON public.subscriptions;

DROP POLICY IF EXISTS reports_insert_own ON public.reports;
DROP POLICY IF EXISTS reports_read_own ON public.reports;
DROP POLICY IF EXISTS reports_read_moderator ON public.reports;
DROP POLICY IF EXISTS reports_update_moderator ON public.reports;

-- =====================================================
-- 3. Criar políticas originais
-- =====================================================

-- USERS
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_insert_service_role ON public.users FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ENVIRONMENTS
CREATE POLICY environments_read_active ON public.environments FOR SELECT USING (status = 'active');

-- ENVIRONMENT_MEMBERS
CREATE POLICY environment_members_select_own ON public.environment_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY environment_members_select_moderator ON public.environment_members FOR SELECT USING (public.is_user_moderator_of_environment(auth.uid(), environment_id));
CREATE POLICY environment_members_insert_own ON public.environment_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY environment_members_update_own ON public.environment_members FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY environment_members_update_moderator ON public.environment_members FOR UPDATE USING (public.is_user_moderator_of_environment(auth.uid(), environment_id)) WITH CHECK (public.is_user_moderator_of_environment(auth.uid(), environment_id));

-- SERVICES
CREATE POLICY services_read_public_active ON public.services FOR SELECT USING (status = 'active' AND is_active = true);
CREATE POLICY services_read_own ON public.services FOR SELECT USING (provider_id = auth.uid());
CREATE POLICY services_insert_own ON public.services FOR INSERT WITH CHECK (provider_id = auth.uid() AND public.can_user_create_service(provider_id, environment_id, latitude, longitude, NULL));
CREATE POLICY services_update_own ON public.services FOR UPDATE USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid() AND public.can_user_create_service(provider_id, environment_id, latitude, longitude, id));
CREATE POLICY services_delete_own ON public.services FOR DELETE USING (provider_id = auth.uid());

-- REVIEWS
CREATE POLICY reviews_read_public ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reviews_delete_own ON public.reviews FOR DELETE USING (user_id = auth.uid());

-- SUBSCRIPTIONS
CREATE POLICY subscriptions_read_own ON public.subscriptions FOR SELECT USING (user_id = auth.uid());

-- REPORTS
CREATE POLICY reports_insert_own ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_read_own ON public.reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY reports_read_moderator ON public.reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = reports.service_id AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id)));
CREATE POLICY reports_update_moderator ON public.reports FOR UPDATE USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = reports.service_id AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.services s WHERE s.id = reports.service_id AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id)));

-- =====================================================
-- 4. Verificar políticas criadas
-- =====================================================

SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

COMMIT;