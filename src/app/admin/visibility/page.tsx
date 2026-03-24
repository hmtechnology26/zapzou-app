'use client';

import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

export default function VisibilityRulesPage() {
  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Regras de Visibilidade" />
      <main className="pt-20 px-6">
        <p className="text-center text-on-surface-variant py-10">Nenhuma regra configurada</p>
      </main>
    </div>
  );
}
