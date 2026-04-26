'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { TopAppBar } from '@/components/TopAppBar';
import type { PlaceSearchResult } from '@/lib/maps';

export default function FavoritesPage() {
  const router = useRouter();
  const { user, favoritePlaces, removeFavoritePlace } = useApp();

  const handleSelectEnvironment = (place: PlaceSearchResult) => {
    localStorage.setItem(`place_${place.id}`, JSON.stringify(place));

    const envSlug =
      place.displayName?.text
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || place.id;

    router.push(`/places/${envSlug}?placeId=${place.id}`);
  };

  const handleRemoveFavorite = async (
    e: React.MouseEvent,
    placeId: string,
  ) => {
    e.stopPropagation();

    if (confirm('Remover este local dos favoritos?')) {
      await removeFavoritePlace(placeId);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/favorites');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <TopAppBar />

      <main className="mx-auto max-w-5xl px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-24 md:px-8 md:pb-20">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f1115] sm:p-8 md:p-10">

          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
                <Icon icon="star" size={16} weight={700} />
                Favoritos
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl">
                Seus ambientes salvos em um só lugar
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400 md:text-base">
                Acesse rapidamente os locais que você mais frequenta e encontre serviços disponíveis nas suas comunidades favoritas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-3xl font-black text-[#30cc36]">
                  {favoritePlaces.length}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  locais salvos
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/places')}
                className="rounded-2xl bg-[#30cc36] p-4 text-left text-white shadow-[0_16px_34px_rgba(48,204,54,0.3)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
              >
                <Icon icon="explore" size={22} weight={700} />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em]">
                  Explorar
                </p>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {favoritePlaces.length === 0 ? (
            <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-[#30cc36]/30 bg-white/80 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl dark:border-[#30cc36]/20 dark:bg-white/[0.03] sm:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36]">
                <Icon icon="explore" size={34} weight={700} />
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                Nenhum favorito ainda
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Favorite ambientes na tela de Ambientes para acessá-los mais rápido sempre que precisar.
              </p>

              <button
                type="button"
                onClick={() => router.push('/places')}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#30cc36] px-7 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(48,204,54,0.35)] transition hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
              >
                Explorar ambientes
                <Icon icon="arrow_forward" size={17} weight={700} />
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {favoritePlaces.map((place) => (
                <article
                  key={place.id}
                  onClick={() => handleSelectEnvironment(place)}
                  className="group cursor-pointer overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#30cc36]/30 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)] active:scale-[0.98] dark:border-white/10 dark:bg-[#0f1115]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36] transition-colors group-hover:bg-[#30cc36] group-hover:text-white">
                      <Icon icon="location_on" weight={700} size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#30cc36]" />
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                          Ambiente salvo
                        </p>
                      </div>

                      <h3 className="mt-1 truncate text-base font-black tracking-tight text-zinc-950 transition-colors group-hover:text-[#30cc36] dark:text-white sm:text-lg">
                        {place.displayName?.text}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-xs font-medium leading-5 text-zinc-500 dark:text-zinc-400">
                        {place.formattedAddress}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(e, place.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-rose-500/80 transition hover:bg-rose-500/10 hover:text-rose-600 active:scale-90"
                        aria-label="Remover favorito"
                      >
                        <Icon icon="delete" size={20} weight={400} />
                      </button>

                      <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-colors group-hover:bg-[#30cc36] group-hover:text-white dark:bg-white/10 sm:flex">
                        <Icon icon="arrow_forward" size={18} weight={700} />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
