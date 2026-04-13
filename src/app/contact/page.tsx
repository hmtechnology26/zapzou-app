'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';

const quickLinks = [
  {
    href: '/terms',
    title: 'Termos de Uso',
    description: 'Veja as regras, responsabilidades e condições de uso da plataforma.',
  },
  {
    href: '/privacy',
    title: 'Política de Privacidade',
    description: 'Entenda quais dados coletamos e como eles são tratados.',
  },
  {
    href: '/faq',
    title: 'FAQ',
    description: 'Acesse as perguntas frequentes com respostas rápidas e objetivas.',
  },
];

export default function ContactPage() {
  const { user } = useApp();

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Sou o ${user?.name || 'Usuário'} e preciso de suporte com a plataforma ConectaE.`
    );
    window.open(`https://wa.me/5551983117180?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-2xl space-y-8 px-4 pt-24">
        <section className="rounded-[2.5rem] border border-primary/20 bg-primary/5 p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10">
            <Icon icon="support_agent" size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">Estamos aqui para ajudar!</h2>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
            Teve algum problema com um anúncio ou quer dar uma sugestão? Converse diretamente com nosso time.
          </p>

          <button
            onClick={handleWhatsApp}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#30CC36] px-8 py-4 font-black text-white shadow-xl shadow-[#30CC36]/20 transition-all hover:brightness-110 active:scale-95"
          >
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .011 5.403.011 12.038c0 2.121.554 4.189 1.602 6.04L0 24l6.105-1.602a11.832 11.832 0 005.937 1.598h.005c6.632 0 12.035-5.404 12.035-12.04a11.808 11.808 0 00-3.517-8.438z" />
            </svg>
            Suporte via WhatsApp
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70">
              Documentos e ajuda
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-on-surface">{item.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{item.description}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon icon="arrow_forward" size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4 px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/70">
            Dúvidas frequentes
          </h3>
          <div className="space-y-2">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5">
              <p className="text-sm font-bold text-on-surface">Como sou aprovado em um ambiente?</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                A liderança da igreja ou condomínio avalia seu pedido de vínculo e autoriza sua entrada.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-5">
              <p className="text-sm font-bold text-on-surface">Meus anúncios são pagos?</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Depende do seu plano. O plano gratuito permite até 2 serviços ativos.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
