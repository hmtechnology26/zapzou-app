'use client';

import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Notificações" />
      <main className="pt-20 px-6">
        <p className="text-center text-on-surface-variant py-10">Nenhuma notificação</p>
      </main>
    </div>
  );
}
