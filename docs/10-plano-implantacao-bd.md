# 10. Plano de Integração com Banco de Dados Supabase e Fluxo de Moderação

Este documento formaliza o plano "De Ponta a Ponta" para substituir todos os dados *mockados* do ZapZou pela integração oficial com o Supabase (`001_initial_schema.sql`), protegendo a criação de anúncios por meio da afiliação aprovada em ambientes.

---

## Estrutura de Pastas e Arquivos Afetados

Abaixo está o mapeamento da árvore do projeto com a exata localização das alterações:

```text
zapzou-app/
├── docs/
│   └── 10-plano-implantacao-bd.md       <-- (NOVO) Este documento
├── src/
│   ├── app/
│   │   ├── page.tsx                     <-- (ALTERADO) Busca serviços da base, aplica distância
│   │   ├── explore/page.tsx             <-- (ALTERADO) Ajuste de queries
│   │   ├── moderation/                  <-- (NOVO) Nova Rota
│   │   │   └── page.tsx                 <-- (NOVO) Painel do Líder para aprovar afiliados
│   │   ├── my-services/page.tsx         <-- (ALTERADO) Lista serviços atrelados ao auth.uid()
│   │   ├── places/
│   │   │   ├── page.tsx                 <-- (ALTERADO) Listagem real
│   │   │   └── [slug]/page.tsx          <-- (ALTERADO) Botão "Solicitar Afiliação" adicionado
│   │   ├── register-service/page.tsx    <-- (ALTERADO) Tela bloqueia fomulário se não for 'active'
│   │   └── service/[slug]/page.tsx      <-- (ALTERADO) Dados de anúncios vindos do DB
│   ├── components/
│   │   ├── PublishModal.tsx             <-- (ALTERADO) Validação idêntica ao form de registro
│   │   └── TopAppBar.tsx                <-- (ALTERADO) Botão de Acesso a Moderação p/ Líderes
│   └── hooks/
│       └── useApp.tsx                   <-- (ALTERADO) Fim do LocalStorage, SSOT pelo Supabase
```

---

## Rotas Mapeadas (App Router)

| Rota | Status | Função Prática na Integração |
|---|---|---|
| `/` (Home) | **Alterada** | Consome dados `services` validados pelos ranges da Geolocation do banco. |
| `/places` e `/places/[slug]` | **Alterada** | Visualiza a igreja/condomínio. O Morador/Prestador pode clicar para se afiliar, gerando um registro `pending` no banco. |
| `/register-service` | **Alterada** | O fluxo de publicação central. Irá realizar consulta no estado de *membership*; se for nulo, exibe "Solicite afiliação". Se for pendente, exibe "Aguardando liderança". Apenas abre o form se for `active`. |
| `/moderation` | **Nova** | Tela exclusiva para usuários com *role* de Moderador num ambiente. Lista prestadores pendentes e os aprova. |
| `/service/[slug]` | **Alterada** | Página pública de um serviço com links reais que contabilizam visitas e chamadas externas. |

---

## O Que PODE e NÃO PODE ser Feito (Regras Invioláveis do Banco)

### O que NÃO PODE 🚫
1. **Ignorar Moderação do Líder:** A interface é proibida de renderizar formulários de cadastro de serviço se o usuário não tiver presença física / afiliação ativa no ambiente selecionado.
2. **Gravar serviços como 'Pending':** Embora os provedores fiquem pendentes na tabela `environment_members`, o anúncio não é gravado "pela metade". Se o backend recusar (devido a plano estourado ou distância de >500m), o form irá falhar e retornar a mensagem de erro da Trigger de Segurança ao usuário.
3. **Uso de LocalStorage:** Dados como arrays de serviços ou ambientes salvos no navegador para preencher lista devem sumir, garantindo a integridade dos dados e o real-time com as respostas do Supabase.

### O que PODE ✅
1. **Consumir livremente:** Consumidores não precisam pedir afiliação apenas para *ver* anúncios. Isso é aberto via RLS na tabela de `services`.
2. **Líder aprova PESSOAS e não POSTS:** Como o contexto comunitário importa, o líder visualiza um usuário que ingressou. Quando ele é aprovado no ambiente, suas publicações feitas à par entram direto.

---

## Checklist de Execução

- [ ] **1. Limpeza Base do Estado (`useApp.tsx`)**
  - [ ] Remover vetores inteiros de `mocks` de ambientes, parceiros e anúncios.
  - [ ] Desligar gatilhos baseados em `localStorage` (zapzou_services, etc.).
  - [ ] Configurar função auto-loading para resgatar status dinâmico de `environment_members` e anexá-lo ao `user` contextual.

- [ ] **2. Refatorando as Páginas de Apresentação (Leitura)**
  - [ ] Adaptar a Home `page.tsx`.
  - [ ] Adaptar Catálogos de Ambientes `places/[slug]`.
  - [ ] Adaptar View Pública do Anúncio `/service/[slug]`.

- [ ] **3. Inserção do Botão e Fluxo de "Solicitar Afiliação"**
  - [ ] Identificar quando usar o call on-click injetando na tabela de conexões.
  - [ ] Atualizar tela de ambientes para que o botão tenha feedback visual (Ex: *Aguardando Aprovação*).

- [ ] **4. Bloqueando o Preenchimento (UX de Segurança)**
  - [ ] Componentizar a trava em `PublishModal.tsx` e na rota isolada `/register-service/page.tsx`.
  - [ ] Fazer tratamento de erro das exceções SQL retornadas ao bater em limitações de DB.

- [ ] **5. Criando Rota de Liderança**
  - [ ] Construir Rota Privada `/moderation` em Next.js.
  - [ ] Exibir a tabela com opções de Action e ligar com RPCs ou Patch do supabase atualizando o status de usuário "A".

- [ ] **6. Testes Específicos & Validação**
  - [ ] Checar criação, exclusão de conta e reset. Verificação final de distâncias.

---

## Teste de Mesa e Validação dos Cenários (Desk Checks)

Abaixo estão as execuções teóricas do fluxo com as rotas exatas, indicando a consistência técnica para confirmar que não existirão furos ("loopholes") na implementação de nenhuma regra.

### UC01: Visualizar Serviços como Visitante Mero Consumidor
- **Fluxo:** Usuário não afiliado navega no site para descobrir que profissionais atendem perto dele.
- **Rota Destino:** `/`, `/explore`, `/places/[slug]`, `/service/[slug]`
- **Arquivos Manipuladores:** `src/app/page.tsx`, `src/app/places/[slug]/page.tsx`, `src/app/service/[slug]/page.tsx`
- **Tabela/Técnica Ocorrida:** `SELECT` na View Pública `user_public_profiles` e tabela `services`.
- **Observação (Garantia de Fluxo sem furos):** **Fluxo Perfeito.** A Role Level Security (`services_read_public_active`) do Supabase permite `SELECT` usando a condição `USING (status = 'active' AND is_active = true)`. O usuário que é mero consumidor não será exposto a qualquer barreira indevida ou exigirá pedir presença em grupos, visto que a UX deve focar no consumo dinâmico das listagens.

### UC02: Tentativa de Publicação sem Afiliação (Burlar Interface)
- **Fluxo:** O novo Prestador quer divulgar seus bolos no "Residencial X", mas ainda não é vinculado como membro.
- **Rota Destino:** `/register-service`
- **Arquivos Manipuladores:** `src/app/register-service/page.tsx` e `src/components/PublishModal.tsx`
- **Tabela/Técnica Ocorrida:** Validação de State no Fetch `environment_members` vs `environments`.
- **Observação (Garantia de Fluxo sem furos):** **Fluxo Perfeito.** A interface bloqueará imediatamente os inputs de formulário. Se, numa hipótese extrema, o usuário criar um Script por fora para dar POST na URL da API Supabase (burlamento client-side), o PostgREST será engatilhado pela RLS `services_insert_own` que força execução imediata de `can_user_create_service`. O banco retornará `FALSE` na etapa de insert lançando a Constraint Violation Error `401`. Furo inexistente, 100% à prova de burla.

### UC03: Envio de Pedido de Afiliação (Church)
- **Fluxo:** O prestador percebe o bloqueio, confirma a igreja desejada e aciona a intenção de ser parceiro, solicitando adesão.
- **Rota Destino:** `/places/[slug]` ou bloqueio renderizado no `/register-service`
- **Arquivos Manipuladores:** `src/app/places/[slug]/page.tsx` / `src/app/register-service/page.tsx`
- **Tabela/Técnica Ocorrida:** `INSERT` em `environment_members`.
- **Observação (Garantia de Fluxo sem furos):** **Fluxo Perfeito.** Por definição padrão (`DEFAULT`), a inserção no banco assume estado `pending`. Mesmo que na construção da "Rota", um usuário mal intencionado passe `{ status: 'active' }`, a trigger blindará se o usuário que pede não for moderador daquele local. O estado real será retido como aguardando liderança.

### UC04: Feedback e Ação da Liderança Religiosa (Moderador)
- **Fluxo:** O Líder devidamente validado (status Moderator) acessa sua área reservada para olhar os painéis, vendo novos inscritos.
- **Rota Destino:** `/moderation`
- **Arquivos Manipuladores:** `src/app/moderation/page.tsx`
- **Tabela/Técnica Ocorrida:** `SELECT` filtrando `role=pending` no próprio `environment_id` dele, efetuando POST(Patch/Update) de `status=active`.
- **Observação (Garantia de Fluxo sem furos):** **Fluxo Perfeito.** O arquivo da Rota construirá os cards contendo um botão `[Aprovar]`. Ao submeter, o banco valida via `environment_members_update_moderator` + a sub-function `is_user_moderator_of_environment`. Ninguém exceto líderes verificados e do MESMO ID de Igreja do solicitante podem alterar as permissões de membro. A regra de negócio se fecha integralmente.

### UC05: Prestador Aprovado Emite Anúncio e Checagem Geográfica
- **Fluxo:** Após aprovação do líder, a UX `/register-service` se destrava. O provedor anexa imagens de seus bolos e preenche preços. A aplicação capta sua geolocalização exata atual (Lat/Log).
- **Rota Destino:** `/register-service`
- **Arquivos Manipuladores:** `src/app/register-service/page.tsx`
- **Tabela/Técnica Ocorrida:** Envio Realtime do Storage Upload de URL de Foto, depois `INSERT` em `services`.
- **Observação (Garantia de Fluxo sem furos):** **Fluxo Perfeito.** O sistema chamará dentro do Next.JS a API Navigator HTML5 para obter as Coordinates do smartphone. O arquivo envia. No momento em que bate no Schema inicial, a stored procedure nativa `haversine_distance_meters` mede o centro da "Church" contra a marca do GPS enviada; tolerância máxima 500 metros cravada no Banco. Limite de planos `Free` (máximo 2 serviços) também é checado. Se passar em tudo, entra imediato (sem pending). Garantia do processo de *anti-fraude espacial* e *limites comerciais*.
