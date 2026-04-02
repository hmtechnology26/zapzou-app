# 5. Arquitetura do Sistema

## Visão Geral

A arquitetura do Conectae segue um modelo moderno de aplicação web com foco em escalabilidade, manutenibilidade e experiência mobile-first. O sistema utiliza Next.js para o frontend/backend e Supabase como Backend-as-a-Service.

---

## 5.1. Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Pages   │  │Components│  │ Hooks    │  │ Context  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └─────────────┴─────────────┴─────────────┘              │
│                            │                                    │
│                      ┌─────▼─────┐                              │
│                      │  Supabase │                              │
│                      │  Client   │                              │
│                      └─────┬─────┘                              │
└────────────────────────────┼────────────────────────────────────┘
                             │
      ┌──────────────────────┼──────────────────────┐
      │                      │                      │
┌─────▼─────┐      ┌────────▼────────┐    ┌────────▼────────┐
│   Auth    │      │  Database       │    │ Cloudflare R2  │
│ (Google)  │      │  (PostgreSQL)   │    │ (Images)        │
└───────────┘      └─────────────────┘    └─────────────────┘
      │                      │                      │
      │                      │         ┌───────────▼───────────┐
      │                      │         │  Google Places API   │
      │                      │         │  (Ambientes)          │
      │                      │         └─────────────────────┘
      └──────────────────────┘
```

---

## 5.2. Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.x | Framework React com App Router |
| React | 18.x | Biblioteca de UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Framework de estilos |
| Material Symbols | 4.x | Ícones (Google Fonts) |

### Backend (BaaS)
| Serviço | Tecnologia | Função |
|---------|------------|--------|
| Supabase Auth | OAuth (Google) | Autenticação de usuários |
| Supabase DB | PostgreSQL | Banco de dados relacional |
| Supabase Storage | Object Storage | Armazenamento de imagens dos serviços |
| Cloudflare R2 | S3-compatible | Armazenamento de imagens (futuro) |
| Google Places API | REST | Busca automática de ambientes (implementado) |
| Payment Gateway | future | Processamento de pagamentos (a definir) |

---

## 5.3. Estrutura de Diretórios

```
src/
├── app/                    # Next.js App Router (rotas)
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Homepage
│   ├── explore/            # Explorar serviços
│   ├── login/              # Login
│   ├── meus-anuncios/      # Meus serviços
│   ├── places/             # Ambientes
│   ├── profile/            # Perfil
│   ├── register-service/   # Criar/editar serviço
│   ├── service/[slug]/     # Detalhes do serviço
│   ├── plans/              # Planos (free, pro, plus)
│   ├── moderation/         # Moderação
│   ├── admin/              # Configurações administrativas
│   │   ├── settings/       # Configurações admin
│   │   ├── visibility/     # Visibilidade
│   │   ├── logo/           # Logo admin
│   │   └── logs/           # Logs admin
│   ├── notifications/      # Notificações
│   ├── favorites/          # Locais favoritos
│   ├── bulletins/          # Boletins
│   ├── finances/           # Finanças
│   ├── members/            # Membros
│   ├── contact/            # Contato
│   ├── edit-profile/       # Editar perfil
│   ├── auth/callback/      # Callback auth
│   ├── terms/              # Termos de uso
│   └── privacy/            # Política de privacidade
├── components/             # Componentes reutilizáveis
│   ├── BottomNav.tsx       # Navegação inferior
│   ├── TopAppBar.tsx       # Barra superior
│   ├── PublishModal.tsx    # Modal de publicação
│   ├── Icon.tsx            # Wrapper de ícones
│   ├── Avatar.tsx          # Avatar de usuário
│   ├── GoogleMap.tsx       # Componente de mapa
│   ├── PlanCheckout.tsx    # Checkout de planos
│   ├── ReviewForm.tsx      # Formulário de avaliações
│   ├── ReviewsList.tsx     # Lista de avaliações
│   └── StarRating.tsx      # Componente de rating
├── hooks/                  # Custom hooks
│   └── useApp.tsx          # Context + integrações com Supabase
├── contexts/               # React Contexts
│   └── PublishModalContext.tsx
├── lib/                    # Utilitários
│   ├── supabase.ts         # Cliente Supabase
│   ├── maps.ts             # Integração Google Places API
│   └── environment-rules.ts # Regras de ambientes
├── types/                  # TypeScript types
│   └── index.ts            # Interfaces do sistema
└── styles/                # Estilos globais
    └── globals.css
```

---

## 5.4. Padrões de Código

### Componentes
- Componentes funcionais com TypeScript
- Props tipadas com interfaces
- Nomes em PascalCase (ex: `ServiceCard`)
- Separação de preocupações (UI vs Lógica)

### Hooks e Estado
- `useApp.tsx` como único estado global (Context API)
- Estados locais com `useState`
- Efeitos com `useEffect` para operações async
- Custom hooks para lógicas reutilizáveis

### naming
- Componentes: PascalCase
- Funções/variáveis: camelCase
- Arquivos: kebab-case

---

## 5.5. Fluxo de Dados

### Autenticação
1. Usuário clica "Entrar com Google"
2. Supabase Auth processa OAuth
3. Usuário armazenado no Context `useApp`
4. Session mantida no localStorage

### Busca de Serviços
1. Usuário digita termo ou seleciona categoria
2. Filtro aplicado no array de serviços (local)
3. Resultados renderizados na UI
4. Lazy loading para performance

### Publicação de Serviço
1. Usuário preenche formulário
2. Fotos convertidas para Base64 (client-side)
3. Dados salvos no estado (Context)
4. Se ambiente = igreja → status = "pending" (moderação)
5. Se ambiente normal → status = "active"

---

## 5.6. Integração com Supabase

### Tabelas Principais
- `users` - Perfis de usuários
- `environments` - Ambientes (condomínios, igrejas)
- `services` - Serviços publicados
- `reviews` - Avaliações
- `members` - Membros de ambientes

### Queries Principais
```typescript
// Buscar ambientes
supabase.from('environments').select('*')

// Buscar serviços
supabase.from('services').select('*').eq('status', 'active')

// Criar serviço
supabase.from('services').insert([{ ... }])

// Atualizar serviço
supabase.from('services').update({ ... }).eq('id', id)
```

---

## 5.7. Considerações de Performance

### Otimizações Implementadas
- **Image optimization:** Lazy loading de imagens
- **Code splitting:** Next.js automático por rota
- **State management:** Context distribuído
- **Local storage:** Cache de dados para offline

### Boas Práticas
- Limitar re-renders com `useMemo`/`useCallback` quando necessário
- Virtualizar listas grandes (próximas fases)
- Compression de imagens antes do upload
- Paginação em listas de serviços (futuro)

---

## 5.8. Segurança

### Autenticação
- OAuth 2.0 com Google
- Sessão gerenciada pelo Supabase
- Tokens não expostos ao cliente

### Dados
- Row Level Security (RLS) no Supabase
- Validação de dados no frontend e backend
- Sanitização de inputs

### Imagens
- Upload via Supabase Storage (atual)
- Integração com Cloudflare R2 (planejado)
- Validação de tipos (apenas imagens)
- Limite de tamanho (max 5MB por imagem)
- Otimização de imagens (WebP automatico)
- CDN global para entrega rápida

---

## 5.9. Integração com Cloudflare R2

### Visão Geral
Atualmente, o Conectae utiliza **Supabase Storage** para upload e entrega de imagens. A integração com **Cloudflare R2** é **planejada** para reduzir custos e permitir uma camada de distribuição mais eficiente. O R2 oferece:
- **Zero egress** - Sem custos de transferência de dados
- **S3-compatible** - Compatibilidade com SDKs e ferramentas S3
- **CDN global** - Entrega rápida de imagens em qualquer lugar

### Tamahos de Imagens
O sistema gera 3 versões de cada imagem para otimizar carregamento:

| Tamanho | Dimensão | Uso | Qualidade |
|---------|----------|-----|------------|
| **Thumbnail** | 150x150 px | Cards de serviços, listas | 70% |
| **Medium** | 400x400 px | Detalhes do serviço, galeria | 80% |
| **Large** | 800x800 px | Visualização completa | 90% |

### Estrutura de Pastas
```
zapzou-bucket/
├── services/
│   ├── {service-id}/
│   │   ├── thumb.jpg      # 150x150
│   │   ├── medium.jpg     # 400x400
│   │   ├── large.jpg      # 800x800
│   │   └── original.jpg  # Preservado original
├── environments/
│   └── {environment-id}/
│       └── logo.jpg       # thumb + medium
└── users/
    └── {user-id}/
        └── avatar.jpg     # thumb + medium
```

### Fluxo de Upload Otimizado
```
1. Usuário seleciona imagens no formulário
2. Upload inicia IMEDIATAMENTE (sem processamento síncrono)
3. Imagem original enviada para R2
4. Processamento em background (async)
5. Quando pronto, thumbnails são gerados
6. UI atualiza automaticamente via polling/websocket
```

### Estratégia de Processamento
- **Background Processing**: Não blocking - usuário não espera processar
- **Cloudflare Workers**: Processamento serverless para resize
- **Fallback**: Se processing falhar, usa original
- **Incremental**: Cada uploaded gera 3 versões

### Configuração de Cache
- Imagens servem via Cloudflare CDN
- Headers de cache otimizados (Cache-Control: public, max-age=31536000)
- Suporte a WebP automático via Cloudflare Polish

### Limites e Custos
- **Tamanho original**: máx 10MB (para garantir qualidade)
- **Processados**: máx 2MB cada
- **Formatos**: JPEG, PNG, WebP (convertido automaticamente)
- **Máximo imagens/serviço**: 5
- **Conversão**: Assíncrona - não bloqueia publicação

### Variantes de Uso no Frontend
```typescript
// Exemplo de uso das diferentes versões
const serviceImage = {
  thumbnail: '.../thumb.jpg',  // Cards
  medium: '.../medium.jpg',   // Galeria
  large: '.../large.jpg',     // Modal/details
  original: '.../original.jpg' // Download
};

// Uso según tamanho de tela
const getImageForScreen = (width: number) => {
  if (width < 400) return serviceImage.thumbnail;
  if (width < 800) return serviceImage.medium;
  return serviceImage.large;
};
```

---

## 5.10. Integração com Google Places API

> **Status atual:** Ambientes são lidos da tabela `environments` no Supabase, e a integração com Google Places API está **implementada** para descoberta automática de condomínios, igrejas, clubes e associações.

### Tipos de Local Suportados
- **establishment** → condomínios, escritórios
- **church** → igrejas, templos
- **club** → clubes sociais, esportivos
- **association** → associações de bairro

### Fluxo de Busca
```
1. Usuário acessa "Explorar Ambientes"
2. Sistema obtém localização atual (ou usa default)
3. Chama Google Places API (Nearby Search / Text Search) (planejado)
4. Filtra resultados por tipo (church, club, etc.)
5. Exibe lista de ambientes encontrados
6. Usuário seleciona → salva no perfil
```

### Dados Capturados do Google Places
- place_id (identificador único)
- name (nome do ambiente)
- formatted_address (endereço)
- types (categorias)
- geometry.location (lat/lng)
- photos (imagens do local)
- rating (nota do Google)

### Armazenamento
- Ambientes selecionados são salvos no banco local (Supabase)
- Cache para reduzir chamadas à API
- Dados sincronizados periodicamente

### Limites e Considerações
- API key com limitações de requisições (configurar quotas)
- Rate limiting: implementar cache e debounce
- Alternativa: usar Text Search para buscas por nome

---

## 5.10. Preparação para Gateway de Pagamento

### Arquitetura Futura
O sistema está preparado para integração com gateway de pagamentos, mas o gateway específico será definido futuramente.

### Dados Necesários
- Dados do usuário (nome, email, CPF/CNPJ)
- Plano selecionado
- Histórico de assinaturas

### Tabelas Preparadas
```sql
subscriptions (
  id
  user_id
  plan
  status (active, cancelled, expired)
  started_at
  expires_at
  payment_id
)
```

### Próximos Passos
1. Definir gateway (MercadoPago, Stripe, PagarMe)
2. Implementar checkout flow
3. Webhooks para confirmação de pagamento
4. Sistema de recorrência (mensal/anual)

---

## Resumo das Integrações

| Serviço | Provedor | Status |
|---------|----------|--------|
| Auth | Supabase + Google OAuth | ✅ Configurado |
| Database | Supabase PostgreSQL | ✅ Configurado |
| Storage | Supabase Storage | ✅ Configurado |
| Places | Google Places API | ✅ Implementado |
| Payments | Gateway a definir | 🔄 Preparado |
