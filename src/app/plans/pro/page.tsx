'use client';

import { PlanCheckout } from '@/components/PlanCheckout';

export default function ProPlanCheckoutPage() {
  return (
    <PlanCheckout
      plan={{
        id: 'pro',
        name: 'PRÓ',
        price: 'R$ 9,90',
        period: 'mês',
        description: 'Para profissionais que querem crescer',
        highlights: [
          'Até 5 serviços publicados',
          'Visibilidade prioritária',
          'Badge de verificação',
          'Suporte prioritário',
        ],
      }}
    />
  );
}

