'use client';

import type { ReactNode } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect, useMemo } from 'react';
import { type PlaceSearchResult } from '@/lib/maps';
import {
  AUTO_APPROVAL_RADIUS_KM,
  calculateDistanceKm,
  inferEnvironmentTypeFromPlace,
  inferEnvironmentValidationFlagsFromPlace,
  isChurchLikeEnvironmentName,
  isWithinAutoApprovalRadius,
  isForcedPendingApprovalEnvironment,
} from '@/lib/environment-rules';
import { supabase } from '@/lib/supabase';
import { hasCnpj } from '@/lib/cnpj';
import { SearchField } from '@/components/SearchField';
import { type PublicationMode } from '@/lib/plan-rules';

interface PlaceDetailPageProps {
  seoContent?: ReactNode;
}

export default function PlaceDetailPage({ seoContent }: PlaceDetailPageProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedEnvironments, services, user, setSelectedEnvironment, setSelectedEnvironments, requestAffiliation } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [placeFromSearch, setPlaceFromSearch] = useState<PlaceSearchResult | null>(null);
  const [membership, setMembership] = useState<{ status: 'active' | 'pending' | 'banned'; role?: 'member' | 'moderator' | null; accessType?: PublicationMode | null } | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingEnvironment, setLoadingEnvironment] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [resolvedEnvironment, setResolvedEnvironment] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [publicationMode, setPublicationMode] = useState<PublicationMode | null>(null);
  const [publishingModeLoading, setPublishingModeLoading] = useState(false);

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const placeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const isFarolPlace = placeSlug === 'igreja-ministerio-farol';
  const placeId = searchParams?.get('placeId');

  const environmentsWithSlug = selectedEnvironments.map(env => ({
    ...env,
    slug: env.slug || generateSlug(env.name)
  }));
  const environmentFromContext = environmentsWithSlug.find(
    (e) => e.slug === placeSlug || generateSlug(e.name) === placeSlug,
  );
  const environment = environmentFromContext || resolvedEnvironment;

  useEffect(() => {
    setLoadingEnvironment(true);
    setShowWelcomeModal(false);
    setResolvedEnvironment(null);
  }, [placeSlug]);

  // Se encontrou o ambiente no banco, remover o placeId da URL
  useEffect(() => {
    if (environment && placeId) {
      // Remover o placeId da URL quando o ambiente estÃƒÂ¡ cadastrado
      router.replace(`/places/${placeSlug}`, { scroll: false });
    }
  }, [environment, placeId, placeSlug]);

  // Se nÃƒÂ£o encontrou no estado local, buscar diretamente do banco
  useEffect(() => {
    if (!environmentFromContext && placeSlug && !placeFromSearch && loadingEnvironment) {
      const fetchEnvironmentFromDb = async () => {
        try {
          const { data, error } = await supabase
            .from('environments')
            .select('*')
            .or(`slug.eq.${placeSlug},name.ilike.${placeSlug.replace(/-/g, ' ')}`)
            .limit(1)
            .maybeSingle();
          
          if (data && !error) {
            let membershipAccessType: PublicationMode | null = null;
            let membershipRole: 'member' | 'moderator' | null = null;

            if (user?.id) {
              const { data: membershipData } = await supabase
                .from('environment_members')
                .select('role, access_type')
                .eq('environment_id', data.id)
                .eq('user_id', user.id)
                .maybeSingle();

              membershipRole = membershipData?.role === 'moderator' ? 'moderator' : 'member';
              membershipAccessType =
                membershipData?.access_type === 'resident' || membershipData?.access_type === 'service_provider'
                  ? membershipData.access_type
                  : null;
            }

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
              address: data.address || '',
              membershipRole,
              membershipAccessType,
              requiresModeratorApproval: Boolean(data.requires_moderator_approval),
              requiresRadiusValidation: Boolean(data.requires_radius_validation),
            };
            setResolvedEnvironment(envWithSlug);

            if (user?.id) {
              setSelectedEnvironments(prev => {
                if (prev.some(e => e.id === envWithSlug.id)) return prev;
                return [...prev, envWithSlug];
              });
            }
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
  }, [placeSlug, environmentFromContext, placeFromSearch, setSelectedEnvironments, loadingEnvironment, user?.id]);

  const effectiveEnvironment = environment || (placeFromSearch ? {
    id: placeFromSearch.id,
    slug: generateSlug(placeFromSearch.displayName?.text || ''),
    name: placeFromSearch.displayName?.text || '',
    type: inferEnvironmentTypeFromPlace(
      placeFromSearch.primaryType,
      placeFromSearch.displayName?.text,
    ),
    members: 0,
    image: '',
    latitude: placeFromSearch.location?.latitude,
    longitude: placeFromSearch.location?.longitude,
    address: placeFromSearch.formattedAddress || '',
    ...inferEnvironmentValidationFlagsFromPlace(
      placeFromSearch.primaryType,
      placeFromSearch.displayName?.text,
    ),
  } : null);

  const requiresModeratorGate = Boolean(
    effectiveEnvironment &&
      (
        effectiveEnvironment.type === 'church' ||
        isChurchLikeEnvironmentName(effectiveEnvironment.name) ||
        effectiveEnvironment.requiresModeratorApproval
      ) &&
      membership?.status !== 'active',
  );

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
       if (user?.id && !selectedEnvironments.some(e => e.id === effectiveEnvironment.id)) {
         setSelectedEnvironments(prev => [...prev, effectiveEnvironment as any]);
       }
    }
  }, [effectiveEnvironment?.id, selectedEnvironments, setSelectedEnvironment, setSelectedEnvironments, user?.id]);

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
          .select('status, role, access_type')
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

  const ensureCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
    if (userLocation) return userLocation;

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      throw new Error('GeolocalizaÃƒÂ§ÃƒÂ£o indisponÃƒÂ­vel neste dispositivo.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(nextLocation);
          resolve(nextLocation);
        },
        (error) => reject(new Error(error.message || 'Falha ao obter sua localizaÃƒÂ§ÃƒÂ£o.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  };

  const handlePlusRequest = async (mode: PublicationMode) => {
    if (!user || !effectiveEnvironment?.id) return;

    setPublishingModeLoading(true);
    try {
      setPublicationMode(mode);

      const hasUnlockedPublicationRole =
        membership?.status === 'active' &&
        (membership?.accessType === 'resident' || membership?.accessType === 'service_provider');

      if (isForcedPendingApprovalEnvironment(effectiveEnvironment.id) && !hasUnlockedPublicationRole) {
        await requestAffiliation(effectiveEnvironment.id, {
          role: 'member',
          accessType: null,
          status: 'pending',
        });
        setMembership({ status: 'pending', accessType: null });
        return;
      }

       if (mode === 'resident' && membership?.status !== 'active') {
         const location = await ensureCurrentLocation();

        if (
          typeof effectiveEnvironment.latitude !== 'number' ||
          typeof effectiveEnvironment.longitude !== 'number'
        ) {
          throw new Error('Este ambiente não possui coordenadas para validação.');
        }

        const distance = calculateDistanceKm(
          location.latitude,
          location.longitude,
          effectiveEnvironment.latitude,
          effectiveEnvironment.longitude,
        );

        if (!isWithinAutoApprovalRadius(distance)) {
          throw new Error(`VocÃƒÂª precisa estar dentro de ${AUTO_APPROVAL_RADIUS_KM * 1000}m para publicar como residente neste ambiente.`);
        }
      }

      await requestAffiliation(effectiveEnvironment.id, {
        role: 'member',
        accessType: mode,
        status: 'active',
      });

      setMembership({ status: 'active', accessType: mode });
    } catch (error: any) {
      console.error('Error handling Plus request:', error);
      alert(error?.message || 'NÃƒÂ£o foi possÃƒÂ­vel concluir sua solicitaÃƒÂ§ÃƒÂ£o.');
    } finally {
      setPublishingModeLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Tudo', icon: 'apps' },
    { id: 'Tecnologia', label: 'Tecnologia', icon: 'terminal' },
    { id: 'Manutenção', label: "Manutenção", icon: 'engineering'},
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

  const servicesWithDistance = useMemo(() => {
    return servicesWithSlug
      .filter((service) => {
        const isActive = service.isActive && service.status === 'active';
        const serviceEnvSlug =
          service.environmentSlug ||
          (service.environmentId
            ? environmentsWithSlug.find((env) => env.id === service.environmentId)?.slug
            : undefined);
        const matchesEnv =
          serviceEnvSlug === placeSlug || service.environmentId === effectiveEnvironment?.id;
        const searchLower = search.toLowerCase().trim();
        const matchesSearch =
          !searchLower ||
          service.title.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower) ||
          (service.category || '').toLowerCase().includes(searchLower);
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        return matchesEnv && matchesSearch && isActive && matchesCategory;
      })
      .map((service) => {
        if (
          userLocation &&
          typeof service.environmentLatitude === 'number' &&
          typeof service.environmentLongitude === 'number'
        ) {
          return {
            ...service,
            distance: calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              service.environmentLatitude,
              service.environmentLongitude,
            ),
          };
        }

        return { ...service, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [
    effectiveEnvironment?.id,
    environmentsWithSlug,
    placeSlug,
    search,
    selectedCategory,
    servicesWithSlug,
    userLocation,
  ]);

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

  // Se nÃƒÂ£o encontrou ambiente e nÃƒÂ£o estÃƒÂ¡ mostrando modal, mostra erro
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

  // Se nÃƒÂ£o encontrou ambiente mas tem o modal, mostrar modal inline
  if (!effectiveEnvironment && showWelcomeModal && placeSlug) {
    const envName = placeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                VocÃƒÂª ÃƒÂ© o primeiro a descobrir este ambiente!
              </p>
              <p className="text-on-surface-variant text-center mt-4">
                Seja o primeiro a fazer parte e publicar seus serviÃƒÂ§os aqui.
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
      {seoContent}

      {/* Floating Action Button for mobile */}
      {user && membership?.status === 'active' && !isFarolPlace && (
        <button 
          onClick={() => router.push(`/register-service?envId=${effectiveEnvironment!.id}`)}
          className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full primary-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
          <Icon icon="add" size={32} />
        </button>
      )}

      <main className="mt-6 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
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

        {/* {effectiveEnvironment && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-primary/60">
              VocÃƒÂª estÃƒÂ¡ vendo os serviÃƒÂ§os de
            </p>
            <h2 className="text-xl font-black text-on-surface mt-1">
              {effectiveEnvironment.name}
            </h2>
          </div>
        )} */}

        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar serviços..."
        />

        {effectiveEnvironment?.address && (
          <div className="flex items-start gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon icon="location_on" size={16} weight={700} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                Endereço do ambiente
              </p>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {effectiveEnvironment.address}
              </p>
            </div>
          </div>
        )}

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

        {requiresModeratorGate && !membershipLoading && (
          <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto md:ml-0">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
                <Icon icon="person_add" size={32} className="text-primary" weight={700} />
             </div>
             <div>
                <h3 className="text-xl font-black text-on-surface tracking-tight">Vincule-se a este ambiente</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">
                  {user?.plan === 'plus'
                    ? 'No Plus, escolha como vocÃƒÂª atua aqui antes de publicar.'
                    : 'Para publicar serviços aqui, você precisa solicitar acesso à liderança.'}
                </p>
             </div>
             {user ? (
               <div className="grid w-full gap-3 sm:grid-cols-2">
                 <button
                   onClick={() => handlePlusRequest('resident')}
                   disabled={publishingModeLoading}
                   className="px-6 py-4 rounded-full bg-surface-container-high text-on-surface text-sm font-black shadow-sm active:scale-95 transition-all hover:bg-surface-container-highest disabled:opacity-50"
                 >
                   Morador 
                 </button>
                 <button
                   onClick={() => handlePlusRequest('service_provider')}
                   disabled={publishingModeLoading}
                   className="px-6 py-4 rounded-full primary-gradient text-white text-sm font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:scale-105 disabled:opacity-50"
                 >
                   Presto ServiÃƒÂ§o
                 </button>
               </div>
             ) : (
               <button 
                 onClick={() => router.push('/login')}
                 className="px-10 py-4.5 rounded-full primary-gradient text-white text-sm font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:scale-105"
               >
                 Fazer login para solicitar
               </button>
             )}
          </div>
        )}

          {user && membership?.status === 'pending' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[3rem] p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto md:ml-0">
               <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Icon icon="hourglass_empty" size={32} className="text-amber-600" weight={700} />
             </div>
             <div>
                <h3 className="text-xl font-black text-amber-900 tracking-tight">Acesso em anÃƒÂ¡lise</h3>
                <p className="text-sm text-amber-800 font-medium mt-1">Sua solicitaÃƒÂ§ÃƒÂ£o de vÃƒÂ­nculo com {effectiveEnvironment!.name} estÃƒÂ¡ aguardando aprovaÃƒÂ§ÃƒÂ£o.</p>
             </div>
          </div>
        )}

        {!requiresModeratorGate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {servicesWithDistance.map((service) => (
            <div 
              key={service.id}
              onClick={() => router.push(`/places/${placeSlug}/services/${service.slug}`)}
              className="bg-surface-container-lowest rounded-[2rem] flex flex-col cursor-pointer hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
            >
              <div className="h-44 w-full overflow-hidden border-b border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                <img 
                  className="w-full h-full object-cover" 
                  src={service.image} 
                  alt={service.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-1 min-w-0 flex-col justify-between p-4 h-full">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-[10px] font-black text-[#30cc36] uppercase tracking-widest bg-[#30cc36]/5 px-2 py-0.5 rounded-full">{service.category || 'Sem categoria'}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        hasCnpj(service.cnpj)
                          ? 'text-emerald-700 bg-emerald-500/10'
                          : 'text-slate-600 bg-slate-500/10'
                      }`}
                    >
                      {hasCnpj(service.cnpj) ? 'PROFISSIONAL' : 'AUTÔNOMO'}
                    </span>
                  </div>
                  <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-[#30cc36] transition-colors">{service.title}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">{service.description}</p>
                
                  <div className="mt-3 flex items-center justify-between">
                    {(userLocation || service.environmentName) && (
                      <div className="flex items-center gap-2">
                        {userLocation && service.distance !== Infinity && (
                          <div className="flex items-center gap-1 text-primary">
                            <Icon icon="location_on" size={12} weight={700} />
                            <span className="text-[10px] text-[#30cc36] font-bold">
                              {service.distance < 1
                                ? `${Math.round(service.distance * 1000)}m`
                                : `${service.distance.toFixed(1)}km`}
                            </span>
                          </div>
                        )}
                        {service.environmentName && (
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {service.environmentName}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-[#30cc36] group-hover/card:text-white transition-all duration-300">
                      <Icon icon="arrow_forward" size={14} weight={700} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {servicesWithDistance.length === 0 && (
            <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
              <p className="text-sm font-bold text-on-surface/40">Nenhum serviço encontrado neste ambiente</p>
            </div>
          )}
        </div>
        )}
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
                VocÃƒÂª ÃƒÂ© o primeiro a descobrir este ambiente! Seja o primeiro a fazer parte e publicar seus serviÃƒÂ§os aqui.
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
                    <span>PeÃƒÂ§a autorizaÃƒÂ§ÃƒÂ£o para um moderador</span>
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
                      // Criar solicitaÃƒÂ§ÃƒÂ£o de novo ambiente
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
                      alert('SolicitaÃƒÂ§ÃƒÂ£o enviada! Em breve este ambiente serÃƒÂ¡ aprovado.');
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
