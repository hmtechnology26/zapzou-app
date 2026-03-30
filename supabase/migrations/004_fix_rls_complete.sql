-- =====================================================
-- CORREÇÃO COMPLETA DE POLÍTICAS RLS
-- Execute no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Dropar todas as políticas existentes da tabela users
-- =====================================================

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_read_own ON public.users;
DROP POLICY IF EXISTS users_read_all ON public.users;
DROP POLICY IF EXISTS users_insert_service_role ON public.users;
DROP POLICY IF EXISTS users_insert_service ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- =====================================================
-- 2. Habilitar RLS (se ainda não estiver habilitado)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Criar políticas corrigidas
-- =====================================================

-- Permite que o usuário leia apenas seu próprio perfil
CREATE POLICY users_read_own ON public.users
FOR SELECT
USING (
    auth.uid() = id
    OR auth.role() = 'service_role'
);

-- Permite inserção apenas via service_role (trigger do auth)
CREATE POLICY users_insert_service ON public.users
FOR INSERT
WITH CHECK (
    auth.role() = 'service_role'
);

-- Permite que o usuário atualize apenas seu próprio perfil
CREATE POLICY users_update_own ON public.users
FOR UPDATE
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);

-- =====================================================
-- 4. Verificar resultado
-- =====================================================

SELECT 
    policyname, 
    cmd, 
    CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type
FROM pg_policies 
WHERE tablename = 'users'
AND schemaname = 'public';

COMMIT;

-- Políticas recriadas com sucesso!