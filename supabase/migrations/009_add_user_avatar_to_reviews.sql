-- Adiciona avatar no review para exibição pública (sem depender de JOIN em users com RLS)
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- Preenche reviews antigos com o avatar atual do usuário (quando disponível)
UPDATE public.reviews r
SET user_avatar = u.avatar
FROM public.users u
WHERE r.user_id = u.id
  AND (r.user_avatar IS NULL OR trim(r.user_avatar) = '');

