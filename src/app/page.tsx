'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect, useMemo } from 'react';
import { MapComponent } from '@/components/GoogleMap';
import { TopAppBar } from '@/components/TopAppBar';

export default function HomePage() {
  const router = useRouter();
  const { user, selectedEnvironment, selectedEnvironments, services } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive && s.status === 'active');
  }, [services]);

  // Extract unique categories from active services
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    activeServices.forEach((s) => {
      if (s.category) {
        cats.add(s.category);
      }
    });
    return Array.from(cats).sort();
  }, [activeServices]);

  const environmentsWithServices = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    activeServices.forEach((service) => {
      if (!service.environmentId) return;
      const label = service.environmentName?.trim() || 'Ambiente';
      if (!map.has(service.environmentId)) {
        map.set(service.environmentId, {
          id: service.environmentId,
          name: label,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeServices]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const servicesWithDistance = useMemo(() => {
    return activeServices
      .filter((s) => {
        const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
        const matchesEnvironment =
          selectedEnvironmentId === 'all' || s.environmentId === selectedEnvironmentId;
        return matchesCategory && matchesEnvironment;
      })
      .map((s) => {
        if (userLocation) {
          const serviceLat = s.environmentLatitude;
          const serviceLng = s.environmentLongitude;
          if (serviceLat && serviceLng) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              serviceLat,
              serviceLng,
            );
            return { ...s, distance };
          }
        }
        return { ...s, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [activeServices, userLocation, selectedCategory, selectedEnvironmentId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position.coords.latitude, position.coords.longitude);
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          console.log('Geolocation error:', err.code, err.message);
        }
      );
    }
  }, []);

  const userAvatar = mounted ? user?.avatar : null;

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationLoading(false);
        },
        () => {
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const environmentsWithSlug = selectedEnvironments.map(env => ({
    ...env,
    slug: env.slug || env.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }));

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, string> = {
      residential: 'apartment',
      church: 'church',
      club: 'clubs',
      association: 'groups'
    };
    return icons[type] || 'location_on';
  };

  return (
    <div className={`min-h-screen ${user ? 'pb-32' : 'pb-10'} bg-background`}>
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <section className="mb-10 mt-6 text-center md:text-left">
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Perto de você</h2>
          <p className="text-on-surface-variant text-base mt-1 font-medium">Serviços confiáveis de ambientes próximos</p>
        </section>

        {/* sessão do mapa */}
        
        {/* <section 
          className="relative h-56 w-full rounded-3xl overflow-hidden shadow-inner"
        >
          {userLocation ? (
            <MapComponent 
              center={userLocation}
              markers={services
                .filter(s => s.latitude && s.longitude)
                .map(s => ({
                  position: { lat: s.latitude!, lng: s.longitude! },
                  title: s.title
                }))}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-container/20 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg"></div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-primary flex items-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <Icon icon="my_location" size={18} />
            {locationLoading ? 'Obtendo...' : 'Usar minha localização'}
          </button>
        </section> */}

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-surface-container-highest rounded-[2.5rem] px-5 py-3 gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-md border border-outline-variant/10 group">
              <Icon icon="search" size={22} className="text-primary group-focus-within:scale-110 transition-transform" weight={500} />
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/70 font-medium text-base"
                placeholder="Encontre o que você precisa..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="relative inline-flex">
            <select
              value={selectedEnvironmentId}
              onChange={(e) => setSelectedEnvironmentId(e.target.value)}
              className="appearance-none text-start bg-surface-container-highest border-none rounded-[2.5rem] px-4 py-2.5 pr-10 text-xs font-bold text-on-surface cursor-pointer shadow-md border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 h-[50px] min-w-[150px]"
              disabled={environmentsWithServices.length === 0}
            >
              <option value="all">TODOS OS AMBIENTES</option>
              {environmentsWithServices.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
              <Icon 
                icon="expand_more" 
                size={18} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" 
              />
            </div>
          </div>

          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 no-scrollbar scroll-smooth">
             {[
               { id: 'all', label: 'Tudo', icon: 'apps' },
               { id: 'Tecnologia', label: 'Tecnologia', icon: 'terminal' },
               { id: 'Limpeza', label: 'Limpeza', icon: 'cleaning_services' },
               { id: 'Construção', label: 'Construção', icon: 'construction' },
               { id: 'Saúde', label: 'Saúde', icon: 'medical_services' },
               { id: 'Beleza', label: 'Beleza', icon: 'content_cut' },
               { id: 'Eventos', label: 'Eventos', icon: 'event' },
               { id: 'Pet Sitting', label: 'Pet Sitting', icon: 'pets' }
             ].map((cat) => (
               <button 
                 key={cat.id} 
                 onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.label)}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap font-black text-xs transition-all border shrink-0 shadow-sm ${
                   (cat.id === 'all' && selectedCategory === 'all') || (selectedCategory === cat.label)
                     ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                     : 'bg-white text-on-surface-variant border-outline-variant/10 hover:border-primary/40 hover:text-primary active:scale-95'
                 }`}
               >
                 <Icon icon={cat.icon} size={16} weight={(cat.id === 'all' && selectedCategory === 'all') || (selectedCategory === cat.label) ? 700 : 400} />
                 {cat.label}
               </button>
             ))}
          </div>
        </section>

        {!search ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-black text-on-surface tracking-tight">Serviços próximos</h3>
              <button onClick={() => router.push('/places')} className="text-xs font-bold text-primary uppercase tracking-wider hover:opacity-70">Ver Ambientes →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesWithDistance.slice(0, 6).map((service) => (
                <div 
                  key={service.id}
                  onClick={() => router.push(`/service/${service.slug}`)}
                  className="bg-surface-container-lowest p-4 rounded-[2rem] flex gap-4 items-center cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                    {service.image ? (
                      <img 
                        className="w-full h-full object-cover" 
                        src={service.image} 
                        alt={service.title}
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <Icon icon="image" size={24} className="text-primary/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">{service.category}</span>
                      </div>
                      <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-primary transition-colors">{service.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">{service.description}</p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      {(userLocation || service.environmentName) && (
                        <div className="flex items-center gap-2">
                          {userLocation && service.distance !== Infinity && (
                            <div className="flex items-center gap-1 text-primary">
                              <Icon icon="location_on" size={12} weight={700} />
                              <span className="text-[10px] font-bold">
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
                      <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all duration-300">
                        <Icon icon="arrow_forward" size={14} weight={700} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {servicesWithDistance.length === 0 && (
                <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                   Nenhum serviço encontrado próximo a você
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-xl font-black text-on-surface tracking-tight px-1">Resultados da busca</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesWithDistance
                .filter(service => {
                  const searchLower = search.toLowerCase().trim();
                  return (
                    service.category.toLowerCase().includes(searchLower) ||
                    service.title.toLowerCase().includes(searchLower) ||
                    (service.description && service.description.toLowerCase().includes(searchLower))
                  );
                })
                .map((service) => (
                  <div 
                    key={service.id}
                    onClick={() => router.push(`/service/${service.slug}`)}
                    className="bg-surface-container-lowest p-4 rounded-[2rem] flex gap-4 items-center cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                      {service.image ? (
                        <img 
                          className="w-full h-full object-cover" 
                          src={service.image} 
                          alt={service.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                          <Icon icon="image" size={24} className="text-primary/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">{service.category}</span>
                        </div>
                        <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-primary transition-colors">{service.title}</h4>
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">{service.description}</p>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        {(userLocation || service.environmentName) && (
                          <div className="flex items-center gap-2">
                            {userLocation && service.distance !== Infinity && (
                              <div className="flex items-center gap-1 text-primary">
                                <Icon icon="location_on" size={12} weight={700} />
                                <span className="text-[10px] font-bold">
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
                        <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all duration-300">
                          <Icon icon="arrow_forward" size={14} weight={700} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {servicesWithDistance.filter(service => {
                  const searchLower = search.toLowerCase().trim();
                  return (
                    service.category.toLowerCase().includes(searchLower) ||
                    service.title.toLowerCase().includes(searchLower) ||
                    (service.description && service.description.toLowerCase().includes(searchLower))
                  );
              }).length === 0 && (
                <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                   Nenhum serviço encontrado para "{search}"
                </div>
              )}
            </div>
          </section>
        )}

        {!selectedEnvironment && (
          <section className="bg-primary/5 p-6 rounded-3xl text-center space-y-3 border border-primary/10">
            <div className="w-16 h-16 rounded-full bg-primary-container mx-auto flex items-center justify-center">
              <Icon icon="touch_app" size={32} className="text-primary" />
            </div>
            <h3 className="font-bold text-on-surface">Selecione um ambiente</h3>
            <p className="text-sm text-on-surface-variant">
              Escolha um ambiente acima para ver os serviços disponíveis perto de você
            </p>
            <button 
              onClick={() => router.push('/places')}
              className="mt-2 px-6 py-3 rounded-full primary-gradient text-white font-bold shadow-lg shadow-primary/20"
            >
              Ver ambientes
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
