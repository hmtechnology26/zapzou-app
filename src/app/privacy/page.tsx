'use client';

import Link from 'next/link';

const sections = [
  {
    title: '1. Dados coletados',
    body: 'Coletamos apenas os dados necessários para o funcionamento da plataforma e para a publicação/visualização de serviços.',
    items: [
      'Dados de autenticação via Google, por meio do Supabase Auth.',
      'Dados de perfil, como nome e avatar, além das informações inseridas na publicação de serviços.',
      'Localização, quando necessária, para validar regras de publicação por ambiente.',
    ],
  },
  {
    title: '2. Finalidades',
    body: 'Usamos os dados para autenticar usuários, manter a conta ativa, exibir serviços e aplicar regras de segurança.',
    items: [
      'Permitir o login e o uso contínuo da conta.',
      'Exibir e organizar serviços por comunidade e ambiente.',
      'Prevenir fraudes, duplicidade de contato e uso indevido da plataforma.',
    ],
  },
  {
    title: '3. Compartilhamento',
    body: 'O contato com prestadores pode ocorrer por links de WhatsApp e Instagram informados pelo próprio usuário.',
    items: ['Não vendemos dados pessoais.', 'Não compartilhamos informações além do necessário para o funcionamento do app.'],
  },
  {
    title: '4. Armazenamento',
    body: 'Os dados ficam armazenados no Supabase, incluindo banco de dados e autenticação.',
    items: [
      'Quando aplicável, imagens e arquivos podem ser armazenados em um serviço de storage configurado.',
      'Mantemos os registros pelo tempo necessário para operar a plataforma e atender obrigações legais.',
    ],
  },
  {
    title: '5. Seus direitos',
    body: 'Você pode solicitar atualização ou remoção de dados conforme aplicável, além de pedir suporte sobre o uso da conta.',
    items: ['Consulte também os Termos de Uso para entender as regras da plataforma.'],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-20 text-on-surface">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 md:px-8">
        <section className="rounded-[2.5rem] border border-outline-variant/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#04193D]/[0.06] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Política de privacidade
              </span>
              <span className="text-xs font-medium text-on-surface-variant">
                Última atualização: 26/03/2026
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                Política de Privacidade
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                Esta política explica como tratamos os dados pessoais no ConectaE e quais informações podem ser
                coletadas durante o uso da plataforma.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <p className="text-sm leading-relaxed text-on-surface-variant md:text-base">
            Ao usar o aplicativo, você concorda com este tratamento de dados conforme descrito nesta página.
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
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-on-surface-variant md:text-base">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm md:p-6">
          <h2 className="text-lg font-black tracking-tight text-on-surface md:text-xl">
            6. Termos relacionados
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
            Consulte também os{' '}
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
