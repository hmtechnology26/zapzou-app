import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Conectae | Landing Oficial",
  description:
    "A plataforma local para condominios, igrejas, clubes e associações fecharem servicos com mais confianca e menos ruido.",
  alternates: {
    canonical: `${siteUrl}/home`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/home`,
    title: "Conectae | Servicos locais com conversao real",
    description:
      "Encontre, publique e feche serviços locais com contato direto via WhatsApp.",
    images: [`${siteUrl}/conectae_logo_light.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conectae | Servicos locais com conversao real",
    description:
      "Marketplace local com foco em comunidade, confiança e crescimento para prestadores.",
    images: [`${siteUrl}/conectae_logo_light.png`],
  },
};

const conversionPillars = [
  {
    title: "Confiança na primeira impressao",
    description:
      "Avaliaçao, badge de verificação e organização por ambiente reduzem incerteza na hora de contratar.",
    metric: "Mais segurança para fechar",
  },
  {
    title: "Contato sem atrito",
    description:
      "Cliente clica e fala direto no WhatsApp. Sem intermediar pagamento e sem taxa por transação.",
    metric: "Fluxo rápido para gerar conversa",
  },
  {
    title: "Oferta realmente local",
    description:
      "Busca por proximidade e contexto de comunidade ajuda a mostrar quem está perto e pronto para atender.",
    metric: "Mais relevância por bairro/ambiente",
  },
];

const personaSections = [
  {
    title: "Moradores",
    pain: "Cansaram de pedir indicação em grupos sem padrão.",
    gain: "Encontram servicos próximos, avaliados e com contato instantãneo.",
    cta: "Explorar Servicos",
    href: "/explore",
  },
  {
    title: "Prestadores",
    pain: "Dependem de boca a boca e perdem visibilidade.",
    gain: "Ganham vitrine local, reputação e opcões de plano para escalar.",
    cta: "Publicar Meu Serviço",
    href: "/register-service",
  },
  {
    title: "Síndicos e Líderes",
    pain: "Recebem pedidos constantes e sem organização.",
    gain: "Centralizam oferta de serviços com mais controle por comunidade.",
    cta: "Falar com Time",
    href: "/contact",
  },
];

const flowSteps = [
  {
    title: "1. Escolha o ambiente",
    description:
      "Condomínios, igrejas, clubes ou associações. A base da aplicacao ja organiza tudo por comunidade.",
    href: "/places",
    action: "Ver Ambientes",
  },
  {
    title: "2. Encontre ou publique serviços",
    description:
      "Busca por categoria e proximidade para cliente; criação simples com fotos e descrição para prestador.",
    href: "/explore",
    action: "Abrir Busca",
  },
  {
    title: "3. Feche no canal que converte",
    description:
      "Contato direto via WhatsApp/Instagram para reduzir fricçao e acelerar o fechamento.",
    href: "/contact",
    action: "Falar com Suporte",
  },
];

const plans = [
  {
    id: "free",
    name: "FREE",
    price: "R$ 0",
    period: "para comecar",
    focus: "Validar demanda local",
    features: ["1 serviço", "1 ambiente", "Visibilidade basica"],
    href: "/plans",
    cta: "Começar Gratis",
    featured: false,
  },
  {
    id: "pro",
    name: "PRO",
    price: "R$ 9,90",
    period: "por mês",
    focus: "Crescimento com destaque",
    features: ["Ate 3 serviços", "Multiplos ambientes", "Badge de verificacao"],
    href: "/plans/pro",
    cta: "Quero PRO",
    featured: true,
  },
  {
    id: "plus",
    name: "PLUS",
    price: "R$ 19,90",
    period: "por mês",
    focus: "Escala para quem vive de servico",
    features: ["Servicos ilimitados", "Ambientes ilimitados", "Recursos avançados"],
    href: "/plans/plus",
    cta: "Quero PLUS",
    featured: false,
  },
];

const faq = [
  {
    q: "O ConectaE cobra taxa por transação?",
    a: "Nao. O contato e direto entre cliente e prestador, sem taxa sobre o serviço contratado.",
  },
  {
    q: "Precisa baixar aplicativo?",
    a: "Nao necessariamente. O ConectaE funciona como PWA e pode ser usado no navegador do celular.",
  },
  {
    q: "Tem moderação?",
    a: "Sim, em ambientes de igreja (quando solicitado) existe moderação de prestadores para manter qualidade e alinhamento local.",
  },
  {
    q: "Como evitem fraude de contas duplicadas?",
    a: "A plataforma detecta repeticao de WhatsApp/Instagram em contas diferentes para reduzir burla de planos.",
  },
];

export default function LandingHomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#051711] text-white">
      <div className="pointer-events-none absolute -left-24 top-14 h-72 w-72 rounded-full bg-primary/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 top-48 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-lime-300/15 blur-3xl animate-pulse" />

      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/conectae_logo_light.png"
              alt="Conectae"
              width={146}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* <div className="flex items-center gap-2">
            <Link
              href="/plans"
              className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Ver Planos
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#30CC36] px-4 py-2 text-sm font-black text-[#052f14] shadow-lg shadow-[#30CC36]/25 transition hover:brightness-110"
            >
              Entrar Agora
            </Link>
          </div> */}
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-12 md:grid-cols-2 md:px-6 md:pb-20 md:pt-16">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
              Marketplace local pronto para conversão
            </span>
            <h1 className="max-w-xl text-4xl font-black leading-tight text-white md:text-6xl">
              Transforme indicação solta em fechamento real de serviço.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-emerald-100/85 md:text-lg">
              O ConectaE conecta moradores/consumidores e prestadores em um fluxo que tira o caos dos grupos e cria uma
              vitrine local com confiança, proximidade e contato imediato.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#30CC36] px-6 py-3 text-center text-sm font-black text-[#052f14] shadow-xl shadow-[#30CC36]/25 transition hover:brightness-110 sm:w-auto"
              >
                Encontrar Serviços
              </Link>
              <Link
                href="/register-service"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-white/50 sm:w-auto"
              >
                Quero Vender no ConectaE
              </Link>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-emerald-50">
                500m de validação local
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-emerald-50">
                Sem taxa por transação
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-emerald-50">
                Contato direto no WhatsApp
              </div>
            </div>
          </div>

          <div>
            <div className="relative rounded-[2rem] border border-white/15 bg-gradient-to-b from-emerald-200/10 to-black/40 p-5 shadow-2xl">
              <div className="grid gap-4">
                <div className="rounded-3xl border border-emerald-100/20 bg-black/40 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200/70">Oferta Piloto</p>
                  <p className="mt-2 text-2xl font-black text-white">1 mês grátis para condominios parceiros</p>
                  <p className="mt-2 text-sm text-emerald-100/80">
                    Estratégia de entrada focada em sindicos com comunidade ativa.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-emerald-100/70">Meta de escala GTM</p>
                    <p className="mt-2 text-3xl font-black">50</p>
                    <p className="mt-1 text-xs text-emerald-100/80">condominios ativos na fase de crescimento</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-emerald-100/70">Plano de entrada</p>
                    <p className="mt-2 text-3xl font-black">R$ 9,90</p>
                    <p className="mt-1 text-xs text-emerald-100/80">upgrade PRO para ganhar destaque</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-lime-200/30 bg-lime-200/10 p-4 text-sm text-lime-50">
                  Foco comercial: reduzir ruído de aquisição e aumentar taxa de contato qualificado no primeiro clique.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#f6f8f7] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Motor de vendas local</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight md:text-4xl">
              A página usa a base real do produto para converter em cada etapa.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {conversionPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-[0_16px_40px_rgba(5,23,17,0.08)]"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{pillar.metric}</p>
                <h3 className="mt-3 text-xl font-black text-on-surface">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#eef4f1] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          {/* <h2 className="max-w-2xl text-3xl font-black leading-tight md:text-4xl">
            Copy orientada por persona para vender para quem decide.
          </h2> */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {personaSections.map((persona) => (
              <article
                key={persona.title}
                className="flex h-full flex-col rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-[0_14px_38px_rgba(5,23,17,0.07)]"
              >
                <h3 className="text-2xl font-black text-on-surface">{persona.title}</h3>
                <p className="mt-4 text-sm font-semibold text-[#a7351b]">{persona.pain}</p>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{persona.gain}</p>
                <Link
                  href={persona.href}
                  className="mt-6 inline-flex w-fit rounded-full bg-on-surface px-4 py-2 text-sm font-bold text-white transition hover:bg-on-surface/90"
                >
                  {persona.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#071a14] py-14 text-white md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Fluxo da aplicação</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">Tudo conectado com o que já existe no app.</h2>
            </div>
            <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/40">
              Abrir Aplicação
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {flowSteps.map((step) => (
              <article key={step.title} className="rounded-3xl border border-white/15 bg-white/5 p-6">
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/85">{step.description}</p>
                <Link href={step.href} className="mt-5 inline-flex text-sm font-bold text-emerald-200 hover:text-emerald-100">
                  {step.action}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#f6f8f7] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Oferta de monetização</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Conheça nossos Planos</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`rounded-3xl border p-6 ${
                  plan.featured
                    ? "border-primary bg-[#0b2f1a] text-white shadow-[0_18px_45px_rgba(48,204,54,0.3)]"
                    : "border-outline-variant/20 bg-white text-on-surface shadow-[0_14px_34px_rgba(5,23,17,0.07)]"
                }`}
              >
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${plan.featured ? "text-emerald-200" : "text-primary"}`}>
                  {plan.name}
                </p>
                <p className="mt-3 text-4xl font-black">
                  {plan.price}
                  <span className={`ml-2 text-sm font-semibold ${plan.featured ? "text-emerald-200/90" : "text-on-surface-variant"}`}>
                    {plan.period}
                  </span>
                </p>
                <p className={`mt-2 text-sm ${plan.featured ? "text-emerald-100/90" : "text-on-surface-variant"}`}>{plan.focus}</p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`text-sm ${plan.featured ? "text-white" : "text-on-surface"}`}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex rounded-full px-4 py-2 text-sm font-black transition ${
                    plan.featured
                      ? "bg-[#30CC36] text-[#052f14] hover:brightness-110"
                      : "bg-on-surface text-white hover:bg-on-surface/90"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#eef4f1] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-black md:text-4xl">FAQ</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <article key={item.q} className="rounded-3xl border border-outline-variant/25 bg-white p-5">
                <h3 className="text-lg font-black text-on-surface">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-[#06140f] py-14 text-white md:py-16">
        <div className="mx-auto w-full max-w-6xl rounded-[2rem] border border-emerald-200/25 bg-gradient-to-r from-[#0f2f1e] to-[#0a2217] px-6 py-8 md:flex md:items-center md:justify-between md:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Chamada para ação final</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Seu produto já tem base. Agora use uma página que vende.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/85">
              Entre agora e transforme descoberta local em pedidos, mensagens e contratos dentro da sua comunidade.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#30CC36] px-5 py-3 text-sm font-black text-[#052f14] hover:brightness-110 sm:w-auto"
            >
              Abrir Aplicação
            </Link>
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-5 py-3 text-sm font-semibold hover:border-white/50 sm:w-auto"
            >
              Falar com Comercial
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
