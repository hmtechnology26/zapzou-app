'use client';

import { PlanCheckout } from '@/components/PlanCheckout';

export default function PlusPlanCheckoutPage() {
  return (
    <PlanCheckout
      plan={{
        id: 'plus',
        name: 'PLUS',
        price: 'R$ 29,90',
        period: 'mês',
        description: 'Para negócios que querem crescer',
        highlights: [
          'Serviços ilimitados',
          'Máxima visibilidade',
          'Análises avançadas',
          'Suporte prioritário 24/7',
        ],
      }}
    />
  );
}

