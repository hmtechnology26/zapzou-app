# ZapZou

Marketplace local de serviços para comunidades (condomínios, igrejas, clubes e associações). Conecta prestadores e clientes, com contato direto via WhatsApp/Instagram.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + Storage)

## Rodando localmente

Pré-requisitos:
- Node.js (recomendado: 18+)
- npm

Passos:

1. Instalar dependências:
   - `npm install`
2. Configurar variáveis de ambiente:
   - copiar `/.env.example` para `/.env`
   - preencher valores do Supabase
3. Rodar em dev:
   - `npm run dev`

## Scripts

- `npm run dev` — roda o Next em desenvolvimento
- `npm run build` — build de produção
- `npm run start` — inicia a aplicação buildada
- `npm run lint` — lint (ESLint)

## Banco (Supabase) e regras

As migrations e regras de negócio ficam em `migrations/`.

- `migrations/001_initial_schema.sql` contém schema, triggers e policies RLS (inclui validações de afiliação, distância e limites de plano).
- `migrations/002_seed_data.sql` contém seed inicial.

Aplicação típica:
- executar as migrations no Supabase SQL Editor (ordem numérica).

## Documentação do produto

Os documentos funcionais/arquiteturais estão em `docs/`.

- `docs/1-resumo-sistema.md`
- `docs/5-arquitetura.md`
- `docs/faq.md`
- `docs/rote_fix.md` (roteiro de correções e conformidade do repo)

## Segurança

- Nunca commitar `.env` (use `/.env.example`).
- Não versionar artefatos de build (`.next/`, `dist/`).
