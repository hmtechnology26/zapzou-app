'use client';

import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

export default function LogoConfigPage() {
  return (
    <div className="min-h-screen pb-24">
      <TopAppBar />
      <main className="pt-20 px-6">
        <p className="text-center text-on-surface-variant py-10">Upload de logo</p>
      </main>
    </div>
  );
}
