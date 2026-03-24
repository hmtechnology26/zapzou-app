'use client';

import { useRouter } from 'next/navigation';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';

export default function SelectEnvironmentsPage() {
  const router = useRouter();
  const { selectedEnvironments, setSelectedEnvironments } = useApp();

  const toggleEnv = (id: string) => {
    setSelectedEnvironments(prev => prev.map(e => e.id === id ? { ...e, isSelected: !e.isSelected } : e));
  };

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Selecionar Ambientes" />
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <p className="text-on-surface-variant mb-6">Escolha os ambientes onde seus serviços serão visíveis.</p>
        <div className="space-y-3">
          {selectedEnvironments.map(env => (
            <div key={env.id} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl" onClick={() => toggleEnv(env.id)}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${env.isSelected ? 'border-primary bg-primary' : 'border-outline'}`}>
                {env.isSelected && <Icon icon="check" weight={400} size={16} className="text-white" />}
              </div>
              <span className="font-medium">{env.name}</span>
            </div>
          ))}
        </div>
        <button onClick={() => router.push('/')} className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg mt-6">Confirmar</button>
      </main>
    </div>
  );
}
