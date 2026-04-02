'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';

type PaymentMethod = 'credit' | 'debit' | 'pix';

export interface PlanCheckoutConfig {
  id: 'pro' | 'plus';
  name: string;
  price: string;
  period: string;
  description: string;
  highlights: string[];
}

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

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function PixQrCode() {
  // QR code genérico (apenas visual / teste)
  return (
    <svg
      viewBox="0 0 120 120"
      className="w-48 h-48 bg-surface-container-lowest rounded-2xl p-3 border border-outline-variant/10"
      aria-label="QR Code Pix"
      role="img"
    >
      <rect width="120" height="120" fill="#fff" />
      {/* finder patterns */}
      <rect x="6" y="6" width="30" height="30" fill="#000" />
      <rect x="10" y="10" width="22" height="22" fill="#fff" />
      <rect x="14" y="14" width="14" height="14" fill="#000" />

      <rect x="84" y="6" width="30" height="30" fill="#000" />
      <rect x="88" y="10" width="22" height="22" fill="#fff" />
      <rect x="92" y="14" width="14" height="14" fill="#000" />

      <rect x="6" y="84" width="30" height="30" fill="#000" />
      <rect x="10" y="88" width="22" height="22" fill="#fff" />
      <rect x="14" y="92" width="14" height="14" fill="#000" />

      {/* random modules */}
      {[
        [44, 10],
        [48, 10],
        [52, 10],
        [60, 10],
        [66, 10],
        [44, 14],
        [52, 14],
        [56, 14],
        [60, 14],
        [70, 14],
        [40, 18],
        [44, 18],
        [52, 18],
        [66, 18],
        [70, 18],
        [44, 26],
        [48, 26],
        [56, 26],
        [60, 26],
        [64, 26],
        [70, 26],
        [40, 34],
        [46, 34],
        [52, 34],
        [58, 34],
        [64, 34],
        [70, 34],
        [40, 42],
        [46, 42],
        [50, 42],
        [56, 42],
        [62, 42],
        [68, 42],
        [74, 42],
        [40, 50],
        [48, 50],
        [56, 50],
        [64, 50],
        [72, 50],
        [42, 58],
        [50, 58],
        [58, 58],
        [66, 58],
        [74, 58],
        [40, 66],
        [46, 66],
        [54, 66],
        [62, 66],
        [70, 66],
        [78, 66],
        [40, 74],
        [48, 74],
        [56, 74],
        [64, 74],
        [72, 74],
        [80, 74],
        [44, 82],
        [52, 82],
        [60, 82],
        [68, 82],
        [76, 82],
        [84, 82],
        [44, 90],
        [52, 90],
        [60, 90],
        [68, 90],
        [76, 90],
        [84, 90],
        [44, 98],
        [52, 98],
        [60, 98],
        [68, 98],
        [76, 98],
        [84, 98],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="4" height="4" fill="#000" />
      ))}
    </svg>
  );
}

export function PlanCheckout({ plan }: { plan: PlanCheckoutConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useApp();

  const currentPlan = user?.plan || 'free';
  const isCurrent = currentPlan === plan.id;
  const returnTo = normalizeReturnTo(searchParams?.get('returnTo'));

  const [method, setMethod] = useState<PaymentMethod>('credit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const pixPayload = useMemo(() => {
    // payload genérico (teste)
    return `00020126580014BR.GOV.BCB.PIX0136zapzou-pix-teste-${plan.id}5204000053039865405${plan.price.replace(/\D/g, '').slice(0, 3) || '000'}5802BR5920ZAPZOU TESTE6009SAO PAULO62100506TESTE6304ABCD`;
  }, [plan.id, plan.price]);

  const canSubmit = useMemo(() => {
    if (!user) return false;
    if (isCurrent) return false;
    if (method === 'pix') return true;
    const numberDigits = cardNumber.replace(/\D/g, '');
    const expiryDigits = cardExpiry.replace(/\D/g, '');
    return (
      cardName.trim().length >= 3 &&
      numberDigits.length >= 13 &&
      expiryDigits.length === 4 &&
      cardCvv.replace(/\D/g, '').length >= 3
    );
  }, [user, isCurrent, method, cardName, cardNumber, cardExpiry, cardCvv]);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    if (!user) {
      setError('Faça login para continuar.');
      return;
    }
    if (isCurrent) {
      setError('Você já está neste plano.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Modo teste: marca o plano no users para liberar as features.
      const { error: updateError } = await supabase
        .from('users')
        .update({ plan: plan.id })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUser({ ...user, plan: plan.id });
      setSuccess(true);
      setTimeout(() => router.replace(returnTo || '/profile'), 900);
    } catch (e: any) {
      console.warn('Plan checkout failed:', e);
      setError(String(e?.message || 'Não foi possível concluir o pagamento de teste.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
    } catch {
      // no-op
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-background">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-outline-variant/20">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
            >
              <Icon icon="arrow_back" size={24} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-on-surface">
              Assinar {plan.name}
            </h1>
          </div>

          {user && (
            <button
              onClick={() => router.push('/profile')}
              className="hover:scale-105 transition-transform active:scale-95"
              aria-label="Abrir perfil"
            >
              <Avatar
                src={user.avatar}
                name={user.name}
                alt="Avatar"
                className="w-10 h-10 border-2 border-primary shadow-sm"
              />
            </button>
          )}
        </div>
      </header>

      <main className="pt-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary tracking-wider">{plan.name}</p>
              <h2 className="text-2xl font-extrabold text-on-surface mt-1">{plan.description}</h2>
              <p className="text-on-surface-variant text-sm mt-2">
                {plan.price} / {plan.period}
              </p>
              <div className="mt-4 space-y-2">
                {plan.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Icon icon="check_circle" size={18} className="text-[#30CC36] flex-shrink-0 mt-0.5" weight={700} />
                    <span className="text-sm text-on-surface">{h}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-primary">{plan.price}</div>
              <div className="text-sm text-on-surface-variant">por {plan.period}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <h3 className="text-lg font-extrabold text-on-surface">Pagamento</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Escolha como prefere pagar. (Checkout em modo teste)
          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {([
              { id: 'credit', label: 'Cartão de crédito', icon: 'credit_card' },
              { id: 'debit', label: 'Cartão de débito', icon: 'payment' },
              { id: 'pix', label: 'Pix', icon: 'qr_code_2' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  method === opt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/10 bg-surface-container-high hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon icon={opt.icon} size={20} className={method === opt.id ? 'text-primary' : 'text-on-surface-variant'} />
                  <span className="font-bold text-sm text-on-surface">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>

          {(method === 'credit' || method === 'debit') && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Nome no cartão</label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="mt-1 w-full bg-surface-container-high rounded-2xl p-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
                  placeholder="Ex: MARIA SILVA"
                  autoComplete="cc-name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Número do cartão</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="mt-1 w-full bg-surface-container-high rounded-2xl p-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Validade</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    className="mt-1 w-full bg-surface-container-high rounded-2xl p-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
                    placeholder="MM/AA"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">CVV</label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="mt-1 w-full bg-surface-container-high rounded-2xl p-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'pix' && (
            <div className="mt-6 grid md:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <PixQrCode />
                <p className="text-xs text-on-surface-variant text-center">
                  QR Code genérico (teste)
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant">Copia e cola</label>
                <textarea
                  readOnly
                  value={pixPayload}
                  className="mt-1 w-full bg-surface-container-high rounded-2xl p-3 text-on-surface text-xs focus:outline-none border border-outline-variant/10"
                  rows={5}
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="mt-3 w-full py-3 rounded-full bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-low transition-colors"
                >
                  Copiar código Pix
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-error text-sm">{error}</p>}
          {success && (
            <p className="mt-4 text-[#30CC36] text-sm font-semibold">
              Assinatura concluída (teste). Redirecionando...
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 py-3 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1 py-3 rounded-full primary-gradient text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCurrent ? 'Plano atual' : isSubmitting ? 'Processando...' : 'Concluir pagamento'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
