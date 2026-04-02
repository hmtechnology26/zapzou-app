'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-extrabold text-on-surface">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Última atualização: 26/03/2026</p>

        <section className="mt-8 space-y-4 text-on-surface">
          <p>
            Esta Política explica, de forma resumida, como tratamos dados pessoais no Conectae. Ao usar o aplicativo,
            você concorda com este tratamento conforme descrito aqui.
          </p>

          <h2 className="mt-6 text-xl font-bold">1. Dados coletados</h2>
          <ul className="list-disc pl-6 text-on-surface">
            <li>Dados de autenticação via Google (por meio do Supabase Auth).</li>
            <li>Dados de perfil (ex.: nome e avatar) e informações fornecidas ao publicar serviços.</li>
            <li>
              Localização (quando necessária) para validar regras de publicação por ambiente (ex.: raio de 500m).
            </li>
          </ul>

          <h2 className="mt-6 text-xl font-bold">2. Finalidades</h2>
          <ul className="list-disc pl-6 text-on-surface">
            <li>Autenticar usuários e manter a conta ativa.</li>
            <li>Permitir publicação e visualização de serviços por comunidade/ambiente.</li>
            <li>Aplicar regras de segurança e prevenção de fraude (ex.: duplicidade de contato).</li>
          </ul>

          <h2 className="mt-6 text-xl font-bold">3. Compartilhamento</h2>
          <p>
            O contato com prestadores pode ocorrer via links para WhatsApp/Instagram informados pelo próprio prestador.
            Fora isso, não vendemos dados pessoais.
          </p>

          <h2 className="mt-6 text-xl font-bold">4. Armazenamento</h2>
          <p>
            Os dados são armazenados no Supabase (PostgreSQL/Auth) e, quando aplicável, arquivos/imagens podem ser
            armazenados em um serviço de storage configurado.
          </p>

          <h2 className="mt-6 text-xl font-bold">5. Seus direitos</h2>
          <p>
            Você pode solicitar remoção/atualização de dados conforme aplicável. Para detalhes, consulte os termos e o
            suporte do projeto.
          </p>

          <h2 className="mt-6 text-xl font-bold">6. Termos</h2>
          <p>
            Consulte também os{' '}
            <Link className="text-primary font-semibold hover:underline" href="/terms">
              Termos de Uso
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

