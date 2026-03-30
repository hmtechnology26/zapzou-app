-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS - VERSÃO CORRIGIDA
-- Execute no Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Dropar políticas restritivas existentes
-- =====================================================

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_read_own ON public.users;
DROP POLICY IF EXISTS users_insert_service_role ON public.users;
DROP POLICY IF EXISTS users_insert_service ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

-- =====================================================
-- 2. Criar políticas corrigidas
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
-- 3. Verificar se funcionou
-- =====================================================

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

COMMIT;

-- Políticas atualizadas com sucesso!
-- Agora o usuário logado poderá ler apenas seu próprio perfil.