"use client";

import { useMemo, useState } from "react";
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

function getAccessTypeBadge(accessType?: 'resident' | 'service_provider' | null) {
  if (accessType === 'resident') {
    return {
      label: 'MORADOR',
      className: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    };
  }

  if (accessType === 'service_provider') {
    return {
      label: 'PRESTADOR',
      className: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
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
      if (!current.slug) {
        current.slug = slug;
      }
      if (current.type === "environment" && service.environmentType?.trim()) {
        current.type = service.environmentType.trim();
      }
      if (!current.address && service.environmentAddress?.trim()) {
        current.address = service.environmentAddress.trim();
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeServices]);

  const membershipByEnvironmentId = useMemo(() => {
    const map = new Map<string, 'resident' | 'service_provider'>();
    selectedEnvironments.forEach((env) => {
      if (env.membershipAccessType === 'resident' || env.membershipAccessType === 'service_provider') {
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

  const openEnvironment = (slug: string) => {
    router.push(`/places/${slug}`);
  };

  const totalEnvironments = environments.length;
  const totalServices = activeServices.length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <TopAppBar />

      <main className="mx-auto max-w-7xl px-4 pt-24 md:px-8">
        <section className="rounded-[2.5rem] border border-outline-variant/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#30cc36]/[0.06] p-6 shadow-sm md:p-8">
          <div className="grid gap-6 md:grid-cols-[1.35fr_0.65fr] md:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/70">
                Ambientes com serviços publicados
              </p>
              <h1 className="mt-6 text-2xl text-center md:text-start font-black uppercase tracking-tight text-on-surface md:text-5xl">
                Escolha um ambiente
              </h1>
              {/* <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                Esta lista mostra apenas os ambientes que já têm serviços ativos
                publicados. Ao abrir um card, você vai para a página do ambiente
                com os serviços dele.
              </p> */}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                <p className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-on-surface-variant/70">
                  Ambientes
                </p>
                <p className="mt-2 text-center text-3xl font-black tracking-tight text-on-surface">
                  {totalEnvironments}
                </p>
              </div>
              <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                <p className="text-[10px] text-center font-black uppercase tracking-[0.2em] text-on-surface-variant/70">
                  Serviços
                </p>
                <p className="mt-2 text-3xl text-center font-black tracking-tight text-on-surface">
                  {totalServices}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SearchField
            value={environmentSearch}
            onChange={setEnvironmentSearch}
            placeholder="Buscar ambiente..."
          />
        </section>

        {servicesLoading && totalEnvironments === 0 ? (
          <div className="mt-8 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-lowest p-6 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-on-surface-variant">
              Carregando ambientes com serviços publicados...
            </p>
          </div>
        ) : null}

        {!servicesLoading && totalEnvironments === 0 ? (
          <div className="mt-8 rounded-[2.5rem] border border-dashed border-outline-variant/15 bg-surface-container-low/40 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
              <Icon icon="domain" size={28} className="text-primary/40" weight={700} />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-on-surface">
              Ainda não há ambientes com serviços publicados
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
              Assim que alguém publicar um serviço em um ambiente, ele aparece
              automaticamente aqui.
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
                  className="group rounded-[1.75rem] border border-outline-variant/10 bg-surface-container-lowest p-5 text-left shadow-sm transition-all duration-300 hover:border-[#30cc36]/20 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-outline-variant/10 bg-surface-container-high text-[#30cc36] transition-colors group-hover:bg-[#30cc36]/8">
                      <Icon
                        icon={getEnvironmentIcon(environment.type, environment.name)}
                        size={26}
                        className="text-[#30cc36]"
                        weight={700}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/55">
                          {getTypeLabel(environment.type)}
                        </p>
                        {accessBadge && (
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${accessBadge.className}`}>
                            {accessBadge.label}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 line-clamp-2 text-[1.15rem] font-black tracking-tight text-on-surface">
                        {environment.name}
                      </h2>
                      {environment.address && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                          {environment.address}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-medium text-on-surface-variant">
                        {environment.serviceCount} serviço
                        {environment.serviceCount === 1 ? "" : "s"} publicado
                        {environment.serviceCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <Icon
                      icon="chevron_right"
                      size={20}
                      weight={700}
                      className="mt-1 text-on-surface-variant/60 transition-colors group-hover:text-on-surface"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {totalEnvironments > 0 && filteredEnvironments.length === 0 && !servicesLoading ? (
          <div className="mt-8 rounded-[2.5rem] border border-dashed border-outline-variant/15 bg-surface-container-low/40 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
              <Icon icon="search_off" size={28} className="text-primary/40" weight={700} />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-on-surface">
              Nenhum ambiente encontrado
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
              Tente outro nome ou limpe a busca para ver todos os ambientes.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
