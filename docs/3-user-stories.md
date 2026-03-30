# 3. User Stories

## Visão Geral

Este documento apresenta as histórias de usuário que definem as funcionalidades do sistema ZapZou. Cada story segue o formato: "Como [usuário], quero [ação], para [resultado]".

---

## 3.1. Autenticação e Onboarding

### US-001: Login com Google
**Como** usuário,
**Quero** fazer login exclusivamente com minha conta Google,
**Para** acessar a plataforma (não existe cadastro manual de usuários).

### US-002: Acessar Moderação (Líderes de Igreja)
**Como** líder de igreja,
**Quero** acessar o painel de moderação via menu do perfil após login Google,
**Para** approve/reject prestadores que desejam publicar no meu ambiente.

### US-003: Validar Localização para Publicar
**Como** prestador,
**Quero** que o sistema valide minha localização (dentro de 500m do ambiente),
**Para** provar que pertenço àquela comunidade e poder publicar serviços.

### US-004: Selecionar Ambientes
**Como** usuário logado,
**Quero** selecionar quais ambientes (condomínio, igreja) participo,
**Para** ver serviços disponíveis nessas comunidades.

---

## 3.2. Busca e Descoberta

### US-004: Buscar Serviços por Texto
**Como** morador,
**Quero** buscar serviços digitando palavras-chave,
**Para** encontrar prestadores específicos que preciso.

### US-005: Filtrar por Categoria
**Como** morador,
**Quero** filtrar serviços por categoria (Alimentação, Limpeza, Pet, etc),
**Para** navegar por tipos específicos de serviço.

### US-006: Ordenar por Proximidade
**Como** morador,
**Quero** ver serviços ordenados por distância,
**Para** encontrar os mais próximos de onde estou.

### US-007: Usar Geolocalização
**Como** morador,
**Quero** usar minha localização para ver serviços próximos,
**Para** descobrir profissionais na minha vizinhança.

---

## 3.3. Visualização de Serviços

### US-008: Ver Detalhes do Serviço
**Como** morador,
**Quero** ver informações completas de um serviço (fotos, descrição, preço, menu),
**Para** avaliar se atende minha necessidade.

### US-009: Ver Avaliações
**Como** morador,
**Quero** ver avaliações e notas de um prestador,
**Para** verificar a qualidade do serviço.

### US-010: Ver Menu/Preços
**Como** morador,
**Quero** visualizar o cardápio ou lista de preços do serviço,
**Para** escolher a opção que melhor se encaixa no meu orçamento.

---

## 3.4. Contato e Conversão

### US-011: Contatar por WhatsApp
**Como** morador,
**Quero** clicar para abrir conversa no WhatsApp com o prestador,
**Para** tirar dúvidas ou contratar o serviço diretamente.

### US-012: Contatar por Instagram
**Como** morador,
**Quero** acessar o perfil do Instagram do prestador,
**Para** ver mais trabalhos e算.

---

## 3.5. Gestão de Serviços (Prestador)

### US-013: Criar Novo Serviço
**Como** prestador,
**Quero** criar um novo serviço com fotos, título, categoria e descrição,
**Para** publicar minha oferta na comunidade.

### US-014: Adicionar Fotos
**Como** prestador,
**Quero** adicionar múltiplas fotos do meu serviço,
**Para**展示 meu trabalho de forma atrativa.

### US-015: Definir Categoria
**Como** prestador,
**Quero** escolher uma categoria para meu serviço,
**Para** aparecer nas buscas corretas.

### US-016: Configurar Contato
**Como** prestador,
**Quero** informar meu WhatsApp e Instagram,
**Para** clientes poderem entrar em contato comigo.

### US-017: Definir Frequência
**Como** prestador,
**Quero** informar quando meu serviço está disponível (diário, semanal, fim de semana),
**Para** clientes saberem minha disponibilidade.

### US-018: Editar Serviço
**Como** prestador,
**Quero** editar as informações do meu serviço,
**Para** manter dados atualizados.

### US-019: Ativar/Desativar Serviço
**Como** prestador,
**Quero** ativar ou desativar um serviço temporariamente,
**Para** gerenciar minha disponibilidade.

### US-020: Excluir Serviço
**Como** prestador,
**Quero** remover um serviço publicado,
**Para** limpar serviços que não ofereço mais.

### US-021: Criar Menu/Preços
**Como** prestador,
**Quero** criar um cardápio com itens e preços,
**Para** detalhamento das opções disponibles.

---

## 3.6. Gestão de Ambientes (Administrador)

### US-022: Gerenciar Ambientes
**Como** administrador,
**Quero** visualizar e gerenciar os ambientes que participo,
**Para** ter controle sobre minhas comunidades.

### US-023: Explorar Novos Ambientes
**Como** usuário,
**Quero** descobrir e adicionar novos ambientes,
**Para** expandir minha rede de serviços.

### US-024: Modificar Logo do Ambiente
**Como** administrador,
**Quero** alterar a foto/logo do ambiente,
**Para** personalizar a identidade visual.

### US-025: Configurar Visibilidade
**Como** administrador,
**Quero** configurar regras de visibilidade do ambiente,
**Para** controlar quem vê os serviços.

---

## 3.7. Moderação (Apenas Igrejas)

### US-026: Aprovar Prestador
**Como** moderador de igreja,
**Quero** approve prestadores que desejam publicar no ambiente,
**Para** permitir que ofereçam serviços na comunidade.

### US-027: Reprovar Prestador
**Como** moderador,
**Quero** reprovar prestadores que não atendem aos critérios,
**Para** manter a qualidade e valores da comunidade.

### US-028: Visualizar Prestadores Pendentes
**Como** moderador,
**Quero** visualizar lista de prestadores pendentes de aprovação,
**Para** revisar solicitações de acesso ao ambiente.

---

## 3.8. Gestão de Membros

### US-029: Lista de Membros
**Como** administrador,
**Quero** ver a lista de membros do ambiente,
**Para** gerenciar quem participa.

### US-030: Aprovar Membro
**Como** administrador,
**Quero** aprovar membros pendentes,
**Para** admiti-los na comunidade.

### US-031: Remover Membro
**Como** administrador,
**Quero** remover um membro,
**Para** excluir acesso quando necessário.

---

## 3.9. Planos e Assinaturas

### US-032: Visualizar Planos
**Como** usuário,
**Quero** ver os planos disponíveis (FREE, PRÓ, PLUS),
**Para** entender as opções de upgrade.

### US-033: Upgrade de Plano
**Como** prestador,
**Quero** fazer upgrade para um plano superior,
**Para** ter mais visibilidade e recursos.

---

## 3.10. Perfil do Usuário

### US-034: Editar Perfil
**Como** usuário,
**Quero** editar minhas informações de perfil,
**Para** manter dados atualizados.

### US-035: Ver Meus Serviços
**Como** prestador,
**Quero** ver a lista de serviços que publiquei,
**Para** gerenciar minhas ofertas.

---

## 3.11. Avaliações

### US-036: Avaliar Serviço
**Como** cliente,
**Quero** dar nota e comentário a um serviço contratado,
**Para** ajudar outros usuários e dar feedback ao prestador.

---

## 3.12. Notificações

### US-037: Receber Notificações
**Como** usuário,
**Quero** ser notificado sobre novidades e mensagens,
**Para** não perder nenhuma informação relevante.

---

## 3.13. Segurança e Anti-Fraude

### US-038: Detectar WhatsApp Duplicado
**Como** sistema,
**Quero** verificar se o WhatsApp informado já existe em outro serviço de conta Google diferente,
**Para** evitar que prestadores burlem os limites de planos criando múltiplas contas.

### US-039: Detectar Instagram Duplicado
**Como** sistema,
**Quero** verificar se o Instagram informado já existe em outro serviço,
**Para** complementar a verificação de fraude por WhatsApp.

### US-040: Validar Localização Periodicamente
**Como** sistema,
**Quero** validar a localização do prestador periodicamente (dentro de 500m do ambiente),
**Para** garantir que o prestador ainda pertence àquela comunidade.

---

## Priorização

| Prioridade | User Stories |
|------------|--------------|
| **Alta (MVP)** | US-001, US-002, US-003, US-004, US-005, US-006, US-008, US-009, US-011, US-013, US-014, US-015, US-016, US-017, US-022, US-026, US-027, US-028, US-032, US-034, US-035, US-038, US-039, US-040 |
| **Média** | US-007, US-010, US-012, US-018, US-019, US-020, US-021, US-023, US-024, US-025, US-029, US-030, US-031, US-033, US-036 |
| **Baixa** | US-037 |