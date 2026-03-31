-- Tabela de favoritos por usuário para ambientes pesquisados via /places
CREATE TABLE IF NOT EXISTS public.user_place_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_place_favorites_unique UNIQUE (user_id, place_id)
);

-- Garantir RLS e políticas para o usuário manipular apenas seus registros
ALTER TABLE public.user_place_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_place_favorites_select_own ON public.user_place_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_place_favorites_insert_own ON public.user_place_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_place_favorites_update_own ON public.user_place_favorites
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_place_favorites_delete_own ON public.user_place_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Manter updated_at atualizado automaticamente
DROP TRIGGER IF EXISTS trg_user_place_favorites_set_updated_at ON public.user_place_favorites;
CREATE TRIGGER trg_user_place_favorites_set_updated_at
  BEFORE UPDATE ON public.user_place_favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
