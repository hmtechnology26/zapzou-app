'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';
import { type PlaceSearchResult } from '@/lib/maps';
import {
  inferEnvironmentTypeFromPlace,
  inferEnvironmentValidationFlagsFromPlace,
} from '@/lib/environment-rules';

export default function PlaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { selectedEnvironments, services, user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [placeFromSearch, setPlaceFromSearch] = useState<PlaceSearchResult | null>(null);

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
      <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-slate-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <button 
            onClick={() => router.back()}
            className="hover:bg-slate-100/50 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
          >
            <Icon icon="arrow_back" size={24} />
          </button>
          <div className="flex items-center gap-2">
            {effectiveEnvironment.image && (
              <img className="w-8 h-8 rounded-full object-cover" src={effectiveEnvironment.image} alt={effectiveEnvironment.name} />
            )}
            <h1 className="text-lg font-semibold tracking-tight text-on-surface">{effectiveEnvironment.name}</h1>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {user ? (
            <button onClick={() => router.push('/profile')} className="hover:scale-105 transition-transform active:scale-95 ml-1">
              <Avatar
                src={user.avatar}
                name={user.name}
                alt="Avatar"
                className="w-10 h-10 border-2 border-primary shadow-sm"
              />
            </button>
          ) : (
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full primary-gradient text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Icon icon="login" size={20} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </header>

      <main className="mt-20 px-4 md:px-8 max-w-3xl mx-auto space-y-6">
        <div className="relative">
          <Icon 
            icon="search" 
            weight={400} 
            size={24} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
          />
          <input 
            className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/60 shadow-inner"
            placeholder="Buscar serviços..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category) => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all ${
                selectedCategory === category 
                  ? 'primary-gradient text-white shadow-md shadow-primary/20' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredServices.map((service) => (
            <div 
              key={service.id}
              onClick={() => router.push(`/places/${placeSlug}/services/${service.slug}`)}
              className="bg-white p-3 rounded-2xl flex gap-4 items-center group cursor-pointer hover:bg-surface-container-lowest transition-all shadow-sm border border-outline-variant/5"
            >
              <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-inner">
                <img 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  src={service.image} 
                  alt={service.title}
                />
              </div>
              <div className="pr-4 py-2 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{service.category}</span>
                  <div className="flex items-center gap-1 text-primary">
                    <Icon icon="star" weight={400} size={14} style={{ fontVariationSettings: "'FILL' 1" }} />
                    <span className="text-[10px] font-extrabold">{service.rating || 'Novo'}</span>
                  </div>
                </div>
                <h3 className="font-bold text-on-surface leading-tight text-base mb-1">{service.title}</h3>
                <p className="text-on-surface-variant text-xs line-clamp-1">{service.description}</p>
              </div>
            </div>
          ))}
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12 opacity-50">
              <Icon icon="search_off" weight={400} size={48} className="mb-2 text-outline mx-auto" />
              <p className="text-sm">Nenhum serviço encontrado neste ambiente.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
