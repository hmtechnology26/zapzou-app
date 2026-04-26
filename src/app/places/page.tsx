"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { TopAppBar } from "@/components/TopAppBar";
import { useApp } from "@/hooks/useApp";
import type { Service } from "@/types";
import { SearchField } from "@/components/SearchField";

type EnvironmentCard = {
  id: string;
  slug: string;
  name: string;
  type: string;
  address: string;
  serviceCount: number;
};

const TYPE_LABELS: Record<string, string> = {
  residential: "Residencial",
  church: "Igreja",
  place_of_worship: "Local de culto",
  cathedral: "Catedral",
  chapel: "Capela",
  temple: "Templo",
  club: "Clube",
  association: "Associação",
  apartment_building: "Prédio",
  condominium_complex: "Condomínio",
  shopping_mall: "Shopping",
  commercial: "Comercial",
  mixed_use: "Uso misto",
  environment: "Ambiente",
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isPublishedService(service: Service) {
  return service.status === "active" && service.isActive !== false;
}

function getTypeLabel(type: string) {
  return TYPE_LABELS[type] || "Ambiente";
}

function getEnvironmentIcon(type: string, name: string) {
  const normalizedType = type.trim().toLowerCase();
  const normalizedName = name.toLowerCase();

  const isChurchLike =
    normalizedType === "church" ||
    normalizedType === "place_of_worship" ||
    normalizedType === "cathedral" ||
    normalizedType === "chapel" ||
    normalizedType === "temple" ||
    normalizedName.includes("igreja");

  return isChurchLike ? "church" : "location_city";
}

function getAccessTypeBadge(
  accessType?: "resident" | "service_provider" | null,
) {
  if (accessType === "resident") {
    return {
      label: "MORADOR",
      className:
        "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    };
  }

  if (accessType === "service_provider") {
    return {
      label: "PRESTADOR",
      className:
        "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }

  return null;
}

export default function PlacesPage() {
  const router = useRouter();
  const { services, servicesLoading, selectedEnvironments } = useApp();
  const [environmentSearch, setEnvironmentSearch] = useState("");

  const activeServices = useMemo(
    () => services.filter(isPublishedService),
    [services],
  );

  const environments = useMemo<EnvironmentCard[]>(() => {
    const map = new Map<string, EnvironmentCard>();

    activeServices.forEach((service) => {
      const label = service.environmentName?.trim() || "Ambiente";
      const slug = service.environmentSlug?.trim() || generateSlug(label);
      const id = service.environmentId?.trim() || slug;
      const current = map.get(id);

      if (!current) {
        map.set(id, {
          id,
          slug,
          name: label,
          type: service.environmentType?.trim() || "environment",
          address: service.environmentAddress?.trim() || "",
          serviceCount: 1,
        });
        return;
      }

      current.serviceCount += 1;

      if (!current.slug) current.slug = slug;

      if (current.type === "environment" && service.environmentType?.trim()) {
        current.type = service.environmentType.trim();
      }

      if (!current.address && service.environmentAddress?.trim()) {
        current.address = service.environmentAddress.trim();
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [activeServices]);

  const membershipByEnvironmentId = useMemo(() => {
    const map = new Map<string, "resident" | "service_provider">();

    selectedEnvironments.forEach((env) => {
      if (
        env.membershipAccessType === "resident" ||
        env.membershipAccessType === "service_provider"
      ) {
        map.set(env.id, env.membershipAccessType);
      }
    });

    return map;
  }, [selectedEnvironments]);

  const filteredEnvironments = useMemo(() => {
    const search = environmentSearch.trim().toLowerCase();
    if (!search) return environments;

    return environments.filter((environment) => {
      const name = environment.name.toLowerCase();
      const typeLabel = getTypeLabel(environment.type).toLowerCase();

      return name.includes(search) || typeLabel.includes(search);
    });
  }, [environments, environmentSearch]);

  useEffect(() => {
    filteredEnvironments.slice(0, 9).forEach((environment) => {
      void router.prefetch(`/places/${environment.slug}`);
    });
  }, [filteredEnvironments, router]);

  const openEnvironment = (slug: string) => {
    router.push(`/places/${slug}`);
  };

  const totalEnvironments = environments.length;
  const totalServices = activeServices.length;

  return (
    <div className="min-h-screen overflow-hidden bg-background pb-24 md:pb-10">
      <TopAppBar />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-24 md:px-8 md:pt-28">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#30cc36]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#30cc36]/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
                <Icon icon="explore" size={15} weight={700} />
                Comunidades
              </span>

              <h1 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl">
                Encontre comunidades com serviços publicados.
              </h1>

              {/* <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-zinc-500 dark:text-white/55 md:text-base">
                Explore ambientes próximos, condomínios, igrejas, clubes e comunidades com profissionais disponíveis.
              </p> */}
            </div>

            {/* <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-[1.5rem] border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-3xl font-black text-[#30cc36]">
                  {totalEnvironments}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Comunidades
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/20 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-3xl font-black text-zinc-950 dark:text-white">
                  {totalServices}
                </p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Serviços
                </p>
              </div>
            </div> */}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/20 bg-white/70 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
          <SearchField
            value={environmentSearch}
            onChange={setEnvironmentSearch}
            placeholder="Buscar comunidade..."
          />
        </section>

        {servicesLoading && totalEnvironments === 0 ? (
          <div className="mt-8 rounded-[2.5rem] border border-white/20 bg-white/70 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#30cc36] border-t-transparent" />
            <p className="mt-4 text-sm font-bold text-zinc-500 dark:text-white/55">
              Carregando comunidades com serviços publicados...
            </p>
          </div>
        ) : null}

        {!servicesLoading && totalEnvironments === 0 ? (
          <div className="mt-8 rounded-[2.5rem] border border-dashed border-[#30cc36]/30 bg-white/70 p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-[#30cc36]/20 dark:bg-white/[0.04]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36]">
              <Icon icon="domain" size={32} weight={700} />
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              Ainda não há comunidades com serviços publicados
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-white/55">
              Assim que alguém publicar um serviço em uma comunidade, ela aparece automaticamente aqui.
            </p>
          </div>
        ) : null}

        {filteredEnvironments.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEnvironments.map((environment) => {
              const accessBadge = getAccessTypeBadge(
                membershipByEnvironmentId.get(environment.id) ?? null,
              );

              return (
                <button
                  key={environment.id}
                  type="button"
                  onClick={() => openEnvironment(environment.slug)}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 p-5 text-left shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#30cc36]/30 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#30cc36]/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#30cc36]/15 bg-[#30cc36]/10 text-[#30cc36] shadow-sm transition-all duration-300 group-hover:bg-[#30cc36] group-hover:text-white group-hover:shadow-[0_14px_35px_rgba(48,204,54,0.25)]">
                      <Icon
                        icon={getEnvironmentIcon(
                          environment.type,
                          environment.name,
                        )}
                        size={27}
                        weight={700}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                          {getTypeLabel(environment.type)}
                        </p>

                        {accessBadge && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${accessBadge.className}`}
                          >
                            {accessBadge.label}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1 line-clamp-2 text-[1.15rem] font-black tracking-tight text-zinc-950 transition-colors group-hover:text-[#30cc36] dark:text-white">
                        {environment.name}
                      </h2>

                      {environment.address && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-white/55">
                          {environment.address}
                        </p>
                      )}

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#30cc36]/15 bg-[#30cc36]/10 px-3 py-1.5 text-[11px] font-black text-[#1eb34b]">
                        <Icon icon="storefront" size={14} weight={700} />
                        {environment.serviceCount} serviço
                        {environment.serviceCount === 1 ? "" : "s"} publicado
                        {environment.serviceCount === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-all duration-300 group-hover:bg-[#30cc36] group-hover:text-white dark:bg-white/10 dark:text-white/45">
                      <Icon icon="chevron_right" size={20} weight={700} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {totalEnvironments > 0 &&
        filteredEnvironments.length === 0 &&
        !servicesLoading ? (
          <div className="mt-8 rounded-[2.5rem] border border-dashed border-[#30cc36]/30 bg-white/70 p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-[#30cc36]/20 dark:bg-white/[0.04]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36]">
              <Icon icon="search_off" size={32} weight={700} />
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
              Nenhuma comunidade encontrada
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-white/55">
              Tente outro nome ou limpe a busca para ver todas as comunidades.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}