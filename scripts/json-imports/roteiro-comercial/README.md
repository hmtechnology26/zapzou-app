# Importador Roteiro Comercial

Importador isolado para popular o ConectaE a partir de `roteirocomercial_data.json`, sem alterar código da aplicação, regras, APIs ou fluxo atual.

## Estrutura real usada

O schema atual não possui tabelas próprias para `estabelecimento`, `contatos`, `endereço` ou `categorias`.

O de/para real fica assim:

- usuário: `public.users`
- estabelecimento: representado pelo conjunto `users + services`
- anúncio: `public.services`
- imagens: `services.image_url` e `services.images_urls`
- contatos: `services.whatsapp`, `services.instagram`, `services.website_url`
- ambiente: `public.environments`
- vínculo do usuário com ambiente: `public.environment_members`
- vínculo do anúncio com ambiente: `public.service_environment_links`

## Regra de ambiente do script

O script não usa mais um ambiente fixo.

Para cada anúncio ele:

1. lê latitude/longitude do JSON
2. consulta a Google Places API
3. procura o condomínio mais próximo
4. se não encontrar condomínio confiável, usa fallback de bairro/região via Google Geocoding
5. reaproveita ambiente existente por `google_place_id`
6. cria ambiente novo somente quando necessário, usando apenas o schema atual

## Alteração permitida no banco

A única alteração estrutural prevista continua sendo:

- `services.import_source`

Valor usado:

- `roteiro_comercial`

## Backup

Antes do `--apply`, o script gera backup JSON em:

`scripts/json-imports/roteiro-comercial/backups/<timestamp>/`

Tabelas cobertas:

- `users`
- `environments`
- `environment_members`
- `services`
- `service_environment_links`
- `reviews`
- `subscriptions`
- `reports`
- `user_place_favorites`

## Pré-requisitos do apply

Para `--apply`, além das variáveis públicas já presentes no `.env`, você precisa de:

- `SUPABASE_SERVICE_ROLE_KEY`

Sem `SUPABASE_SERVICE_ROLE_KEY`, não é possível:

- fazer backup completo
- criar usuários autenticáveis em `auth.users`
- criar usuários internos em `public.users`
- criar ambientes
- criar memberships
- inserir anúncios administrativamente

O upload das imagens usa o mesmo fluxo da aplicaÃ§Ã£o:

- cria o usuÃ¡rio importado em `auth.users`
- autentica temporariamente com esse usuÃ¡rio
- solicita URL assinada na edge function `r2-signed-upload`
- envia a imagem para o R2

## Comandos

Dry-run:

```bash
node scripts/json-imports/roteiro-comercial/import-roteiro-comercial.mjs --dry-run
```

Dry-run em JSON:

```bash
node scripts/json-imports/roteiro-comercial/import-roteiro-comercial.mjs --dry-run --json
```

Importação real:

```bash
node scripts/json-imports/roteiro-comercial/import-roteiro-comercial.mjs --apply
```

Limitar volume:

```bash
node scripts/json-imports/roteiro-comercial/import-roteiro-comercial.mjs --dry-run --limit=100
```
