'use client';

import { useRouter } from 'next/navigation';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';

export default function MembersPage() {
  const router = useRouter();
  const { members } = useApp();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar />
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {m.avatar ? <img className="w-full h-full rounded-full object-cover" src={m.avatar} alt={m.name} /> : <span className="font-bold text-primary">{m.initials || m.name[0]}</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">{m.name}</h3>
                <p className="text-on-surface-variant text-sm">{m.unit}</p>
              </div>
              {m.isPending && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pendente</span>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
