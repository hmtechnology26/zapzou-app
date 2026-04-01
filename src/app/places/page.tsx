'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect, type MouseEvent } from 'react';
import { TopAppBar } from '@/components/TopAppBar';
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
    selectedEnvironments,
  } = useApp();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
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

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const searchResultsWithDistance = searchResults
    .map(place => ({
      ...place,
      slug: generateSlug(place.displayName?.text || place.id),
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
    const query = new URLSearchParams();
    
    // Verificar se o ambiente já está cadastrado no banco
    const existingEnvironment = selectedEnvironments.find(env => {
      const envSlugFromName = env.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return envSlugFromName === envSlug || env.slug === envSlug;
    });
    
    // Só adicionar placeId se o ambiente NÃO estiver cadastrado no banco
    if (place && !existingEnvironment) {
      localStorage.setItem(`place_${place.id}`, JSON.stringify(place));
      query.set('placeId', place.id);
    }
    if (mode) {
      query.set('mode', mode);
    }

    const queryString = query.toString();
    const url = `/places/${envSlug}${queryString ? `?${queryString}` : ''}`;
    router.push(url);
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
      <TopAppBar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-32">
        
        <section className="mb-10 mt-6 text-center md:text-left">
           <h2 className="text-3xl font-black text-on-surface tracking-tighter">Explorar Ambientes</h2>
           <p className="text-on-surface-variant text-base mt-1 font-medium">Digite o nome do seu ambiente para ver quem está anunciando lá.</p>
        </section>

        <div className="relative mb-8">
          <div className="flex items-center bg-surface-container-highest rounded-[2.5rem] px-8 py-6 gap-6 focus-within:bg-white focus-within:ring-8 focus-within:ring-primary/5 transition-all shadow-md border border-outline-variant/10 group">
            <Icon icon="search" size={28} className="text-primary group-focus-within:scale-110 transition-transform" weight={700} />
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/70 font-black text-lg"
              placeholder={
                selectedCategory === 'church'
                  ? 'Nome da igreja, templo ou capela...'
                  : 'Nome do condomínio ou residencial...'
              }
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searchLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary border-t-transparent shadow-sm"></div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {PLACE_CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-black text-sm transition-all border shrink-0 shadow-sm ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105 z-10'
                    : 'bg-white text-on-surface-variant border-outline-variant/10 hover:border-primary/40 hover:text-primary active:scale-95'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-white/20' : 'bg-primary/10'
                }`}>
                  <Icon
                    icon={category.icon}
                    size={20}
                    weight={isSelected ? 700 : 400}
                    className={isSelected ? 'text-white' : 'text-primary'}
                  />
                </div>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {(hasSearched || showOnlyFavorites) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">
                {showOnlyFavorites
                  ? favoritePlacesToRender.length > 0
                    ? `${favoritePlacesToRender.length} favoritos`
                    : 'Nenhum favorito'
                  : searchResultsWithDistance.length > 0
                    ? `${searchResultsWithDistance.length} locais encontrados`
                    : 'Buscando locais...'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {placesToRender.map((place) => {
                const isFavorite = user
                  ? backendFavoritePlaces.some((fav) => fav.id === place.id)
                  : favorites.includes(place.id);

                const isCompact = showOnlyFavorites;

                return (
                  <div 
                    key={place.id}
                    onClick={() => handleSelectEnvironment(place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id, place)}
                    className={`group/item rounded-[2.5rem] flex items-center gap-4 cursor-pointer bg-surface-container-lowest hover:bg-white hover:shadow-2xl hover:shadow-primary/5 border border-outline-variant/10 transition-all duration-500 active:scale-[0.98] relative overflow-hidden ${
                      isCompact ? 'p-3 pr-5' : 'p-5 flex-col gap-4'
                    }`}
                  >
                    {!isCompact && (
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover/item:scale-110 transition-transform duration-500">
                          <Icon icon={selectedCategory === 'church' ? 'church' : 'domain'} weight={400} size={28} className="text-primary" />
                        </div>
                        <button 
                          onClick={(e) => void handleToggleFavoriteClick(place, e)}
                          className="p-2.5 rounded-full bg-surface-container-high hover:bg-primary/10 transition-colors shadow-sm group/fav"
                        >
                          <Icon 
                            icon={isFavorite ? 'star' : 'star_border'} 
                            size={20} 
                            weight={700}
                            className={isFavorite ? 'text-primary scale-110' : 'text-on-surface-variant group-hover/fav:text-primary'}
                          />
                        </button>
                      </div>
                    )}

                    {isCompact && (
                      <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-500">
                        <Icon icon={selectedCategory === 'church' ? 'church' : 'domain'} weight={400} size={32} className="text-primary" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-on-surface leading-tight group-hover/item:text-primary transition-colors truncate ${
                        isCompact ? 'text-base' : 'text-lg'
                      }`}>{place.displayName?.text}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                           {getTypeLabel(place.primaryType)}
                        </span>
                      </div>
                      {!isCompact && (
                        <p className="text-xs text-on-surface-variant font-medium line-clamp-2 mt-3 leading-relaxed opacity-70 group-hover/item:opacity-100 transition-opacity">
                          {place.formattedAddress}
                        </p>
                      )}
                      {isCompact && (
                        <p className="text-[11px] text-on-surface-variant/60 font-medium truncate mt-0.5">
                          {place.formattedAddress}
                        </p>
                      )}
                    </div>

                    {!isCompact && (
                      <div className="mt-2 pt-4 border-t border-outline-variant/5 flex items-center justify-between">
                         <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-tighter">Tocar para ver serviços</span>
                         <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white transition-all transform group-hover/item:translate-x-1">
                            <Icon icon="arrow_forward" size={16} weight={700} />
                         </div>
                      </div>
                    )}

                    {isCompact && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => void handleToggleFavoriteClick(place, e)}
                          className="p-3 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors group/del"
                          title="Remover dos favoritos"
                        >
                          <Icon icon="delete" size={20} weight={400} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover/item:bg-primary group-hover/item:text-white transition-all">
                           <Icon icon="chevron_right" size={20} weight={700} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasSearched && !showOnlyFavorites && (
          <div className="text-center py-8 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-outline-variant/10 mt-10">
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
               <Icon icon="search" weight={700} size={20} className="text-primary/30" />
            </div>
            <h3 className="text-[14px] font-black text-on-surface">Comece sua busca</h3>
            <p className="text-[12px] text-on-surface-variant font-medium mt-2 max-w-sm mx-auto">
              Digite o nome do seu {selectedCategory === 'church' ? 'ambiente religioso' : 'condomínio'} para ver quem está anunciando lá.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
