"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { useApp } from "@/hooks/useApp";
import { useState, useEffect, useMemo, useRef } from "react";
import { MapComponent } from "@/components/GoogleMap";
import { TopAppBar } from "@/components/TopAppBar";
import { hasCnpj } from "@/lib/cnpj";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { SearchField } from "@/components/SearchField";

export default function HomePage() {
  const router = useRouter();
  const { user, selectedEnvironment, selectedEnvironments, services } =
    useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  const toSafeLower = (value: unknown) =>
    typeof value === "string" ? value.toLowerCase() : "";

  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive && s.status === "active");
  }, [services]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    activeServices.forEach((s) => {
      if (s.category) {
        cats.add(s.category);
      }
    });
    return Array.from(cats).sort();
  }, [activeServices]);

  const environmentsWithServices = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    activeServices.forEach((service) => {
      if (!service.environmentId) return;
      const label = service.environmentName?.trim() || "Ambiente";
      if (!map.has(service.environmentId)) {
        map.set(service.environmentId, {
          id: service.environmentId,
          name: label,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [activeServices]);

  const selectedEnvironmentName = useMemo(() => {
    if (selectedEnvironmentId === "all") return "Filtro";
    return (
      environmentsWithServices.find((env) => env.id === selectedEnvironmentId)
        ?.name || "Filtro"
    );
  }, [selectedEnvironmentId, environmentsWithServices]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const servicesWithDistance = useMemo(() => {
    return activeServices
      .filter((s) => {
        const matchesCategory =
          selectedCategory === "all" || s.category === selectedCategory;
        const matchesEnvironment =
          selectedEnvironmentId === "all" ||
          s.environmentId === selectedEnvironmentId;
        return matchesCategory && matchesEnvironment;
      })
      .map((s) => {
        if (userLocation) {
          const serviceLat = s.environmentLatitude;
          const serviceLng = s.environmentLongitude;
          if (serviceLat && serviceLng) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              serviceLat,
              serviceLng,
            );
            return { ...s, distance };
          }
        }
        return { ...s, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [activeServices, userLocation, selectedCategory, selectedEnvironmentId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(
            "User location obtained:",
            position.coords.latitude,
            position.coords.longitude,
          );
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.log("Geolocation error:", err.code, err.message);
        },
      );
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const userAvatar = mounted ? user?.avatar : null;

  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        () => {
          setLocationLoading(false);
        },
      );
    } else {
      setLocationLoading(false);
    }
  };

  const environmentsWithSlug = selectedEnvironments.map((env) => ({
    ...env,
    slug:
      env.slug ||
      env.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
  }));

  const categories = [
    { id: "all", label: "Tudo", icon: "apps" },
    ...SERVICE_CATEGORIES,
  ];

  return (
    <div className={`min-h-screen ${user ? "pb-32" : "pb-10"} bg-background`}>
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <section className="mb-10 mt-6 text-center md:text-left">
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">
            Perto de você
          </h2>
          <p className="text-on-surface-variant text-base mt-1 font-medium">
            Serviços confiáveis de ambientes próximos
          </p>
        </section>

        {/* sessão do mapa */}

        {/* <section 
          className="relative h-56 w-full rounded-3xl overflow-hidden shadow-inner"
        >
          {userLocation ? (
            <MapComponent 
              center={userLocation}
              markers={services
                .filter(s => s.latitude && s.longitude)
                .map(s => ({
                  position: { lat: s.latitude!, lng: s.longitude! },
                  title: s.title
                }))}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary-container/20 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg"></div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleGetLocation}
            disabled={locationLoading}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-4 py-2 rounded-full shadow-lg text-sm font-medium text-primary flex items-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <Icon icon="my_location" size={18} />
            {locationLoading ? 'Obtendo...' : 'Usar minha localização'}
          </button>
        </section> */}

        <section className="space-y-6">
          <div className="flex items-center gap-2">
            {/* INPUT */}
            <div className="flex-1 min-w-0">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Encontre um serviço..."
              />
            </div>

            {/* DROPDOWN CUSTOMIZADO */}
            <div
              ref={filterDropdownRef}
              className="relative flex-shrink-0"
            >
              <button
                type="button"
                onClick={() =>
                  environmentsWithServices.length > 0 &&
                  setIsFilterOpen((prev) => !prev)
                }
                disabled={environmentsWithServices.length === 0}
                className="bg-surface-container-highest rounded-[2.5rem] pl-3 pr-8 py-2.5 text-xs font-bold text-on-surface cursor-pointer shadow-md border border-outline-variant/10 focus:outline-none focus:ring-2 focus:ring-primary/20 h-[44px] max-w-[118px] sm:max-w-[180px] flex items-center truncate disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="truncate">{selectedEnvironmentName}</span>
              </button>

              <Icon
                icon="expand_more"
                size={16}
                className={`absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none transition-transform ${
                  isFilterOpen ? "rotate-180" : ""
                }`}
              />

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] rounded-2xl bg-surface-container-lowest shadow-2xl border border-outline-variant/10 z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEnvironmentId("all");
                      setIsFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      selectedEnvironmentId === "all"
                        ? "bg-primary/5 text-primary font-bold"
                        : "hover:bg-surface-container-highest text-on-surface"
                    }`}
                  >
                    Filtro
                  </button>

                  <div className="max-h-72 overflow-y-auto">
                    {environmentsWithServices.map((env) => (
                      <button
                        key={env.id}
                        type="button"
                        onClick={() => {
                          setSelectedEnvironmentId(env.id);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          selectedEnvironmentId === env.id
                            ? "bg-primary/5 text-primary font-bold"
                            : "hover:bg-surface-container-highest text-on-surface"
                        }`}
                      >
                        {env.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 no-scrollbar scroll-smooth">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setSelectedCategory(cat.id === "all" ? "all" : cat.label)
                }
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl whitespace-nowrap font-black text-xs transition-all border shrink-0 shadow-sm ${
                  (cat.id === "all" && selectedCategory === "all") ||
                  selectedCategory === cat.label
                    ? "bg-[#30cc36] text-white border-[#30cc36] shadow-lg shadow-[#30cc36]/20 scale-105"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-[#30cc36]/40 hover:text-[#30cc36] active:scale-95"
                }`}
              >
                <Icon
                  icon={cat.icon}
                  size={16}
                  weight={
                    (cat.id === "all" && selectedCategory === "all") ||
                    selectedCategory === cat.label
                      ? 700
                      : 400
                  }
                />
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {!search ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-black text-on-surface tracking-tight">
                Serviços próximos
              </h3>
              <button
                onClick={() => router.push("/places")}
                className="text-xs font-bold text-primary uppercase tracking-wider hover:opacity-70"
              >
                Ver Ambientes →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesWithDistance.slice(0, 6).map((service) => (
                <div
                  key={service.id}
                  onClick={() => router.push(`/service/${service.slug}`)}
                  className="bg-surface-container-lowest p-4 rounded-[2rem] flex gap-4 items-center cursor-pointer hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                    {service.image ? (
                      <img
                        className="w-full h-full object-cover"
                        src={service.image}
                        alt={service.title}
                      loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <Icon
                          icon="image"
                          size={24}
                          className="text-primary/20"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className="text-[10px] font-black text-[#30cc36] uppercase tracking-widest bg-[#30cc36]/5 px-2 py-0.5 rounded-full">
                          {service.category}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            hasCnpj(service.cnpj)
                              ? 'text-emerald-700 bg-emerald-500/10'
                              : 'text-slate-600 bg-slate-500/10'
                          }`}
                        >
                          {hasCnpj(service.cnpj) ? 'PROFISSIONAL' : 'AUTÔNOMO'}
                        </span>
                      </div>
                      <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-[#30cc36] transition-colors">
                        {service.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {(userLocation || service.environmentName) && (
                        <div className="flex items-center gap-2">
                          {userLocation && service.distance !== Infinity && (
                            <div className="flex items-center gap-1 text-primary">
                              <Icon icon="location_on" size={12} weight={700} />
                              <span className="text-[10px] text-[#30cc36] font-bold">
                                {service.distance < 1
                                  ? `${Math.round(service.distance * 1000)}m`
                                  : `${service.distance.toFixed(1)}km`}
                              </span>
                            </div>
                          )}
                          {service.environmentName && (
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {service.environmentName}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-[#30cc36] group-hover/card:text-white transition-all duration-300">
                        <Icon icon="arrow_forward" size={14} weight={700} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {servicesWithDistance.length === 0 && (
                <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                  Nenhum serviço encontrado próximo a você
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <h3 className="text-xl font-black text-on-surface tracking-tight px-1">
              Resultados da busca
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesWithDistance
                .filter((service) => {
                  const searchLower = search.toLowerCase().trim();
                  const serviceCategory = toSafeLower(service.category);
                  const serviceTitle = toSafeLower(service.title);
                  const serviceDescription = toSafeLower(service.description);
                  return (
                    serviceCategory.includes(searchLower) ||
                    serviceTitle.includes(searchLower) ||
                    serviceDescription.includes(searchLower)
                  );
                })
                .map((service) => (
                  <div
                    key={service.id}
                    onClick={() => router.push(`/service/${service.slug}`)}
                    className="bg-surface-container-lowest p-4 rounded-[2rem] flex gap-4 items-center cursor-pointer hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                      {service.image ? (
                        <img
                          className="w-full h-full object-cover"
                          src={service.image}
                          alt={service.title}
                        loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                          <Icon
                            icon="image"
                            size={24}
                            className="text-primary/20"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                      <div>
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                            {service.category || "Sem categoria"}
                          </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            hasCnpj(service.cnpj)
                              ? 'text-emerald-700 bg-emerald-500/10'
                              : 'text-slate-600 bg-slate-500/10'
                          }`}
                        >
                          {hasCnpj(service.cnpj) ? 'PROFISSIONAL' : 'AUTÔNOMO'}
                        </span>
                        </div>
                        <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-primary transition-colors">
                          {service.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">
                          {service.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {(userLocation || service.environmentName) && (
                          <div className="flex items-center gap-2">
                            {userLocation && service.distance !== Infinity && (
                              <div className="flex items-center gap-1 text-primary">
                                <Icon
                                  icon="location_on"
                                  size={12}
                                  weight={700}
                                />
                                <span className="text-[10px] font-bold">
                                  {service.distance < 1
                                    ? `${Math.round(service.distance * 1000)}m`
                                    : `${service.distance.toFixed(1)}km`}
                                </span>
                              </div>
                            )}
                            {service.environmentName && (
                              <span className="text-[10px] text-on-surface-variant font-medium">
                                {service.environmentName}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all duration-300">
                          <Icon icon="arrow_forward" size={14} weight={700} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {servicesWithDistance.filter((service) => {
                const searchLower = search.toLowerCase().trim();
                const serviceCategory = toSafeLower(service.category);
                const serviceTitle = toSafeLower(service.title);
                const serviceDescription = toSafeLower(service.description);
                return (
                  serviceCategory.includes(searchLower) ||
                  serviceTitle.includes(searchLower) ||
                  serviceDescription.includes(searchLower)
                );
              }).length === 0 && (
                <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                  Nenhum serviço encontrado para "{search}"
                </div>
              )}
            </div>
          </section>
        )}

        {/* {!selectedEnvironment && (
          <section className="bg-primary/5 p-6 rounded-3xl text-center space-y-3 border border-primary/10">
            <div className="w-16 h-16 rounded-full bg-primary-container mx-auto flex items-center justify-center">
              <Icon icon="touch_app" size={32} className="text-primary" />
            </div>
            <h3 className="font-bold text-on-surface">Selecione um ambiente</h3>
            <p className="text-sm text-on-surface-variant">
              Escolha um ambiente acima para ver os serviços disponíveis perto
              de você
            </p>
            <button
              onClick={() => router.push("/places")}
              className="mt-2 px-6 py-3 rounded-full primary-gradient text-white font-bold shadow-lg shadow-primary/20"
            >
              Ver ambientes
            </button>
          </section>
        )} */}
      </main>
    </div>
  );
}
