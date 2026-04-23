import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "ConectaE | Landing Page",
  description:
    "Condomínios, igrejas, clubes e associações mais organizados com o ConectaE. Linguagem simples, resultado visivel.",
  alternates: {
    canonical: `${siteUrl}/landing`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/landing`,
    title: "ConectaE para condomínios, igrejas, clubes e associações",
    description:
      "Menos bagunca nos grupos, mais ordem nos servicos da comunidade.",
    images: [`${siteUrl}/conectae_logo_light.png`],
  },
};

const environmentCards = [
  {
    title: "Condomínios",
    pain: "Todo dia tem pedido repetido no grupo e indicação perdida.",
    gain: "Morador encontra rápido e ganha paz na rotina.",
  },
  {
    title: "Igrejas",
    pain: "A comunidade quer ajuda, mas falta organização para indicar.",
    gain: "Os serviços ficam visiveis para todos, com mais clareza e confianca.",
  },
  {
    title: "Clubes",
    pain: "A informação roda entre poucas pessoas e muita coisa se perde.",
    gain: "O clube centraliza tudo e os associados resolvem sem dor de cabeca.",
  },
  {
    title: "Associacões",
    pain: "Tem demanda, mas falta um lugar certo para divulgar e contratar.",
    gain: "A associação organiza os prestadores e facilita a vida dos membros.",
  },
];

const impactPoints = [
  "Menos mensagem repetida e perdidas no grupo",
  "Mais confiança para contratar",
  "Contato direto no WhatsApp",
  "Maior visibilidade para quem trabalha na comunidade",
  "Mais facilidade para quem precisa de serviço",
  "Maior tranquilidade para quem busca um prestador"
];

const steps = [
  {
    title: "1. Você chama a gente",
    text: "Em poucos minutos, entendemos seu ambiente e montamos o melhor início.",
  },
  {
    title: "2. O ambiente entra no ConectaE",
    text: "Moradores e membros acessam e já começam a encontrar os serviços do dia a dia.",
  },
  {
    title: "3. Tudo fica mais organizado",
    text: "Quem precisa encontra rápido e quem presta serviço ganha mais oportunidade.",
  },
];

const plans = [
  {
    name: "FREE",
    price: "R$ 0",
    period: "para começar",
    description: "Perfeito para testar e dar os primeiros passos.",
    features: ["Ate 2 serviços", "1 ambiente", "Visibilidade basica"],
    href: "/contact",
    cta: "Comecar Gratis",
    featured: false,
  },
  {
    name: "PRO",
    price: "R$ 9,90",
    period: "por mês",
    description: "Para quem quer aparecer mais e vender mais.",
    features: ["Ate 3 servicos", "Até 2 ambiente", "Badge de verificacao"],
    href: "/contact",
    cta: "Quero PRO",
    featured: true,
  },
  {
    name: "PLUS",
    price: "R$ 19,90",
    period: "por mês",
    description: "Para quem vive de serviço e quer escalar.",
    features: ["Servicos ilimitados", "Ambientes ilimitados", "Suporte prioritário"],
    href: "/contact",
    cta: "Quero PLUS",
    featured: false,
  },
];

const faq = [
  {
    q: "Precisa instalar app no celular?",
    a: "Não obrigatoriamente. Abre no navegador e vai um atalho para a tela inicial, igual app.",
  },
  {
    q: "Meu ambiente consegue começar sem complicação?",
    a: "Sim. A implantação e simples, com apoio do nosso time do começo ao uso no dia a dia.",
  },
  {
    q: "Isso substitui o grupo de WhatsApp?",
    a: "O grupo pode continuar. O ConectaE entra para organizar os servicos e evitar bagunça.",
  },
  {
    q: "Quem conversa com o prestador?",
    a: "O contato é direto pelo WhatsApp ou Instagram, sem complicacao.",
  },
];

export default function LandingSalesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06150f] text-white">
      <div className="pointer-events-none absolute -left-16 top-12 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />

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
              href="/home"
              className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Ver Site
            </Link>
            <Link
              href="/contact"
              className="rounded-full bg-[#30CC36] px-4 py-2 text-sm font-black text-[#052f14] shadow-lg shadow-[#30CC36]/25 transition hover:brightness-110"
            >
              Quero Implantar
            </Link>
          </div> */}
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-12 md:grid-cols-2 md:px-6 md:pb-20 md:pt-16">
          <div className="space-y-6">
            <h1 className="max-w-2xl text-3xl font-black leading-tight text-white md:text-5xl">
              Chega de bagunça no grupo.
              <br />
              Seu ambiente pode funcionar melhor.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-emerald-100/85 md:text-lg">
              O ConectaE organiza os prestadores de serviços do seu condominio, igreja, clube ou associação em um lugar só. 
              Menos confusao e mais facilidade para todo mundo.
            </p>

            {/* <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#30CC36] px-6 py-3 text-center text-sm font-black text-[#052f14] shadow-xl shadow-[#30CC36]/25 transition hover:brightness-110 sm:w-auto"
              >
                Quero implantar no meu ambiente
              </Link>
              <Link
                href="/explore"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-white/50 sm:w-auto"
              >
                Ver exemplo na pratica
              </Link>
            </div> */}

            <div className="hidden gap-3 pt-2 md:grid md:grid-cols-2">
              {impactPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-emerald-50"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-[2rem] border border-white/15 bg-gradient-to-b from-emerald-200/10 to-black/40 p-6 shadow-2xl">
              <div className="grid gap-4">
                <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                  <p className="text-lg font-black text-white">Antes do ConectaE</p>
                  <p className="mt-2 text-base text-emerald-50/90">
                    Pedido perdido no grupo, resposta atrasada e dúvida sobre quem contratar.
                  </p>
                </div>
                <div className="rounded-3xl border border-emerald-200/25 bg-emerald-300/10 p-5">
                  <p className="text-lg font-black text-emerald-50">Com ConectaE no ambiente</p>
                  <p className="mt-2 text-base text-emerald-50">
                    Serviço organizado, busca rápida e contato direto para resolver sem enrolação.
                  </p>
                </div>
                <div className="rounded-3xl border border-lime-200/30 bg-lime-200/10 p-5 text-base font-semibold text-lime-50">
                  Organização e comunidade bem atendida: é isso que a plataforma entrega.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pt-1 sm:grid-cols-2 md:hidden">
            {impactPoints.map((item) => (
              <div
                key={`mobile-${item}`}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-emerald-50"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8f7] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-10">
            <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-4xl">
              Funciona para Condomínios, Igrejas, Clubes e Associações.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {environmentCards.map((card) => (
              <article
                key={card.title}
                className="rounded-3xl border border-outline-variant/20 bg-white p-6 shadow-[0_16px_40px_rgba(5,23,17,0.08)]"
              >
                <h3 className="text-2xl font-black text-on-surface">{card.title}</h3>
                <p className="mt-4 text-base font-semibold text-[#a7351b]">{card.pain}</p>
                <p className="mt-3 text-base leading-relaxed text-on-surface-variant">{card.gain}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f1] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <h2 className="max-w-4xl text-3xl font-black leading-tight md:text-4xl">
            Em poucas palavras: menos confusão, mais resultado no dia a dia.
          </h2>
          <div className="mt-8 rounded-[2rem] border border-outline-variant/20 bg-white p-6 shadow-[0_16px_36px_rgba(5,23,17,0.08)] md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[#f4f9f4] p-5">
                <p className="text-4xl font-black text-primary">1 lugar</p>
                <p className="mt-2 text-base font-semibold text-on-surface">para achar serviço sem ficar caçando mensagem antiga</p>
              </div>
              <div className="rounded-2xl bg-[#f4f9f4] p-5">
                <p className="text-4xl font-black text-primary">1 clique</p>
                <p className="mt-2 text-base font-semibold text-on-surface">para falar com o prestador no WhatsApp ou Instagram</p>
              </div>
              <div className="rounded-2xl bg-[#f4f9f4] p-5">
                <p className="text-4xl font-black text-primary">1 rotina</p>
                <p className="mt-2 text-base font-semibold text-on-surface">mais leve para moradores e consumidores</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071a14] py-14 text-white md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <h2 className="mt-3 text-3xl font-black md:text-4xl">Implementar aqui é rapido!</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-3xl border border-white/15 bg-white/5 p-6">
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/85">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8f7] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-black md:text-4xl">Planos que cabem no bolso de quem presta serviço.</h2>
            <p className="mt-3 text-base text-on-surface-variant">
              O ambiente ganha organização. O prestador escolhe o plano para crescer dentro da comunidade.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-6 ${
                  plan.featured
                    ? "border-primary bg-[#0b2f1a] text-white shadow-[0_20px_46px_rgba(48,204,54,0.28)]"
                    : "border-outline-variant/20 bg-white text-on-surface shadow-[0_16px_36px_rgba(5,23,17,0.08)]"
                }`}
              >
                <h3 className={`text-xl font-black ${plan.featured ? "text-emerald-100" : "text-on-surface"}`}>{plan.name}</h3>
                <p className="mt-3 text-4xl font-black">
                  {plan.price}
                  <span className={`ml-2 text-sm font-semibold ${plan.featured ? "text-emerald-200" : "text-on-surface-variant"}`}>
                    {plan.period}
                  </span>
                </p>
                <p className={`mt-3 text-sm ${plan.featured ? "text-emerald-100/90" : "text-on-surface-variant"}`}>
                  {plan.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm font-medium">
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-black transition sm:w-auto ${
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

          <div className="mt-8 rounded-3xl border border-outline-variant/20 bg-white p-6 text-on-surface shadow-[0_12px_28px_rgba(5,23,17,0.06)] md:p-7">
            <p className="text-xl font-black">Condominio parceiro pode iniciar com condição especial de entrada.</p>
            <p className="mt-2 text-base text-on-surface-variant">
              Chame nosso time e veja o melhor formato para implantar no seu ambiente.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f1] py-14 text-on-surface md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <h2 className="text-3xl font-black md:text-4xl">Perguntas que sempre aparecem</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <article key={item.q} className="rounded-3xl border border-outline-variant/25 bg-white p-6">
                <h3 className="text-lg font-black text-on-surface">{item.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#06140f] py-14 text-white md:py-16">
        <div className="mx-auto w-full max-w-6xl rounded-[2rem] border border-emerald-200/25 bg-gradient-to-r from-[#0f2f1e] to-[#0a2217] px-6 py-8 md:flex md:items-center md:justify-between md:px-10">
          <div className="max-w-2xl">
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Líder que organiza bem o ambiente cuida melhor das pessoas.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-emerald-100/85">
              Traga o ConectaE para seu condomínio, igreja, clube ou associacao e deixe a rotina da comunidade mais
              simples, mais rapida e mais organizada.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#30CC36] px-6 py-3 text-sm font-black text-[#052f14] hover:brightness-110 sm:w-auto"
            >
              Quero Implantar Agora
            </Link>
            {/* <Link
              href="/plans"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:border-white/50 sm:w-auto"
            >
              Ver Planos
            </Link> */}
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold hover:border-white/50 sm:w-auto"
            >
              Abrir Aplicação
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
