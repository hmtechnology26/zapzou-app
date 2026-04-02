# 1. Resumo do Sistema

## Visão Geral do Projeto

**Conectae** é uma plataforma digital de marketplace de serviços local que conecta prestadores de serviços a clientes dentro de suas comunidades vizinhas, como condomínios residenciais, igrejas, clubes e associações.

---

## Problema

Em comunidades locais (condomínios, igrejas, bairros), há uma necessidade constante de encontrar prestadores de serviços confiáveis e próximos. As soluções atuais (grupos de WhatsApp, murais físicos, indicações boca a boca) são descentralizadas, difíceis de gerenciar e não oferecem uma experiência moderna de busca e contratação.

---

## Solução

Uma plataforma mobile-first que permite:
- **Autenticação:** Login exclusivamente via Google (OAuth2) com integração nativa Supabase - não há sistema de cadastro de usuários
- **Ambientes:** Integração com Google Places API para busca automática de condomínios, igrejas, clubes e associações. Ambientes também podem ser cadastrados manualmente no banco (tabela `environments`).
- **Validação de localização:** Para publicar serviços, o usuário precisa estar dentro de 500m do ambiente (quando o ambiente possui latitude/longitude cadastradas).
- **Moderação:** Apenas para ambientes do tipo igreja - líderes podem aprobar/rejeitar prestadores (não serviços)
- **Para prestadores:** Criar perfil profissional, publicar serviços com fotos e menu, receber avaliações e construir reputação dentro da comunidade.
- **Para clientes:** Encontrar serviços próximos, verificar avaliações, entrar em contato diretamente via WhatsApp/Instagram, e descobrir novos prestadores por geolocalização.

---

## Público-Alvo

### Segmentos principais:
- **Prestadores de serviços:** Profissionais autônomos (diaristas, entregadores, pet walkers, culinários, técnicos, etc.) que atuam em comunidades específicas
- **Moradores/Clientes:** Pessoas que buscam serviços locais confiáveis no seu condomínio, igreja ou associação
- **Administradores:** Síndicos, líderes religiosos, gestores de clubes que precisam gerenciar membros e serviços disponíveis

---

## Diferenciais Competitivos

1. **Ambientes prontos para expansão:** Ambientes são buscados via Google Places API (implementado). Também podem ser cadastrados manualmente no banco (tabela `environments`).
2. **Validação de localização:** Usuário precisa estar dentro de 500m do ambiente para publicar serviços - localização validada periodicamente
3. **Moderação por prestador:** Apenas ambientes igrejas podem approve/reject prestadores (não serviços)
4. **Anti-fraude:** Sistema detecta prestadores com mesmo WhatsApp/Instagram em diferentes contas Google para evitar burla de planos
5. **Foco comunitário:** O conteúdo é organizado por ambientes/comunidades; a publicação pode exigir afiliação e regras locais (ex.: igrejas com moderação)
6. **Sistema de planos:** FREE (2 serviços/1 ambiente), PRÓ (5 serviços/múltiplos ambientes), PLUS (ilimitado)
7. **Zero atrito:** Contato direto via WhatsApp/Instagram sem intermediários

---

## Modelo de Monetização

- **Plano FREE:** Gratuito, até 2 serviços publicados em 1 ambiente, visibilidade básica
- **Plano PRÓ:** R$9,90/mês, até 5 serviços, pode publicar em múltiplos ambientes, badge de verificação, prioridade de visualização
- **Plano PLUS:** R$29,90/mês, serviços ilimitados, pode publicar em múltiplos ambientes, análises avançadas (sem API de integração)

---

## Tecnológico

- **Frontend:** Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Storage:** Supabase Storage (atual)
- **Mobile-first:** PWA-ready com design responsivo
- **Ícones:** Material Symbols (Google Fonts)
- **Autenticação:** Google OAuth via Supabase Auth (integração nativa)
- **Locais/Ambientes:** Integração com Google Places API para busca automática de condomínios, igrejas e outros ambientes
- **Pagamentos:** Preparado para integração futura (gateway a definir)
