# FAQ - Perguntas Frequentes

## O que é o Conectae?

O Conectae é uma plataforma digital de serviços local que conecta prestadores de serviços a clientes dentro de suas comunidades vizinhas, como condomínios residenciais, igrejas, clubes e associações.

---

## Como funciona o Conectae?

1. **Usuários escolhem seu ambiente** (condomínio, igreja, etc.)
2. **Prestadores publicam seus serviços** com fotos, descrição e contato
3. **Moradores buscam e encontram serviços** próximos
4. **Contato é feito diretamente** via WhatsApp ou Instagram

---

## Quais são os tipos de ambiente disponíveis?

- **Residencial:** Condomínios e residenciais
- **Igrejas:** Paróquias e comunidades religiosas
- **Clubes:** Clubes sociais e esportivos
- **Associações:** Associações de bairro e profissionais

---

## Como me cadastrar?

1. Acesse o app Conectae
2. Clique em "Entrar"
3. Faça login com Google
4. Selecione os ambientes disponíveis

Observações:
- O login é via Google (OAuth) com Supabase Auth.
- Em ambientes do tipo igreja, usuários com papel de moderador podem aprovar prestadores para publicar naquele ambiente.

---

## É gratuito usar o Conectae?

**Sim e Não:**

- **Plano FREE:** gratuito, permite 2 serviços publicado em 1 ambiente com visibilidade básica
- **Plano PRÓ:** R$9,90/mês, até 5 serviços, badge de verificação, prioridade de visualização, pode publicar em mais de um ambiente
- **Plano PLUS:** R$29,90/mês, serviços ilimitados e recursos avançados (conforme roadmap), pode publicar em mais de um ambiente

Obs.: atualmente não há API pública de integração.

---

## Como funciona a moderação em igrejas?

O prestador só poderá criar um serviço após a aprovação do moderador sobre o ambiente igreja:

- O prestador fica com status **"Pendente"**
- O líder/moderador da igreja precisa **aprovar** para publicar, lembrando que pode haver mais de um lider/moderador para o ambiente. 

Lembrando que a moderação não é do serviço e sim do prestador para publicar naquele ambiente. 

- Isso garante qualidade e alinhamento com os valores da comunidade

---

## Como crio um serviço?

1. Faça login no app
2. Acesse "Meus Serviços"
3. Clique em "Criar Novo Serviço"
4. Escolha o ambiente que deseja publicar o serviço (caso você nao tenha um abiente ainda, você precisará buscar o ambiente, validar a localização dentro do raio de 500m desse ambiente, isso prova que você pertence a esse ambiente)
5. Preencha as informações:
   - Fotos (até 5)
   - Título e descrição
   - Categoria
   - WhatsApp e Instagram
   - Frequência de disponibilidade
5. Publique!

---

## Quais categorias de serviço existem?

- Alimentação
- Limpeza
- Pet Sitting (cuidados com pets)
- Manutenção
- Beleza (cabeleireiro, estética)
- Tecnologia
- Outros

---

## Como funciona a busca?

Você pode buscar por:
- **Texto:** digite o que precisa (ex: "diarista", "marmitas")
- **Categoria:** filtre por tipo de serviço
- **Proximidade:** use sua localização para ver serviços próximos

---

## Como entrar em contato com um prestador?

Clique no botão **WhatsApp** ou **Instagram** na página do serviço. Você será redirecionado para o app correspondente para iniciar a conversa.

---

## Posso editar ou excluir meu serviço?

**Sim!** Acesse "Meus Serviços", selecione o serviço desejado e você poderá:
- Editar informações
- Ativar/desativar temporariamente
- Excluir o serviço

---

## O que é o badge de verificação?

O badge (selo) de verificação é um símbolo de confiança que aparece em serviços de planos pagos (PRÓ e PLUS). Indica que o prestador foi verificado pela plataforma.

---

## Como me torno administrador de um ambiente?

Entre em contato com o líder atual (síndico, pastor, presidente) do ambiente. Eles podem conceder acesso administrativo através do painel de configurações.

OBS: ISSO É VALIDO APENAS PARA IGREJAS.

---

## Como funciona a geolocalização?

Se você permitir o acesso à sua localização, o Conectae ordenará os serviços por proximidade, mostrando os mais próximos de você primeiro com a distância em metros ou quilômetros.

---

## Posso adicionar mais de um ambiente?

**Sim!** Você pode participar de múltiplos ambientes (ex: seu condomínio e sua igreja). Os serviços de todos os ambientes selecionados aparecerão na sua busca.

OBS: VOCÊ PODE COMPRAR DE MAIS DE UM AMBIENTE MAS NAO PODE PUBLICAR EM MAIS DE UM AMBIENTE SE NAO TIVER NO MINIMO O PLANO PRÓ

---

## Como funciona o sistema de avaliações?

Após contratar um serviço, você pode avaliar:
- **Estrelas:** de 1 a 5
- **Comentário:** texto opcional

A nota média aparece no serviço e ajuda outros usuários a decidir.

---

## Esqueci minha senha, como recupero?

O Conectae usa autenticação Google. Se você não conseguir acessar sua conta Google, terá dificuldades de acesso. Entre em contato com o suporte.

OBS: SE O USUÁRIO NAO TIVER CONTA GOOGLE, ELE NAO PODERÁ USAR O APP. NADA PODEREMOS FAZER POIS O CONECTAE NAO TEM SISTEMA DE CADASTRO DE USUÁRIOS.

---
## Como indentificamos que o usuário está cadastrando o mesmo serviço em contas google diferentes para burlar o pagamento dos planos PRO e PLUS?

Se o Whatsapp ou o Instagram for o mesmo, ja é o indicio suficiente para considerarmos que é o mesmo usuário e não será permitido e será impedido o cadastro do serviço.

---


## Meu serviço foi rejeitado, o que fazer?

Atualmente, a moderação é focada em **prestadores** (principalmente em ambientes do tipo igreja), e não em “aprovar/rejeitar” serviços individualmente.

Se você não consegue publicar, os motivos mais comuns são:
1. Sua afiliação ao ambiente está **pendente** (em igrejas) — aguarde a aprovação do moderador.
2. Você está fora do raio permitido (ex.: **500m**) para publicar no ambiente.
3. Você atingiu o limite do seu plano (FREE/PRÓ/PLUS).

Se houver conteúdo abusivo ou indevido, o serviço pode ser removido por denúncia/revisão conforme regras do app.

---

## Posso usar o Conectae offline?

Não. O Conectae precisa de internet para carregar conteúdos, publicar serviços e abrir contatos (WhatsApp/Instagram). Pode existir cache do navegador em alguns cenários, mas não é um modo offline suportado.

---

## O Conectae está disponível em quais cidades?

O Conectae está em fase piloto e a disponibilidade depende dos ambientes cadastrados (condomínios/igrejas/clubes/associações) no sistema. A expansão para novas regiões ocorre progressivamente.

---

## Como posso anuncir meu negócio no Conectae?

1. **Plano FREE:** publique até 2 serviços gratuitamente no mesmo ambiente.
2. **Plano PRÓ:** até 5 serviços + badge de verificação e pode publicar em mais ambientes
3. **Plano PLUS:** serviços ilimitados + badge de verificação e pode publicar em mais ambientes

OBS: NÃO EXISTE API

---

## Quantos ambientes o usuário FREE pode publicar serviços?

O usuário FREE pode publicar até **2 serviços** e em **1 ambiente**.

---

## O Conectae cobra taxa por transação?

**Não.** O Conectae não cobra taxa sobre serviços contratados. O contato entre prestador e cliente é direto via WhatsApp/Instagram, sem intermediação da plataforma.

---

## Como reportar um problema ou abusou?

Entre em contato através do suporte na página do app. Nós analisaremos e tomaremos as medidas necessárias.

---

## Vocês têm aplicativo para celular?

O Conectae é uma **PWA (Progressive Web App)** e funciona como um aplicativo no celular:
- Acesse via navegador
- Adicione à tela inicial
- Requer internet para funcionar

---

## Posso sugerir novas funcionalidades?

**Sim!** Entre em contato pelo suporte. Valorizamos o feedback dos usuários e constantemente adicionamos novas funcionalidades baseadas em sugestões.

---

## Como funciona o programa de indicação?

(Futuro) Em breve, você poderá indicar novos usuários e prestadores, acumulando pontos e benefícios.

---

## Vocês oferecem suporte técnico?

**Sim!** Plano PRÓ e PLUS têm suporte prioritário. Plano FREE tem suporte por email com tempo de resposta maior.

---

## O que fazer se meu ambiente não aparece?

1. Verifique se você está logado
2. Acesse "Explorar" para buscar novos ambientes
3. Se ainda não encontrar, entre em contato para solicitar cadastro

---

## Posso usar o Conectae para trabalho freelancer?

**Sim!** Muitos profissionais usam o Conectae para encontrar clientes em suas comunidades. É uma excelente forma de conquistar clientes locais.

---

## Vocês têm API para integração?

Atualmente, **não** oferecemos API pública para integração.
---

## Política de Privacidade

O Conectae coleta apenas dados necessários para funcionamento:
- Nome e email (via Google)
- Localização (quando necessária para validação de regras de publicação por ambiente)
- Dados de serviços publicados

Não vendemos dados a terceiros. Veja nossa Política de Privacidade completa.

---

## Como excluir minha conta?

Entre em contato com o suporte solicitando exclusão. Todos os seus dados serão removidos em até 30 dias.

---

## Ainda tem dúvidas?

Entre em contato pelo suporte do app ou email: [EMAIL_ADDRESS]
