'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
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
    description: 'Ideal para começar',
    features: [
      'Até 2 serviços publicados',
      'Apenas 1 ambiente',
      'Suporte por email',
    ],
    notFeatures: [
      'Destaque nos resultados',
      'Badge de verificação',
    ],
    cta: 'Plano Atual',
    popular: false,
  },
  {
    id: 'pro',
    name: 'PRÓ',
    price: 'R$ 9,90',
    period: 'por mês',
    description: 'Para profissionais que querem crescer',
    features: [
      'Até 5 serviços publicados',
      'Mais de 1 ambiente',
      'Badge de verificação PRÓ',
      'Suporte prioritário em Até 24h',
      
    ],
    notFeatures: [
      'Análises avançadas',
    ],
    cta: 'Upgrade para PRÓ',
    popular: false,
  },
  {
    id: 'plus',
    name: 'PLUS',
    price: 'R$ 19,90',
    period: 'por mês',
    description: 'Para negócios que querem crescer',
    features: [
      'Serviços ilimitados publicados',
      'Ambientes ilimitados',
      'Badge de verificação PLUS',
      'Suporte prioritário - Até 6h',
    ],
    notFeatures: [],
    cta: 'Upgrade para PLUS',
    popular: true,
  },
];

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();
  const currentPlan = user?.plan || 'plus';
  const returnTo = normalizeReturnTo(searchParams?.get('returnTo'));
  const returnToQuery = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';

  const goBack = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.replace('/profile');
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      alert('Você já está no plano FREE!');
      return;
    }
    if (planId === currentPlan) {
      alert('Este já é o seu plano atual.');
      return;
    }

    if (planId === 'pro' || planId === 'plus') {
      router.push(`/plans/${planId}${returnToQuery}`);
      return;
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-background">
      <TopAppBar showBack onBack={() => router.push('/profile')} />

      <main className="pt-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-on-surface">Escolha seu plano</h2>
          <p className="text-on-surface-variant mt-2">Encontre o plano ideal para seu negócio</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => (
            (() => {
              const isCurrent = plan.id === currentPlan;
              const ctaLabel = isCurrent ? 'Plano Atual' : plan.cta;
              const isDisabled = true;
              return (
            <div 
              key={plan.id}
              className={`relative bg-surface-container-lowest rounded-3xl p-6 flex flex-col ${
                plan.popular ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-black text-on-surface">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-primary">{plan.price}</span>
                  <span className="text-on-surface-variant text-sm ml-1">/{plan.period}</span>
                </div>
                <p className="text-on-surface-variant text-sm mt-1">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icon icon="check_circle" size={18} className="text-[#30CC36] flex-shrink-0 mt-0.5" weight={700} />
                    <span className="text-sm text-on-surface">{feature}</span>
                  </div>
                ))}
                {plan.notFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 opacity-50">
                    <Icon icon="cancel" size={18} className="text-on-surface-variant flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-on-surface-variant">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isDisabled}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                  plan.popular
                    ? 'primary-gradient text-white shadow-lg shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-low'
                } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {ctaLabel}
              </button>
            </div>
              );
            })()
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-on-surface text-center mb-6">O que dizem nossos clientes</h3>
          <div className="space-y-4">
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <div className="flex items-start gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" 
                  alt="Alessandra Lima" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Alessandra Lima</p>
                      <p className="text-xs text-primary font-medium">Plano PRÓ • Diarista</p>
                    </div>
                    <div className="flex gap-0.5">
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-2">"Comecei com o plano FREE e logo percebi que precisava de mais visibilidade. Com o PRÓ, meus serviços de diarista começaram a aparecer nas primeiras posições. Em 2 semanas, dobrou minha clientela!"</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <div className="flex items-start gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" 
                  alt="Juliana Costa" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Juliana Costa</p>
                      <p className="text-xs text-primary font-medium">Plano PLUS • Restaurant Delivery</p>
                    </div>
                    <div className="flex gap-0.5">
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-2">"Tenho um restaurante delivery e preciso de resultados rápidos. O PLUS me deu acesso a promoções exclusivas e análises avançadas. Consegui identificar quais pratos vendem mais e otimizei meu cardápio. Faturamento subiu 40% em 3 meses!"</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <div className="flex items-start gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" 
                  alt="Carlos Eduardo" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Carlos Eduardo</p>
                      <p className="text-xs text-primary font-medium">Plano FREE • Professor de Yoga</p>
                    </div>
                    <div className="flex gap-0.5">
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-on-surface-variant" weight={400} />
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-2">"Ainda estou começando no mercado de yoga online. O FREE já me ajuda a ter uma presença digital sem custos. Em um mês, já marquei 8 aulas particulares só pelo Conectae!"</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <div className="flex items-start gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100" 
                  alt="Ana Beatriz" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Ana Beatriz</p>
                      <p className="text-xs text-primary font-medium">Plano PRÓ • Cabeleireira</p>
                    </div>
                    <div className="flex gap-0.5">
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-2">"Serviços de beleza exigem confiança. O badge de verificação do PRÓ passou muito mais credibilidade para minhas clientes. O suporte prioritário também é excelente - sempre respondem rapidinho!"</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
              <div className="flex items-start gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" 
                  alt="Rafael Souza" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">Rafael Souza</p>
                      <p className="text-xs text-primary font-medium">Plano PLUS • Manutenção Predial</p>
                    </div>
                    <div className="flex gap-0.5">
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                      <Icon icon="star" size={16} className="text-primary" weight={700} style={{ fontVariationSettings: "'FILL' 1" }} />
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm mt-2">"Tenho uma equipe de 3 profissionais de manutenção. O PLUS me permite gerenciar todos os serviços pelo mesmo perfil e ainda integrou com meu sistema de agendamento. A produtividade da equipe aumentou 60%!"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-surface-container-low rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="help" size={24} className="text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Precisa de ajuda?</h4>
              <p className="text-on-surface-variant text-sm mt-1">
                Entre em contato conosco se tiver dúvidas sobre qual plano escolher.
              </p>
              <button className="mt-3 text-primary text-sm font-bold">
                Falar com suporte →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
