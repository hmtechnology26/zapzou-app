'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';
import type { PlaceSearchResult } from '@/lib/maps';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, favoritePlaces, removeFavoritePlace, loading } = useApp();

  const handleSelectEnvironment = (place: PlaceSearchResult) => {
    localStorage.setItem(`place_${place.id}`, JSON.stringify(place));
    const envSlug = place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id;
    router.push(`/places/${envSlug}?placeId=${place.id}`);
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, placeId: string) => {
    e.stopPropagation();
    if (confirm('Remover este local dos favoritos?')) {
      await removeFavoritePlace(placeId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Layout handles redirect
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopAppBar />

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col items-center text-center gap-2">
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
              <Icon icon="star" size={24} className="text-primary" />
           </div>
           <h2 className="text-xl font-black text-on-surface tracking-tight">Seus Favoritos</h2>
           <p className="text-sm text-on-surface-variant max-w-xs">
              Acesse rapidamente os ambientes que você mais frequenta e confira os serviços disponíveis.
           </p>
        </div>

        <div className="space-y-4">
          {favoritePlaces.length === 0 ? (
            <div className="rounded-[2.5rem] border-2 border-dashed border-outline-variant/10 py-16 text-center bg-white/30 backdrop-blur-sm">
               <Icon icon="explore" size={40} className="mx-auto mb-4 opacity-20 text-primary" />
               <p className="text-sm font-bold text-on-surface-variant">Você ainda não possui favoritos.</p>
               <p className="text-[11px] text-on-surface-variant/60 max-w-xs mx-auto mt-1 uppercase tracking-wider">Favorite locais na tela de Ambientes para vê-los aqui.</p>
               <button 
                 onClick={() => router.push('/places')}
                 className="mt-6 px-6 py-3 rounded-full primary-gradient text-white font-bold shadow-lg shadow-primary/20 text-sm"
               >
                 Explorar Ambientes
               </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {favoritePlaces.map((place) => (
                <div 
                  key={place.id}
                  onClick={() => handleSelectEnvironment(place)}
                  className="p-4 rounded-2xl flex items-center gap-4 cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all active:scale-[0.98] shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    <Icon icon="location_on" weight={400} size={24} className="text-on-surface-variant" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface truncate">{place.displayName?.text}</h3>
                    <p className="text-on-surface-variant text-[11px] line-clamp-1 mt-0.5">
                      {place.formattedAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleRemoveFavorite(e, place.id)}
                      className="p-2 rounded-full hover:bg-error/10 text-error transition-colors"
                    >
                      <Icon icon="delete" size={20} />
                    </button>
                    <Icon icon="chevron_right" weight={400} size={24} className="text-on-surface-variant" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
