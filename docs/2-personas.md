# 2. Personas (Usuários)

## Visão Geral

O ZapZou atende diferentes tipos de usuários com necessidades distintas. A seguir, as personas identificadas para o sistema.

---

## 2.1. Prestador de Serviços

### Descrição
Profissional autônomo que oferece serviços dentro de uma comunidade (condomínio, igreja, associação).

### Perfil Demográfico
- **Idade:** 25-55 anos
- **Renda:** Média-baixa a média
- **Escolaridade:** Diversificada
- **Conhecimento tech:** Intermediário (usa WhatsApp fluentemente)

### Objetivos
- Atrair clientes novos dentro da comunidade
- Construir reputação e receber avaliações positivas
- Divulgar seu trabalho de forma organizada
- Aumentar visibilidade para crescer o negócio

### Comportamento
- Publica serviços com fotos do seu trabalho
- Mantém perfil atualizado com contato (WhatsApp/Instagram)
- Responde rapidamente a interessados
- Gosta de feedback positivo

### Dores
- Difícil encontrar clientes de forma organizada
- Depende de indicações boca a boca
- Sem controle sobre visibilidade
- Competição desleal sem verificação

### Necessidades do Sistema
- Criar anúncio rápido com fotos
- Receber contato direto (sem intermediários)
- Visualizar avaliações e reputação
- Upgrade de plano para mais visibilidade

---

## 2.2. Morador/Cliente

### Descrição
Pessoa que mora ou frequenta uma comunidade e precisa encontrar prestadores de serviços locais.

### Perfil Demográfico
- **Idade:** 20-70 anos
- **Renda:** Variável
- **Conhecimento tech:** Básico a intermediário

### Objetivos
- Encontrar serviços confiáveis e próximos
- Verificar reputação (avaliações)
- Entrar em contato rapidamente
- Descobrir novos serviços disponíveis
- Encontrar facilmente sua comunidade (condomínio, igreja)

### Comportamento
- Busca por necessidade específica
- Avalia fotos e descrições
- Leva rating em consideração
- Prefere contato por WhatsApp
- Descobre ambientes via busca no app (Google Places)

### Dores
- Não sabe quem oferece serviço na comunidade
- Difícil verificar confiabilidade
- Precisa perguntar em grupos de WhatsApp
- Informações desatualizadas
- Não conhece todos os ambientes da região

### Necessidades do Sistema
- Busca automática de ambientes via Google Places
- Busca por categoria e proximidade
- Ver avaliações e fotos
- Contato direto via WhatsApp
- Favoritar prestadores

---

## 2.3. Administrador/Líder Comunitário

### Descrição
Pessoa responsável por gerenciar uma comunidade religiosa (líder de igreja, pastor). Apenas ambientes do tipo **igreja** podem ter moderators. Para condomínios e outros tipos, não há moderação.

### Perfil Demográfico
- **Idade:** 30-65 anos
- **Papel:** Voluntário ou remunerado na igreja
- **Conhecimento tech:** Básico a intermediário

### Objetivos
- Manter organização dos serviços na comunidade
- Garantir qualidade e alinhamento com valores da igreja
- Aprovar/Reprovar prestadores que desejam publicar no ambiente
- Gerenciar membros da comunidade

### Comportamento
- Acessa painel de moderação via menu do perfil (após login Google)
- Revisa solicitações de prestadores
- Pode haber múltiplos moderadores por ambiente
- Não há interface para configurações de ambiente (apenas banco de dados)

### Dores
- Prestadores não verificados podem publicar livremente
- Membros pedindo indicações constantemente
- Necessidade de validar que o prestador pertence à comunidade

### Necessidades do Sistema
- Painel de moderação de prestadores (não de serviços)
- Lista de prestadores pendentes
- Aprovar/Reprovar acesso de prestadores ao ambiente

---

## 2.4. Administrador da Plataforma (Super Admin)

### Descrição
Equipe interna que gerencia a plataforma ZapZou.

### Objetivos
- Monitorar métricas do sistema
- Gerenciar problemas e suporte
- Configurar parâmetros globais
- Analisar crescimento

### Acesso
- Painel administrativo completo
- Todas as comunidades e serviços
- Dados agregados e KPIs

---

## Resumo das Personas

| Persona | Principal | Tipo |
|---------|-----------|------|
| Prestador | Criar e gerenciar serviços | Negócio |
| Morador | Buscar e contratar serviços | Consumo |
| Líder | Moderar ambiente | Gestão |
| Admin | Governar plataforma | Gestão |