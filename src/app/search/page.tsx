'use client';

import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

export default function SearchPage() {
  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Buscar" />
      <main className="pt-20 px-6">
        <div className="relative">
          <Icon icon="search" weight={400} size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 text-on-surface" placeholder="Buscar serviços..." />
        </div>
      </main>
    </div>
  );
}
