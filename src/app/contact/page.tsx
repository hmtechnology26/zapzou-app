'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';

const quickLinks = [
  {
    href: '/terms',
    title: 'Termos de Uso',
    description: 'Regras, responsabilidades e condições de uso.',
    icon: 'description',
  },
  {
    href: '/privacy',
    title: 'Privacidade',
    description: 'Como seus dados são coletados e protegidos.',
    icon: 'shield',
  },
  {
    href: '/faq',
    title: 'FAQ',
    description: 'Respostas rápidas para dúvidas comuns.',
    icon: 'help',
  },
];

export default function ContactPage() {
  const { user } = useApp();

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Sou ${user?.name || 'usuário'} e preciso de suporte com a plataforma Conectaê.`
    );

    window.open(`https://wa.me/5551981011805?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_38%),linear-gradient(180deg,_#ffffff_0%,_#f6faf7_100%)] pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-6xl px-4 pt-24 md:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#04193D]/20 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#04193D]/20 bg-[#04193D]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
                <Icon icon="support_agent" size={16} weight={700} />
                Atendimento ConectaE
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
                Fale com nosso time e receba ajuda rápida
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-500 md:text-lg">
                Precisa tirar dúvidas sobre planos, anúncios, comunidades ou suporte técnico? Converse direto com a gente pelo WhatsApp.
              </p>

              <button
                onClick={handleWhatsApp}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#04193D] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(48,204,54,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95 sm:w-auto"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .011 5.403.011 12.038c0 2.121.554 4.189 1.602 6.04L0 24l6.105-1.602a11.832 11.832 0 005.937 1.598h.005c6.632 0 12.035-5.404 12.035-12.04a11.808 11.808 0 00-3.517-8.438z" />
                </svg>
                Iniciar conversa no WhatsApp
              </button>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                  <p className="text-2xl font-black text-[#04193D]">Rápido</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    atendimento direto
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                  <p className="text-2xl font-black text-[#04193D]">Humano</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    suporte de verdade
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                  <p className="text-2xl font-black text-[#04193D]">Seguro</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    conversa protegida
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-zinc-200/80 bg-white/90 p-6 text-zinc-950 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#04193D]/10 text-[#04193D]">
    <Icon icon="bolt" size={28} weight={700} />
  </div>

  <h2 className="mt-6 text-2xl font-black tracking-tight text-zinc-950">
    Antes de chamar, conte o que você precisa
  </h2>

  <p className="mt-3 text-sm leading-6 text-zinc-500">
    Para agilizar, envie na mensagem se sua dúvida é sobre plano, anúncio,
    pagamento, comunidade ou acesso.
  </p>

  <div className="mt-6 space-y-3">
    {[
      'Escolher o melhor plano',
      'Resolver problema no anúncio',
      'Dúvidas sobre comunidades',
      'Suporte técnico da conta',
    ].map((item) => (
      <div
        key={item}
        className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#04193D]/10 text-[#04193D]">
          <Icon icon="check" size={15} weight={700} />
        </span>

        <p className="text-sm font-bold text-zinc-700">
          {item}
        </p>
      </div>
    ))}
  </div>
</aside>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
              Documentos e ajuda
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.6rem] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#04193D]/30 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#04193D]/10 text-[#04193D]">
                      <Icon icon={item.icon} size={22} weight={700} />
                    </div>

                    <p className="text-base font-black text-zinc-950">
                      {item.title}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {item.description}
                    </p>
                  </div>

                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-[#04193D] group-hover:text-white">
                    <Icon icon="arrow_forward" size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#04193D]">
            Dúvidas frequentes
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-5">
              <p className="text-sm font-black text-zinc-950">
                Como sou aprovado em uma comunidade?
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                A liderança da igreja, condomínio ou organização avalia seu pedido e autoriza sua entrada.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-5">
              <p className="text-sm font-black text-zinc-950">
                Meus anúncios são pagos?
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Depende do plano escolhido. O plano gratuito permite começar com recursos básicos.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}