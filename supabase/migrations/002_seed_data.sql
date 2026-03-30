-- =====================================================
-- ZAPZOU - DADOS DE TESTE (SEED)
-- Execute APÓS a migração principal
-- =====================================================

BEGIN;

-- =====================================================
-- USERS (simulando usuários criados via Google OAuth)
-- =====================================================

INSERT INTO public.users (id, email, name, avatar, role, plan) VALUES
('11111111-1111-1111-1111-111111111111', 'maria.silva@gmail.com', 'Maria Silva', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'user', 'free'),
('22222222-2222-2222-2222-222222222222', 'joao.admin@zapzou.com', 'João Administrador', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'moderator', 'plus'),
('33333333-3333-3333-3333-333333333333', 'julia.santos@gmail.com', 'Julia Santos', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'user', 'pro'),
('44444444-4444-4444-4444-444444444444', 'pedro.santos@gmail.com', 'Pedro Santos', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'user', 'free'),
('55555555-5555-5555-5555-555555555555', 'maria.limpeza@gmail.com', 'Maria Silva Limpeza', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'user', 'free'),
('66666666-6666-6666-6666-666666666666', ' pastor.igreja@gmail.com', 'Pastor João', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'moderator', 'free')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ENVIRONMENTS
-- =====================================================

INSERT INTO public.environments (id, name, slug, type, description, image_url, place_id, address, latitude, longitude, members_count, status) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', 'Residencial Aurora', 'residencial-aurora', 'residential', 'Condomínio residencial com 120 moradores', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150', 'ChIJP2Teste123', 'Rua das Flores, 100 - São Paulo, SP', -23.550520, -46.633308, 5, 'active'),
('bbbb2222-bbbb-2222-bbbb-222222222222', 'Igreja Farol', 'igreja-farol', 'church', 'Comunidade religiosa Evangélica', 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=150', 'ChIJP2Teste456', 'Av. Principal, 200 - São Paulo, SP', -23.551000, -46.634000, 3, 'active'),
('cccc3333-cccc-3333-cccc-333333333333', 'Clube das Acácias', 'clube-das-acacias', 'club', 'Clube social e esportivo', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150', 'ChIJP2Teste789', 'Rua das Acácias, 50 - São Paulo, SP', -23.549500, -46.635000, 2, 'active')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ENVIRONMENT MEMBERS
-- =====================================================

INSERT INTO public.environment_members (id, user_id, environment_id, unit, role, status) VALUES
('mmmm1111-mmmm-1111-mmmm-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Bloco A - Apto 101', 'member', 'active'),
('mmmm2222-mmmm-2222-mmmm-222222222222', '33333333-3333-3333-3333-333333333333', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Bloco B - Apto 202', 'member', 'active'),
('mmmm3333-mmmm-3333-mmmm-333333333333', '44444444-4444-4444-4444-444444444444', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Bloco A - Apto 305', 'member', 'active'),
('mmmm4444-mmmm-4444-mmmm-444444444444', '55555555-5555-5555-5555-555555555555', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'Bloco C - Apto 401', 'member', 'active'),
('mmmm5555-mmmm-5555-mmmm-555555555555', '66666666-6666-6666-6666-666666666666', 'bbbb2222-bbbb-2222-bbbb-222222222222', NULL, 'moderator', 'active'),
('mmmm6666-mmmm-6666-mmmm-666666666666', '11111111-1111-1111-1111-111111111111', 'bbbb2222-bbbb-2222-bbbb-222222222222', NULL, 'member', 'pending')
ON CONFLICT (user_id, environment_id) DO NOTHING;

-- =====================================================
-- SERVICES (sem image_status - usa default)
-- =====================================================

INSERT INTO public.services (
    id, slug, title, description, category,
    image_url, images_urls, image_thumb_url, image_medium_url, image_original_url, image_status,
    provider, provider_id,
    price, whatsapp, instagram, frequency,
    rating, reviews_count,
    tags, menu,
    status, is_active,
    environment_id,
    latitude, longitude, last_location_check
) VALUES
(
    'ssss1111-ssss-1111-ssss-111111111111',
    'marmitas-da-julia',
    'Marmitas da Julia - Caseira & Fit',
    'Refeições saudáveis preparadas diariamente com ingredientes frescos. Cardápio variados com opções fit e tradicionais.',
    'Alimentação',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800"]',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200',
    'ready',
    'Julia Santos', '33333333-3333-3333-3333-333333333333',
    'R$ 25-35', '5511999999999', '@marmitasdajulia', 'Diário',
    4.9, 12,
    '["Sem conservantes", "Fit", "Vegetariano"]',
    '[{"id": "m1", "name": "Marmita Pequena (350g)", "description": "Ideal para um almoço leve", "price": "R$ 25"}, {"id": "m2", "name": "Marmita Média (500g)", "description": "Nossa campeã de vendas", "price": "R$ 32"}, {"id": "m3", "name": "Combo Semanal (5 un)", "description": "Praticidade para sua semana", "price": "R$ 145"}]',
    'active', true,
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    -23.550620, -46.633408, NOW()
),
(
    'ssss2222-ssss-2222-ssss-222222222222',
    'limpeza-residencial-maria',
    'Limpeza Residencial - Maria',
    'Serviço de limpeza doméstica com produtos ecológicos e biodegradáveis. Deixe sua casa impecável e segura.',
    'Limpeza',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    '["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"]',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200',
    'ready',
    'Maria Silva Limpeza', '55555555-5555-5555-5555-555555555555',
    'R$ 80-150', '5511888888888', '@limpezamaria', 'Diário',
    4.7, 8,
    '["Produtos ecológicos", "Idosos"]',
    '[{"id": "l1", "name": "Limpeza Rápida", "description": "1h de serviço", "price": "R$ 80"}, {"id": "l2", "name": "Limpeza Completa", "description": "2h de serviço", "price": "R$ 120"}, {"id": "l3", "name": "Limpeza Pesada", "description": "3h de serviço", "price": "R$ 150"}]',
    'active', true,
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    -23.550300, -46.633100, NOW()
),
(
    'ssss3333-ssss-3333-ssss-333333333333',
    'dog-walker-pedro',
    'Dog Walker - Pedro',
    'Passeios diários para seu cão de estimação. Amoroso, responsável e com experiência com pets de todos os portes.',
    'Pet Sitting',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
    '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800", "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800"]',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=150',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200',
    'ready',
    'Pedro Santos', '44444444-4444-4444-4444-444444444444',
    'R$ 30-50', '5511777777777', '@pedropetwalker', 'Diário',
    5.0, 5,
    '["Pet Friendly", "Experiência com berani"]',
    '[{"id": "p1", "name": "Passeio 30min", "description": "Passeio rápido", "price": "R$ 30"}, {"id": "p2", "name": "Passeio 1h", "description": "Passeio completo", "price": "R$ 50"}]',
    'active', true,
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    -23.550800, -46.633500, NOW()
),
(
    'ssss4444-ssss-4444-ssss-444444444444',
    'cabeleireira-julia',
    'Cabeleireira Julia - Serviços de Beleza',
    'Corte, pintura, hidratação e tratamento capilar. Profissional com 10 anos de experiência.',
    'Beleza',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    '["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800"]',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200',
    'ready',
    'Julia Santos', '33333333-3333-3333-3333-333333333333',
    'R$ 50-150', '5511999999999', '@juliabelleza', 'Fim de Semana',
    4.8, 15,
    '["Corte", "Tintura", "Tratamento"]',
    '[{"id": "b1", "name": "Corte Feminino", "description": "Corte e secagem", "price": "R$ 60"}, {"id": "b2", "name": "Tintura Completa", "description": "Cor e retoque", "price": "R$ 150"}, {"id": "b3", "name": "Hidratação", "description": "Tratamento profundo", "price": "R$ 50"}]',
    'active', true,
    'bbbb2222-bbbb-2222-bbbb-222222222222',
    -23.551100, -46.634100, NOW()
),
(
    'ssss5555-ssss-5555-ssss-555555555555',
    'tecnico-informatica',
    'Técnico de Informática - João',
    'Suporte técnico para computadores, notebooks e redes. Instalação de software, hardware e configuração.',
    'Tecnologia',
    'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800',
    '["https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800"]',
    NULL, NULL, NULL,
    'pending',
    'João Administrador', '22222222-2222-2222-2222-222222222222',
    'R$ 80-150', '5511966666666', '@joaotech', 'Diário',
    4.5, 3,
    '["Redes", "Hardware", "Software"]',
    '[{"id": "t1", "name": "Visita Técnica", "description": "Diagnóstico", "price": "R$ 80"}, {"id": "t2", "name": "Formatação", "description": "Instalação completa", "price": "R$ 120"}]',
    'active', true,
    'cccc3333-cccc-3333-cccc-333333333333',
    -23.549600, -46.635100, NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- REVIEWS
-- =====================================================

INSERT INTO public.reviews (id, service_id, user_id, user_name, stars, comment, created_at) VALUES
('rrrr1111-rrrr-1111-rrrr-111111111111', 'ssss1111-ssss-1111-ssss-111111111111', '11111111-1111-1111-1111-111111111111', 'Maria Silva', 5, 'As marmitas são deliciosas! Muito fresquinhas e saborosas.', '2026-03-20 10:00:00+00'),
('rrrr2222-rrrr-2222-rrrr-222222222222', 'ssss1111-ssss-1111-ssss-111111111111', '44444444-4444-4444-4444-444444444444', 'Pedro Santos', 5, 'Entrega sempre no horário. Recomendo!', '2026-03-21 14:30:00+00'),
('rrrr3333-rrrr-3333-rrrr-333333333333', 'ssss2222-ssss-2222-ssss-222222222222', '11111111-1111-1111-1111-111111111111', 'Maria Silva', 4, 'Serviço excelente, muito caprichosa.', '2026-03-19 09:15:00+00'),
('rrrr4444-rrrr-4444-rrrr-444444444444', 'ssss3333-ssss-3333-ssss-333333333333', '33333333-3333-3333-3333-333333333333', 'Julia Santos', 5, 'Meu dog ama os passeios com o Pedro!', '2026-03-22 16:45:00+00'),
('rrrr5555-rrrr-5555-rrrr-555555555555', 'ssss4444-ssss-4444-ssss-444444444444', '11111111-1111-1111-1111-111111111111', 'Maria Silva', 5, 'Corte ficou perfeito!', '2026-03-18 11:20:00+00')
ON CONFLICT (service_id, user_id) DO NOTHING;

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

INSERT INTO public.subscriptions (id, user_id, plan, status, started_at, expires_at, payment_id) VALUES
('subs1111-s111-1111-s111-111111111111', '33333333-3333-3333-3333-333333333333', 'pro', 'active', '2026-03-01 00:00:00+00', '2026-04-01 00:00:00+00', 'pay_123456'),
('subs2222-s222-2222-s222-222222222222', '22222222-2222-2222-2222-222222222222', 'plus', 'active', '2026-02-15 00:00:00+00', '2026-05-15 00:00:00+00', 'pay_789012')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- REPORTS (exemplos vazios)
-- =====================================================
-- Nenhum relatório para incluir neste seed

COMMIT;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Users: ' || COUNT(*) FROM public.users;
SELECT 'Environments: ' || COUNT(*) FROM public.environments;
SELECT 'Environment Members: ' || COUNT(*) FROM public.environment_members;
SELECT 'Services: ' || COUNT(*) FROM public.services;
SELECT 'Services Active: ' || COUNT(*) FROM public.services WHERE is_active = true;
SELECT 'Reviews: ' || COUNT(*) FROM public.reviews;
SELECT 'Subscriptions: ' || COUNT(*) FROM public.subscriptions;

-- Listar serviços por ambiente
SELECT e.name as ambiente, s.title as servico, s.category, s.rating 
FROM public.services s 
JOIN public.environments e ON s.environment_id = e.id 
WHERE s.is_active = true 
ORDER BY e.name, s.title;

\echo '=========================================='
\echo 'DADOS DE TESTE INSERIDOS COM SUCESSO!'
\echo '=========================================='