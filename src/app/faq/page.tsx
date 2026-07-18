'use client';

import Link from 'next/link';

const faqItems = [
  {
    question: 'O que é o ConectaE?',
    answer:
      'O ConectaE é uma plataforma digital de serviços locais que conecta prestadores e clientes dentro de comunidades como condomínios, igrejas, clubes e associações.',
  },
  {
    question: 'Como funciona o ConectaE?',
    answer:
      'O usuário escolhe um ambiente, os prestadores publicam seus serviços e os moradores encontram opções próximas. O contato acontece diretamente via WhatsApp ou Instagram.',
    items: [
      'Usuários escolhem o ambiente.',
      'Prestadores publicam serviços com fotos, descrição e contato.',
      'Moradores buscam e encontram serviços próximos.',
      'O contato é feito diretamente no canal informado pelo prestador.',
    ],
  },
  {
    question: 'Quais são os tipos de ambiente disponíveis?',
    answer: 'A plataforma trabalha com diferentes perfis de ambiente para organizar os serviços publicados.',
    items: ['Residencial: condomínios e residenciais.', 'Igrejas: paróquias e comunidades religiosas.', 'Clubes: clubes sociais e esportivos.', 'Associações: associações de bairro e profissionais.'],
  },
  {
    question: 'Como me cadastrar?',
    answer:
      'Basta acessar o app, tocar em Entrar, fazer login com Google e selecionar os ambientes disponíveis.',
    items: [
      'O login é feito via Google (OAuth) com Supabase Auth.',
      'Em ambientes do tipo igreja, usuários com papel de moderador podem aprovar prestadores para publicar.',
    ],
  },
  {
    question: 'É gratuito usar o ConectaE?',
    answer: 'Sim e não. Existem limites e benefícios que variam conforme o plano.',
    items: [
      'Plano FREE: gratuito, permite até 2 serviços publicados em 1 ambiente com visibilidade básica.',
      'Plano PRO: R$ 9,90/mês, até 5 serviços, badge de verificação, prioridade de visualização e publicação em mais de um ambiente.',
      'Plano PLUS: R$ 29,90/mês, serviços ilimitados e recursos avançados, com publicação em mais de um ambiente.',
    ],
  },
  {
    question: 'Como funciona a moderação em igrejas?',
    answer:
      'Em ambientes do tipo igreja, o prestador fica pendente até que um moderador aprove sua participação naquele ambiente.',
    items: [
      'O prestador fica com status pendente.',
      'O líder ou moderador aprova o acesso para publicação.',
      'A moderação é do prestador para publicar naquele ambiente, não do serviço individualmente.',
    ],
  },
  {
    question: 'Como crio um serviço?',
    answer:
      'Depois de fazer login, acesse Meus Serviços, toque em Criar Novo Serviço, escolha o ambiente e preencha as informações da publicação.',
    items: [
      'Fotos, título e descrição.',
      'Categoria e canais de contato.',
      'Frequência de disponibilidade.',
      'Em seguida, publique o serviço.',
    ],
  },
  {
    question: 'Quais categorias de serviço existem?',
    answer:
      'As categorias ajudam a organizar e filtrar os anúncios publicados na plataforma.',
    items: ['Alimentação', 'Limpeza', 'Pet Sitting', 'Manutenção', 'Beleza', 'Tecnologia', 'Outros'],
  },
  {
    question: 'Como funciona a busca?',
    answer:
      'Você pode buscar por texto, filtrar por categoria e usar a proximidade para ver serviços próximos da sua localização.',
  },
  {
    question: 'Como entrar em contato com um prestador?',
    answer:
      'Basta tocar nos botões de WhatsApp ou Instagram na página do serviço para ser redirecionado ao app correspondente.',
  },
  {
    question: 'Posso editar ou excluir meu serviço?',
    answer:
      'Sim. Em Meus Serviços você pode editar informações, ativar ou desativar temporariamente e excluir o anúncio.',
  },
  {
    question: 'O que é o badge de verificação?',
    answer:
      'É um selo de confiança exibido em serviços de planos pagos, indicando que o prestador foi verificado pela plataforma.',
  },
  {
    question: 'Como me torno administrador de um ambiente?',
    answer:
      'Entre em contato com o líder atual do ambiente para solicitar acesso administrativo. Esse fluxo vale principalmente para igrejas.',
  },
  {
    question: 'Como funciona a geolocalização?',
    answer:
      'Quando você permite o acesso à localização, o ConectaE ordena os serviços por proximidade e mostra a distância aproximada.',
  },
  {
    question: 'Posso adicionar mais de um ambiente?',
    answer:
      'Sim, você pode participar de múltiplos ambientes. Porém, para publicar em mais de um ambiente, é necessário atender ao plano exigido.',
  },
  {
    question: 'Como funciona o sistema de avaliações?',
    answer:
      'Após contratar um serviço, você pode avaliar com estrelas e comentário opcional. A média aparece na página do serviço.',
  },
  {
    question: 'Esqueci minha senha, como recupero?',
    answer:
      'Como o acesso é feito via Google, você precisa recuperar o acesso da sua conta Google para voltar a entrar no app.',
  },
  {
    question: 'Como identificamos múltiplas contas?',
    answer:
      'Se WhatsApp ou Instagram forem iguais, isso pode indicar o mesmo usuário tentando burlar regras de plano ou publicação.',
  },
  {
    question: 'Meu serviço foi rejeitado, o que fazer?',
    answer:
      'Se você não consegue publicar, normalmente é por vínculo pendente, limite do plano ou validação de localização/moderação.',
    items: [
      'A afiliação ao ambiente pode estar pendente.',
      'Você pode estar fora do raio permitido, como 500m.',
      'O limite do seu plano pode ter sido atingido.',
    ],
  },
  {
    question: 'Posso usar o ConectaE offline?',
    answer:
      'Não. O ConectaE precisa de internet para carregar conteúdos, publicar serviços e abrir contatos externos.',
  },
  {
    question: 'O ConectaE está disponível em quais cidades?',
    answer:
      'A disponibilidade depende dos ambientes cadastrados. A expansão acontece de forma progressiva conforme novos locais entram na plataforma.',
  },
  {
    question: 'Como posso anunciar meu negócio no ConectaE?',
    answer:
      'Você pode publicar serviços nos planos disponíveis, com limites e benefícios diferentes para cada plano.',
    items: [
      'Plano FREE: até 2 serviços gratuitamente no mesmo ambiente.',
      'Plano PRO: até 5 serviços com badge de verificação e mais ambientes.',
      'Plano PLUS: serviços ilimitados e mais recursos.',
    ],
  },
  {
    question: 'Quantos ambientes o usuário FREE pode publicar serviços?',
    answer: 'O usuário FREE pode publicar até 2 serviços e em 1 ambiente.',
  },
  {
    question: 'O ConectaE cobra taxa por transação?',
    answer:
      'Não. O contato entre prestador e cliente é direto, sem intermediação da plataforma e sem taxa sobre a contratação.',
  },
  {
    question: 'Como reportar um problema ou abuso?',
    answer:
      'Entre em contato pelo suporte do app para que a equipe avalie o caso e tome as medidas necessárias.',
  },
  {
    question: 'Vocês têm aplicativo para celular?',
    answer:
      'O ConectaE funciona como uma PWA e pode ser usado no celular pelo navegador, com opção de adicionar à tela inicial.',
  },
  {
    question: 'Posso sugerir novas funcionalidades?',
    answer:
      'Sim. Você pode enviar sugestões pelo suporte e elas ajudam a priorizar novos recursos da plataforma.',
  },
  {
    question: 'Como funciona o programa de indicação?',
    answer:
      'Esse recurso está previsto para o futuro e deve permitir indicar usuários e prestadores com benefícios e pontos.',
  },
  {
    question: 'Vocês oferecem suporte técnico?',
    answer:
      'Sim. Os planos PRO e PLUS têm suporte prioritário, enquanto o plano FREE conta com suporte em prazo maior.',
  },
  {
    question: 'O que fazer se meu ambiente não aparece?',
    answer:
      'Verifique se você está logado, acesse Explorar para buscar novos ambientes e, se necessário, solicite o cadastro do local.',
  },
  {
    question: 'Posso usar o ConectaE para trabalho freelancer?',
    answer:
      'Sim. Muitos profissionais usam a plataforma para encontrar clientes em suas comunidades e ampliar a visibilidade local.',
  },
  {
    question: 'Vocês têm API para integração?',
    answer: 'Atualmente, não oferecemos API pública para integração.',
  },
  {
    question: 'Política de Privacidade',
    answer:
      'O ConectaE coleta apenas os dados necessários para funcionamento, como nome, e-mail, localização quando necessária e dados dos serviços publicados. Não vendemos dados a terceiros.',
  },
  {
    question: 'Como excluir minha conta?',
    answer:
      'Entre em contato com o suporte solicitando a exclusão. Seus dados serão removidos em até 30 dias, quando aplicável.',
  },
  {
    question: 'Ainda tem dúvidas?',
    answer: 'Entre em contato com o suporte do app ou pelo e-mail conectae.hub@gmail.com',
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-20 text-on-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-8">
        <section className="rounded-[2.5rem] border border-outline-variant/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#04193D]/[0.06] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Perguntas frequentes
              </span>
              
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                FAQ
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                Respostas rápidas sobre funcionamento da plataforma, publicação de serviços, planos, moderação e
                suporte.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <p className="text-sm leading-relaxed text-on-surface-variant md:text-base">
            Se você ainda ficar com alguma dúvida depois desta lista, use a página de contato ou fale com o suporte.
          </p>
        </section>

        <div className="grid gap-4">
          {faqItems.map((item) => (
            <section
              key={item.question}
              className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-black tracking-tight text-on-surface md:text-xl">
                {item.question}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                {item.answer}
              </p>
              {item.items ? (
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-on-surface-variant md:text-base">
                  {item.items.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-black tracking-tight text-on-surface md:text-xl">
            Ainda precisa de ajuda?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            Consulte também a{' '}
            <Link className="font-semibold text-primary hover:underline" href="/privacy">
              Política de Privacidade
            </Link>{' '}
            e os{' '}
            <Link className="font-semibold text-primary hover:underline" href="/terms">
              Termos de Uso
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
