# 4. Roadmap

## Visão Geral

O roadmap do Conectae define as fases de desenvolvimento e evolução do produto, desde o MVP até a escala completa.

---

## Fase 1: MVP - Fundação

### Objetivo
Lançar a versão mínima viável com as funcionalidades essenciais para validar o produto.

### Escopo
- **Autenticação:** Login exclusivamente via Google (não existe cadastro manual)
- **Ambientes:** Busca via Google Places API + validação de localização 500m para publicação
- **Serviços:** Criar, editar, ativar/desativar, excluir serviços
- **Limites por plano:** FREE (2 serviços/1 ambiente), PRÓ (5 serviços/múltiplos), PLUS (ilimitado)
- **Moderação:** Apenas igrejas - approve/reject prestadores (não serviços)
- **Anti-fraude:** Detectar WhatsApp/Instagram duplicado em diferentes contas
- **Busca:** Busca por texto e categoria
- **Visualização:** Detalhes do serviço, avaliações, menu
- **Contato:** WhatsApp direto
- **Validação periódica:** Verificação de localização para prestadores ativos

### Entregas
- [x] Frontend Next.js 14 com Tailwind
- [x] Supabase configurado (Auth, DB, Storage)
- [x] UI Mobile-first responsiva
- [x] Fluxo completo de prestação de serviços
- [ ] Integração Google Places API
- [ ] Sistema de validação de localização
- [ ] Sistema de moderação de prestadores (apenas igrejas)
- [ ] Sistema anti-fraude (WhatsApp/Instagram duplicado)

### Timeline
**Mês 1-2**

---

## Fase 2: Inteligência e Localização

### Objetivo
Melhorar a descoberta com geolocalização e funcionalidades inteligentes.

### Escopo
- **Geolocalização:** Serviços ordenados por proximidade
- **GPS:** Usar localização do usuário
- **Filtros avançados:** Por tipo, rating, preço
- **Notificações:** Push notifications
- **Favoritos:** Salvar serviços favoritos

### Entregas
- [ ] Integração com Google Maps API
- [ ] Cálculo de distância
- [ ] Sistema de notificações push
- [ ] Lista de favoritos

### Timeline
**Mês 3-4**

---

## Fase 3: Monetização e Planos

### Objetivo
Implementar o sistema de planos e começar a monetização.

### Escopo
- **Plano FREE:** Até 2 serviços em 1 ambiente
- **Plano PRÓ:** R$9,90/mês - até 5 serviços, múltiplos ambientes, badge, prioridade
- **Plano PLUS:** R$29,90/mês - serviços ilimitados, múltiplos ambientes, análises avançadas (sem API)
- **Checkout:** Integração com gateway de pagamento (a definir)
- **Badge de verificação:** Indicador visual nos planos pagos

### Entregas
- [ ] Sistema de planos no frontend
- [ ] Integração de pagamentos (gateway a definir)
- [ ] Badge de verificação
- [ ] Dashboard de estatísticas para planos pagos
- [ ] Sistema de multi-ambiente para planos pagos

### Timeline
**Mês 5-6**

---

## Fase 4: Escala e Expansão

### Objetivo
Escalabilidade técnica e expansão para novos mercados.

### Escopo
- **PWA:** Progressive Web App para instalável
- **Nacional:** Expansão para todo o Brasil (não apenas SP)
- **Analytics:** Dashboard de métricas avançado
- **White-label:** Versão customizável para grandes condomínios
- **Denúncias:** Sistema de denúncia de serviços irregular

### Entregas
- [ ] PWA com Service Worker
- [ ] Dashboard de analytics
- [ ] Sistema de denúncias
- [ ] Expansão nacional

### Timeline
**Mês 7-9**

---

## Fase 5: Crescimento e Retenção

### Objetivo
Aumentar engajamento e retenção de usuários.

### Escopo
- **Gamificação:** Pontos e recompensas
- **Programa de indicação:** Indicar prestadores
- **Respostas rápidas:** Chatbot para dúvidas
- **Relatórios:** Exportar dados
- **Integrações:** Calendário, WhatsApp Business API

### Entregas
- [ ] Sistema de pontos
- [ ] Programa de indicação
- [ ] Chatbot de suporte
- [ ] Integração com Google Calendar

### Timeline
**Mês 10-12**

---

## Cronograma Visual

```
Mês 1-2    Mês 3-4    Mês 5-6    Mês 7-9    Mês 10-12
   |          |          |          |           |
   v          v          v          v           v
[ MVP ] → [ Geo+ ] → [ Planos ] → [ Escala ] → [ Growth ]
```

---

## Marcos (Milestones)

| Fase | Marco | Métrica de Validação |
|------|-------|---------------------|
| MVP | Launch | 10 serviços publicados |
| Geo | Geolocalização | 50% usuários usando GPS |
| Planos | Monetização | 5% conversion rate |
| Escala | Multi-ambiente | 10 comunidades ativas |
| Growth | Retenção | 30% DAU/MAU |