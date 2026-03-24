'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';

export default function PlacesPage() {
  const router = useRouter();
  const { selectedEnvironments, user } = useApp();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationLoading(false);
        },
        () => {
          setLocationLoading(false);
        }
      );
    }
  }, []);

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

  const filteredEnvironments = selectedEnvironments
    .map(env => ({
      ...env,
      slug: env.slug || env.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      distance: env.latitude && env.longitude && userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, env.latitude, env.longitude)
        : Infinity
    }))
    .filter(env => 
      env.name.toLowerCase().includes(search.toLowerCase()) || env.slug.includes(search.toLowerCase())
    )
    .sort((a, b) => a.distance - b.distance);

  const handleSelectEnvironment = (envSlug: string) => {
    router.push(`/places/${envSlug}`);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Residencial',
      church: 'Igreja',
      club: 'Clube',
      association: 'Associação'
    };
    return labels[type] || type;
  };

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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Ambientes</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
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

      <main className="mt-20 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="relative mb-6">
          <Icon 
            icon="search" 
            weight={400} 
            size={24} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
          />
          <input 
            className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/60 shadow-inner"
            placeholder="Buscar ambientes..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="grid gap-3">
          {filteredEnvironments.map((env) => (
            <div 
              key={env.id} 
              onClick={() => handleSelectEnvironment(env.slug)}
              className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all active:scale-[0.98]"
            >
              {env.image ? (
                <img className="w-16 h-16 rounded-full object-cover" src={env.image} alt={env.name} />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                  <Icon icon="location_on" weight={400} size={24} className="text-on-surface-variant" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">{env.name}</h3>
                <p className="text-on-surface-variant text-sm">
                  {getTypeLabel(env.type)} • {env.members} membros
                  {userLocation && env.distance !== Infinity && (
                    <span className="text-primary font-medium"> • {env.distance.toFixed(1)}km</span>
                  )}
                </p>
              </div>
              <Icon icon="chevron_right" weight={400} size={24} className="text-on-surface-variant" />
            </div>
          ))}
        </div>

        {filteredEnvironments.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <Icon icon="location_off" weight={400} size={48} className="mb-2 text-outline mx-auto" />
            <p className="text-sm">Nenhum ambiente encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
}
