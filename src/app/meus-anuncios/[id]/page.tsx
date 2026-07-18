'use client';

import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { useState, useMemo, useEffect } from 'react';
import { TopAppBar } from '@/components/TopAppBar';
import { getEnvironmentAvailabilityState } from '@/lib/environment-rules';
import { Avatar } from '@/components/Avatar';
import { supabase } from '@/lib/supabase';

export default function EnvironmentCataloguePage() {
  const router = useRouter();
  const params = useParams();
  const envId = params?.id as string;
  const { services, user, toggleServiceStatus, removeService, selectedEnvironments, setSelectedEnvironment } = useApp();
  
  const [currentEnv, setCurrentEnv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter user services for this specific environment
  const userServicesForEnv = services.filter(
    (s) => s.provider_id === user?.id && s.environmentId === envId
  );

  useEffect(() => {
    if (!envId) return;

    const fetchEnv = async () => {
      // First check in selectedEnvironments
      const existing = selectedEnvironments.find(e => e.id === envId);
      if (existing) {
        setCurrentEnv(existing);
        setSelectedEnvironment(existing);
        setLoading(false);
        return;
      }

      // Fetch from DB if not found
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('id', envId)
        .single();

      if (data && !error) {
        const normalized = {
          id: data.id,
          name: data.name,
          type: data.type,
          image: data.image_url || '',
          requiresModeratorApproval: !!data.requires_moderator_approval,
          requiresRadiusValidation: !!data.requires_radius_validation,
        };
        setCurrentEnv(normalized);
        setSelectedEnvironment(normalized as any);
      }
      setLoading(false);
    };

    fetchEnv();
  }, [envId, selectedEnvironments, setSelectedEnvironment]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentEnv) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Icon icon="error_outline" size={48} className="text-outline" />
        <p className="text-on-surface-variant">Ambiente não encontrado</p>
        <button onClick={() => router.push('/meus-anuncios')} className="text-primary font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      <TopAppBar />

      <main className="mt-24 px-4 max-w-3xl mx-auto space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col items-center text-center gap-2">
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Icon icon="store" size={24} className="text-primary" />
           </div>
           <h2 className="text-xl font-black text-on-surface tracking-tight">Gerenciar Catálogo</h2>
           <p className="text-sm text-on-surface-variant max-w-xs">
              Visualize e edite seus anúncios publicados especificamente em <strong>{currentEnv.name}</strong>.
           </p>
           <button 
             onClick={() => router.push(`/register-service?envId=${currentEnv.id}`)}
             className="mt-2 px-6 py-3 rounded-full bg-[#04193D] text-white font-bold shadow-lg shadow-[#000000]/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-sm"
           >
             <Icon icon="add" size={20} />
             Novo Anúncio neste Ambiente
           </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-on-surface-variant px-1 uppercase tracking-widest flex items-center justify-between">
            <span>Meus Anúncios</span>
            <span className="bg-surface-container-high px-2 py-0.5 rounded-md text-[10px]">{userServicesForEnv.length}</span>
          </h3>

          {userServicesForEnv.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/30 py-12 text-center text-on-surface-variant bg-surface-container-low/30">
               <Icon icon="post_add" size={48} className="mx-auto mb-3 opacity-20" />
               <p className="text-sm font-medium">Você ainda não possui anúncios aqui.</p>
               <p className="text-xs opacity-60">Comece adicionando seu primeiro serviço!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userServicesForEnv.map((service) => {
                const availability = getEnvironmentAvailabilityState(currentEnv, {
                  membershipStatus: service.status === 'active' ? 'active' : 'pending',
                });

                return (
                  <article key={service.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col group">
                    <div className="relative aspect-square w-full overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={service.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy" decoding="async" />
                      <div className="absolute top-3 left-3 flex gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            service.status === 'active' ? 'bg-[#04193D] text-white shadow-lg shadow-[#04193D]/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          }`}>
                          {availability.label}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-[10px] font-bold text-primary tracking-widest uppercase">{service.category}</span>
                      </div>
                      <h4 className="font-bold text-on-surface mb-2">{service.title}</h4>
                      
                      <div className="mt-auto pt-4 flex gap-2 border-t border-outline-variant/10">
                        <button
                          onClick={() => router.push(`/register-service?id=${service.id}`)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors"
                        >
                          <Icon icon="edit" size={16} />
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Deseja excluir este anúncio?')) {
                              try {
                                await removeService(service.id);
                              } catch (err) {
                                alert('Erro ao remover serviço');
                              }
                            }
                          }}
                          className="p-2 rounded-xl bg-surface-container-high text-error hover:bg-error/10 transition-colors"
                        >
                          <Icon icon="delete" size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-3xl flex gap-3 items-start">
           <Icon icon="info" size={20} className="text-orange-600 mt-1" />
           <div className="flex-1">
              <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">Visibilidade Pública</p>
              <p className="text-[11px] text-orange-800 leading-relaxed mt-1">
                Seus anúncios neste catálogo são visíveis ao publico em geral, e possuem o selo de verificação do ambiente <strong>{currentEnv.name}</strong>.
              </p>
           </div>
        </div>
      </main>
    </div>
  );
}
