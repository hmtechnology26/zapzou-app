'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect, type MouseEvent } from 'react';
import { searchPlaces, type PlaceSearchResult } from '@/lib/maps';
import { inferEnvironmentTypeFromPlace } from '@/lib/environment-rules';

const PLACE_CATEGORIES = [
  {
    id: 'condominium' as const,
    label: 'Condomínios',
    description: '',
    icon: 'domain',
  },
  {
    id: 'church' as const,
    label: 'Igrejas',
    description: '',
    icon: 'church',
  }
] as const;

export default function PlacesPage() {
  const router = useRouter();
  const {
    user,
    favoritePlaces: backendFavoritePlaces,
    storeFavoritePlace,
    removeFavoritePlace,
  } = useApp();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritePlaceCache, setFavoritePlaceCache] = useState<Record<string, PlaceSearchResult>>({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'condominium' | 'church'>('condominium');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load favorites from localStorage when no backend user
  useEffect(() => {
    if (typeof window === 'undefined' || user) return;
    const savedFavorites = localStorage.getItem('favoritePlaces');
    if (!savedFavorites) {
      setFavorites([]);
      setFavoritePlaceCache({});
      return;
    }

    try {
      const parsed = JSON.parse(savedFavorites);
      if (Array.isArray(parsed)) {
        const normalizedFavorites = parsed.filter((id): id is string => typeof id === 'string');
        setFavorites(normalizedFavorites);

        const cache: Record<string, PlaceSearchResult> = {};
        normalizedFavorites.forEach((favoriteId) => {
          const savedPlaceJson = localStorage.getItem(`place_${favoriteId}`);
          if (!savedPlaceJson) return;
          try {
            const parsedPlace = JSON.parse(savedPlaceJson);
            if (
              parsedPlace &&
              typeof parsedPlace === 'object' &&
              parsedPlace.id === favoriteId
            ) {
              cache[favoriteId] = parsedPlace as PlaceSearchResult;
            }
          } catch (err) {
            console.error(`Error parsing saved place ${favoriteId}:`, err);
          }
        });
        setFavoritePlaceCache(cache);
        return;
      }
    } catch (err) {
      console.error('Error parsing favorites:', err);
      localStorage.removeItem('favoritePlaces');
    }

    setFavorites([]);
    setFavoritePlaceCache({});
  }, [user]);

  useEffect(() => {
    if (user) {
      setFavorites([]);
      setFavoritePlaceCache({});
    }
  }, [user]);

  // Save favorites to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || user) return;
    localStorage.setItem('favoritePlaces', JSON.stringify(favorites));
  }, [favorites, user]);

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
        const results = await searchPlaces(search, { categoryType: selectedCategory });
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, selectedCategory]);

  const searchResultsWithDistance = searchResults
    .map(place => ({
      ...place,
      slug: place.id,
      name: place.displayName?.text || '',
      type: inferEnvironmentTypeFromPlace(place.primaryType),
      members: 0,
      image: ''
    }));

  const localFavoritePlaces = favorites
    .map((favoriteId) => {
      const livePlace = searchResultsWithDistance.find(place => place.id === favoriteId);
      if (livePlace) {
        return livePlace;
      }
      return favoritePlaceCache[favoriteId];
    })
    .filter((place): place is PlaceSearchResult => Boolean(place));

  const favoritePlacesToRender = user ? backendFavoritePlaces : localFavoritePlaces;
  const placesToRender = showOnlyFavorites ? favoritePlacesToRender : searchResultsWithDistance;

  const handleSelectEnvironment = (envSlug: string, place?: PlaceSearchResult) => {
    if (place) {
      localStorage.setItem(`place_${place.id}`, JSON.stringify(place));
      router.push(`/places/${envSlug}?placeId=${place.id}`);
    } else {
      router.push(`/places/${envSlug}`);
    }
  };

  const handleToggleFavorite = async (place: PlaceSearchResult) => {
    if (user) {
      const isServerFavorite = backendFavoritePlaces.some((fav) => fav.id === place.id);
      try {
        if (isServerFavorite) {
          await removeFavoritePlace(place.id);
        } else {
          await storeFavoritePlace(place);
        }
      } catch (err) {
        console.error('Erro ao atualizar favorito no backend:', err);
      }
      return;
    }

    const isFavorite = favorites.includes(place.id);
    const nextFavorites = isFavorite
      ? favorites.filter((id) => id !== place.id)
      : [...favorites, place.id];

    setFavorites(nextFavorites);
    setFavoritePlaceCache((prevCache) => {
      const nextCache = { ...prevCache };
      if (isFavorite) {
        delete nextCache[place.id];
      } else {
        nextCache[place.id] = place;
      }
      return nextCache;
    });

    if (typeof window === 'undefined') return;

    try {
      if (isFavorite) {
        localStorage.removeItem(`place_${place.id}`);
      } else {
        localStorage.setItem(`place_${place.id}`, JSON.stringify(place));
      }
    } catch (err) {
      console.error(`Error syncing place ${place.id} to localStorage:`, err);
    }
  };

  const handleToggleFavoriteClick = async (
    place: PlaceSearchResult,
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    await handleToggleFavorite(place);
  };

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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Buscar Locais e Serviços</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`hover:bg-slate-100/50 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary ${showOnlyFavorites ? 'bg-primary/10' : ''}`}
            >
              <Icon icon="star" size={26} className={showOnlyFavorites ? 'text-primary' : 'text-on-surface-variant'} />
              {/* <span className="text-[12px] mx-2 ml-1">{showOnlyFavorites ? 'Todos' : 'Favoritos'}</span> */}
            </button>
          </div>
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
        <div className="relative mb-6">
          <Icon 
            icon="search" 
            weight={400} 
            size={24} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
          />
          <input 
            className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/60 shadow-inner"
            placeholder={
              selectedCategory === 'church'
                ? 'Buscar igrejas, templos e capelas'
                : 'Buscar condomínios, residenciais e clubes'
            }
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          {PLACE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`group flex flex-col items-center text-center justify-center gap-2 rounded-2xl border px-4 py-4 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/90 text-white shadow-lg'
                    : 'border-transparent bg-surface-container-highest text-on-surface'
                }`}
              >
                <Icon
                  icon={category.icon}
                  size={28}
                  className={`transition-colors ${
                    isSelected ? 'text-white' : 'text-primary'
                  }`}
                />
                <p className="text-sm font-semibold leading-tight">{category.label}</p>
                <p className="text-[11px] leading-tight text-on-surface-variant">
                  {category.description}
                </p>
              </button>
            );
          })}
        </div>

        {(hasSearched || showOnlyFavorites) && (
          <div className="grid gap-3">
            <p className="text-sm text-on-surface-variant mb-2">
              {showOnlyFavorites
                ? favoritePlacesToRender.length > 0
                  ? `${favoritePlacesToRender.length} favoritos`
                  : 'Nenhum favorito adicionado'
                : searchResultsWithDistance.length > 0
                  ? `${searchResultsWithDistance.length} locais encontrados`
                  : 'Nenhum local encontrado'}
            </p>
              {placesToRender.map((place) => {
                const isFavorite = user
                  ? backendFavoritePlaces.some((fav) => fav.id === place.id)
                  : favorites.includes(place.id);

                return (
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
                    </p>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                      {place.formattedAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => void handleToggleFavoriteClick(place, e)}
                      className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      <Icon 
                        icon={isFavorite ? 'star' : 'star_border'} 
                        size={20} 
                        className={isFavorite ? 'text-primary' : 'text-on-surface-variant'}
                      />
                    </button>
                    <Icon icon="chevron_right" weight={400} size={24} className="text-on-surface-variant" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hasSearched && !showOnlyFavorites && (
        <div className="text-center py-12 opacity-50">
          <Icon icon="search" weight={400} size={48} className="mb-2 text-outline mx-auto" />
          <p className="text-sm capitalize">
            Busque por {selectedCategory === 'church' ? 'igrejas e templos' : 'condomínios e residenciais'} usando o filtro acima.
          </p>
        </div>
      )}
      </main>
    </div>
  );
}
