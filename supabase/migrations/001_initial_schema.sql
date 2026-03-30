-- =====================================================
-- ZAPZOU DATABASE MIGRATION SCRIPT
-- Version: 2.0.0
-- Date: 2026-03-25
-- Alinhado com a documentação funcional do projeto
-- =====================================================

BEGIN;

-- =====================================================
-- 0. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. ENUM TYPES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE environment_type AS ENUM ('residential', 'church', 'club', 'association');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE environment_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_role AS ENUM ('member', 'moderator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_status AS ENUM ('pending', 'active', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'pro', 'plus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_status AS ENUM ('pending', 'active', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE image_processing_status AS ENUM ('pending', 'processing', 'ready', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Perfis sincronizados com auth.users (Google OAuth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'user',
    plan plan_type NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ambientes importados/validados
CREATE TABLE IF NOT EXISTS public.environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    type environment_type NOT NULL,
    description TEXT,
    image_url TEXT,
    place_id VARCHAR(255),
    address TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    members_count INTEGER NOT NULL DEFAULT 0 CHECK (members_count >= 0),
    status environment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vínculo usuário x ambiente
CREATE TABLE IF NOT EXISTS public.environment_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
    unit VARCHAR(50),
    role membership_role NOT NULL DEFAULT 'member',
    status member_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT environment_members_unique UNIQUE (user_id, environment_id)
);

-- Serviços publicados
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,

    image_url TEXT,
    images_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_thumb_url TEXT,
    image_medium_url TEXT,
    image_original_url TEXT,
    image_status image_processing_status NOT NULL DEFAULT 'pending',

    provider VARCHAR(150) NOT NULL,
    provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    price VARCHAR(50),
    whatsapp VARCHAR(20),
    instagram VARCHAR(100),
    frequency VARCHAR(50),

    rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),

    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    menu JSONB NOT NULL DEFAULT '[]'::jsonb,

    status service_status NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT true,

    environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,

    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    last_location_check TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT services_contact_required CHECK (
        COALESCE(NULLIF(TRIM(whatsapp), ''), NULLIF(TRIM(instagram), '')) IS NOT NULL
    )
);

-- Avaliações
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reviews_unique_user_service UNIQUE (service_id, user_id)
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan plan_type NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    payment_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Denúncias
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apenas 1 assinatura ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_active_per_user
    ON public.subscriptions(user_id)
    WHERE status = 'active';

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE INDEX IF NOT EXISTS idx_environments_slug ON public.environments(slug);
CREATE INDEX IF NOT EXISTS idx_environments_type ON public.environments(type);
CREATE INDEX IF NOT EXISTS idx_environments_status ON public.environments(status);
CREATE INDEX IF NOT EXISTS idx_environments_place_id ON public.environments(place_id);

CREATE INDEX IF NOT EXISTS idx_environment_members_user ON public.environment_members(user_id);
CREATE INDEX IF NOT EXISTS idx_environment_members_environment ON public.environment_members(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_members_status ON public.environment_members(status);
CREATE INDEX IF NOT EXISTS idx_environment_members_role ON public.environment_members(role);

CREATE INDEX IF NOT EXISTS idx_services_environment ON public.services(environment_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_service ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_reports_service ON public.reports(service_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Índices funcionais para anti-fraude
CREATE INDEX IF NOT EXISTS idx_services_whatsapp_normalized
    ON public.services ((regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g')))
    WHERE whatsapp IS NOT NULL AND TRIM(whatsapp) <> '';

CREATE INDEX IF NOT EXISTS idx_services_instagram_normalized
    ON public.services ((lower(regexp_replace(COALESCE(instagram, ''), '^@', '', 'g'))))
    WHERE instagram IS NOT NULL AND TRIM(instagram) <> '';

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_whatsapp(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT NULLIF(regexp_replace(COALESCE(p_value, ''), '\D', '', 'g'), '');
$$;

CREATE OR REPLACE FUNCTION public.normalize_instagram(p_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT NULLIF(lower(regexp_replace(COALESCE(trim(p_value), ''), '^@', '', 'g')), '');
$$;

CREATE OR REPLACE FUNCTION public.slugify(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_text TEXT;
BEGIN
    v_text := lower(COALESCE(p_text, ''));
    v_text := translate(
        v_text,
        'áàãâäéèêëíìîïóòõôöúùûüçñýÿ',
        'aaaaaeeeeiiiiooooouuuucnyy'
    );
    v_text := regexp_replace(v_text, '[^a-z0-9]+', '-', 'g');
    v_text := regexp_replace(v_text, '(^-+|-+$)', '', 'g');

    IF v_text = '' THEN
        v_text := 'servico';
    END IF;

    RETURN v_text;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_service_slug(p_title TEXT, p_service_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_base TEXT;
    v_slug TEXT;
    v_counter INTEGER := 1;
BEGIN
    v_base := public.slugify(p_title);
    v_slug := v_base;

    WHILE EXISTS (
        SELECT 1
        FROM public.services s
        WHERE s.slug = v_slug
          AND (p_service_id IS NULL OR s.id <> p_service_id)
    ) LOOP
        v_counter := v_counter + 1;
        v_slug := v_base || '-' || v_counter;
    END LOOP;

    RETURN v_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.haversine_distance_meters(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    r NUMERIC := 6371000;
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);

    a := power(sin(dlat / 2), 2)
       + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(dlon / 2), 2);

    c := 2 * atan2(sqrt(a), sqrt(1 - a));

    RETURN r * c;
END;
$$;

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

    RETURN COALESCE(v_plan, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_plan_service_limit(p_plan plan_type)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_plan
        WHEN 'free' THEN 2
        WHEN 'pro'  THEN 5
        WHEN 'plus' THEN NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.get_plan_environment_limit(p_plan plan_type)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE p_plan
        WHEN 'free' THEN 1
        WHEN 'pro'  THEN NULL
        WHEN 'plus' THEN NULL
    END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_active_member_of_environment(
    p_user_id UUID,
    p_environment_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.environment_members em
         WHERE em.user_id = p_user_id
           AND em.environment_id = p_environment_id
           AND em.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_user_moderator_of_environment(
    p_user_id UUID,
    p_environment_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
          FROM public.environment_members em
         WHERE em.user_id = p_user_id
           AND em.environment_id = p_environment_id
           AND em.role = 'moderator'
           AND em.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.can_publish_in_environment(
    p_user_id UUID,
    p_environment_id UUID,
    p_latitude NUMERIC,
    p_longitude NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_environment_type environment_type;
    v_environment_status environment_status;
    v_env_lat NUMERIC;
    v_env_lon NUMERIC;
    v_membership_status member_status;
    v_distance NUMERIC;
BEGIN
    SELECT e.type, e.status, e.latitude, e.longitude
      INTO v_environment_type, v_environment_status, v_env_lat, v_env_lon
      FROM public.environments e
     WHERE e.id = p_environment_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_environment_status <> 'active' THEN
        RETURN FALSE;
    END IF;

    SELECT em.status
      INTO v_membership_status
      FROM public.environment_members em
     WHERE em.user_id = p_user_id
       AND em.environment_id = p_environment_id;

    IF v_membership_status IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_membership_status <> 'active' THEN
        RETURN FALSE;
    END IF;

    IF v_environment_type = 'church' AND NOT public.is_user_active_member_of_environment(p_user_id, p_environment_id) THEN
        RETURN FALSE;
    END IF;

    IF v_env_lat IS NOT NULL AND v_env_lon IS NOT NULL THEN
        IF p_latitude IS NULL OR p_longitude IS NULL THEN
            RETURN FALSE;
        END IF;

        v_distance := public.haversine_distance_meters(
            p_latitude,
            p_longitude,
            v_env_lat,
            v_env_lon
        );

        IF v_distance IS NULL OR v_distance > 500 THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_create_service(
    p_user_id UUID,
    p_environment_id UUID,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_service_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan plan_type;
    v_service_limit INTEGER;
    v_environment_limit INTEGER;
    v_current_services INTEGER;
    v_current_environments INTEGER;
BEGIN
    IF p_user_id IS NULL OR p_environment_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF NOT public.can_publish_in_environment(p_user_id, p_environment_id, p_latitude, p_longitude) THEN
        RETURN FALSE;
    END IF;

    v_plan := public.get_effective_plan(p_user_id);
    v_service_limit := public.get_plan_service_limit(v_plan);
    v_environment_limit := public.get_plan_environment_limit(v_plan);

    SELECT COUNT(*)
      INTO v_current_services
      FROM public.services s
     WHERE s.provider_id = p_user_id
       AND (p_service_id IS NULL OR s.id <> p_service_id);

    IF v_service_limit IS NOT NULL AND v_current_services >= v_service_limit THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(DISTINCT s.environment_id)
      INTO v_current_environments
      FROM public.services s
     WHERE s.provider_id = p_user_id
       AND (p_service_id IS NULL OR s.id <> p_service_id);

    IF v_environment_limit IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
              FROM public.services s
             WHERE s.provider_id = p_user_id
               AND s.environment_id = p_environment_id
               AND (p_service_id IS NULL OR s.id <> p_service_id)
        ) THEN
            -- já publica nesse ambiente, pode seguir
            NULL;
        ELSIF v_current_environments >= v_environment_limit THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;

-- =====================================================
-- 5. BUSINESS RULE FUNCTIONS / TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.trg_users_fill_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.plan IS NULL THEN
        NEW.plan := 'free';
    END IF;

    IF NEW.role IS NULL THEN
        NEW.role := 'user';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_environment_members_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_env_type environment_type;
BEGIN
    SELECT e.type
      INTO v_env_type
      FROM public.environments e
     WHERE e.id = NEW.environment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ambiente não encontrado';
    END IF;

    IF NEW.role = 'moderator' AND v_env_type <> 'church' THEN
        RAISE EXCEPTION 'Moderadores só podem existir em ambientes do tipo church';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_services_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_provider_name TEXT;
BEGIN
    IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
        NEW.slug := public.generate_unique_service_slug(
            NEW.title,
            CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
        );
    ELSE
        NEW.slug := public.generate_unique_service_slug(
            NEW.slug,
            CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
        );
    END IF;

    SELECT u.name
      INTO v_provider_name
      FROM public.users u
     WHERE u.id = NEW.provider_id;

    IF v_provider_name IS NULL THEN
        RAISE EXCEPTION 'Prestador não encontrado';
    END IF;

    NEW.provider := v_provider_name;

    IF NEW.status IS NULL THEN
        NEW.status := 'active';
    END IF;

    IF NEW.last_location_check IS NULL THEN
        NEW.last_location_check := NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_services_prevent_duplicate_contact()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_whatsapp TEXT;
    v_instagram TEXT;
    v_exists BOOLEAN;
BEGIN
    v_whatsapp := public.normalize_whatsapp(NEW.whatsapp);
    v_instagram := public.normalize_instagram(NEW.instagram);

    IF v_whatsapp IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
              FROM public.services s
             WHERE public.normalize_whatsapp(s.whatsapp) = v_whatsapp
               AND s.provider_id <> NEW.provider_id
               AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        ) INTO v_exists;

        IF v_exists THEN
            RAISE EXCEPTION 'Este WhatsApp já está em uso em outro serviço de outra conta';
        END IF;
    END IF;

    IF v_instagram IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
              FROM public.services s
             WHERE public.normalize_instagram(s.instagram) = v_instagram
               AND s.provider_id <> NEW.provider_id
               AND s.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
        ) INTO v_exists;

        IF v_exists THEN
            RAISE EXCEPTION 'Este Instagram já está em uso em outro serviço de outra conta';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reviews_refresh_service_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_service_id UUID;
BEGIN
    v_service_id := COALESCE(NEW.service_id, OLD.service_id);

    UPDATE public.services s
       SET rating = COALESCE(agg.avg_rating, 0),
           reviews_count = COALESCE(agg.total_reviews, 0),
           updated_at = NOW()
      FROM (
            SELECT r.service_id,
                   ROUND(AVG(r.stars)::numeric, 1) AS avg_rating,
                   COUNT(*) AS total_reviews
              FROM public.reviews r
             WHERE r.service_id = v_service_id
             GROUP BY r.service_id
      ) agg
     WHERE s.id = agg.service_id;

    UPDATE public.services s
       SET rating = 0,
           reviews_count = 0,
           updated_at = NOW()
     WHERE s.id = v_service_id
       AND NOT EXISTS (
            SELECT 1
              FROM public.reviews r
             WHERE r.service_id = v_service_id
       );

    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_environment_members_refresh_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_environment_id UUID;
BEGIN
    v_environment_id := COALESCE(NEW.environment_id, OLD.environment_id);

    UPDATE public.environments e
       SET members_count = (
           SELECT COUNT(*)
             FROM public.environment_members em
            WHERE em.environment_id = v_environment_id
              AND em.status = 'active'
       ),
           updated_at = NOW()
     WHERE e.id = v_environment_id;

    RETURN NULL;
END;
$$;

-- Sincroniza perfil a partir do auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, avatar, role, plan)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        'user',
        'free'
    )
    ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           name = EXCLUDED.name,
           avatar = EXCLUDED.avatar,
           updated_at = NOW();

    RETURN NEW;
END;
$$;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trg_users_fill_defaults ON public.users;
CREATE TRIGGER trg_users_fill_defaults
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trg_users_fill_defaults();

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_environments_set_updated_at ON public.environments;
CREATE TRIGGER trg_environments_set_updated_at
BEFORE UPDATE ON public.environments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_environment_members_validate ON public.environment_members;
CREATE TRIGGER trg_environment_members_validate
BEFORE INSERT OR UPDATE ON public.environment_members
FOR EACH ROW
EXECUTE FUNCTION public.trg_environment_members_validate();

DROP TRIGGER IF EXISTS trg_environment_members_set_updated_at ON public.environment_members;
CREATE TRIGGER trg_environment_members_set_updated_at
BEFORE UPDATE ON public.environment_members
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_environment_members_refresh_count_insupd ON public.environment_members;
CREATE TRIGGER trg_environment_members_refresh_count_insupd
AFTER INSERT OR UPDATE OR DELETE ON public.environment_members
FOR EACH ROW
EXECUTE FUNCTION public.trg_environment_members_refresh_count();

DROP TRIGGER IF EXISTS trg_services_before_write ON public.services;
CREATE TRIGGER trg_services_before_write
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.trg_services_before_write();

DROP TRIGGER IF EXISTS trg_services_prevent_duplicate_contact ON public.services;
CREATE TRIGGER trg_services_prevent_duplicate_contact
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.trg_services_prevent_duplicate_contact();

DROP TRIGGER IF EXISTS trg_services_set_updated_at ON public.services;
CREATE TRIGGER trg_services_set_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_set_updated_at ON public.reports;
CREATE TRIGGER trg_reports_set_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reviews_refresh_service_stats_insupddel ON public.reviews;
CREATE TRIGGER trg_reviews_refresh_service_stats_insupddel
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.trg_reviews_refresh_service_stats();

-- =====================================================
-- 7. VIEW PÚBLICA DE PERFIS
-- =====================================================

CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT
    id,
    name,
    avatar,
    plan
FROM public.users;

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. POLICIES
-- =====================================================

-- ---------- USERS ----------
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own
ON public.users
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- opcional para service_role / triggers administrativos
DROP POLICY IF EXISTS users_insert_service_role ON public.users;
CREATE POLICY users_insert_service_role
ON public.users
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ---------- ENVIRONMENTS ----------
DROP POLICY IF EXISTS environments_read_active ON public.environments;
CREATE POLICY environments_read_active
ON public.environments
FOR SELECT
USING (status = 'active');

-- ---------- ENVIRONMENT_MEMBERS ----------
DROP POLICY IF EXISTS environment_members_select_own ON public.environment_members;
CREATE POLICY environment_members_select_own
ON public.environment_members
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS environment_members_select_moderator ON public.environment_members;
CREATE POLICY environment_members_select_moderator
ON public.environment_members
FOR SELECT
USING (
    public.is_user_moderator_of_environment(auth.uid(), environment_id)
);

DROP POLICY IF EXISTS environment_members_insert_own ON public.environment_members;
CREATE POLICY environment_members_insert_own
ON public.environment_members
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS environment_members_update_own ON public.environment_members;
CREATE POLICY environment_members_update_own
ON public.environment_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS environment_members_update_moderator ON public.environment_members;
CREATE POLICY environment_members_update_moderator
ON public.environment_members
FOR UPDATE
USING (
    public.is_user_moderator_of_environment(auth.uid(), environment_id)
)
WITH CHECK (
    public.is_user_moderator_of_environment(auth.uid(), environment_id)
);

-- ---------- SERVICES ----------
DROP POLICY IF EXISTS services_read_public_active ON public.services;
CREATE POLICY services_read_public_active
ON public.services
FOR SELECT
USING (
    status = 'active'
    AND is_active = true
);

DROP POLICY IF EXISTS services_read_own ON public.services;
CREATE POLICY services_read_own
ON public.services
FOR SELECT
USING (
    provider_id = auth.uid()
);

DROP POLICY IF EXISTS services_insert_own ON public.services;
CREATE POLICY services_insert_own
ON public.services
FOR INSERT
WITH CHECK (
    provider_id = auth.uid()
    AND public.can_user_create_service(
        provider_id,
        environment_id,
        latitude,
        longitude,
        NULL
    )
);

DROP POLICY IF EXISTS services_update_own ON public.services;
CREATE POLICY services_update_own
ON public.services
FOR UPDATE
USING (
    provider_id = auth.uid()
)
WITH CHECK (
    provider_id = auth.uid()
    AND public.can_user_create_service(
        provider_id,
        environment_id,
        latitude,
        longitude,
        id
    )
);

DROP POLICY IF EXISTS services_delete_own ON public.services;
CREATE POLICY services_delete_own
ON public.services
FOR DELETE
USING (
    provider_id = auth.uid()
);

-- ---------- REVIEWS ----------
DROP POLICY IF EXISTS reviews_read_public ON public.reviews;
CREATE POLICY reviews_read_public
ON public.reviews
FOR SELECT
USING (true);

DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_insert_own
ON public.reviews
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own
ON public.reviews
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
CREATE POLICY reviews_delete_own
ON public.reviews
FOR DELETE
USING (user_id = auth.uid());

-- ---------- SUBSCRIPTIONS ----------
DROP POLICY IF EXISTS subscriptions_read_own ON public.subscriptions;
CREATE POLICY subscriptions_read_own
ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- ---------- REPORTS ----------
DROP POLICY IF EXISTS reports_insert_own ON public.reports;
CREATE POLICY reports_insert_own
ON public.reports
FOR INSERT
WITH CHECK (
    reporter_id = auth.uid()
);

DROP POLICY IF EXISTS reports_read_own ON public.reports;
CREATE POLICY reports_read_own
ON public.reports
FOR SELECT
USING (
    reporter_id = auth.uid()
);

DROP POLICY IF EXISTS reports_read_moderator ON public.reports;
CREATE POLICY reports_read_moderator
ON public.reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = reports.service_id
           AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id)
    )
);

DROP POLICY IF EXISTS reports_update_moderator ON public.reports;
CREATE POLICY reports_update_moderator
ON public.reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = reports.service_id
           AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
          FROM public.services s
         WHERE s.id = reports.service_id
           AND public.is_user_moderator_of_environment(auth.uid(), s.environment_id)
    )
);

-- =====================================================
-- 10. GRANTS
-- =====================================================

GRANT SELECT ON public.user_public_profiles TO authenticated;
GRANT SELECT ON public.user_public_profiles TO anon;

-- =====================================================
-- 11. OPTIONAL SEED (DESATIVADO EM PRODUÇÃO)
-- =====================================================
-- Descomente só se quiser dados iniciais para teste.
--
-- INSERT INTO public.environments
--     (name, slug, type, description, image_url, place_id, address, latitude, longitude, status)
-- VALUES
--     (
--         'Residencial Aurora',
--         'residencial-aurora',
--         'residential',
--         'Condomínio residencial no centro',
--         'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150',
--         'place_id_demo_1',
--         'Rua das Flores, 100',
--         -23.5505,
--         -46.6333,
--         'active'
--     ),
--     (
--         'Igreja Farol',
--         'igreja-farol',
--         'church',
--         'Comunidade religiosa',
--         'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=150',
--         'place_id_demo_2',
--         'Av. Principal, 200',
--         -23.5510,
--         -46.6340,
--         'active'
--     )
-- ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- =====================================================
-- 12. IMPORTANT NOTES
-- =====================================================
/*
1) AUTH TRIGGER NO SUPABASE
   A função abaixo já foi criada neste script:
   public.handle_auth_user_upsert()

   Depois rode no SQL Editor do Supabase (ou via migration com privilégios adequados):

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
   AFTER INSERT OR UPDATE ON auth.users
   FOR EACH ROW
   EXECUTE FUNCTION public.handle_auth_user_upsert();

2) REGRA DE MODERAÇÃO
   - A moderação é do prestador no ambiente (environment_members.status)
   - Em church, moderadores podem aprovar/reprovar memberships
   - O serviço continua tendo status para compatibilidade de frontend e evolução futura,
     mas a trava principal de publicação está no membership + RLS

3) REGRA DE 500m
   - Para publicar/editar serviço, latitude/longitude do serviço devem ficar
     dentro de 500m do ambiente, quando o ambiente possuir coordenadas

4) LIMITES DE PLANO
   - FREE: até 2 serviços e até 1 ambiente
   - PRO: até 5 serviços e múltiplos ambientes
   - PLUS: ilimitado

5) ANTI-FRAUDE
   - WhatsApp e Instagram são normalizados
   - Não é permitido repetir contato em contas diferentes

6) PRIVACIDADE
   - A tabela users não está publicamente aberta
   - Para exibição pública, use a view: public.user_public_profiles
*/