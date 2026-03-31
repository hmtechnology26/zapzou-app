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
  const { selectedEnvironments, services, user, setSelectedEnvironment, setSelectedEnvironments } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [placeFromSearch, setPlaceFromSearch] = useState<PlaceSearchResult | null>(null);
  const [membership, setMembership] = useState<{ status: 'active' | 'pending' | 'banned' } | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const placeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const placeId = searchParams?.get('placeId');

  useEffect(() => {
    if (placeId) {
      const stored = localStorage.getItem(`place_${placeId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPlaceFromSearch(parsed);
        } catch (e) {
          console.error('Failed to parse stored place:', e);
        }
      }
    }
  }, [placeId]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Residencial',
      church: 'Igreja',
      place_of_worship: 'Igreja',
      cathedral: 'Catedral',
      chapel: 'Capela',
      temple: 'Templo',
      club: 'Clube',
      association: 'Associação',
      apartment_building: 'Prédio',
      condominium_complex: 'Condomínio',
      shopping_mall: 'Shopping'
    };
    return labels[type] || type;
  };

  const environmentsWithSlug = selectedEnvironments.map(env => ({
    ...env,
    slug: env.slug || generateSlug(env.name)
  }));
  const environment = environmentsWithSlug.find(e => e.slug === placeSlug);

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

  const categories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

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
    const matchesCategory = selectedCategory === 'Tudo' || s.category === selectedCategory;
    
    return isActive && matchesEnv && matchesSearch && matchesCategory;
  });

  if (!effectiveEnvironment) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Icon icon="error_outline" size={48} className="text-outline" />
        <p className="text-on-surface-variant">Ambiente não encontrado</p>
        <button onClick={() => router.back()} className="text-primary font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background">
      <TopAppBar 
        showBack
        onBack={() => router.back()}
        leftCustomAction={
          <div className="flex items-center gap-2">
            {effectiveEnvironment.image && (
              <img className="w-8 h-8 border border-outline-variant/10 rounded-full object-cover" src={effectiveEnvironment.image} alt={effectiveEnvironment.name} />
            )}
            <h1 className="text-lg font-black tracking-tight text-on-surface line-clamp-1">{effectiveEnvironment.name}</h1>
          </div>
        }
      />

      {/* Floating Action Button for mobile */}
      {user && membership?.status === 'active' && (
        <button 
          onClick={() => router.push(`/register-service?envId=${effectiveEnvironment.id}`)}
          className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full primary-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
        >
          <Icon icon="add" size={32} />
        </button>
      )}

      <main className="mt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <div className="relative">
          <div className="flex items-center bg-surface-container-highest rounded-[2.5rem] px-8 py-6 gap-6 focus-within:bg-white focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-md border border-outline-variant/10 group">
            <Icon icon="search" size={28} className="text-primary group-focus-within:scale-110 transition-transform" weight={700} />
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
          {categories.map((category) => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl whitespace-nowrap font-black text-sm transition-all border shrink-0 shadow-sm ${
                selectedCategory === category 
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' 
                  : 'bg-white text-on-surface-variant border-outline-variant/10 hover:border-primary/40 hover:text-primary active:scale-95'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {user && membership === null && !membershipLoading && (
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
          <div className="bg-amber-50 border border-amber-100 rounded-[3rem] p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto md:ml-0">
             <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-200">
                <Icon icon="hourglass_empty" size={32} className="text-amber-600" weight={700} />
             </div>
             <div>
                <h3 className="text-xl font-black text-amber-900 tracking-tight">Acesso em análise</h3>
                <p className="text-sm text-amber-800 font-medium mt-1">Sua solicitação de vínculo com {effectiveEnvironment.name} está aguardando aprovação.</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div 
              key={service.id}
              onClick={() => router.push(`/places/${placeSlug}/services/${service.slug}`)}
              className="group/card bg-white p-4 rounded-[2.5rem] flex flex-col gap-5 cursor-pointer hover:shadow-2xl hover:shadow-primary/5 border border-outline-variant/10 transition-all duration-500 active:scale-[0.98] relative overflow-hidden"
            >
              <div className="w-full h-48 rounded-[2rem] overflow-hidden shadow-inner bg-surface-container relative">
                <img 
                  className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700" 
                  src={service.image} 
                  alt={service.title}
                />
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
    </div>
  );
}
