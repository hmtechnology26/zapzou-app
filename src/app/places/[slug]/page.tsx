'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';
import { type PlaceSearchResult } from '@/lib/maps';
import {
  inferEnvironmentTypeFromPlace,
  inferEnvironmentValidationFlagsFromPlace,
} from '@/lib/environment-rules';
import { supabase } from '@/lib/supabase';

export default function PlaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedEnvironments, services, user, setSelectedEnvironment, setSelectedEnvironments, requestAffiliation } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [placeFromSearch, setPlaceFromSearch] = useState<PlaceSearchResult | null>(null);
  const [membership, setMembership] = useState<{ status: 'active' | 'pending' | 'banned' } | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingEnvironment, setLoadingEnvironment] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const placeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const placeId = searchParams?.get('placeId');

  const environmentsWithSlug = selectedEnvironments.map(env => ({
    ...env,
    slug: env.slug || generateSlug(env.name)
  }));
  
  const environment = environmentsWithSlug.find(e => e.slug === placeSlug || generateSlug(e.name) === placeSlug);

  // Se encontrou o ambiente no banco, remover o placeId da URL
  useEffect(() => {
    if (environment && placeId) {
      // Remover o placeId da URL quando o ambiente está cadastrado
      router.replace(`/places/${placeSlug}`, { scroll: false });
    }
  }, [environment, placeId, placeSlug]);

  // Se não encontrou no estado local, buscar diretamente do banco
  useEffect(() => {
    if (!environment && placeSlug && !placeFromSearch && loadingEnvironment) {
      const fetchEnvironmentFromDb = async () => {
        try {
          const { data, error } = await supabase
            .from('environments')
            .select('*')
            .or(`slug.eq.${placeSlug},name.ilike.${placeSlug.replace(/-/g, ' ')}`)
            .limit(1)
            .maybeSingle();
          
          if (data && !error) {
            const envWithSlug = {
              id: data.id,
              name: data.name,
              slug: data.slug || generateSlug(data.name),
              type: data.type,
              members: Number(data.members_count ?? 0),
              image: data.image_url || '',
              status: data.status,
              latitude: data.latitude,
              longitude: data.longitude,
              requiresModeratorApproval: Boolean(data.requires_moderator_approval),
              requiresRadiusValidation: Boolean(data.requires_radius_validation),
            };
            setSelectedEnvironments(prev => {
              if (prev.some(e => e.id === envWithSlug.id)) return prev;
              return [...prev, envWithSlug];
            });
          } else {
            // Ambiente não encontrado no banco - mostrar modal de boas-vindas
            setShowWelcomeModal(true);
          }
        } catch (err) {
          console.error('Error fetching environment:', err);
          setShowWelcomeModal(true);
        } finally {
          setLoadingEnvironment(false);
        }
      };
      fetchEnvironmentFromDb();
    }
  }, [placeSlug, environment, placeFromSearch, placeId, setSelectedEnvironments, loadingEnvironment]);

  const effectiveEnvironment = environment || (placeFromSearch ? {
    id: placeFromSearch.id,
    slug: generateSlug(placeFromSearch.displayName?.text || ''),
    name: placeFromSearch.displayName?.text || '',
    type: inferEnvironmentTypeFromPlace(placeFromSearch.primaryType),
    members: 0,
    image: '',
    latitude: placeFromSearch.location?.latitude,
    longitude: placeFromSearch.location?.longitude,
    ...inferEnvironmentValidationFlagsFromPlace(placeFromSearch.primaryType),
  } : null);

  const topBarProps = {
    showBack: true,
    onBack: () => router.back(),
  };

  useEffect(() => {
    if (environment) {
      setLoadingEnvironment(false);
    }
  }, [environment]);

  // Set global context
  useEffect(() => {
    if (effectiveEnvironment && effectiveEnvironment.id) {
       setSelectedEnvironment(effectiveEnvironment as any);
       
       // Also ensure it's in selectedEnvironments for RLS/logic consistency
       if (!selectedEnvironments.some(e => e.id === effectiveEnvironment.id)) {
         setSelectedEnvironments(prev => [...prev, effectiveEnvironment as any]);
       }
    }
  }, [effectiveEnvironment?.id, setSelectedEnvironment, setSelectedEnvironments]);

  // Fetch membership
  useEffect(() => {
    if (!user || !effectiveEnvironment?.id) {
      setMembership(null);
      return;
    }

    const fetchMembership = async () => {
      setMembershipLoading(true);
      try {
        const { data, error } = await supabase
          .from('environment_members')
          .select('status')
          .eq('environment_id', effectiveEnvironment.id)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setMembership(data as any);
        } else {
          setMembership(null);
        }
      } catch (err) {
        console.error('Error fetching membership:', err);
        setMembership(null);
      } finally {
        setMembershipLoading(false);
      }
    };

    fetchMembership();
  }, [user?.id, effectiveEnvironment?.id]);

  // Fetch member count (independent of user)
  useEffect(() => {
    if (!effectiveEnvironment?.id) {
      return;
    }

    const fetchMemberCount = async () => {
      console.log('[MemberCount] Fetching for environment:', effectiveEnvironment.id);
      try {
        const { count, error } = await supabase
          .from('environment_members')
          .select('*', { count: 'exact', head: true })
          .eq('environment_id', effectiveEnvironment.id)
          .eq('status', 'active');
        
        console.log('[MemberCount] Result:', { count, error });
        if (!error && count !== null) {
          setMemberCount(count);
        } else {
          console.log('[MemberCount] Error or null count:', error);
        }
      } catch (err) {
        console.error('Error fetching member count:', err);
      }
    };

    fetchMemberCount();
  }, [effectiveEnvironment?.id]);

  const categories = [
    { id: 'all', label: 'Tudo', icon: 'apps' },
    { id: 'Tecnologia', label: 'Tecnologia', icon: 'terminal' },
    { id: 'Limpeza', label: 'Limpeza', icon: 'cleaning_services' },
    { id: "Alimentação", label: "Alimentação", icon: "restaurant" },
    { id: 'Construção', label: 'Construção', icon: 'construction' },
    { id: 'Saúde', label: 'Saúde', icon: 'medical_services' },
    { id: 'Beleza', label: 'Beleza', icon: 'content_cut' },
    { id: 'Eventos', label: 'Eventos', icon: 'event' },
    { id: 'Pet Sitting', label: 'Pet Sitting', icon: 'pets' }
  ];

  const servicesWithSlug = services.map(s => ({
    ...s,
    slug: s.slug || generateSlug(s.title)
  }));

  const filteredServices = servicesWithSlug.filter(s => {
    const isActive = s.isActive && s.status === 'active';
    const serviceEnvSlug = s.environmentSlug || (s.environmentId ? environmentsWithSlug.find(e => e.id === s.environmentId)?.slug : undefined);
    const matchesEnv = serviceEnvSlug === placeSlug || s.environmentId === effectiveEnvironment?.id;
    const matchesSearch = !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesEnv && matchesSearch && isActive && matchesCategory;
  });

  const mode = searchParams.get('mode');

  // Mostrar loading enquanto busca ambiente
  if (loadingEnvironment || !placeSlug) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 bg-background">
        <TopAppBar {...topBarProps} />
        <main className="mt-20 px-4 md:px-8 max-w-4xl mx-auto flex items-center justify-center pb-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  // Se não encontrou ambiente e não está mostrando modal, mostra erro
  if (!effectiveEnvironment && !showWelcomeModal) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 bg-background">
        <TopAppBar {...topBarProps} />
        <main className="mt-20 px-4 md:px-8 max-w-4xl mx-auto flex items-center justify-center flex-col gap-4 pb-32">
          <Icon icon="error_outline" size={48} className="text-outline" />
          <p className="text-on-surface-variant">Ambiente não encontrado</p>
          <button onClick={() => router.back()} className="text-primary font-bold">
            Voltar
          </button>
        </main>
      </div>
    );
  }

  // Se não encontrou ambiente mas tem o modal, mostrar modal inline
  if (!effectiveEnvironment && showWelcomeModal && placeSlug) {
    const envName = placeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const isChurch = placeFromSearch?.primaryType === 'church' || 
                     placeFromSearch?.primaryType === 'place_of_worship' || 
                     placeFromSearch?.primaryType === 'cathedral' || 
                     placeFromSearch?.primaryType === 'chapel' || 
                     placeFromSearch?.primaryType === 'temple' ||
                     envName.toLowerCase().includes('igreja') ||
                     envName.toLowerCase().includes('templo') ||
                     envName.toLowerCase().includes('capela') ||
                     envName.toLowerCase().includes('catedral');
    
    return (
      <div className="min-h-screen pb-24 md:pb-8 bg-background">
        <TopAppBar {...topBarProps} />
        <main className="mt-20 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
          <div className="flex items-center gap-3">
            
          </div>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon="celebration" size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-on-surface">
                SEJA BEM VINDO AO 
                <br />
                {envName.toUpperCase()}!
              </h2>
              <p className="text-on-surface-variant text-center mt-4">
                Você é o primeiro a descobrir este ambiente!
              </p>
              <p className="text-on-surface-variant text-center mt-4">
                Seja o primeiro a fazer parte e publicar seus serviços aqui.
              </p>
              <div className="p-4 bg-surface-container-lowest rounded-2xl">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-2"></p>
                <ul className="text-sm text-on-surface-variant space-y-2 text-left">
                  
                </ul>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => {
                    router.push('/meus-anuncios');
                  }}
                  className="w-full bg-primary text-white font-bold py-4 px-6 rounded-2xl hover:bg-primary/90 transition-colors"
                >
                  SEJA O PRIMEIRO A PUBLICAR AQUI
                </button>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    router.back();
                  }}
                  className="w-full bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-2xl hover:bg-surface-container-highest transition-colors"
                >
                  VOLTAR
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background">
      <TopAppBar {...topBarProps} />

      {/* Floating Action Button for mobile */}
      {user && membership?.status === 'active' && (
        <button 
          onClick={() => router.push(`/register-service?envId=${effectiveEnvironment!.id}`)}
          className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full primary-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
          <Icon icon="add" size={32} />
        </button>
      )}

      <main className="mt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        {(placeSlug === 'igreja-ministerio-farol' || effectiveEnvironment?.name?.toLowerCase().includes('farol')) && (
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a4a19] to-[#259128] p-8 shadow-2xl border border-white/5">
             <div className="absolute -top-6 -right-6 opacity-40 rotate-12">
               <img src="/farol_logo.png" alt="Farol Logo" className="w-52 h-auto" loading="lazy" decoding="async" />
             </div>
             <div className="relative z-10 flex flex-col gap-6">
               <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                    <span className="text-[10px] text-white font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Icon icon="verified" size={14} className="text-amber-300" />
                      ministério farol
                    </span>
                 </div>
               </div>
               
               <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">Negócios com Propósito</h2>
                  <p className="text-white text-base font-medium max-w-lg leading-relaxed">
                    Plantando princípios eternos para gerar frutos que permanecem!!
                  </p>
               </div>

               <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/10">
                 <div className="flex items-center gap-2.5 text-white/90 group cursor-default">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <Icon icon="location_on" size={16} />
                   </div>
                   <span className="text-xs font-bold tracking-tight">Canoas, RS</span>
                 </div>
                 <div className="flex items-center gap-2.5 text-white/90 group cursor-default">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <Icon icon="groups" size={16} />
                   </div>
                   <span className="text-xs font-bold tracking-tight">
                     {memberCount !== null ? `${memberCount} Membros` : 'Carregando...'}
                   </span>
                 </div>
                 {/* <div className="flex items-center gap-2.5 text-white/90 group cursor-default">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                     <Icon icon="star" size={16} className="text-amber-300" />
                   </div>
                   <span className="text-xs font-bold tracking-tight">Ranking #1</span>
                 </div> */}
               </div>
              </div>
           </div>
        )}

        {effectiveEnvironment && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-primary/60">
              Você está vendo os serviços de
            </p>
            <h2 className="text-xl font-black text-on-surface mt-1">
              {effectiveEnvironment.name}
            </h2>
          </div>
        )}

        <div className="relative">
            <div className="flex items-center bg-surface-container-highest rounded-[2.5rem] px-8 py-6 gap-6 focus-within:bg-surface-container-lowest focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-md border border-outline-variant/10 group">
            <Icon icon="search" size={28} className="text-[#30cc36] group-focus-within:scale-110 transition-transform" weight={700} />
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/70 font-black text-lg"
              placeholder="Buscar serviços..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.label)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap font-black text-xs transition-all border shrink-0 shadow-sm ${
                selectedCategory === (cat.id === 'all' ? 'all' : cat.label)
                  ? 'bg-[#30cc36] text-white border-[#30cc36] shadow-lg shadow-[#30cc36]/20 scale-105' 
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-[#30cc36]/40 hover:text-[#30cc36] active:scale-95'
              }`}
            >
              <Icon icon={cat.icon} size={16} weight={selectedCategory === (cat.id === 'all' ? 'all' : cat.label) ? 700 : 400} />
              {cat.label}
            </button>
          ))}
        </div>

        {user && membership === null && !membershipLoading && mode === 'join' && (
          <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto md:ml-0">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                <Icon icon="person_add" size={32} className="text-primary" weight={700} />
             </div>
             <div>
                <h3 className="text-xl font-black text-on-surface tracking-tight">Vincule-se a este ambiente</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Para publicar serviços aqui, você precisa solicitar acesso à liderança.</p>
             </div>
             <button 
               onClick={() => router.push(`/meus-anuncios`)}
               className="px-10 py-4.5 rounded-full primary-gradient text-white text-sm font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:scale-105"
             >
               Solicitar Acesso
             </button>
          </div>
        )}

          {user && membership?.status === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[3rem] p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto md:ml-0">
               <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Icon icon="hourglass_empty" size={32} className="text-amber-600" weight={700} />
             </div>
             <div>
                <h3 className="text-xl font-black text-amber-900 tracking-tight">Acesso em análise</h3>
                <p className="text-sm text-amber-800 font-medium mt-1">Sua solicitação de vínculo com {effectiveEnvironment!.name} está aguardando aprovação.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div 
              key={service.id}
              onClick={() => router.push(`/places/${placeSlug}/services/${service.slug}`)}
              className="group/card bg-surface-container-lowest p-4 rounded-[2.5rem] flex flex-col gap-5 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 border border-outline-variant/10 transition-all duration-500 active:scale-[0.98] relative overflow-hidden"
            >
              <div className="w-full h-48 rounded-[2rem] overflow-hidden shadow-inner bg-surface-container relative">
                <img 
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" 
                  src={service.image} 
                  alt={service.title}
                loading="lazy" decoding="async" />
              </div>
              <div className="px-2 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full">{service.category}</span>
                </div>
                <h3 className="font-black text-on-surface text-lg leading-tight group-hover/card:text-primary transition-colors mb-2">{service.title}</h3>
                <p className="text-on-surface-variant text-xs line-clamp-2 font-medium leading-relaxed opacity-70">{service.description}</p>
                
                <div className="mt-5 pt-5 border-t border-outline-variant/5 flex items-center justify-between">
                   <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-tighter">Ver detalhes e contato</span>
                   <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all transform group-hover/card:translate-x-1">
                      <Icon icon="arrow_forward" size={20} weight={700} />
                   </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredServices.length === 0 && (
            <div className="col-span-full text-center py-24 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-outline-variant/10">
              <Icon icon="search_off" weight={700} size={56} className="mb-4 text-primary/10 mx-auto" />
              <p className="text-lg font-black text-on-surface/40">Busca sem resultados</p>
              <p className="text-sm text-on-surface-variant/60 font-medium">Nenhum serviço encontrado com esses filtros neste ambiente.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de boas-vindas para ambiente não cadastrado */}
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon icon="celebration" size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-on-surface">
                SEJA BEM VINDO AO {placeFromSearch?.displayName?.text?.toUpperCase() || placeSlug?.toUpperCase() || 'AMBIENTE'}!
              </h2>
              <p className="text-on-surface-variant text-center mt-4">
                Você é o primeiro a descobrir este ambiente! Seja o primeiro a fazer parte e publicar seus serviços aqui.
              </p>
              <div className="mt-6 p-4 bg-surface-container-lowest rounded-2xl">
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Como funciona?</p>
                <ul className="text-sm text-on-surface-variant space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <Icon icon="location_on" size={16} className="text-primary mt-0.5" />
                    <span>Solicite acesso por proximidade ou</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="admin_panel_settings" size={16} className="text-primary mt-0.5" />
                    <span>Peça autorização para um moderador</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={async () => {
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    try {
                      // Criar solicitação de novo ambiente
                      const envName = placeFromSearch?.displayName?.text || placeSlug || 'Novo Ambiente';
                      const { error } = await supabase
                        .from('environment_requests')
                        .insert([{
                          name: envName,
                          place_id: placeId,
                          requested_by: user.id,
                          status: 'pending'
                        }]);
                      if (error) throw error;
                      setShowWelcomeModal(false);
                      alert('Solicitação enviada! Em breve este ambiente será aprovado.');
                    } catch (err) {
                      console.error('Error requesting environment:', err);
                      alert('Erro ao solicitar. Tente novamente.');
                    }
                  }}
                  className="w-full bg-primary text-white font-bold py-4 px-6 rounded-2xl hover:bg-primary/90 transition-colors"
                >
                  {user ? 'SOLICITAR ACESSO' : 'FAZER LOGIN PARA SOLICITAR'}
                </button>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    router.back();
                  }}
                  className="w-full bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-2xl hover:bg-surface-container-highest transition-colors"
                >
                  VOLTAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
