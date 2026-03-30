# Roteiro de Correções (rote_fix)

Este documento consolida o checklist de conformidade do repositório **ZapZou** e descreve, para cada item, a **solução recomendada baseada no estado atual do projeto** (código, docs e migrations existentes).

> **Status (repo):** os itens deste roteiro já foram aplicados no código/documentação. Use a lista abaixo como auditoria e referência do porquê das mudanças.

## Contexto (realidade atual)

- O projeto está configurado para **Next.js** (`package.json` usa `next dev/build/start`) e o `README.md` descreve como rodar localmente.
- O legado Vite/React Router foi removido (sem `react-router-dom`, `src/pages/` ou `src/main.tsx`).
- `.env` e `.next/` não são versionados; existe `.env.example` como referência.
- O schema do Supabase (migrations) define `services.provider_id` e o app insere usando `provider_id`.
- Upload de imagens usa **Supabase Storage** (atual). Cloudflare R2 é planejado.
- Regras de banco (RLS + triggers + funções) já existem e impõem:
  - validação de **afiliação ativa**;
  - validação de **distância <= 500m**;
  - limites por **plano**;
  - anti-fraude por **WhatsApp/Instagram** duplicados;
  - `provider` preenchido por trigger a partir de `provider_id`.

## Como executar este roteiro (ordem recomendada)

1. **Higiene e segurança do repositório (P0)**: remover `.env` e `.next` do git, limpar artefatos e padronizar docs básicas.
2. **Alinhamento crítico com o banco (P0)**: corrigir `provider_id` e geolocalização (sem bypass por fallback).
3. **Clarificar o que é MVP vs “a implementar” (P1)**: Places/R2/API/offline/cidades.
4. **Qualidade e governança (P2)**: lint, scripts, arquivos de políticas do repo.

---

## Checklist detalhado + solução

### 1) [P0] Atualizar README para refletir o ZapZou (Next.js + Supabase)

**Problema (real):** `README.md` é de template Vite, não descreve como rodar o ZapZou.

**Solução proposta:**
- Reescrever `README.md` com:
  - pré-requisitos (Node, npm);
  - variáveis de ambiente (sem valores reais);
  - comandos: `npm install`, `npm run dev`, `npm run lint`, `npm run build`, `npm run start`;
  - link para a pasta `docs/` (documentação funcional/arquitetura);
  - seção “Banco/Supabase” com referência às migrations e ao fluxo de RLS.

**Critério de aceite:**
- Um dev novo consegue subir o projeto seguindo apenas o README, sem “adivinhar”.

---

### 2) [P0] Remover `.next/` do git (artefatos de build/cache)

**Problema (real):** `.next/` está no `.gitignore`, mas está **trackeado** (logo continua versionado).

**Solução proposta:**
- Remover do índice git sem apagar arquivos locais:
  - `git rm -r --cached .next`
  - manter `.next/` no `.gitignore` (já existe).
- Opcional: adicionar instrução no README para apagar `.next/` em caso de build quebrado.

**Critério de aceite:**
- `git ls-files .next` retorna vazio.

---

### 3) [P0] Remover `.env` do git e substituir por `.env.example`

**Problema (real):** `.env` está trackeado com valores reais.

**Solução proposta:**
- Remover `.env` do índice:
  - `git rm --cached .env`
- Criar `.env.example` com chaves **sem valores**:
  - `NEXT_PUBLIC_SUPABASE_URL=`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
  - `NEXT_PUBLIC_R2_PUBLIC_URL=`
- Manter `.env` no `.gitignore` (já existe).
- Rotacionar quaisquer chaves que tenham sido expostas em histórico (se aplicável).

**Critério de aceite:**
- `git ls-files .env` retorna vazio.
- Projeto funciona ao copiar `.env.example` -> `.env` e preencher valores.

---

### 4) [P0] Remover arquivo `nul`

**Problema (real):** existe arquivo `nul` (0 bytes). Em Windows isso é nome reservado e pode causar problemas em ferramentas.

**Solução proposta:**
- Remover do repositório.
- Verificar se algum script depende disso (improvável).

**Critério de aceite:**
- Arquivo não existe mais no repo.

---

### 5) [P0] Restringir `images.remotePatterns` no Next

**Problema (real):** `next.config.mjs` permite imagens de qualquer host (`hostname: '**'`), o que é permissivo demais e pode abrir superfícies desnecessárias.

**Solução proposta (MVP realista):**
- Trocar por uma lista mínima de domínios esperados, por exemplo:
  - Supabase Storage do projeto (`<project-ref>.supabase.co`)
  - domínio público do R2 (se realmente usado)
- Se ainda não houver certeza, começar com Supabase e adicionar R2 quando estiver ativo.

**Critério de aceite:**
- Imagens continuam carregando nas telas atuais.
- Não aceita host arbitrário.

---

### 6) [P0] Corrigir escrita em `services`: usar `provider_id` (não `user_id`)

**Problema (real):** o schema do banco usa `provider_id`, mas o app ainda faz insert com `user_id`.

**Solução proposta:**
- Atualizar `src/hooks/useApp.tsx` (e qualquer outro ponto) para inserir:
  - `provider_id: user.id`
  - remover `user_id` do payload
- Evitar setar campos que o banco já garante via trigger (ex.: `provider`).

**Critério de aceite:**
- Insert de serviço passa pelas triggers e não falha por coluna inexistente.

---

### 7) [P0] Impedir “bypass” da regra dos 500m (geolocalização)

**Problema (real):** hoje existe fallback para latitude/longitude do ambiente ou `0`, o que pode permitir passar no banco sem coordenadas reais.

**Solução proposta (baseada no banco atual):**
- Ao publicar, obter coordenadas via browser (`navigator.geolocation`) e enviar no insert/update.
- Se o usuário negar ou falhar, bloquear publicação com mensagem clara.
- Remover fallback automático `selectedEnvironment.latitude/longitude` e `0`.

**Critério de aceite:**
- Publicação falha quando não há coordenadas do usuário.
- Publicação falha quando distância > 500m (conforme função `can_publish_in_environment`).

---

### 8) [P1] Padronizar “fonte de verdade” para Storage (Supabase vs R2)

**Problema (real):**
- Docs dizem Cloudflare R2.
- Código hoje usa Supabase Storage no upload do serviço.
- Existia uma rota de upload stub no Next que não era usada (foi removida).

**Solução proposta (MVP realista): escolher 1 caminho e alinhar tudo**

Opção A (mais rápida/MVP): **assumir Supabase Storage como storage atual**
- Atualizar docs para “Storage: Supabase (por enquanto), R2 planejado”.
- Remover/ajustar menções a R2 no resumo/arquitetura (marcar como “🔄 a implementar”).
- Manter `NEXT_PUBLIC_R2_PUBLIC_URL` apenas se existir CDN/R2 ativo no ambiente.

Opção B (alinhada ao pitch): **implementar R2 de verdade**
- Implementar API route no Next para upload assinado (S3-compatible) e salvar URLs no DB.
- Atualizar `register-service` para usar essa rota em vez de Supabase Storage.

**Critério de aceite:**
- Um único fluxo de upload funcionando (sem fallback silencioso para base64).
- Documentação e env condizem com a implementação.

---

### 9) [P1] Padronizar “Ambientes/Places”: Google Places vs seed/manual

**Problema (real):** docs assumem Google Places API, mas não há implementação clara no código.

**Solução proposta (MVP realista):**
- Se o MVP já funciona com `environments` seedados:
  - manter seed/manual por enquanto;
  - atualizar docs para “Places API 🔄 a configurar”.
- Se precisa de busca real:
  - implementar endpoint para busca no Google Places (server-side) + criação/atualização de `environments` com lat/lng.

**Critério de aceite:**
- Usuário consegue encontrar/selecionar ambientes conforme o fluxo definido, sem “lacunas”.

---

### 10) [P1] Corrigir FAQ (contradições e TODOs)

**Problema (real):** o FAQ contém “TODO” e respostas conflitantes (API, offline, cidades, login).

**Solução proposta:**
- Revisar cada seção e manter **apenas a regra vigente**.
- Criar bloco “Planejado” separado para funcionalidades futuras, sem contradizer o comportamento atual.

**Critério de aceite:**
- FAQ não contém TODOs.
- Não existem duas respostas opostas para a mesma pergunta.

---

### 11) [P1] Atualizar/arquivar `relatorio-revisao-banco.md` (congelar como histórico)

**Problema (real):** relatório indica “login simulado”, mas o login atual já usa `signInWithOAuth`.

**Solução proposta:**
- Atualizar o relatório para refletir o estado atual **ou**
- Renomear para algo como “relatorio-2026-03-25.md” e criar um novo relatório atual.
- Remover links hardcoded para um projeto específico do Supabase (não colocar IDs/URLs sensíveis em docs públicas do repo).

**Critério de aceite:**
- Não há afirmações sabidamente falsas no relatório principal.

---

### 12) [P1] Remover/arquivar legado Vite/React Router

**Problema (real):** existe uma base “Vite/React Router” coexistindo com Next App Router (tende a confundir e gerar dependência morta).

**Solução proposta (realista):**
- Definir oficialmente: “A aplicação é Next.js; legado fica em `src/_pages_legacy/` ou é removido”.
- Remover dependência `react-router-dom` se não for usada.
- Remover `src/main.tsx` e assets de Vite se não fizerem parte do build.

**Critério de aceite:**
- `npm run dev` sobe sem nenhuma referência ao legado.
- Dependências refletem o runtime real.

---

### 13) [P1] ESLint: alinhar configuração ao Next (sem preset de Vite)

**Problema (real):** `eslint.config.js` usa `reactRefresh.configs.vite`.

**Solução proposta:**
- Trocar para regras/presets compatíveis com Next (ex.: `next/core-web-vitals`), mantendo TypeScript.
- Garantir que `npm run lint` execute e reporte corretamente.

**Critério de aceite:**
- Lint roda sem configurações inconsistentes com Next.

---

### 14) [P1] Publicar “regras do projeto” que hoje estão untracked (docs/migrations)

**Problema (real):** `docs/` e `migrations/` aparecem como não versionados no status, mas são a base das regras.

**Solução proposta:**
- Adicionar `docs/` e `migrations/` no git (com revisão do que pode/ não pode ir para o repo).
- Garantir que não há segredos/URLs específicas indevidas dentro desses arquivos.

**Critério de aceite:**
- `docs/` e `migrations/` são versionados e revisáveis.

---

### 15) [P2] Adicionar arquivos de governança mínimos (se o repo for colaborativo)

**Problema (real):** não há `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.editorconfig`.

**Solução proposta:**
- Criar os arquivos mínimos com regras de contribuição, segurança e padronização.
- Se o projeto for fechado, ao menos `.editorconfig` + `CONTRIBUTING.md` simplificado ajudam.

**Critério de aceite:**
- Regras ficam claras para qualquer contribuidor.

---

## Observações finais

- Itens P0 são “conformidade básica” (segurança + integridade do repo) e devem ser tratados primeiro.
- O banco já é a fonte de verdade de regras de negócio; o app precisa **parar de “inventar” defaults** que contornem RLS/triggers.
- Sempre que ajustar regras em docs (R2/Places/API/offline), separar claramente:
  - **Funciona hoje**
  - **Planejado / a implementar**
