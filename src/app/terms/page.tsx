'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold text-on-surface">Termos de Uso</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Última atualização: 26/03/2026</p>

        <section className="mt-8 space-y-4 text-on-surface">
          <p>
            Estes Termos de Uso regem o acesso e o uso do Conectae. Ao utilizar o aplicativo, você concorda com estes
            termos.
          </p>

          <h2 className="mt-6 text-xl font-bold">1. O que é o Conectae</h2>
          <p>
            O Conectae é um hub de serviços. A plataforma facilita a descoberta de prestadores em ambientes
            (ex.: condomínios, igrejas, clubes e associações) e oferece meios de contato direto (ex.: WhatsApp/Instagram).
          </p>

          <h2 className="mt-6 text-xl font-bold">2. Conta e autenticação</h2>
          <p>O acesso é realizado via login com Google (OAuth) por meio do Supabase Auth.</p>

          <h2 className="mt-6 text-xl font-bold">3. Publicação de serviços e regras</h2>
          <p>
            Para publicar serviços, podem existir validações de afiliação ao ambiente e de localização (ex.: raio máximo
            permitido). Em ambientes do tipo igreja, pode haver moderação de prestadores.
          </p>

          <h2 className="mt-6 text-xl font-bold">4. Conteúdos e responsabilidade</h2>
          <p>
            O usuário é responsável pelas informações publicadas e pelo cumprimento de leis aplicáveis. O Conectae não se
            responsabiliza por negociações, execução do serviço, pagamentos ou eventuais conflitos entre usuários.
          </p>

          <h2 className="mt-6 text-xl font-bold">5. Suspensão e encerramento</h2>
          <p>
            Podemos restringir ou encerrar acessos em caso de abuso, fraude, violação de regras do ambiente ou uso
            inadequado.
          </p>

          <h2 className="mt-6 text-xl font-bold">6. Contato</h2>
          <p>
            Para dúvidas, consulte a{' '}
            <Link className="text-primary font-semibold hover:underline" href="/privacy">
              Política de Privacidade
            </Link>{' '}
            e o FAQ.
          </p>
        </section>
      </div>
    </main>
  );
}

