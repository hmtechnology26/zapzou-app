-- =====================================================
-- CORREÇÃO RLS TEMPORÁRIA PARA TESTES
-- Execute no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- Desabilitar RLS em todas as tabelas principais
-- =====================================================

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Verificar estado (syntax correta)
-- =====================================================

SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'services', 'environments', 'environment_members', 'reviews', 'subscriptions', 'reports')
ORDER BY tablename;

COMMIT;

-- RLS desabilitado para testes!