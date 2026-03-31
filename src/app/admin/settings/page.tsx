'use client';

import { useRouter } from 'next/navigation';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';

export default function AdminSettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar />
      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-2">
        <button onClick={() => router.push('/admin/visibility')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl">
          <Icon icon="visibility" weight={400} size={24} className="text-primary" />
          <span className="flex-1 text-left font-medium">Regras de Visibilidade</span>
          <Icon icon="chevron_right" weight={400} size={24} />
        </button>
        <button onClick={() => router.push('/admin/logo')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl">
          <Icon icon="image" weight={400} size={24} className="text-primary" />
          <span className="flex-1 text-left font-medium">Configurar Logo</span>
          <Icon icon="chevron_right" weight={400} size={24} />
        </button>
        <button onClick={() => router.push('/admin/logs')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl">
          <Icon icon="history" weight={400} size={24} className="text-primary" />
          <span className="flex-1 text-left font-medium">Logs de Atividade</span>
          <Icon icon="chevron_right" weight={400} size={24} />
        </button>
        <button onClick={() => router.push('/moderation')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl">
          <Icon icon="admin_panel_settings" weight={400} size={24} className="text-primary" />
          <span className="flex-1 text-left font-medium">Moderação</span>
          <Icon icon="chevron_right" weight={400} size={24} />
        </button>
      </main>
    </div>
  );
}
