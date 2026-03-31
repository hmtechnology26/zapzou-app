'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { supabase } from '@/lib/supabase';
import type { Environment } from '@/types';

const TYPE_LABELS: Record<Environment['type'], string> = {
  residential: 'Residencial',
  church: 'Igreja',
  club: 'Clube',
  association: 'Associação',
};

type AffiliationRecord = {
  id: string;
  environmentId: string;
  role: 'member' | 'moderator' | null;
  status: 'active' | 'pending' | 'banned';
  createdAt?: string;
};

const getStatusRank = (status?: AffiliationRecord['status']) => {
  switch (status) {
    case 'active': return 0;
    case 'pending': return 1;
    case 'banned': return 2;
    default: return 3;
  }
};

export default function MyAdsPage() {
  const router = useRouter();
  const { user, membershipVersion } = useApp();
  const { open } = usePublishModal();
  const [mounted, setMounted] = useState(false);
  const [affiliations, setAffiliations] = useState<Record<string, AffiliationRecord>>({});
  const [affiliationLoading, setAffiliationLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [myContexts, setMyContexts] = useState<Environment[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserContexts = useCallback(async () => {
    if (!user?.id) return;
    setLoadingContexts(true);
    setAffiliationLoading(true);

    // Fetch environments where user has membership
    const { data: membersData, error: membersError } = await supabase
      .from('environment_members')
      .select('status, role, environment_id, environments(*)')
      .eq('user_id', user.id);

    if (membersData && !membersError) {
      const affiliationsPayload: Record<string, AffiliationRecord> = {};
      const contextsPayload: Environment[] = [];

      membersData.forEach((record: any) => {
        if (record.environments) {
          const env = record.environments;
          const normalizedEnv: Environment = {
            id: env.id,
            name: env.name,
            slug: env.slug || env.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            type: env.type,
            members: Number(env.members_count ?? 0),
            image: env.image_url || '',
            latitude: env.latitude,
            longitude: env.longitude,
            requiresModeratorApproval: Boolean(env.requires_moderator_approval),
            requiresRadiusValidation: Boolean(env.requires_radius_validation),
          };
          
          affiliationsPayload[env.id] = {
            id: record.id,
            environmentId: env.id,
            role: record.role,
            status: record.status,
          };
          
          if (record.role === 'member' || record.role === 'moderator') {
            contextsPayload.push(normalizedEnv);
          }
        }
      });

      setAffiliations(affiliationsPayload);
      setMyContexts(contextsPayload.sort((a, b) => {
        const rankA = getStatusRank(affiliationsPayload[a.id]?.status);
        const rankB = getStatusRank(affiliationsPayload[b.id]?.status);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      }));
    }
    
    setLoadingContexts(false);
    setAffiliationLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserContexts();
    }
  }, [user?.id, fetchUserContexts, membershipVersion]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden pb-24">
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-12 pb-32">
        <section className="bg-primary/5 border border-primary/10 rounded-[3rem] p-10 shadow-sm text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                 <Icon icon="add_location_alt" size={32} className="text-primary" weight={700} />
              </div>
              <h2 className="text-3xl font-black text-on-surface tracking-tighter">Expandir seu Negócio</h2>
              <p className="text-base text-on-surface-variant max-w-md mx-auto mt-3 font-medium leading-relaxed">
                Leve seus serviços para novos condomínios e comunidades. Solicite vínculo agora mesmo.
              </p>
              <button 
                onClick={open}
                className="mt-8 uppercase py-2 primary-gradient text-white text-sm rounded-full px-10 py-4.5 font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:scale-105"
              >
                Procurar Ambiente
              </button>
            </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary/70">
              Ambientes de Atuação
            </h3>
            <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
              {myContexts.length} Vinculados
            </span>
          </div>

          {(loadingContexts || affiliationLoading) ? (
            <div className="py-24 flex justify-center flex-col items-center gap-4">
               <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
               <p className="text-xs font-black uppercase tracking-widest text-primary/40">Carregando seus locais...</p>
            </div>
          ) : myContexts.length === 0 ? (
            <div className="rounded-[3rem] border-2 border-dashed border-outline-variant/10 py-24 text-center bg-surface-container-low/20">
               <Icon icon="explore" size={56} className="mx-auto mb-6 opacity-10 text-primary" />
               <h4 className="text-xl font-black text-on-surface/40">Nenhum vínculo ativo</h4>
               <p className="text-sm text-on-surface-variant/60 font-medium max-w-xs mx-auto mt-2">Você ainda não solicitou entrada em nenhum ambiente para anunciar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myContexts.map((env) => {
                const membership = affiliations[env.id];
                const isActive = membership?.status === 'active';
                const isPending = membership?.status === 'pending';

                return (
                  <article key={env.id} className="bg-white rounded-[2rem] p-5 border border-outline-variant/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-surface-container overflow-hidden flex-shrink-0 shadow-inner">
                        {env.image ? <img src={env.image} alt={env.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-on-surface-variant"><Icon icon="domain" size={28} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h4 className="font-bold text-on-surface truncate">{env.name}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                            isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isPending ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {isActive ? 'Ativo' : isPending ? 'Análise' : 'Bloqueado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                              <Icon icon="category" size={12} />
                              {TYPE_LABELS[env.type]}
                           </span>
                           {env.members > 0 && (
                             <span className="text-[10px] text-on-surface-variant/60 font-bold flex items-center gap-1">
                                <Icon icon="groups" size={14} />
                                {env.members}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      {isActive && (
                        <button 
                          onClick={() => router.push(`/meus-anuncios/${env.id}`)}
                          className="w-full md:w-auto min-w-[180px] md:min-w-[220px] max-w-[250px] py-3.5 md:px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] md:text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110 whitespace-nowrap"
                        >
                          <Icon icon="store" size={18} />
                          Gerenciar Catálogo
                        </button>
                      )}
                      {!isActive && isPending && (
                        <div className="w-full md:w-auto py-3.5 px-6 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2">
                           <Icon icon="hourglass_empty" size={16} />
                           Aguardando Aprovação
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
