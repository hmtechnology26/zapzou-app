'use client';

import Link from 'next/link';

const sections = [
  {
    title: '1. O que é o ConectaE',
    body: 'O ConectaE é um hub de serviços para conectar pessoas a prestadores dentro de ambientes como condomínios, igrejas e outros espaços comunitários.',
  },
  {
    title: '2. Conta e autenticação',
    body: 'O acesso é feito por login com Google via Supabase Auth. Você é responsável por manter seus dados de acesso seguros.',
  },
  {
    title: '3. Publicação de serviços',
    body: 'A publicação pode exigir validação de vínculo, localização e moderação, dependendo do ambiente e das regras da conta. Em alguns casos, ambientes como igrejas exigem moderação.',
  },
  {
    title: '4. Conteúdo e responsabilidade',
    body: 'O usuário responde pelas informações que publica. O ConectaE não se responsabiliza por negociações, pagamentos, execução do serviço ou conflitos entre usuários.',
  },
  {
    title: '5. Suspensão e encerramento',
    body: 'Podemos restringir ou encerrar acessos em caso de abuso, fraude, violação das regras da plataforma ou uso inadequado.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-20 text-on-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-8">
        <section className="rounded-[2.5rem] border border-outline-variant/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#30cc36]/[0.06] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Termos de uso
              </span>
              <span className="text-xs font-medium text-on-surface-variant">
                Última atualização: 26/03/2026
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                Termos de Uso
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                Estes termos explicam como você pode usar a plataforma, quais
                são as responsabilidades de cada parte e como funcionam as
                regras de publicação e convivência dentro do ConectaE.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Ao usar o aplicativo, você concorda com estes termos. Se não
            concordar com alguma parte, interrompa o uso da plataforma.
          </p>
        </section>

        <div className="grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-black tracking-tight text-on-surface md:text-xl">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-black tracking-tight text-on-surface md:text-xl">
            6. Contato
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            Para dúvidas, consulte também a{' '}
            <Link className="font-semibold text-primary hover:underline" href="/privacy">
              Política de Privacidade
            </Link>{' '}
            e os canais de suporte do projeto.
          </p>
        </section>
      </div>
    </main>
  );
}
