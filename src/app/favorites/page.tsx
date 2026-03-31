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
        <div className="bg-emerald-50/60 backdrop-blur-md border border-emerald-100 rounded-[2.5rem] p-6 sm:p-10 flex flex-col items-center text-center gap-4 shadow-sm">
           <div className="w-16 h-16 rounded-full bg-emerald-100/50 flex items-center justify-center border border-emerald-200 shrink-0">
              <Icon icon="star" size={32} weight={700} className="text-emerald-700" />
           </div>
           <div className="space-y-1 sm:space-y-2">
             <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tighter">Seus Favoritos</h2>
             <p className="text-xs sm:text-base text-emerald-900/60 font-medium max-w-xs leading-relaxed">
                Acesse rapidamente os ambientes que você mais frequenta e confira os serviços disponíveis.
             </p>
           </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {favoritePlaces.length === 0 ? (
            <div className="rounded-[3rem] border-2 border-dashed border-emerald-100 py-12 sm:py-16 text-center bg-white/40 backdrop-blur-sm">
               <Icon icon="explore" size={48} className="mx-auto mb-4 opacity-20 text-emerald-600" />
               <p className="text-lg font-black text-emerald-950">Vazio por aqui</p>
               <p className="text-sm text-emerald-900/60 max-w-xs mx-auto mt-2 font-medium px-4">Favorite locais na tela de Ambientes para vê-los aqui.</p>
               <button 
                 onClick={() => router.push('/places')}
                 className="mt-8 px-10 py-4 rounded-full primary-gradient text-white font-black shadow-xl shadow-primary/20 text-sm active:scale-95 transition-all"
               >
                 Explorar Ambientes
               </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {favoritePlaces.map((place) => (
                <div 
                  key={place.id}
                  onClick={() => handleSelectEnvironment(place)}
                  className="p-3 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] flex items-center gap-3 sm:gap-4 cursor-pointer bg-white hover:bg-emerald-50/30 border border-outline-variant/10 transition-all active:scale-[0.98] shadow-sm group min-w-0 overflow-hidden"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon icon="location_on" weight={400} size={20} className="text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-on-surface text-sm sm:text-lg truncate group-hover:text-primary transition-colors">{place.displayName?.text}</h3>
                    <p className="text-slate-400 text-[10px] sm:text-xs truncate mt-0.5 font-medium opacity-80">
                      {place.formattedAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                    <button 
                      onClick={(e) => handleRemoveFavorite(e, place.id)}
                      className="p-2 text-rose-500/80 hover:text-rose-600 transition-colors active:scale-90"
                    >
                      <Icon icon="delete" size={20} weight={300} />
                    </button>
                    <Icon icon="chevron_right" weight={400} size={20} className="text-slate-200" />
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
