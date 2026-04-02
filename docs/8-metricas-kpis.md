# 8. Métricas e KPIs

## Visão Geral

Este documento define as métricas e indicadores de performance (KPIs) para medir o sucesso do sistema Conectae. As métricas estão organizadas em categorias: engajamento, conversão, retenção e negócio.

---

## 8.1. Métricas de Engajamento

### Métricas de Usuário
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **DAU** | Usuários ativos diários | Usuários que abriram o app no dia | Crescimento 10% mês |
| **MAU** | Usuários ativos mensais | Usuários únicos no mês | Crescimento 15% mês |
| **DAU/MAU** | Stickiness ratio | (DAU / MAU) * 100 | > 30% |
| **Sessões por usuário** | Média de sessões diárias | Total de sessões / usuários únicos | > 2 |
| **Tempo na sessão** | Tempo médio por sessão | Média de tempo por visita | > 3 min |
| **Pages per session** | Páginas por sessão | Total pageviews / sessões | > 5 |

### Métricas de Serviços
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Serviços visualizados** | Total de visualizações | Sum de pageviews de serviços | Crescimento 20% |
| **Visualizações por serviço** | Média de visualizações | Total visualizações / serviços | > 50 |
| **Buscas realizadas** | Número de buscas | Contagem de buscas | > 1000/mês |
| **Filtros utilizados** | Uso de filtros | Contagem de uso de filtros | > 30% buscas |

---

## 8.2. Métricas de Conversão

### Funil de Prestadores
| Etapa | Métrica | Fórmula | Meta |
|-------|---------|---------|------|
| Visitantes | Visitantes na página de publicação | unique visitors | 500/mês |
| Inicia formulário | Taxa de início | (iniciados / visitantes) * 100 | > 15% |
| Completa publicação | Taxa de conclusão | (completados / iniciados) * 100 | > 60% |
| Serviço ativo | Taxa de ativação | (ativos / publicados) * 100 | > 80% |

### Ações de Contato
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Cliques WhatsApp** | Total de cliques no botão WhatsApp | Contagem de clicks | Crescimento 20% |
| **Cliques Instagram** | Total de cliques no link Instagram | Contagem de clicks | Crescimento 15% |
| **Taxa de contato** | (cliques / visualizações) * 100 | % usuários que contatam | > 10% |

### Planos e Monetização
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Visitantes Planos** | Visitantes na página de planos | unique visitors | 200/mês |
| **Upgrade requests** | Solicitações de upgrade | contagem | 5% dos visitantes |
| **Conversion rate** | (pagamentos / visitantes planos) * 100 | % conversão | > 3% |

---

## 8.3. Métricas de Retenção

### Retenção de Usuários
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **D1 Retention** | Usuários que voltam no dia 1 | (retornam D1 / total D0) * 100 | > 40% |
| **D7 Retention** | Usuários que voltam no dia 7 | (retornam D7 / total D0) * 100 | > 20% |
| **D30 Retention** | Usuários que voltam no dia 30 | (retornam D30 / total D0) * 100 | > 10% |
| **Churn rate** | Taxa de流失 | (usuários inativos / total) * 100 | < 5% |

### Retenção de Prestadores
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Prestadores ativos** | Prestadores com serviço ativo | contagem | > 50 |
| **Serviços mantidos** | Serviços que permanecem ativos | (ativos / publicados) * 100 | > 70% |
| **Tempo médio ativo** | Dias médio com serviço ativo | média | > 30 dias |

---

## 8.4. Métricas de Comunidade

### Ambientes
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Ambientes ativos** | Total de ambientes com serviço | contagem | > 10 |
| **Membros por ambiente** | Média de membros por ambiente | total membros / ambientes | > 50 |
| **Serviços por ambiente** | Média de serviços por ambiente | total serviços / ambientes | > 5 |

### Moderação
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **Serviços pendentes** | Serviços aguardando moderação | contagem | < 20 |
| **Tempo de moderação** | Tempo médio de aprovação | média de horas | < 24h |
| **Taxa de aprovação** | % serviços aprovados | (aprovados / total) * 100 | > 70% |

---

## 8.5. Métricas de Negócio

### Revenue (Futuro)
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **MRR** | Receita mensal recorrente | soma de assinaturas ativas | Crescimento 10% |
| **ARPU** | Receita média por usuário | MRR / total usuários | > R$ 5,00 |
| **LTV** | Valor vitalício do cliente | ARPU / churn rate | > R$ 100 |

### Custo (Futuro)
| KPI | Descrição | Fórmula | Meta |
|-----|------------|---------|------|
| **CAC** | Custo de aquisição de cliente | marketing / novos clientes | < R$ 30 |
| **Churn value** | Valor perdido por churn | MRR * churn rate | < 5% |

---

## 8.6. Dashboard de Métricas

### Prioritárias (MVP)
1. **DAU/MAU** - Engajamento
2. **Serviços ativos** - Oferta
3. **Cliques WhatsApp** - Conversão
4. **Tempo na sessão** - Experiência
5. **Taxa de aprovação (moderação)** - Qualidade

### Secundárias (Fase 2+)
1. DAU, MAU
2. Conversion rate de planos
3. Retention D7, D30
4. Revenue MRR

---

## 8.7. Ferramentas de Tracking

### Implementar
- **Google Analytics 4** - Eventos e funis
- **Supabase Analytics** - Queries do banco
- **Sentry** - Erros e performance

### Eventos a Registrar
```typescript
// Autenticação
event('login', { method: 'google' })
event('logout', {})

// Navegação
event('page_view', { page: '/service/xyz' })
event('search', { query: 'diarista', results: 5 })

// Serviços
event('service_view', { service_id: '123', category: 'limpeza' })
event('service_create', { category: 'food' })
event('whatsapp_click', { service_id: '123' })

// Planos
event('plan_view', { plan: 'pro' })
event('upgrade_click', { plan: 'plus' })
```

---

## 8.8. Metas por Fase

### Fase 1 - MVP
| Meta | Valor |
|------|-------|
| Usuários ativos | 100 |
| Serviços publicados | 50 |
| Cliques WhatsApp/mês | 200 |

### Fase 2 - Geo
| Meta | Valor |
|------|-------|
| Usuários ativos | 500 |
| Taxa de uso GPS | > 40% |
| DAU/MAU | > 25% |

### Fase 3 - Planos
| Meta | Valor |
|------|-------|
| Assinaturas ativas | 25 |
| MRR | R$ 500 |
| Conversion rate | > 3% |

### Fase 4 - Escala
| Meta | Valor |
|------|-------|
| Usuários ativos | 2000 |
| Ambientes | 50 |
| MRR | R$ 5000 |