import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "ConectaE - Encontre clientes perto de você",
  description:
    "Conecta E: plataforma que conecta prestadores de serviço, clientes e comunidades de forma rápida, simples e segura. Teste grátis.",
  alternates: {
    canonical: `${siteUrl}/landing`,
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/landing`,
    title: "Conecta E - Encontre clientes perto de você",
    description:
      "Conecta E: plataforma que conecta prestadores de serviço, clientes e comunidades de forma rápida, simples e segura. Teste grátis.",
    images: [`${siteUrl}/apple-touch-icon.png`],
  },
};

const heroCards = [
  {
    title: "Prestador de serviço",
    text: "Conquiste clientes próximos e aumente sua renda com mais visibilidade local.",
    icon: "location_on",
  },
  {
    title: "Para quem busca serviços",
    text: "Encontre serviços confiáveis perto de você, com a segurança da sua comunidade.",
    icon: "groups",
  },
  {
    title: "Para quem gerencia comunidades",
    text: "Transforme sua comunidade em um ambiente organizado, conectado e cheio de oportunidades.",
    icon: "apartment",
  },
];

const realidadeHoje = [
  "Precisa investir em anúncios para conseguir clientes e nem sempre tem retorno",
  "Fica sem previsibilidade de renda, com dias cheios e outros sem nenhum pedido de serviço",
  "Fica refém de Instagram e redes sociais para conseguir trabalho",
  "Dificuldade para conseguir clientes da sua própria região",
];

const beneficiosPrestador = [
  "Seja encontrado por pessoas da sua própria região, prontas para contratar",
  "Divulgue seus serviços de forma simples e direta",
  "Gere oportunidades todos os dias dentro da comunidade",
  "Tenha mais previsibilidade de pedidos ao longo do mês",
  "Aumente sua visibilidade local sem precisar investir muito",
];

const metricas = [
  { value: "+46%", label: "Renda", icon: "trending_up", floating: false },
  { value: "+500", label: "Novos clientes", icon: "groups", floating: false },
  {
    value: "5km",
    label: "Alcance local",
    icon: "location_on",
    floating: false,
  },
  { value: "100%", label: "Confiança", icon: "shield", floating: false },
];

const passos = [
  {
    title: "Passo 1",
    heading: "Crie seu perfil no ConectaE",
    text: "Cadastre seus serviços de forma simples e comece a mostrar seu trabalho para pessoas da sua região.",
    icon: "person_add",
  },
  {
    title: "Passo 2",
    heading: "Comece a aparecer para clientes próximos",
    text: "Seu serviço fica visível dentro das comunidades, alcançando pessoas que realmente podem contratar você.",
    icon: "visibility",
  },
  {
    title: "Passo 3",
    heading: "Receba mais contatos e oportunidades",
    text: "Clientes encontram você com facilidade e entram em contato para solicitar seus serviços.",
    icon: "chat",
  },
  {
    title: "Passo 4",
    heading: "Aumente sua renda com mais frequência",
    text: "Com mais visibilidade e proximidade, você gera mais pedidos e cresce de forma consistente.",
    icon: "paid",
  },
];

const planos = [
  {
    name: "FREE",
    description: "Comece a divulgar seus serviços agora mesmo.",
    price: "R$ 0",
    period: "/mês",
    features: [
      "Perfil básico na plataforma",
      "1 Publicação",
      "1 Comunidade",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    featured: false,
  },
  {
    name: "PRO",
    description: "Para quem quer crescer com previsibilidade.",
    price: "R$ 19,90",
    period: "/mês",
    features: [
      "Selo de Verificado",
      "Até 3 Publicações",
      "Ate 2 Comunidades",
      "Relatório de Visualização Básico",
      "Suporte por email",
    ],
    cta: "Assinar agora",
    featured: false,
    badge: "Mais escolhido",
  },
  {
    name: "PLUS",
    description: "Máximo alcance e ferramentas avançadas.",
    price: "R$ 29",
    period: "/mês",
    features: [
      "Tudo do Profissional",
      "Selo de verificado",
      "Publicações Ilimitadas",
      "Comunidades Ilimitadas",
      "Relatório de Visualizações Avançado",
      "Suporte Prioritário",
    ],
    cta: "Falar com vendas",
    featured: true,
  },
];

const buscaDiferenciais = [
  { icon: "groups", text: "Profissionais da sua comunidade" },
  { icon: "Build", text: "Tudo organizado num só lugar" },
  { icon: "schedule", text: "Economize tempo" },
  { icon: "shield", text: "Contrate com mais segurança" },
];

const buscaLista = [
  "Acesse profissionais dentro da sua própria comunidade",
  "Tenha tudo organizado em um só lugar",
  "Economize tempo e evite riscos ao contratar",
];

const comunidadeLista = [
  "Ofereça um diferencial relevante",
  "Centralize serviços e comunicação",
  "Fortaleça engajamento e valor",
];

const faq = [
  {
    question: "O que é o ConectaE?",
    answer:
      "O ConectaE é uma plataforma digital de serviços locais que conecta prestadores a clientes dentro da própria comunidade, como condomínios residenciais e igrejas.",
  },
  {
    question: "Como faço para começar a divulgar meus serviços?",
    answer:
      'Faça login com Google, entre em "Meus Serviços", clique em "Criar Novo Serviço", escolha o ambiente em que você participa e publique com fotos, descrição e contato.',
  },
  {
    question: "Preciso pagar para testar?",
    answer:
      "Não. Você pode começar no plano FREE. Depois, se quiser mais alcance e recursos, pode migrar para os planos pagos.",
  },
  {
    question: "Como funciona para quem quer contratar um serviço?",
    answer:
      "Quem busca serviço pode filtrar por categoria, texto e proximidade. Depois é só abrir o perfil e falar direto com o prestador no WhatsApp ou Instagram.",
  },
  {
    question: "Posso levar o ConectaE para meu condomínio ou associação?",
    answer:
      "Sim. O ConectaE foi criado para ambientes como condomínios residenciais e igrejas. Assim a comunidade organiza os serviços em um só lugar e facilita a contratação local.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. O ConectaE usa login seguro com Google e coleta apenas os dados necessários para o funcionamento da plataforma. Seus dados não são vendidos a terceiros.",
  },
];

export default function LandingSalesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7fbf8] text-[#111f18]">
      <header className="sticky top-0 z-50 border-b border-[#dbe9df] bg-[#f7fbf8]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:h-16 sm:py-0 md:px-6">
          <Link href="/landing" className="flex items-center gap-2">
            <Image
              src="/conectae_logo.png"
              alt="ConectaE"
              width={146}
              height={40}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#beneficios"
              className="text-[18px] text-[#5f7066]  transition-colors hover:text-[#1b2a20]"
            >
              Benefícios
            </a>
            <a
              href="#como-funciona"
              className="text-[18px] text-[#5f7066] transition-colors hover:text-[#1b2a20]"
            >
              Como funciona
            </a>
            <a
              href="#planos"
              className="text-[18px] text-[#5f7066] transition-colors hover:text-[#1b2a20]"
            >
              Planos
            </a>
            <a
              href="#faq"
              className="text-[18px] text-[#5f7066] transition-colors hover:text-[#1b2a20]"
            >
              FAQ
            </a>
          </nav>

          <div className="flex flex-row-reverse items-center gap-2 md:flex-row">
            <details className="relative md:hidden">
              <summary
                aria-label="Abrir menu"
                className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#d6e6db] bg-white text-[#1c2d23] shadow-[0_6px_16px_rgba(17,60,34,0.08)] [&::-webkit-details-marker]:hidden"
              >
                <Icon icon="menu" size={20} weight={700} />
              </summary>

              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-[#dce9df] bg-white p-2 shadow-[0_16px_36px_rgba(17,60,34,0.16)]">
                <nav className="flex flex-col">
                  <a
                    href="#beneficios"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#1c2d23] transition hover:bg-[#f2f8f4]"
                  >
                    Benefícios
                  </a>
                  <a
                    href="#como-funciona"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#1c2d23] transition hover:bg-[#f2f8f4]"
                  >
                    Como funciona
                  </a>
                  <a
                    href="#planos"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#1c2d23] transition hover:bg-[#f2f8f4]"
                  >
                    Planos
                  </a>
                  <a
                    href="#faq"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[#1c2d23] transition hover:bg-[#f2f8f4]"
                  >
                    FAQ
                  </a>
                </nav>
              </div>
            </details>

            <Link
              href="/"
              className="inline-flex shrink-0 items-center rounded-full bg-[#04193D] px-3 py-2 text-xs font-bold uppercase text-white transition hover:brightness-110 sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Teste grátis</span>
              <span className="hidden sm:inline">Teste grátis agora</span>
              <Icon
                icon="arrow_forward"
                className="ml-2"
                size={14}
                weight={700}
              />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#f7fbf8] via-[#f0fbf4] to-[#ecf8ef]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:py-16 md:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit uppercase items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 text-[10px] font-medium text-[#04193D]">
              Nova forma de conectar serviços e comunidades
            </div>

            <h1 className="text-3xl font-bold leading-[1.1] text-[#122319] sm:text-5xl lg:text-6xl">
              Encontre clientes perto de você e divulgue seus serviços{" "}
              <span className="text-[#04193D]">em um só lugar.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-[#5f7066] sm:text-lg">
              O <span className="font-bold">ConectaE</span> é uma plataforma que
              conecta quem presta serviços a quem precisa contratar, de forma
              rápida, simples e segura, tudo em um só lugar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="inline-flex w-full justify-center uppercase items-center gap-2 rounded-full bg-[#04193D] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(39,201,88,0.3)] transition hover:brightness-110 sm:w-auto sm:px-8"
              >
                Teste grátis agora
                <Icon icon="arrow_forward" size={16} weight={700} />
              </Link>
              <a
                href="#beneficios"
                className="inline-flex w-full justify-center items-center rounded-full border border-[#d6e6db] bg-white px-6 py-3 text-sm font-semibold text-[#1c2d23] transition hover:bg-[#f2f8f4] sm:w-auto sm:px-8"
              >
                Saiba mais
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#04193D]/20 blur-3xl" />
            <img
              src="/hero-conectae.png"
              alt="Profissional usando o Conecta E para conseguir mais clientes"
              className="relative w-full rounded-3xl object-cover shadow-[0_24px_55px_rgba(14,62,35,0.22)]"
              loading="lazy"
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-16 md:px-6 lg:pb-28">
          <div className="grid cursor-pointer gap-6 md:grid-cols-3">
            {heroCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#dce9df] bg-white p-6 shadow-[0_8px_26px_rgba(17,60,34,0.08)] transition-all hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f9ee] text-xl text-[#1eb34b]">
                  <Icon icon={card.icon} size={22} weight={600} />
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-[#5f7066]">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f7f3] py-14 sm:py-16 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 text-sm inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 font-medium text-[#04193D]">
              A REALIDADE HOJE
            </div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Como você consegue clientes hoje?
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2">
            {realidadeHoje.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-2xl border border-[#dce9df] bg-white p-5 shadow-[0_8px_24px_rgba(17,60,34,0.06)]"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#feeceb] text-[#dc4f44]">
                  <Icon icon="close" size={16} weight={700} />
                </div>
                <p className="text-[#2f4238]">{item}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-lg text-[#5f7066] sm:mt-12 sm:text-xl">
            Veja como o{" "}
            <span className="font-semibold text-[#1eb34b]">ConectaE</span> pode
            transformar sua rotina e gerar mais oportunidades para você:
          </p>
        </div>
      </section>

      <section
        id="beneficios"
        className="relative overflow-hidden bg-gradient-to-b from-white via-[#f7fff9] to-white py-16 sm:py-20 lg:py-32"
      >
        <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#04193D]/10 blur-3xl lg:left-[70%]" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 md:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/25 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#1eb34b] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#04193D]" />
              Para quem presta serviços
            </div>

            <h2 className="mt-6 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#102418] sm:text-4xl lg:text-5xl">
              Conquiste mais clientes próximos e{" "}
              <span className="text-[#04193D]">aumente sua renda</span> com
              consistência
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#5f7066] sm:text-lg">
              Transforme sua presença local em oportunidades reais. Seja
              encontrado por pessoas da sua região que já estão procurando pelo
              seu serviço.
            </p>

            <div className="mt-9 flex w-full max-w-xl flex-col gap-4">
              {beneficiosPrestador.map((item) => (
                <div
                  key={item}
                  className="group flex items-start gap-4 rounded-2xl border border-[#dce9df] bg-white/80 p-4 text-left shadow-[0_10px_30px_rgba(17,60,34,0.06)] transition-all duration-300 hover:border-[#04193D]/25 hover:shadow-[0_12px_28px_rgba(17,60,34,0.08)]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#04193D] text-white shadow-[0_8px_18px_rgba(48,204,54,0.25)]">
                    <Icon icon="check" size={16} weight={700} />
                  </div>

                  <p className="pt-1 text-sm font-medium leading-6 text-[#2f4238] sm:text-base">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/"
              className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#04193D] px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_14px_35px_rgba(48,204,54,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto sm:px-9"
            >
              Teste grátis agora
              <Icon icon="arrow_forward" size={17} weight={700} />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#04193D]/20 via-[#e8f9ed] to-transparent blur-2xl" />

            <div className="relative rounded-[2rem] border border-[#dce9df] bg-white/70 p-4 shadow-[0_24px_70px_rgba(17,60,34,0.12)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#1eb34b] p-5 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    Painel do prestador
                  </p>
                  <h3 className="mt-2 text-xl font-bold">Crescimento local</h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Icon icon="trending_up" size={24} weight={700} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {metricas.map((m) => (
                  <article
                    key={m.label}
                    className={`rounded-2xl border border-[#dce9df] bg-white p-5 shadow-[0_10px_24px_rgba(17,60,34,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(17,60,34,0.12)] ${
                      m.floating ? "sm:translate-y-6" : ""
                    }`}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9f9ee] text-[#1eb34b]">
                      <Icon icon={m.icon} size={22} weight={700} />
                    </div>

                    <div className="text-3xl font-extrabold tracking-tight text-[#1eb34b]">
                      {m.value}
                    </div>

                    <div className="mt-2 text-sm font-medium leading-5 text-[#5f7066]">
                      {m.label}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="bg-gradient-to-b from-[#f7fbf8] to-[#eef7f2] py-14 sm:py-16 lg:py-28"
      >
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 text-sm inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 font-medium text-[#04193D]">
              COMO FUNCIONA NA PRÁTICA
            </div>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Consiga mais clientes da sua região em{" "}
              <span className="text-[#04193D]">poucos passos</span>
            </h2>
            <p className="mt-4 text-lg text-[#5f7066]">
              Divulgue seus serviços, aumente sua visibilidade e comece a
              receber pedidos de pessoas próximas a você.
            </p>
          </div>

          <div className="mt-10 cursor-pointer grid gap-6 md:mt-14 md:grid-cols-2 lg:grid-cols-4">
            {passos.map((passo) => (
              <article
                key={passo.title}
                className="relative rounded-2xl border border-[#dce9df] bg-white p-6 shadow-[0_8px_24px_rgba(17,60,34,0.06)] transition-all hover:-translate-y-1"
              >
                <div className="absolute -top-3 left-6 rounded-full bg-[#04193D] px-3 py-1 text-xs font-bold text-white">
                  {passo.title}
                </div>
                <div className="mb-4 mt-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#e9f9ee] text-xl text-[#04193D]">
                  <Icon icon={passo.icon} size={22} weight={600} />
                </div>
                <h3 className="text-base font-semibold leading-snug">
                  {passo.heading}
                </h3>
                <p className="mt-2 text-sm text-[#5f7066]">{passo.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-14 sm:py-16 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 text-sm inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 font-medium text-[#04193D]">
              PLANOS
            </div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Planos que cabem no bolso de quem presta serviço
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3 cursor-pointer">
            {planos.map((plano) => (
              <article
                key={plano.name}
                className={`rounded-2xl border p-6 shadow-[0_10px_26px_rgba(17,60,34,0.08)] ${
                  plano.featured
                    ? "relative border-[#04193D] bg-[#f0fff4]"
                    : "border-[#dce9df] bg-white"
                }`}
              >
                {plano.badge ? (
                  <span className="absolute -top-3 left-6 rounded-full bg-[#04193D] px-3 py-1 text-xs font-bold text-white">
                    {plano.badge}
                  </span>
                ) : null}

                <h3 className="text-xl font-bold sm:text-2xl">{plano.name}</h3>
                <p className="mt-2 text-[#5f7066]">{plano.description}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold text-[#04193D] sm:text-4xl">
                    {plano.price}
                  </span>
                  <span className="pb-1 text-sm text-[#5f7066]">
                    {plano.period}
                  </span>
                </div>

                <ul className="mt-5 space-y-2">
                  {plano.features.map((feature) => (
                    <li key={feature} className="text-sm text-[#2f4238]">
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-bold ${
                    plano.featured
                      ? "bg-[#04193D] text-white hover:brightness-110"
                      : "bg-[#10271b] text-white hover:bg-[#0d1f15]"
                  } transition`}
                >
                  {plano.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f7f3] py-14 sm:py-16 lg:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:px-6 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="text-lg text-[#5f7066]">
              Saiba como funciona o <span className="font-bold">ConectaE</span>{" "}
              para quem busca serviços locais ou quer organizar sua comunidade.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {buscaDiferenciais.map((item) => (
                <article
                  key={item.text}
                  className="rounded-2xl border border-[#dce9df] bg-white p-6 shadow-[0_8px_22px_rgba(17,60,34,0.06)]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f9ee] text-[#04193D]">
                    <Icon icon={item.icon} size={20} weight={600} />
                  </div>
                  <p className="text-sm font-medium">{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="mb-6 text-sm inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 font-medium text-[#04193D]">
              <Icon icon="arrow_forward" size={14} weight={700} />
              PARA QUEM BUSCA SERVIÇOS
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Encontre serviços com{" "}
              <span className="text-[#04193D]">
                mais confiança e praticidade
              </span>
              , perto de você
            </h2>

            <ul className="mt-6 flex flex-col gap-3">
              {buscaLista.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#04193D] text-xs text-white">
                    <Icon icon="check" size={14} weight={700} />
                  </div>
                  <span className="text-[#2f4238]">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/"
              className="mt-8 uppercase inline-flex w-full justify-center items-center gap-2 rounded-full bg-[#04193D] px-6 py-3 text-[11px] text-white shadow-[0_10px_30px_rgba(39,201,88,0.3)] transition hover:brightness-110 sm:w-auto sm:px-8"
            >
              Buscar profissionais perto de mim
              <Icon icon="arrow_forward" size={14} weight={700} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[#dce9df] shadow-[0_18px_42px_rgba(17,60,34,0.16)]">
            <img
              src="https://rede-vizinha-pros.lovable.app/assets/community-conecta-cvj9Alrh.jpg"
              alt="Comunidade conectada com Conecta E"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#102217]/90 via-[#102217]/75 to-[#102217]/45" />

            <div className="relative grid gap-8 p-6 text-white sm:p-12 lg:grid-cols-5 lg:gap-10 lg:p-16">
              <div className="lg:col-span-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#04193D]/30 px-3 py-1 text-xs uppercase font-semibold ring-1 ring-white/20">
                  <Icon icon="arrow_forward" size={14} weight={700} />
                  Para quem gerencia comunidades
                </div>
                <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Conecte, organize e gere valor.{" "}
                  <span className="text-[#04193D]">
                    Crie uma comunidade onde todos ganham.
                  </span>
                </h2>
                <p className="mt-5 max-w-xl text-white/80">
                  Leve o Conecta E para seu condomínio, igreja, clube ou
                  associação e torne a rotina mais simples, rápida e organizada.
                  Transforme o dia a dia da sua comunidade com tecnologia,
                  inteligência e segurança.
                </p>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex w-full justify-center uppercase items-center rounded-full gap-2 bg-white px-6 py-3 text-sm font-bold text-[#122319] transition ease-in-all hover:bg-[#04193D] sm:w-auto sm:px-8"
                >
                  Criar plataforma para minha comunidade
                  <Icon icon="arrow_forward" size={14} weight={700} />
                </Link>
              </div>

              <div className="lg:col-span-2">
                <div className="flex flex-col gap-3">
                  {comunidadeLista.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <Icon icon="star" size={18} weight={700} />
                      </div>
                      <p className="text-sm font-medium">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f1f7f3] py-14 sm:py-16 lg:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 text-sm inline-flex w-fit items-center gap-2 rounded-full border border-[#04193D]/30 bg-[#e8f9ed] px-4 py-1.5 font-medium text-[#04193D]">
              FAQ
            </div>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="mt-4 text-[#5f7066]">
              Tudo o que você precisa saber antes de começar.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl sm:mt-12">
            <div className="flex flex-col gap-3">
              {faq.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-[#dce9df] bg-white px-5 shadow-[0_8px_24px_rgba(17,60,34,0.06)]"
                >
                  <summary className="cursor-pointer list-none py-4 text-left text-base font-semibold">
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.question}</span>
                      <Icon
                        icon="expand_more"
                        size={18}
                        className="text-[#5f7066]"
                      />
                    </div>
                  </summary>
                  <div className="pb-4 text-sm text-[#5f7066]">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-[#27c958]/30 bg-gradient-to-r from-[#27c958] to-[#04193D] p-6 text-center text-white shadow-[0_12px_36px_rgba(39,201,88,0.35)] sm:mt-14 sm:p-12">
            <h3 className="text-2xl font-bold sm:text-3xl">
              Pronto para conquistar mais clientes na sua região?
            </h3>
            <p className="mt-3 text-white/90">
              Comece grátis hoje mesmo e leve seus serviços para a próxima
              vizinhança.
            </p>
            <Link
              href="/"
              className="mt-6 gap-2 uppercase inline-flex w-full justify-center items-center rounded-full bg-white px-6 py-3 text-sm font-bold text-[#122319] transition hover:bg-white/90 sm:w-auto sm:px-8"
            >
              Teste grátis agora
              <Icon icon="arrow_forward" size={14} weight={700} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dce9df] py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-sm text-[#5f7066] md:px-6">
          <div className="flex items-center gap-2 font-bold text-[#1b2a20]">
            <Image
              src="/conectae_logo.png"
              alt="ConectaE"
              width={128}
              height={34}
              className="h-10 w-auto"
            />
          </div>
          <p>© 2026 ConectaE - Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
