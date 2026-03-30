'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { user, selectedEnvironment, selectedEnvironments, services } = useApp();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

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

  const servicesWithDistance = services
    .filter(s => s.isActive && s.status === 'active')
    .map(s => {
      if (s.latitude && s.longitude && userLocation) {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
        return { ...s, distance };
      }
      return { ...s, distance: Infinity };
    })
    .sort((a, b) => a.distance - b.distance);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-slate-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <span className="text-xl font-black text-primary tracking-tight">ZapZou</span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button 
            onClick={() => router.push('/search')}
            className="hover:bg-slate-100/50 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
          >
            <Icon icon="search" size={24} />
          </button>
          {mounted && user?.avatar ? (
            <div className="relative">
              <button onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm hover:scale-105 transition-transform">
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </button>
              {user?.plan && user.plan !== 'free' && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md ${
                  user.plan === 'pro' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {user.plan === 'pro' ? 'PRÓ' : 'PLUS'}
                </div>
              )}
            </div>
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

      <main className="pt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-6 pb-28">
        <section className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Perto de você</h2>
          <p className="text-on-surface-variant text-base">Serviços confiáveis de ambientes próximos</p>
        </section>

        <section 
          className="relative h-56 w-full rounded-3xl overflow-hidden bg-surface-container-highest shadow-inner"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-container/20" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {selectedEnvironment && (
                <div className="absolute -top-10 -left-6 bg-primary-container text-on-primary-container px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2 border-2 border-white z-10">
                  <Icon icon="location_on" size={16} style={{ fontVariationSettings: "'FILL' 1" }} />
                  {selectedEnvironment.name}
                </div>
              )}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg"></div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-primary flex items-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <Icon icon="my_location" size={18} />
            {locationLoading ? 'Obtendo...' : 'Usar minha localização'}
          </button>

          <div className="absolute bottom-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-2 rounded-2xl flex flex-col gap-1 shadow-sm border border-outline-variant/10">
            <button className="p-2 hover:bg-surface-container-high rounded-xl transition-colors">
              <Icon icon="add" size={20} className="text-on-surface-variant" />
            </button>
            <button className="p-2 hover:bg-surface-container-high rounded-xl transition-colors">
              <Icon icon="remove" size={20} className="text-on-surface-variant" />
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-center bg-surface-container-highest rounded-full px-6 py-4 gap-4 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Icon icon="search" size={24} className="text-on-surface-variant" />
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/60"
              placeholder="O que você precisa hoje?"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {!search && (
          <section className="space-y-3">
            <h3 className="text-lg font-bold text-on-surface">Serviços próximos</h3>
            <div className="space-y-3">
              {servicesWithDistance.slice(0, 6).map((service) => (
                <div 
                  key={service.id}
                  onClick={() => router.push(`/service/${service.slug}`)}
                  className="bg-surface-container-lowest p-3 rounded-2xl flex gap-4 items-center cursor-pointer hover:bg-surface-container-low transition-all active:scale-[0.98] border border-outline-variant/5"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      className="w-full h-full object-cover" 
                      src={service.image} 
                      alt={service.title}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{service.category}</span>
                      <div className="flex items-center gap-1 text-primary">
                        <Icon icon="star" size={12} style={{ fontVariationSettings: "'FILL' 1" }} />
                        <span className="text-[10px] font-extrabold">{service.rating || 'Novo'}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-on-surface text-sm truncate">{service.title}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{service.description}</p>
                    {userLocation && service.distance !== Infinity && (
                      <p className="text-[10px] text-primary font-medium mt-1">
                        {service.distance < 1 
                          ? `${Math.round(service.distance * 1000)}m` 
                          : `${service.distance.toFixed(1)}km`} de distância
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {servicesWithDistance.length === 0 && (
                <p className="text-center text-on-surface-variant py-8">Nenhum serviço encontrado próximo a você</p>
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
