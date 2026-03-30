'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';
import { searchPlaces, type PlaceSearchResult } from '@/lib/maps';

export default function PlacesPage() {
  const router = useRouter();
  const { user } = useApp();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não disponível no navegador');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });
        setLocationLoading(false);
        setSearch('Próximo a mim');
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permissão de localização negada');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Localização indisponível');
            break;
          case error.TIMEOUT:
            setLocationError('Tempo limite atingido');
            break;
          default:
            setLocationError('Erro ao obter localização');
        }
      }
    );
  };

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      setHasSearched(true);
      try {
        const results = await searchPlaces(search);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

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

  const mapPrimaryTypeToEnvType = (primaryType: string): string => {
    const typeMap: Record<string, string> = {
      church: 'church',
      condominium_complex: 'residential',
      apartment_building: 'residential',
      apartment_complex: 'residential',
      housing_complex: 'residential',
      shopping_mall: 'club'
    };
    return typeMap[primaryType] || 'residential';
  };

  const searchResultsWithDistance = searchResults
    .map(place => ({
      ...place,
      slug: place.id,
      name: place.displayName?.text || '',
      type: mapPrimaryTypeToEnvType(place.primaryType),
      members: 0,
      image: '',
      distance: userLocation && place.location
        ? calculateDistance(userLocation.lat, userLocation.lng, place.location.latitude, place.location.longitude)
        : Infinity
    }))
    .sort((a, b) => a.distance - b.distance);

  const handleSelectEnvironment = (envSlug: string, place?: PlaceSearchResult) => {
    if (place) {
      localStorage.setItem(`place_${place.id}`, JSON.stringify(place));
      router.push(`/places/${envSlug}?placeId=${place.id}`);
    } else {
      router.push(`/places/${envSlug}`);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Residencial',
      church: 'Igreja',
      club: 'Clube',
      association: 'Associação',
      apartment_building: 'Prédio',
      condominium_complex: 'Condomínio',
      shopping_mall: 'Shopping'
    };
    return labels[type] || type;
  };

  if (!mounted) return null;

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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Buscar Locais</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button onClick={() => router.push('/profile')} className="hover:scale-105 transition-transform active:scale-95 ml-1">
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  alt="Avatar"
                  className="w-10 h-10 border-2 border-primary shadow-sm"
                />
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
        <button
          onClick={handleUseMyLocation}
          disabled={locationLoading}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 mb-6 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {locationLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          ) : (
            <Icon icon="my_location" size={24} className="text-primary" />
          )}
          <span className="font-semibold text-primary">Usar minha localização</span>
        </button>

        {locationError && (
          <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl flex items-center gap-2">
            <Icon icon="error_outline" size={20} className="text-error" />
            <span className="text-sm text-error">{locationError}</span>
          </div>
        )}

        <div className="relative mb-6">
          <Icon 
            icon="search" 
            weight={400} 
            size={24} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
          />
          <input 
            className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/60 shadow-inner"
            placeholder="Buscar condomínios, igrejas, prédios..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>

        {hasSearched && (
          <div className="grid gap-3">
            <p className="text-sm text-on-surface-variant mb-2">
              {searchResultsWithDistance.length > 0 
                ? `${searchResultsWithDistance.length} locais encontrados`
                : 'Nenhum local encontrado'}
            </p>
            {searchResultsWithDistance.map((place) => (
              <div 
                key={place.id}
                onClick={() => handleSelectEnvironment(place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id, place)}
                className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                  <Icon icon="location_on" weight={400} size={24} className="text-on-surface-variant" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{place.displayName?.text}</h3>
                  <p className="text-on-surface-variant text-sm">
                    {getTypeLabel(place.primaryType)}
                    {userLocation && place.distance !== Infinity && (
                      <span className="text-primary font-medium"> • {place.distance.toFixed(1)}km</span>
                    )}
                  </p>
                </div>
                <Icon icon="chevron_right" weight={400} size={24} className="text-on-surface-variant" />
              </div>
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12 opacity-50">
            <Icon icon="search" weight={400} size={48} className="mb-2 text-outline mx-auto" />
            <p className="text-sm">Busque por locais próximos ou use sua localização</p>
          </div>
        )}
      </main>
    </div>
  );
}
