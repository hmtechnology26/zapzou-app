# 7. Fluxos do Sistema

## Visão Geral

Este documento descreve os principais fluxos de usuário do sistema ZapZou, detalhando as ações, eventos e respostas do sistema para cada cenário.

---

## 7.1. Fluxo de Autenticação

### Login com Google (Única forma de login)
```
┌────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Usuário      │      │   Frontend     │      │   Supabase      │
│                │      │                 │      │   Auth          │
└───────┬────────┘      └────────┬────────┘      └────────┬────────┘
        │                        │                        │
        │ 1. Clica "Entrar       │                        │
        │    com Google"         │                        │
        │──────────────────────>│                        │
        │                        │                        │
        │                        │ 2. Inicia OAuth       │
        │                        │──────────────────────>│
        │                        │                        │
        │                        │ 3. Redirect Google   │
        │<──────────────────────│                        │
        │                        │                        │
        │ 4. Autentica no       │                        │
        │    Google             │                        │
        │──────────────────────>│                        │
        │                        │                        │
        │                        │ 5. Retorna token     │
        │                        │<──────────────────────│
        │                        │                        │
        │                        │ 6. Cria/atualiza     │
        │                        │    usuário no banco  │
        │                        │──────────────────────>│
        │                        │                        │
        │                        │ 7. Session OK        │
        │                        │<──────────────────────│
        │                        │                        │
        │ 8. Redireciona para   │                        │
        │    Home               │                        │
        │<──────────────────────│                        │
        │                        │                        │
```

**OBS:** 
- Não existe sistema de cadastro - apenas login Google
- Se não tiver conta Google, não pode usar o app
- Administrador/proprietário não tem interface - acesso apenas via banco de dados

---

## 7.2. Fluxo de Seleção de Ambientes

### Primeiro Acesso
```
1. Usuário acessa app pela primeira vez
2. Sistema exibe tela de seleção de ambientes
3. Usuário pode escolher entre:
   - Ambientes recomendados (padrão)
   - Explorar novos ambientes
4. Usuário seleciona ambiente → Define como principal
5. Sistema salva seleção no localStorage
6. Redireciona para Home com serviços do ambiente
```

### Gerenciar Ambientes
1. Usuário acessa "Meus Ambientes"
2. Visualiza lista de ambientes selecionados
3. Pode remover ambiente (desmarca)
4. Pode adicionar novo ambiente (botão +)
5. Mudanças salvas em tempo real

---

## 7.3. Fluxo de Busca e Descoberta

### Busca por Texto
```
1. Usuário digita no campo de busca
2. Sistema filtra serviços em tempo real
3. Busca em: título, descrição, categoria, provedor
4. Normaliza texto (remove acentos, minúsculas)
5. Exibe resultados ordenados por relevância
6. Se nenhum resultado → mostra mensagem
```

### Filtrar por Categoria
```
1. Usuário clica em categoria (ex: "Alimentação")
2. Sistema filtra serviços por category
3. Combina com busca por texto (se houver)
4. Atualiza lista de resultados
```

### Ordenar por Proximidade
```
1. Sistema solicita geolocalização (se permitido)
2. Calcula distância entre usuário e cada serviço
3. Ordena: menores distâncias primeiro
4. Exibe distância em metros/km
```

---

## 7.4. Fluxo de Publicação de Serviço

### Criar Novo Serviço
```
1. Prestador acessa "Meus Serviços"
2. Clica em "Criar Novo Serviço"
3. Seleciona ambiente onde deseja publicar
4. Sistema valida localização (dentro de 500m do ambiente)
   - SE não estiver no raio → Exibe erro "Você precisa estar próximo do ambiente"
5. Preenche formulário:
   - Fotos (até 5)
   - Título
   - Categoria
   - Descrição
   - Frequência/Disponibilidade
   - WhatsApp
   - Instagram
6. Clica em "Publicar"
7. Sistema valida campos obrigatórios
8. Sistema verifica WhatsApp/Instagram duplicados:
   - SE WhatsApp já existe em outro serviço de conta Google diferente → Bloqueia
   - SE Instagram já existe em outro serviço → Bloqueia (complementar)
9. SE ambiente = "igreja":
   - Adiciona na lista de pendentes do moderador
   - Exibe mensagem: "Aguardando aprovação do líder"
10. SENÃO (residencial, club, association):
   - Serviço publicado imediatamente
11. Serviço adicionado à lista
12. Redireciona para "Meus Serviços"
```

### Validação de Localização
```
1. Ao selecionar ambiente para publicar
2. Sistema obtém localização atual do usuário (geolocalização do navegador)
3. Envia latitude/longitude no insert/update do serviço
4. O banco valida distância até o ambiente (regra de 500m via função/RLS, ex.: `can_publish_in_environment`)
5. SE distância > 500m → Bloqueia publicação
6. SE distância <= 500m → Permite publicação
7. Após publicação, sistema armazena as coordenadas no serviço
8. (Planejado) Validação periódica: a cada X dias, verificar localização novamente
   - SE prestador sair do raio → notificar ou desativar serviço
```

### Editar Serviço
1. Prestador acessa "Meus Serviços"
2. Seleciona serviço para editar
3. Modifica campos desejados
4. Salva alterações
5. Atualiza lista de serviços

### Excluir Serviço
1. Prestador acessa "Meus Serviços"
2. Seleciona opção de excluir
3. Confirma exclusão
4. Serviço removido da lista

---

## 7.5. Fluxo de Visualização de Serviço

### Detalhes do Serviço
```
1. Usuário clica no card do serviço
2. Sistema carrega página de detalhes
3. Exibe:
   - Fotos (galeria)
   - Título e descrição
   - Categoria e tags
   - Rating e avaliações
   - Menu/preços (se aplicável)
   - Contato (WhatsApp, Instagram)
4. Usuário pode:
   - Clicar em WhatsApp → abre app
   - Clicar em Instagram → abre perfil
   - Ver avaliações
```

---

## 7.6. Fluxo de Moderação (Apenas Igrejas)

### Aprovação de Prestador (não serviço!)
```
1. Prestador tenta publicar serviço em ambiente igrejas
2. Sistema adiciona prestador à lista de "pendentes" do ambiente
3. Moderador (líder) acessa painel via menu do perfil
4. Visualiza lista de prestadores pendentes
5. Pode:
   - Aprovar → prestador pode publicar no ambiente
   - Reprovar → prestador não pode publicar
6. Prestador é notificado da decisão
7. SE aprovado → serviço publicado
8. SE reprovado → serviço não é publicado
```

**OBS:** 
- Moderação é sobre o **prestador**, não sobre o serviço
- Apenas ambientes do tipo 'church' têm moderação
- Pode haver múltiplos moderadores por ambiente
- Não há rejeição de serviços - apenas banimento via denúncia (futuro)

---

## 7.7. Fluxo de Gestão de Membros

### Adicionar Membro
```
1. Novo usuário solicita acesso
2. Entra como "pending"
3. Administrador visualiza lista de pendentes
4. Pode:
   - Aprovar → vira membro ativo
   - Rejeitar → acesso negado
```

---

## 7.8. Fluxo de Planos

### Upgrade de Plano
```
1. Usuário acessa "Planos"
2. Visualiza opções (FREE, PRÓ, PLUS)
3. Seleciona plano desejado
4. Sistema exibe mensagem "Em breve"
5. Funcionalidade de pagamento futura
```

---

## 7.9. Fluxo de Avaliações

### Avaliar Serviço
```
1. Cliente acessa serviço contratado
2. Clica em "Avaliar"
3. Seleciona nota (1-5 estrelas)
4. Opcional: escreve comentário
5. Sistema:
   - Salva avaliação no banco
   - Recalcula rating médio
   - Atualiza contagem de reviews
```

---

## 7.10. Resumo dos Fluxos

| Fluxo | Ator | Descrição |
|-------|------|------------|
| Login (Google only) | Usuário | Autenticação exclusivamente via Google |
| Seleção de Ambiente | Usuário | Escolher onde consumir serviços |
| Busca | Morador | Encontrar serviços por texto/categoria |
| Publicação | Prestador | Criar novo serviço com validação de localização |
| Anti-fraude | Sistema | Verificar WhatsApp/Instagram duplicados |
| Visualização | Morador | Ver detalhes de um serviço |
| Moderação | Líder (igreja) | Approve/reject prestadores (não serviços) |
| Upgrade | Prestador | Mudar para plano pago |
