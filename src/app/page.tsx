"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { useApp } from "@/hooks/useApp";
import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { MapComponent } from "@/components/GoogleMap";
import { TopAppBar } from "@/components/TopAppBar";
import { hasCnpj } from "@/lib/cnpj";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { SearchField } from "@/components/SearchField";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 9;

type MembershipAccessType = "resident" | "service_provider" | null;
type StoryMediaType = "image" | "video";

type StoryDbRow = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: StoryMediaType;
  author_name?: string | null;
  author_avatar?: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
};

type StoryItem = {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  mediaUrl: string;
  mediaType: StoryMediaType;
  createdAt: string;
};

type StoryGroup = {
  userId: string;
  name: string;
  avatar: string | null;
  items: StoryItem[];
};

type SelectedStoryMedia = {
  id: string;
  file: File;
  previewUrl: string;
  kind: StoryMediaType;
};

type ProviderGroup = {
  key: string;
  providerId: string | null;
  providerName: string;
  services: Array<any>;
  totalServices: number;
  totalEnvironments: number;
  primaryService: any;
};

function getAccessTypeBadge(
  accessType?: "resident" | "service_provider" | null,
) {
  if (accessType === "resident") {
    return {
      label: "MORADOR",
      className: "bg-orange-500/20 text-orange-700 border-orange-500/20",
    };
  }

  if (accessType === "service_provider") {
    return {
      label: "PRESTADOR",
      className: "bg-sky-500/10 text-sky-700 border-sky-500/20",
    };
  }

  return null;
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="px-4 py-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-highest"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest text-sm font-bold text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-highest"
        >
          Próximo
        </button>
      </div>

      <p className="text-sm font-medium text-center text-on-surface-variant">
        Página {currentPage} de {totalPages}
      </p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const {
    user,
    selectedEnvironment,
    selectedEnvironments,
    services,
    servicesLoading,
    membershipVersion,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [selectedStoryFiles, setSelectedStoryFiles] = useState<File[]>([]);
  const [storyItems, setStoryItems] = useState<StoryItem[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState("");
  const [storyPublishError, setStoryPublishError] = useState("");
  const [isPublishingStory, setIsPublishingStory] = useState(false);
  const [storiesRefreshKey, setStoriesRefreshKey] = useState(0);
  const [isProviderServicesOpen, setIsProviderServicesOpen] = useState(false);
  const [activeProviderGroupKey, setActiveProviderGroupKey] = useState<
    string | null
  >(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [activeStoryViewerUserId, setActiveStoryViewerUserId] = useState<
    string | null
  >(null);
  const [activeStoryViewerIndex, setActiveStoryViewerIndex] = useState(0);
  const [isDeletingStory, setIsDeletingStory] = useState(false);
  const [storyDeleteError, setStoryDeleteError] = useState("");
  const [membershipAccessByEnvironmentId, setMembershipAccessByEnvironmentId] =
    useState<Record<string, MembershipAccessType>>({});
  const [membershipAccessLoaded, setMembershipAccessLoaded] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const storyViewerVideoRef = useRef<HTMLVideoElement | null>(null);

  const toSafeLower = (value: unknown) =>
    typeof value === "string" ? value.toLowerCase() : "";

  const activeServices = useMemo(() => {
    return services.filter((s) => s.isActive && s.status === "active");
  }, [services]);

  const normalizeAvatar = (value: unknown) => {
    if (typeof value !== "string") return null;
    const cleaned = value.trim();
    if (!cleaned || cleaned === "null" || cleaned === "undefined") return null;
    return cleaned;
  };

  const isMissingColumnError = (error: any, column: string) => {
    const message = String(error?.message || "").toLowerCase();
    const col = column.toLowerCase();
    return (
      error?.code === "42703" ||
      (message.includes(col) && message.includes("column"))
    );
  };

  const getStoryMediaType = (value: string): StoryMediaType => {
    return value.startsWith("video/") ? "video" : "image";
  };

  const selectedStoryMedia = useMemo<SelectedStoryMedia[]>(() => {
    return selectedStoryFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      kind: getStoryMediaType(file.type),
    }));
  }, [selectedStoryFiles]);

  const storyGroups = useMemo<StoryGroup[]>(() => {
    const grouped = new Map<string, StoryGroup>();

    storyItems.forEach((item) => {
      const existing = grouped.get(item.userId);
      if (!existing) {
        grouped.set(item.userId, {
          userId: item.userId,
          name: item.name,
          avatar: item.avatar,
          items: [item],
        });
        return;
      }

      existing.items.push(item);
    });

    const groups = Array.from(grouped.values());
    if (!user?.id) return groups;

    return groups.map((group) => {
      if (group.userId !== user.id) return group;
      return {
        ...group,
        name: user.name || group.name,
        avatar: normalizeAvatar(user.avatar) ?? group.avatar,
      };
    });
  }, [storyItems, user?.avatar, user?.id, user?.name]);

  const ownStoryGroup = useMemo(() => {
    if (!user?.id) return null;
    return storyGroups.find((group) => group.userId === user.id) || null;
  }, [storyGroups, user?.id]);

  const otherStoryGroups = useMemo(() => {
    if (!user?.id) return storyGroups;
    return storyGroups.filter((group) => group.userId !== user.id);
  }, [storyGroups, user?.id]);

  const activeStoryViewerGroup = useMemo(() => {
    if (!activeStoryViewerUserId) return null;
    return (
      storyGroups.find((group) => group.userId === activeStoryViewerUserId) ||
      null
    );
  }, [activeStoryViewerUserId, storyGroups]);

  const activeStoryViewerItem = useMemo(() => {
    if (!activeStoryViewerGroup) return null;
    return activeStoryViewerGroup.items[activeStoryViewerIndex] || null;
  }, [activeStoryViewerGroup, activeStoryViewerIndex]);

  useEffect(() => {
    if (!isStoryViewerOpen) return;

    if (!activeStoryViewerGroup || activeStoryViewerGroup.items.length === 0) {
      setIsStoryViewerOpen(false);
      setActiveStoryViewerUserId(null);
      setActiveStoryViewerIndex(0);
      return;
    }

    if (activeStoryViewerIndex >= activeStoryViewerGroup.items.length) {
      setActiveStoryViewerIndex(0);
    }
  }, [activeStoryViewerGroup, activeStoryViewerIndex, isStoryViewerOpen]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    activeServices.forEach((s) => {
      if (s.category) {
        cats.add(s.category);
      }
    });
    return Array.from(cats).sort();
  }, [activeServices]);

  const membershipEnvironmentIds = useMemo(() => {
    return Array.from(
      new Set(
        activeServices
          .map((service) => service.environmentId)
          .filter(
            (envId): envId is string =>
              typeof envId === "string" && envId.length > 0,
          ),
      ),
    ).sort();
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

  useEffect(() => {
    let cancelled = false;

    const loadMembershipAccessTypes = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setMembershipAccessByEnvironmentId({});
          setMembershipAccessLoaded(true);
        }
        return;
      }

      if (membershipEnvironmentIds.length === 0) {
        if (!cancelled) {
          setMembershipAccessLoaded(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from("environment_members")
        .select("environment_id, access_type, status")
        .eq("user_id", user.id)
        .in("environment_id", membershipEnvironmentIds)
        .neq("status", "banned");

      if (cancelled) return;

      if (error) {
        console.warn("loadMembershipAccessTypes failed:", error);
        setMembershipAccessLoaded(true);
        return;
      }

      const nextMap: Record<string, MembershipAccessType> = {};
      (data || []).forEach((row: any) => {
        if (
          row?.access_type === "resident" ||
          row?.access_type === "service_provider"
        ) {
          if (
            typeof row.environment_id === "string" &&
            row.environment_id.length > 0
          ) {
            nextMap[row.environment_id] = row.access_type;
          }
        }
      });

      setMembershipAccessByEnvironmentId(nextMap);
      setMembershipAccessLoaded(true);
    };

    void loadMembershipAccessTypes();

    return () => {
      cancelled = true;
    };
  }, [membershipEnvironmentIds, membershipVersion, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadStories = async () => {
      setStoriesLoading(true);
      setStoriesError("");

      const nowIso = new Date().toISOString();
      let storiesData: StoryDbRow[] | null = null;
      let storiesErrorResult: any = null;

      {
        const { data, error } = await supabase
          .from("stories")
          .select(
            "id, user_id, media_url, media_type, author_name, author_avatar, created_at, expires_at, is_active",
          )
          .eq("is_active", true)
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false })
          .limit(80);
        storiesData = Array.isArray(data) ? (data as StoryDbRow[]) : null;
        storiesErrorResult = error;
      }

      if (
        storiesErrorResult &&
        isMissingColumnError(storiesErrorResult, "author_name")
      ) {
        const { data, error } = await supabase
          .from("stories")
          .select(
            "id, user_id, media_url, media_type, created_at, expires_at, is_active",
          )
          .eq("is_active", true)
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false })
          .limit(80);
        storiesData = Array.isArray(data) ? (data as StoryDbRow[]) : null;
        storiesErrorResult = error;
      }

      if (cancelled) return;

      if (storiesErrorResult) {
        console.warn("loadStories failed:", storiesErrorResult);
        setStoriesError("Nao foi possivel carregar os stories agora.");
        setStoryItems([]);
        setStoriesLoading(false);
        return;
      }

      const rows = Array.isArray(storiesData) ? storiesData : [];

      const normalizedStories: StoryItem[] = rows
        .filter(
          (row) => typeof row.user_id === "string" && row.user_id.length > 0,
        )
        .map((row) => {
          const storyAuthorName =
            typeof row.author_name === "string" &&
            row.author_name.trim().length > 0
              ? row.author_name.trim()
              : "Usuario";

          return {
            id: row.id,
            userId: row.user_id,
            name: storyAuthorName,
            avatar: normalizeAvatar(row.author_avatar),
            mediaUrl: row.media_url,
            mediaType: row.media_type === "video" ? "video" : "image",
            createdAt: row.created_at,
          };
        });

      if (cancelled) return;
      setStoryItems(normalizedStories);
      setStoriesLoading(false);
    };

    void loadStories();

    return () => {
      cancelled = true;
    };
  }, [storiesRefreshKey, user?.id]);

  useEffect(() => {
    return () => {
      selectedStoryMedia.forEach((media) => {
        URL.revokeObjectURL(media.previewUrl);
      });
    };
  }, [selectedStoryMedia]);

  useEffect(() => {
    if (!isStoryComposerOpen && !isProviderServicesOpen && !isStoryViewerOpen)
      return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isStoryComposerOpen && !isPublishingStory) {
        setIsStoryComposerOpen(false);
        return;
      }

      if (isProviderServicesOpen) {
        handleCloseProviderServices();
        return;
      }

      if (isStoryViewerOpen) {
        setIsStoryViewerOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [
    isProviderServicesOpen,
    isPublishingStory,
    isStoryComposerOpen,
    isStoryViewerOpen,
  ]);

  useEffect(() => {
    if (!isStoryComposerOpen && !isProviderServicesOpen && !isStoryViewerOpen)
      return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isProviderServicesOpen, isStoryComposerOpen, isStoryViewerOpen]);

  useEffect(() => {
    if (!isStoryViewerOpen) return;
    if (activeStoryViewerItem?.mediaType !== "video") return;

    const video = storyViewerVideoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }, [
    activeStoryViewerItem?.id,
    activeStoryViewerItem?.mediaType,
    isStoryViewerOpen,
  ]);

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

  const filteredServices = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    if (!searchLower) {
      return servicesWithDistance;
    }

    return servicesWithDistance.filter((service) => {
      const serviceCategory = toSafeLower(service.category);
      const serviceTitle = toSafeLower(service.title);
      const serviceDescription = toSafeLower(service.description);

      return (
        serviceCategory.includes(searchLower) ||
        serviceTitle.includes(searchLower) ||
        serviceDescription.includes(searchLower)
      );
    });
  }, [search, servicesWithDistance]);

  const providerGroups = useMemo<ProviderGroup[]>(() => {
    const grouped = new Map<
      string,
      { providerId: string | null; providerName: string; services: Array<any> }
    >();

    filteredServices.forEach((service) => {
      const providerId =
        typeof service.provider_id === "string" &&
        service.provider_id.trim().length > 0
          ? service.provider_id.trim()
          : null;
      const providerName = (service.provider || "Usuario").trim() || "Usuario";
      const groupKey = providerId
        ? `uid:${providerId}`
        : `name:${providerName.toLowerCase()}`;
      const current = grouped.get(groupKey);

      if (!current) {
        grouped.set(groupKey, {
          providerId,
          providerName,
          services: [service],
        });
        return;
      }

      current.services.push(service);
    });

    return Array.from(grouped.entries()).map(([key, group]) => {
      const uniqueEnvironments = new Set(
        group.services
          .map((service) => service.environmentId)
          .filter(
            (envId): envId is string =>
              typeof envId === "string" && envId.length > 0,
          ),
      );
      return {
        key,
        providerId: group.providerId,
        providerName: group.providerName,
        services: group.services,
        totalServices: group.services.length,
        totalEnvironments: uniqueEnvironments.size,
        primaryService: group.services[0],
      };
    });
  }, [filteredServices]);

  const displayedServices = useMemo(() => {
    return providerGroups.map((group) => ({
      ...group.primaryService,
      groupKey: group.key,
      groupProviderName: group.providerName,
      groupTotalServices: group.totalServices,
      groupTotalEnvironments: group.totalEnvironments,
    }));
  }, [providerGroups]);

  const totalPages = Math.max(
    1,
    Math.ceil(displayedServices.length / PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedServices = displayedServices.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedEnvironmentId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    let shouldPrefetch = true;

    if (typeof window !== "undefined") {
      const connection = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      const saveData = Boolean(connection?.saveData);
      const effectiveType = String(connection?.effectiveType || "");
      const isSlowConnection =
        effectiveType.includes("2g") || effectiveType === "3g";
      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
      shouldPrefetch = !(saveData || isSlowConnection || isMobileViewport);
    }

    if (!shouldPrefetch) return;

    paginatedServices.forEach((service) => {
      if (service.slug) {
        void router.prefetch(`/service/${service.slug}`);
      }
    });
  }, [paginatedServices, router]);

  useEffect(() => {
    let cancelled = false;

    const requestLocationOnEntry = () => {
      if (!("geolocation" in navigator)) return;

      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        () => {
          if (cancelled) return;
          setLocationLoading(false);
        },
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
      );
    };

    requestLocationOnEntry();

    return () => {
      cancelled = true;
    };
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

  const getFileExtension = (file: File) => {
    const fromName = file.name?.split(".").pop()?.toLowerCase();
    if (fromName && fromName.length <= 8) {
      return fromName.replace(/[^a-z0-9]/g, "") || "bin";
    }

    const fromMime = file.type.split("/")[1]?.toLowerCase().split(";")[0];
    if (fromMime && fromMime.length <= 12) {
      return fromMime.replace(/[^a-z0-9]/g, "") || "bin";
    }

    return "bin";
  };

  const resolveStoryUploadEndpoint = () => {
    let edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    if (!edgeFunctionUrl) {
      throw new Error("Configuracao de upload nao encontrada.");
    }

    if (!edgeFunctionUrl.includes("r2-signed-upload")) {
      edgeFunctionUrl = edgeFunctionUrl.endsWith("/")
        ? `${edgeFunctionUrl}r2-signed-upload`
        : `${edgeFunctionUrl}/r2-signed-upload`;
    }

    return edgeFunctionUrl;
  };

  const uploadStoryFileToR2 = async (file: File) => {
    if (!user?.id) {
      throw new Error("Voce precisa estar logado para publicar stories.");
    }

    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const edgeFunctionUrl = resolveStoryUploadEndpoint();

    if (!r2PublicUrl || !supabaseAnonKey) {
      throw new Error("Configuracao de storage incompleta.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    const extension = getFileExtension(file);
    const randomPart = Math.random().toString(36).slice(2, 8);
    const filePath = `tenants/${user.id}/stories/${Date.now()}-${randomPart}.${extension}`;
    const contentType = file.type || "application/octet-stream";

    const signResponse = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        path: filePath,
        contentType,
      }),
    });

    if (!signResponse.ok) {
      const payload = await signResponse.json().catch(() => null);
      throw new Error(
        payload?.error || "Nao foi possivel gerar URL de upload.",
      );
    }

    const { uploadUrl } = await signResponse.json();
    if (!uploadUrl || typeof uploadUrl !== "string") {
      throw new Error("URL de upload invalida.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha no envio da midia para o Cloudflare R2.");
    }

    const normalizedPublicUrl = r2PublicUrl.replace(/\/+$/, "");
    return `${normalizedPublicUrl}/${filePath}`;
  };

  const handleStoryFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const nextFiles = [...selectedStoryFiles, ...files];
      if (nextFiles.length > 10) {
        setStoryPublishError(
          "Voce pode selecionar no maximo 10 midias por envio.",
        );
      } else {
        setStoryPublishError("");
      }
      setSelectedStoryFiles(nextFiles.slice(0, 10));
    }
    event.target.value = "";
  };

  const handleOpenStoryComposer = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setStoryPublishError("");
    setIsStoryComposerOpen(true);
  };

  const handleCloseStoryComposer = () => {
    if (isPublishingStory) return;
    setIsStoryComposerOpen(false);
    setStoryPublishError("");
    setSelectedStoryFiles([]);
  };

  const handleOpenCamera = () => {
    cameraInputRef.current?.click();
  };

  const handleOpenGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleOpenStoryViewer = (storyGroup: StoryGroup, storyIndex = 0) => {
    if (!storyGroup.items.length) return;
    const safeIndex = Math.min(
      Math.max(storyIndex, 0),
      storyGroup.items.length - 1,
    );
    setActiveStoryViewerUserId(storyGroup.userId);
    setActiveStoryViewerIndex(safeIndex);
    setStoryDeleteError("");
    setIsStoryViewerOpen(true);
  };

  const handleCloseStoryViewer = () => {
    setIsStoryViewerOpen(false);
    setActiveStoryViewerUserId(null);
    setActiveStoryViewerIndex(0);
    setStoryDeleteError("");
  };

  const handleStoryViewerPrevious = () => {
    if (!activeStoryViewerGroup) return;
    setActiveStoryViewerIndex((prev) =>
      prev > 0 ? prev - 1 : activeStoryViewerGroup.items.length - 1,
    );
  };

  const handleStoryViewerNext = () => {
    if (!activeStoryViewerGroup) return;
    setActiveStoryViewerIndex((prev) =>
      prev < activeStoryViewerGroup.items.length - 1 ? prev + 1 : 0,
    );
  };

  const handleStoryViewerAutoAdvance = () => {
    if (!activeStoryViewerGroup) return;

    if (activeStoryViewerIndex < activeStoryViewerGroup.items.length - 1) {
      setActiveStoryViewerIndex((prev) => prev + 1);
      return;
    }

    handleCloseStoryViewer();
  };

  const handleDeleteCurrentStory = async () => {
    if (!user?.id || !activeStoryViewerItem) return;
    if (activeStoryViewerItem.userId !== user.id) return;

    const confirmed = window.confirm("Remover este story agora?");
    if (!confirmed) return;

    setIsDeletingStory(true);
    setStoryDeleteError("");

    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", activeStoryViewerItem.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setStoriesRefreshKey((prev) => prev + 1);
      handleCloseStoryViewer();
    } catch (err: any) {
      console.warn("handleDeleteCurrentStory failed:", err);
      setStoryDeleteError(err?.message || "Nao foi possivel remover o story.");
    } finally {
      setIsDeletingStory(false);
    }
  };

  const activeProviderGroup = useMemo(() => {
    if (!activeProviderGroupKey) return null;
    return (
      providerGroups.find((group) => group.key === activeProviderGroupKey) ||
      null
    );
  }, [activeProviderGroupKey, providerGroups]);

  const handleOpenProviderServices = (groupKey: string) => {
    setActiveProviderGroupKey(groupKey);
    setIsProviderServicesOpen(true);
  };

  const handleCloseProviderServices = () => {
    setIsProviderServicesOpen(false);
    setActiveProviderGroupKey(null);
  };

  const handleRemoveSelectedStoryMedia = (mediaId: string) => {
    setSelectedStoryFiles((prev) =>
      prev.filter(
        (file, index) =>
          `${file.name}-${file.lastModified}-${index}` !== mediaId,
      ),
    );
  };

  const handlePublishStories = async () => {
    if (!user?.id) {
      router.push("/login");
      return;
    }

    if (selectedStoryFiles.length === 0) {
      setStoryPublishError("Selecione pelo menos uma foto ou video.");
      return;
    }

    setIsPublishingStory(true);
    setStoryPublishError("");

    try {
      const payload: Array<{
        user_id: string;
        media_url: string;
        media_type: StoryMediaType;
        author_name: string;
        author_avatar: string | null;
      }> = [];

      const authorName = (user.name || "").trim() || "Usuario";
      const authorAvatar = normalizeAvatar(user.avatar);

      for (const file of selectedStoryFiles) {
        const mediaUrl = await uploadStoryFileToR2(file);
        payload.push({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: getStoryMediaType(file.type),
          author_name: authorName,
          author_avatar: authorAvatar,
        });
      }

      const { error } = await supabase.from("stories").insert(payload);

      if (error) {
        throw error;
      }

      setSelectedStoryFiles([]);
      setIsStoryComposerOpen(false);
      setStoriesRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      console.warn("handlePublishStories failed:", err);
      setStoryPublishError(
        err?.message || "Nao foi possivel publicar seu story.",
      );
    } finally {
      setIsPublishingStory(false);
    }
  };

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
  const showInitialLoading = servicesLoading && services.length === 0;

  return (
    <div className={`min-h-screen ${user ? "pb-32" : "pb-10"} bg-background`}>
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-32">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-on-surface-variant"></h2>
            {/* {user && (
              <button
                type="button"
                onClick={handleOpenStoryComposer}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#30cc36]/10 text-[#30cc36] hover:bg-[#30cc36]/20 transition-colors"
              >
                Adicionar
              </button>
            )} */}
          </div>

          {storiesError && (
            <p className="px-1 text-xs text-red-600">{storiesError}</p>
          )}

          <div className="flex overflow-x-auto px-1 pb-2 gap-4 no-scrollbar">
            {user && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (ownStoryGroup) {
                    handleOpenStoryViewer(ownStoryGroup, 0);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (ownStoryGroup) {
                      handleOpenStoryViewer(ownStoryGroup, 0);
                    }
                  }
                }}
                className="w-[78px] shrink-0 flex flex-col items-center gap-2"
                aria-label={
                  ownStoryGroup ? "Visualizar seu story" : "Seu story"
                }
              >
                <div className="relative">
                  <div
                    className={`rounded-full p-[2px] ${
                      ownStoryGroup
                        ? "bg-[conic-gradient(at_top,_#f58529,_#dd2a7b,_#8134af,_#515bd4,_#f58529)]"
                        : "bg-surface-container-high"
                    }`}
                  >
                    <div className="rounded-full bg-background p-[2px]">
                      <Avatar
                        src={userAvatar || undefined}
                        name={user.name}
                        alt="Seu avatar"
                        className="w-16 h-16"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenStoryComposer();
                    }}
                    className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-[#30cc36] text-white border-2 border-background flex items-center justify-center shadow-md"
                    aria-label="Adicionar story"
                  >
                    <Icon icon="add" size={15} weight={700} />
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-on-surface truncate max-w-full">
                  Seu story
                </span>
              </div>
            )}

            {otherStoryGroups.map((storyGroup) => (
              <button
                key={storyGroup.userId}
                type="button"
                onClick={() => handleOpenStoryViewer(storyGroup, 0)}
                className="w-[78px] shrink-0 flex flex-col items-center gap-2"
                aria-label={`Story de ${storyGroup.name}`}
              >
                <div className="rounded-full p-[2px] bg-[conic-gradient(at_top,_#f58529,_#dd2a7b,_#8134af,_#515bd4,_#f58529)]">
                  <div className="rounded-full bg-background p-[2px]">
                    <Avatar
                      src={storyGroup.avatar || undefined}
                      name={storyGroup.name}
                      alt={storyGroup.name}
                      className="w-16 h-16"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-on-surface truncate max-w-full">
                  {storyGroup.name}
                </span>
              </button>
            ))}

            {!storiesLoading && !user && otherStoryGroups.length === 0 && (
              <div className="w-full py-4 px-4 rounded-2xltext-center text-xs text-on-surface-variant"></div>
            )}

            {storiesLoading && (
              <div className="w-full py-4 px-4 rounded-2xl text-center text-xs text-on-surface-variant"></div>
            )}
          </div>
        </section>

        {/* <section className="mb-1 mt-1 text-left md:text-left">
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">
            Anúncios
          </h2>
          <p className="text-on-surface-variant text-base mt-1 font-medium">
            Serviços confiáveis perto de você.
          </p>
        </section> */}

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
            <div ref={filterDropdownRef} className="relative flex-shrink-0">
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

        {showInitialLoading ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest shadow-sm"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <div className="h-44 w-full animate-pulse bg-surface-container-high" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-surface-container-high" />
                      <div className="h-3 w-16 animate-pulse rounded-full bg-surface-container-high" />
                    </div>
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-surface-container-high" />
                    <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-container-high" />
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-3 w-20 animate-pulse rounded-full bg-surface-container-high" />
                      <div className="h-7 w-7 animate-pulse rounded-full bg-surface-container-high" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <>
            {!search ? (
              <section className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {paginatedServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => router.push(`/service/${service.slug}`)}
                      className="bg-surface-container-lowest rounded-[2rem] flex flex-col cursor-pointer hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                    >
                      <div className="relative h-44 w-full overflow-hidden border-b border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                        {service.image ? (
                          <img
                            className="w-full h-full object-cover"
                            src={service.image}
                            alt={service.title}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                            <Icon
                              icon="image"
                              size={24}
                              className="text-primary/20"
                            />
                          </div>
                        )}
                        {service.image &&
                          service.publisherType === "resident" && (
                            <img
                              src="/pin.png"
                              alt="Morador"
                              className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 object-contain drop-shadow-md"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                      </div>
                      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 h-full">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-[#30cc36] uppercase tracking-widest bg-[#30cc36]/5 px-2 py-0.5 rounded-full">
                              {service.category}
                            </span>
                            <div className="ml-auto flex flex-col items-end gap-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  hasCnpj(service.cnpj)
                                    ? "text-white bg-[#30cc36] dark:text-black/80 dark:bg-[#30cc36]"
                                    : "text-white bg-orange-600 dark:text-white dark:bg-orange-700"
                                }`}
                              >
                                {hasCnpj(service.cnpj)
                                  ? "PROFISSIONAL"
                                  : "AUTÔNOMO"}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-[#30cc36] transition-colors">
                            {service.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-semibold mt-1 truncate">
                            {service.groupProviderName}
                          </p>
                        </div>

                        <div className="mt-1 space-y-2">
                          <div className="flex items-center justify-between">
                            {(userLocation || service.environmentName) && (
                              <div className="flex items-center gap-2">
                                {userLocation &&
                                  service.distance !== Infinity && (
                                    <div className="flex items-center gap-1 text-primary">
                                      <Icon
                                        icon="location_on"
                                        size={12}
                                        weight={700}
                                      />
                                      <span className="text-[10px] text-[#30cc36] font-bold">
                                        {service.distance < 1
                                          ? `${Math.round(service.distance * 1000)}m`
                                          : `${service.distance.toFixed(1)}km`}
                                      </span>
                                    </div>
                                  )}
                                {service.environmentName && (
                                  <span className="text-[9px] text-on-surface-variant font-medium">
                                    {service.environmentName}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-[#30cc36] group-hover/card:text-white transition-all duration-300">
                            <Icon icon="arrow_forward" size={14} weight={700} />
                          </div> */}
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (service.slug) {
                                router.push(`/service/${service.slug}`);
                              }
                            }}
                            className="w-full rounded-full uppercase border border-[#30cc36]/30 text-[#30cc36] text-xs font-black py-2 hover:bg-[#30cc36]/10 transition-colors"
                          >
                            Ver anúncio
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displayedServices.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                      Nenhum prestador encontrado proximo a voce
                    </div>
                  )}
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={displayedServices.length}
                  onPrevious={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  onNext={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                />
              </section>
            ) : (
              <section className="space-y-4">
                <h3 className="text-xl font-black text-on-surface tracking-tight px-1">
                  Resultados da busca
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {paginatedServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => router.push(`/service/${service.slug}`)}
                      className="bg-surface-container-lowest rounded-[2rem] flex flex-col cursor-pointer hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98] border border-outline-variant/10 group group/card relative overflow-hidden h-full"
                    >
                      <div className="relative h-44 w-full overflow-hidden border-b border-outline-variant/10 group-hover/card:scale-105 transition-transform duration-500">
                        {service.image ? (
                          <img
                            className="w-full h-full object-cover"
                            src={service.image}
                            alt={service.title}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                            <Icon
                              icon="image"
                              size={24}
                              className="text-primary/20"
                            />
                          </div>
                        )}
                        {service.image &&
                          service.publisherType === "resident" && (
                            <img
                              src="/pin.png"
                              alt="Morador"
                              className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 object-contain drop-shadow-md"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                      </div>
                      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 h-full">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                              {service.category || "Sem categoria"}
                            </span>
                            <div className="ml-auto flex flex-col items-end gap-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  hasCnpj(service.cnpj)
                                    ? "text-emerald-700 bg-emerald-500/10"
                                    : "text-slate-600 bg-slate-500/10"
                                }`}
                              >
                                {hasCnpj(service.cnpj)
                                  ? "PROFISSIONAL"
                                  : "AUTÔNOMO"}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-black text-on-surface text-[15px] leading-tight truncate group-hover/card:text-primary transition-colors">
                            {service.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-semibold mt-1 truncate">
                            {service.groupProviderName}
                          </p>
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">
                            {service.description}
                          </p>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            {(userLocation || service.environmentName) && (
                              <div className="flex items-center gap-2">
                                {userLocation &&
                                  service.distance !== Infinity && (
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
                                  <span className="text-[10px] text-on-surface-variant font-medium truncate">
                                    {service.environmentName}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-white transition-all duration-300">
                              <Icon
                                icon="arrow_forward"
                                size={14}
                                weight={700}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (service.slug) {
                                router.push(`/service/${service.slug}`);
                              }
                            }}
                            className="w-full rounded-full border border-primary/30 text-primary text-xs font-black py-2 hover:bg-primary/10 transition-colors"
                          >
                            Ver anuncio
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displayedServices.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/20 italic text-on-surface-variant/60">
                      Nenhum prestador encontrado para "{search}"
                    </div>
                  )}
                </div>
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  totalItems={displayedServices.length}
                  onPrevious={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  onNext={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                />
              </section>
            )}
          </>
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

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleStoryFilesSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleStoryFilesSelected}
      />

      {isStoryViewerOpen && activeStoryViewerGroup && activeStoryViewerItem && (
        <div className="fixed inset-0 z-[67] bg-black/85 backdrop-blur-sm md:flex md:items-center md:justify-center">
          <div className="w-full h-full bg-black text-white flex flex-col md:max-w-md md:h-[90vh] md:max-h-[840px] md:rounded-3xl md:border md:border-white/10 md:overflow-hidden">
            <div className="px-4 pt-4">
              <div className="flex items-center gap-1">
                {activeStoryViewerGroup.items.map((item, index) => (
                  <span
                    key={item.id}
                    className={`h-1 flex-1 rounded-full ${
                      index === activeStoryViewerIndex
                        ? "bg-white"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  src={activeStoryViewerGroup.avatar || undefined}
                  name={activeStoryViewerGroup.name}
                  alt={activeStoryViewerGroup.name}
                  className="w-9 h-9"
                />
                <p className="text-sm font-semibold truncate">
                  {activeStoryViewerGroup.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeStoryViewerItem.userId === user?.id && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentStory}
                    disabled={isDeletingStory}
                    className="h-9 px-3 rounded-full bg-red-500/25 text-red-100 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Remover story"
                  >
                    {isDeletingStory ? "Removendo..." : "Remover"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseStoryViewer}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                  aria-label="Fechar visualizacao de story"
                >
                  <Icon icon="close" size={20} />
                </button>
              </div>
            </div>

            {storyDeleteError && (
              <p className="px-4 pb-2 text-xs text-rose-300">
                {storyDeleteError}
              </p>
            )}

            <div className="relative flex-1 flex items-center justify-center px-2 pb-4">
              <button
                type="button"
                onClick={handleStoryViewerPrevious}
                className="absolute left-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="Story anterior"
              >
                <Icon icon="chevron_left" size={20} />
              </button>

              <div className="w-full h-full rounded-2xl overflow-hidden bg-black">
                {activeStoryViewerItem.mediaType === "video" ? (
                  <video
                    key={activeStoryViewerItem.id}
                    ref={storyViewerVideoRef}
                    src={activeStoryViewerItem.mediaUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    controls
                    playsInline
                    preload="metadata"
                    onEnded={handleStoryViewerAutoAdvance}
                  />
                ) : (
                  <img
                    src={activeStoryViewerItem.mediaUrl}
                    alt={`Story de ${activeStoryViewerGroup.name}`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleStoryViewerNext}
                className="absolute right-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="Proximo story"
              >
                <Icon icon="chevron_right" size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isProviderServicesOpen && activeProviderGroup && (
        <div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm md:flex md:items-center md:justify-center">
          <div className="w-full h-full bg-surface-container-lowest md:max-w-2xl md:h-[82vh] md:rounded-3xl md:overflow-hidden md:border md:border-outline-variant/20">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-base font-black text-on-surface">
                    {activeProviderGroup.providerName}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {activeProviderGroup.totalServices} anuncio
                    {activeProviderGroup.totalServices === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseProviderServices}
                  className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface"
                  aria-label="Fechar lista de anúncios"
                >
                  <Icon icon="close" size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeProviderGroup.services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      handleCloseProviderServices();
                      if (service.slug) {
                        router.push(`/service/${service.slug}`);
                      }
                    }}
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-highest/40 p-3 flex items-center gap-3 text-left hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon
                            icon="image"
                            size={18}
                            className="text-on-surface-variant"
                          />
                        </div>
                      )}
                      {service.image &&
                        service.publisherType === "resident" && (
                          <img
                            src="/pin.png"
                            alt="Morador"
                            className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 object-contain drop-shadow-md"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-wide text-[#30cc36]">
                        {service.category || "Sem categoria"}
                      </p>
                      <p className="text-sm font-bold text-on-surface truncate mt-0.5">
                        {service.title}
                      </p>
                      {service.environmentName && (
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {service.environmentName}
                        </p>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <Icon icon="arrow_forward" size={14} weight={700} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isStoryComposerOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm md:flex md:items-center md:justify-center">
          <div className="w-full h-full bg-black text-white flex flex-col md:max-w-md md:h-[92vh] md:max-h-[840px] md:rounded-3xl md:border md:border-white/10 md:overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              {/* <button
                type="button"
                onClick={handleCloseStoryComposer}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Fechar"
              >
                <Icon icon="close" size={20} />
              </button> */}
              <h3 className="font-semibold text-base">Adicionar ao story</h3>
              <button
                type="button"
                onClick={handleCloseStoryComposer}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Fechar"
              >
                <Icon icon="close" size={20} />
              </button>
              {/* <button
                type="button"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                aria-label="Configuracoes"
              >
                <Icon icon="settings" size={20} />
              </button> */}
            </div>

            <div className="px-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleOpenCamera}
                disabled={isPublishingStory}
                className="rounded-2xl bg-white/10 px-3 py-3 text-left hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-bold">Abrir camera</p>
                <p className="text-[11px] text-white/70 mt-1">
                  Tire uma foto ou grave agora
                </p>
              </button>
              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={isPublishingStory}
                className="rounded-2xl bg-white/10 px-3 py-3 text-left hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-bold">Fotos do aparelho</p>
                <p className="text-[11px] text-white/70 mt-1">
                  Escolha da sua galeria
                </p>
              </button>
            </div>

            <div className="mt-5 px-4">
              <p className="text-xs text-white/75">
                Selecione uma ou mais midias e toque em publicar.
              </p>
            </div>

            {storyPublishError && (
              <p className="mt-3 px-4 text-xs text-rose-400">
                {storyPublishError}
              </p>
            )}

            <div className="mt-3 flex-1 overflow-y-auto px-1 pb-4">
              {selectedStoryMedia.length === 0 ? (
                <div className="mx-3 h-full min-h-[180px] rounded-2xl border border-dashed border-white/25 bg-white/5 flex items-center justify-center px-5 text-center">
                  <p className="text-sm text-white/75">
                    Nenhuma midia selecionada ainda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {selectedStoryMedia.map((media) => (
                    <div
                      key={media.id}
                      className="relative aspect-[3/4] rounded-md overflow-hidden bg-black"
                    >
                      {media.kind === "video" ? (
                        <video
                          src={media.previewUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={media.previewUrl}
                          alt="Midia selecionada"
                          className="w-full h-full object-cover"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedStoryMedia(media.id)}
                        disabled={isPublishingStory}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-40"
                        aria-label="Remover midia"
                      >
                        <Icon icon="close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={handlePublishStories}
                disabled={isPublishingStory || selectedStoryMedia.length === 0}
                className="w-full rounded-full bg-[#30cc36] text-white font-black text-sm py-3 transition-all hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {isPublishingStory ? "Publicando..." : "Publicar nos stories"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
