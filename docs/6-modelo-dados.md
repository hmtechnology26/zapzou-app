# 6. Modelo de Dados

## Visão Geral

Este documento define as entidades, atributos e relacionamentos do banco de dados do ZapZou. O modelo utiliza PostgreSQL via Supabase.

---

## 6.1. Entidades Principais

### Tabela: `users`
Armazena os perfis dos usuários do sistema (criados automaticamente via Google OAuth).

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| email | VARCHAR(255) | Email do usuário (Google) | Sim |
| name | VARCHAR(150) | Nome completo | Sim |
| avatar | TEXT | URL do avatar (Google) | Não |
| role | ENUM('user', 'moderator') | Papel do usuário | Sim |
| plan | ENUM('free', 'pro', 'plus') | Plano ativo | Não |
| created_at | TIMESTAMP | Data de criação | Sim |
| updated_at | TIMESTAMP | Última atualização | Não |

**OBS:** Não existe interface de cadastro. Usuários são criados automaticamente via login Google.

---

### Tabela: `environments`
Armazena os ambientes (condomínios, igrejas, clubes, associações).

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| name | VARCHAR(150) | Nome do ambiente | Sim |
| slug | VARCHAR(150) | URL amigável | Sim |
| type | ENUM('residential', 'church', 'club', 'association') | Tipo de ambiente | Sim |
| description | TEXT | Descrição | Não |
| image_url | TEXT | URL do logo/foto | Não |
| members_count | INTEGER | Contagem de membros | Não |
| status | ENUM('active', 'inactive') | Status | Sim |
| latitude | DECIMAL | Latitude (geolocalização) | Não |
| longitude | DECIMAL | Longitude (geolocalização) | Não |
| created_at | TIMESTAMP | Data de criação | Sim |
| updated_at | TIMESTAMP | Última atualização | Não |

---

### Tabela: `services`
Armazena os serviços publicados pelos prestadores.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| slug | VARCHAR(150) | URL amigável | Sim |
| title | VARCHAR(150) | Título do serviço | Sim |
| description | TEXT | Descrição detalhada | Sim |
| category | VARCHAR(50) | Categoria (Alimentação, Limpeza, etc) | Sim |
| image_url | TEXT | URL da imagem principal (large) | Não |
| images_urls | JSONB | Array de URLs de imagens (todas as versões) | Não |
| image_thumb_url | TEXT | URL thumbnail (150x150) | Não |
| image_medium_url | TEXT | URL medium (400x400) | Não |
| image_original_url | TEXT | URL da imagem original | Não |
| image_status | VARCHAR(20) | Status do processamento ('processing', 'ready', 'failed') | Não |
| provider | VARCHAR(150) | Nome do prestador | Sim |
| provider_id | UUID | ID do prestador (FK users) | Sim |
| price | VARCHAR(50) | Preço (texto livre) | Não |
| whatsapp | VARCHAR(20) | Número WhatsApp | Não |
| instagram | VARCHAR(100) | Handle Instagram | Não |
| frequency | VARCHAR(50) | Disponibilidade (diário, semanal) | Não |
| rating | DECIMAL(2,1) | Nota média (0-5) | Não |
| reviews_count | INTEGER | Total de avaliações | Não |
| tags | JSONB | Array de tags | Não |
| menu | JSONB | Cardápio/itens com preços | Não |
| is_active | BOOLEAN | Se está ativo | Sim |
| environment_id | UUID | ID do ambiente (FK environments) | Sim |
| latitude | DECIMAL | Latitude do prestador (validação) | Não |
| longitude | DECIMAL | Longitude do prestador (validação) | Não |
| last_location_check | TIMESTAMP | Última verificação de localização | Não |
| created_at | TIMESTAMP | Data de criação | Sim |
| updated_at | TIMESTAMP | Última atualização | Não |

**OBS:** 
- `image_status` indica se as versões otimizadas estão prontas (processing → ready/failed)
- Se processamento falhar, usa imagem original diretamente
- O serviço é publicado imediatamente, mesmo com processing pendente
- WhatsApp e Instagram são validados contra duplicatas para anti-fraude

---

### Tabela: `reviews`
Armazena as avaliações dos serviços.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| service_id | UUID | ID do serviço (FK services) | Sim |
| user_id | UUID | ID do avaliador (FK users) | Sim |
| user_name | VARCHAR(150) | Nome do avaliador | Sim |
| stars | INTEGER | Nota (1-5) | Sim |
| comment | TEXT | Comentário | Não |
| created_at | TIMESTAMP | Data da avaliação | Sim |

---

### Tabela: `environment_members`
Relacionamento entre usuários e ambientes (membership).

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| user_id | UUID | ID do usuário (FK users) | Sim |
| environment_id | UUID | ID do ambiente (FK environments) | Sim |
| unit | VARCHAR(50) | Unidade/apartamento | Não |
| role | ENUM('member', 'moderator') | Papel no ambiente | Sim |
| status | ENUM('pending', 'active', 'banned') | Status de aprovação | Sim |
| created_at | TIMESTAMP | Data de entrada | Sim |
| updated_at | TIMESTAMP | Última atualização | Não |

**OBS:** 
- Moderadores só existem em ambientes do tipo 'church'
- Pode haver múltiplos moderadores por ambiente
- status 'banned' para prestadores banidos via denúncia

---

### Tabela: `subscriptions`
Armazena as assinaturas/planos pagos.

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|------------|--------------|
| id | UUID | Identificador único | Sim |
| user_id | UUID | ID do usuário (FK users) | Sim |
| plan | ENUM('free', 'pro', 'plus') | Plano contratado | Sim |
| status | ENUM('active', 'cancelled', 'expired') | Status | Sim |
| started_at | TIMESTAMP | Início da assinatura | Sim |
| expires_at | TIMESTAMP | Expiração | Não |
| payment_id | VARCHAR(100) | ID do pagamento externo | Não |
| created_at | TIMESTAMP | Data de criação | Sim |

---

## 6.2. Relacionamentos

```
users (1) ──────< (N) environment_members
users (1) ──────< (N) services
users (1) ──────< (N) reviews
users (1) ──────< (N) subscriptions
environments (1) ──────< (N) environment_members
environments (1) ──────< (N) services
services (1) ──────< (N) reviews
```

---

## 6.3. Tipo Enum

### Status de Serviço
```sql
'pending'   -- Aguardando moderação
'active'   -- Ativo/publicado
'rejected' -- Rejeitado
```

### Tipo de Ambiente
```sql
'residential'  -- Condomínio residencial
'church'      -- Igreja
'club'        -- Clube
'association' -- Associação
```

### Plano
```sql
'free'  -- Gratuito
'pro'   -- R$9,90/mês
'plus'  -- R$29,90/mês
```

---

## 6.4. Estado Local (Context API)

Além do banco de dados, o sistema gerencia estado local no cliente via React Context:

### `useApp` State
```typescript
interface AppState {
  user: User | null;
  selectedEnvironments: Environment[];
  selectedEnvironment: Environment | null;
  services: Service[];
  members: Member[];
  loading: boolean;
}
```

### Estrutura de Service (Frontend)
```typescript
interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  price?: string;
  provider: string;
  frequency?: string;
  isActive?: boolean;
  WhatsApp?: string;
  instagram?: string;
  status: 'active' | 'pending' | 'rejected';
  environmentId?: string;
  environmentSlug?: string;
  environments?: { id: string; slug: string }[];
  verified?: boolean;
  location?: string;
  tags?: string[];
  menu?: MenuItem[];
  latitude?: number;
  longitude?: number;
}
```

---

## 6.5. Índices Recomendados

Para performance óptima, criar índices nas colunas frequentemente consultadas:

```sql
-- Busca de serviços por ambiente
CREATE INDEX idx_services_environment ON services(environment_id);

-- Serviços ativos
CREATE INDEX idx_services_active ON services(is_active, status);

-- Busca por categoria
CREATE INDEX idx_services_category ON services(category);

-- Avaliações por serviço
CREATE INDEX idx_reviews_service ON reviews(service_id);

-- Membros por ambiente
CREATE INDEX idx_members_environment ON environment_members(environment_id);
```

---

## 6.6. Row Level Security (RLS)

Configurações de segurança a nível de linha:

```sql
-- Serviços: todos podem ver ativos, apenas_owner pode editar
CREATE POLICY "services_read_active" ON services
  FOR SELECT USING (status = 'active');

CREATE POLICY "services_manage_own" ON services
  FOR ALL USING (auth.uid() = user_id);
```

---

## 6.7. Dados de Exemplo (Seed)

### Ambientes padrão
```json
[
  {
    "id": "1",
    "name": "Residencial Aurora",
    "slug": "residencial-aurora",
    "type": "residential",
    "members_count": 120
  },
  {
    "id": "2", 
    "name": "Paróquia Santo Antônio",
    "slug": "paroquia-santo-antonio",
    "type": "church",
    "members_count": 200
  }
]
```

### Serviços de exemplo
- Marmitas da Julia (Alimentação)
- Limpeza Residencial (Limpeza)
- Dog Walker - Pedro (Pet Sitting)