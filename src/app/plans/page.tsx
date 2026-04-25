'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';

function normalizeReturnTo(value: string | null): string {
  if (!value) return '';

  const candidates = [value];

  try {
    candidates.push(decodeURIComponent(value));
  } catch {
    // ignore malformed encodings
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!candidate.startsWith('/')) continue;
    if (candidate.startsWith('//')) continue;
    return candidate;
  }

  return '';
}

const plans = [
  {
    id: 'free',
    name: 'FREE',
    price: 'R$ 0',
    period: 'para sempre',
    description: 'Para começar sua presença digital sem custo.',
    highlight: 'Comece agora',
    features: [
      'Perfil básico na plataforma',
      '1 publicação ativa',
      '1 comunidade',
      'Suporte por email',
    ],
    cta: 'Começar grátis',
    popular: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 'R$ 19,90',
    period: 'mês',
    description: 'Para prestadores que querem mais visibilidade local.',
    highlight: 'Mais visibilidade',
    features: [
      'Selo de verificado',
      'Até 3 publicações',
      'Até 2 comunidades',
      'Relatório básico de visualizações',
      'Suporte por email',
    ],
    cta: 'Falar sobre o PRO',
    popular: false,
  },
  {
    id: 'plus',
    name: 'PLUS',
    price: 'R$ 29',
    period: 'mês',
    description: 'Para quem quer escala, dados e alcance máximo.',
    highlight: 'Mais escolhido',
    features: [
      'Tudo do PRO',
      'Publicações ilimitadas',
      'Comunidades ilimitadas',
      'Dashboard avançado',
      'Relatório de visualizações',
      'Suporte prioritário',
    ],
    cta: 'Falar sobre o PLUS',
    popular: true,
  },
];

const testimonials = [
  {
    name: 'Alessandra Lima',
    role: 'Diarista',
    plan: 'Plano PRO',
    text: 'Com o PRO, meus serviços começaram a aparecer mais e em poucas semanas recebi novos contatos pela plataforma.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  },
  {
    name: 'Juliana Costa',
    role: 'Restaurante delivery',
    plan: 'Plano PLUS',
    text: 'O PLUS me ajudou a entender quais anúncios geravam mais interesse e a organizar melhor minha divulgação.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  },
  {
    name: 'Ana Beatriz',
    role: 'Cabeleireira',
    plan: 'Plano PRO',
    text: 'O selo de verificado passou mais confiança para minhas clientes e deixou meu perfil muito mais profissional.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
  },
];

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();

  const currentPlan = user?.plan || 'free';
  const returnTo = normalizeReturnTo(searchParams?.get('returnTo'));
  const returnToQuery = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : '';

  const whatsappNumber = '5551981011805';

  const handleSelectPlan = (planId: string) => {
  const messages: Record<string, string> = {
    free:
      'Olá! Quero saber mais sobre o plano FREE do ConectaE e começar gratuitamente.',
    pro:
      'Olá! Tenho interesse no plano PRO do ConectaE. Quero mais visibilidade para meus serviços.',
    plus:
      'Olá! Tenho interesse no plano PLUS do ConectaE. Quero publicações ilimitadas e dashboard avançado.',
  };

  const message =
    messages[planId] ||
    'Olá! Quero saber mais sobre os planos do ConectaE.';

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  window.open(url, '_blank', 'noopener,noreferrer');
};

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_36%),linear-gradient(180deg,_#ffffff_0%,_#f7faf8_100%)] pb-24 dark:bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_36%),linear-gradient(180deg,_#080a0c_0%,_#101215_100%)] md:pb-12">
      <TopAppBar showBack onBack={() => router.push('/profile')} />

      <main className="mx-auto max-w-6xl px-4 pt-20 md:px-8 md:pt-24">
        <section className="relative text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
            <Icon icon="workspace_premium" size={16} weight={700} />
            Planos ConectaE
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl">
            Escolha o plano ideal para crescer com mais confiança
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400 md:text-lg">
            Tenha mais presença, mais visibilidade e ferramentas para transformar seu serviço em uma operação mais profissional.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const ctaLabel = isCurrent ? 'Falar sobre meu plano atual' : plan.cta;

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-[2rem] border bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(15,23,42,0.12)] dark:bg-[#0f1115] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${
                  plan.popular
                    ? 'border-[#30cc36]/40 ring-2 ring-[#30cc36]/20'
                    : 'border-zinc-200/80 dark:border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4 rounded-full bg-[#30cc36] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(48,204,54,0.35)]">
                    Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36]">
                    <Icon
                      icon={plan.popular ? 'bolt' : plan.id === 'pro' ? 'verified' : 'rocket_launch'}
                      size={24}
                      weight={700}
                    />
                  </div>

                  <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
                    {plan.highlight}
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                    {plan.name}
                  </h2>

                  <p className="mt-2 min-h-[44px] text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black tracking-tight text-[#30cc36]">
                      {plan.price}
                    </span>
                    <span className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#30cc36]/10 text-[#30cc36]">
                        <Icon icon="check" size={14} weight={700} />
                      </div>
                      <span className="text-sm leading-5 text-zinc-700 dark:text-zinc-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-all duration-300 ${
                    plan.popular
                      ? 'bg-[#30cc36] text-white shadow-[0_16px_34px_rgba(48,204,54,0.35)] hover:brightness-110'
                      : 'border border-zinc-200 bg-zinc-950 text-white hover:border-[#30cc36]/40 hover:bg-[#30cc36] dark:border-white/10 dark:bg-white dark:text-zinc-950 dark:hover:bg-[#30cc36] dark:hover:text-white'
                  }`}
                >
                  {ctaLabel}
                  <Icon icon="arrow_forward" size={17} weight={700} />
                </button>
              </article>
            );
          })}
        </section>

        <section className="mt-14 rounded-[2rem] border border-zinc-200/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] md:p-8">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#30cc36]">
                Prova social
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                Prestadores que já estão crescendo
              </h3>
            </div>

            <div className="flex items-center gap-1 text-[#30cc36]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Icon
                  key={index}
                  icon="star"
                  size={18}
                  weight={700}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-3xl border border-zinc-200/70 bg-white p-5 dark:border-white/10 dark:bg-[#0f1115]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-11 w-11 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  <div>
                    <p className="font-black text-zinc-950 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-[#30cc36]">
                      {item.plan} • {item.role}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  “{item.text}”
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#30cc36]/20 bg-[#30cc36] p-6 text-white shadow-[0_24px_70px_rgba(48,204,54,0.22)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                Ainda em dúvida?
              </p>
              <h4 className="mt-2 text-2xl font-black tracking-tight">
                Fale com a gente e escolha o melhor plano
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                Conte sobre seu tipo de serviço, sua região e seu objetivo. A gente te ajuda a escolher o caminho mais inteligente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/contact?source=plans-help')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#1eb34b] transition hover:brightness-95"
            >
              Falar com suporte
              <Icon icon="arrow_forward" size={17} weight={700} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}