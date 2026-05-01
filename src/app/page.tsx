"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { useApp } from "@/hooks/useApp";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { MapComponent } from "@/components/GoogleMap";
import { TopAppBar } from "@/components/TopAppBar";
import { hasCnpj } from "@/lib/cnpj";
import { SERVICE_CATEGORIES } from "@/lib/service-categories";
import { SearchField } from "@/components/SearchField";
import { supabase } from "@/lib/supabase";
import { trackServiceInteraction } from "@/lib/service-interactions";

const PAGE_SIZE = 16;
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
          className="rounded-full border border-white/20 bg-white/70 px-4 py-2 text-sm font-black text-zinc-700 shadow-sm backdrop-blur-xl transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="rounded-full border border-white/20 bg-white/70 px-4 py-2 text-sm font-black text-zinc-700 shadow-sm backdrop-blur-xl transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        >
          Próximo
        </button>
      </div>

      <p className="text-center text-sm font-bold text-zinc-400 dark:text-white/45">
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
    loading,
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
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
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

  const getLinkedEnvironments = useCallback((service: any) => {
    const linked = Array.isArray(service?.linkedEnvironments)
      ? service.linkedEnvironments.filter(
          (env: any) => typeof env?.id === "string" && env.id.length > 0,
        )
      : [];

    const fallbackEnvironmentId =
      typeof service?.environmentId === "string" &&
      service.environmentId.trim().length > 0
        ? service.environmentId.trim()
        : "";
    const fallbackEnvironmentName =
      typeof service?.environmentName === "string"
        ? service.environmentName.trim()
        : "";
    const fallbackEnvironmentSlug =
      typeof service?.environmentSlug === "string"
        ? service.environmentSlug.trim()
        : "";
    const fallbackEnvironmentAddress =
      typeof service?.environmentAddress === "string"
        ? service.environmentAddress.trim()
        : "";
    const fallbackEnvironmentType =
      typeof service?.environmentType === "string"
        ? service.environmentType.trim()
        : "";
    const fallbackEnvironmentImage =
      typeof service?.environmentImage === "string"
        ? service.environmentImage.trim()
        : "";

    const hasFallbackCoordinates =
      typeof service?.environmentLatitude === "number" &&
      typeof service?.environmentLongitude === "number";

    if (
      fallbackEnvironmentId ||
      fallbackEnvironmentName ||
      hasFallbackCoordinates
    ) {
      const hasSameEnvironment = linked.some((env: any) => {
        if (fallbackEnvironmentId) {
          return env.id === fallbackEnvironmentId;
        }

        if (!fallbackEnvironmentName) return false;
        return (
          typeof env?.name === "string" &&
          env.name.trim().toLowerCase() ===
            fallbackEnvironmentName.toLowerCase()
        );
      });

      if (!hasSameEnvironment) {
        linked.push({
          id: fallbackEnvironmentId || `published:${service?.id || "service"}`,
          slug:
            fallbackEnvironmentSlug ||
            fallbackEnvironmentName.toLowerCase().replace(/\s+/g, "-"),
          name: fallbackEnvironmentName || "Ambiente",
          type: fallbackEnvironmentType,
          latitude: service?.environmentLatitude,
          longitude: service?.environmentLongitude,
          address: fallbackEnvironmentAddress,
          image: fallbackEnvironmentImage,
        });
      }
    }

    return linked;
  }, []);

  const getLinkedEnvironmentIds = useCallback(
    (service: any) => {
      return getLinkedEnvironments(service).map((env: any) => env.id);
    },
    [getLinkedEnvironments],
  );

  const membershipEnvironmentIds = useMemo(() => {
    return Array.from(
      new Set(
        activeServices.flatMap((service) => getLinkedEnvironmentIds(service)),
      ),
    ).sort();
  }, [activeServices, getLinkedEnvironmentIds]);

  const environmentsWithServices = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    activeServices.forEach((service) => {
      getLinkedEnvironments(service).forEach((env: any) => {
        const envId = typeof env?.id === "string" ? env.id : "";
        if (!envId) return;
        const label =
          (typeof env?.name === "string" && env.name.trim().length > 0
            ? env.name.trim()
            : "") ||
          service.environmentName?.trim() ||
          "Ambiente";

        if (!map.has(envId)) {
          map.set(envId, {
            id: envId,
            name: label,
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [activeServices, getLinkedEnvironments]);

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
        const linkedEnvironmentIds = getLinkedEnvironmentIds(s);
        const matchesEnvironment =
          selectedEnvironmentId === "all" ||
          linkedEnvironmentIds.includes(selectedEnvironmentId);
        return matchesCategory && matchesEnvironment;
      })
      .map((s) => {
        const linkedEnvironments = getLinkedEnvironments(s);
        const defaultEnvironmentName =
          (typeof s.environmentName === "string"
            ? s.environmentName.trim()
            : "") ||
          (typeof linkedEnvironments[0]?.name === "string"
            ? linkedEnvironments[0].name
            : "");
        const defaultEnvironmentId =
          (typeof linkedEnvironments[0]?.id === "string" &&
          linkedEnvironments[0].id.trim().length > 0
            ? linkedEnvironments[0].id.trim()
            : "") ||
          (typeof s.environmentId === "string" &&
          s.environmentId.trim().length > 0
            ? s.environmentId.trim()
            : "");

        let distance = Infinity;
        let distanceEnvironmentName = defaultEnvironmentName;
        let distanceEnvironmentId = defaultEnvironmentId;

        if (userLocation) {
          type DistanceCandidate = {
            value: number;
            id: string;
            name: string;
          };

          const distanceCandidates = linkedEnvironments
            .map((env: any): DistanceCandidate | null => {
              if (
                typeof env?.latitude !== "number" ||
                typeof env?.longitude !== "number"
              ) {
                return null;
              }
              const envName =
                typeof env?.name === "string" && env.name.trim().length > 0
                  ? env.name.trim()
                  : defaultEnvironmentName;
              return {
                value: calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  env.latitude,
                  env.longitude,
                ),
                id: typeof env?.id === "string" ? env.id : "",
                name: envName,
              };
            })
            .filter(
              (
                candidate: DistanceCandidate | null,
              ): candidate is DistanceCandidate =>
                Boolean(
                  candidate &&
                  typeof candidate.value === "number" &&
                  typeof candidate.id === "string" &&
                  candidate.id.length > 0 &&
                  Number.isFinite(candidate.value),
                ),
            );

          if (distanceCandidates.length > 0) {
            const nearest = distanceCandidates.reduce(
              (closest: DistanceCandidate, current: DistanceCandidate) =>
                current.value < closest.value ? current : closest,
            );
            distance = nearest.value;
            distanceEnvironmentId = nearest.id || defaultEnvironmentId;
            distanceEnvironmentName = nearest.name || defaultEnvironmentName;
          }
        } else if (
          selectedEnvironmentId !== "all" &&
          linkedEnvironments.some(
            (env: any) => env?.id === selectedEnvironmentId,
          )
        ) {
          const selectedEnvironment = linkedEnvironments.find(
            (env: any) => env?.id === selectedEnvironmentId,
          );
          distanceEnvironmentId = selectedEnvironmentId;
          if (typeof selectedEnvironment?.name === "string") {
            distanceEnvironmentName = selectedEnvironment.name;
          }
        }

        return {
          ...s,
          distance,
          distanceEnvironmentName,
          distanceEnvironmentId,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [
    activeServices,
    getLinkedEnvironmentIds,
    getLinkedEnvironments,
    userLocation,
    selectedCategory,
    selectedEnvironmentId,
  ]);

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

  const getServiceProviderKey = useCallback((service: any) => {
    const normalize = (value: unknown) =>
      typeof value === "string" ? value.trim().toLowerCase() : "";
    const normalizePhone = (value: unknown) =>
      typeof value === "string" ? value.replace(/\D/g, "") : "";

    const providerId = normalize(service?.provider_id);
    const whatsapp = normalizePhone(service?.WhatsApp || service?.whatsapp);
    const instagram = normalize(service?.instagram).replace(/^@/, "");
    const website = normalize(service?.website || service?.website_url);
    const providerName = normalize(service?.provider);

    return (
      providerId ||
      (whatsapp ? `whatsapp:${whatsapp}` : "") ||
      (instagram ? `instagram:${instagram}` : "") ||
      (website ? `website:${website}` : "") ||
      `provider:${providerName}`
    );
  }, []);

  const shouldShowResidentPin = useCallback(
    (service: any) => {
      const isOwnService =
        typeof service?.provider_id === "string" &&
        typeof user?.id === "string" &&
        service.provider_id === user.id;

      const contextEnvironmentId =
        typeof service?.distanceEnvironmentId === "string" &&
        service.distanceEnvironmentId.trim().length > 0
          ? service.distanceEnvironmentId.trim()
          : typeof service?.environmentId === "string" &&
              service.environmentId.trim().length > 0
            ? service.environmentId.trim()
            : null;

      if (isOwnService && membershipAccessLoaded && contextEnvironmentId) {
        const contextAccessType =
          membershipAccessByEnvironmentId[contextEnvironmentId] ?? null;
        if (contextAccessType === "resident") return true;
        if (contextAccessType === "service_provider") return false;
      }

      return service.publisherType === "resident";
    },
    [membershipAccessByEnvironmentId, membershipAccessLoaded, user?.id],
  );

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
        group.services.flatMap((service) => getLinkedEnvironmentIds(service)),
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
  }, [filteredServices, getLinkedEnvironmentIds]);

  const displayedServices = useMemo(() => {
    if (selectedCategory !== "all") {
      return filteredServices;
    }

    if (loading || !userLocation) {
      return filteredServices;
    }

    const getServiceDistance = (service: any) =>
      typeof service?.distance === "number" && Number.isFinite(service.distance)
        ? service.distance
        : Infinity;

    const providerGroups = new Map<string, Array<any>>();

    filteredServices.forEach((service) => {
      const key = getServiceProviderKey(service);
      const bucket = providerGroups.get(key);
      if (bucket) {
        bucket.push(service);
        return;
      }
      providerGroups.set(key, [service]);
    });

    return Array.from(providerGroups.values())
      .map((group) =>
        [...group].sort(
          (a, b) => getServiceDistance(a) - getServiceDistance(b),
        )[0],
      )
      .sort((a, b) => getServiceDistance(a) - getServiceDistance(b));
  }, [
    filteredServices,
    getServiceProviderKey,
    loading,
    selectedCategory,
    userLocation,
  ]);

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
    let hasRequestedLocation = false;

    const requestLocationOnEntry = () => {
      if (cancelled || hasRequestedLocation || !("geolocation" in navigator))
        return;

      hasRequestedLocation = true;
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

    const requestOnFirstInteraction = () => {
      requestLocationOnEntry();
      window.removeEventListener("pointerdown", requestOnFirstInteraction);
      window.removeEventListener("touchstart", requestOnFirstInteraction);
      window.removeEventListener("keydown", requestOnFirstInteraction);
    };

    const setupLocationRequest = async () => {
      if (!("geolocation" in navigator)) return;

      try {
        if (typeof navigator.permissions?.query === "function") {
          const permission = await navigator.permissions.query({
            name: "geolocation" as PermissionName,
          });

          if (permission.state === "granted") {
            requestLocationOnEntry();
            return;
          }

          if (permission.state === "prompt") {
            window.addEventListener("pointerdown", requestOnFirstInteraction, {
              once: true,
            });
            window.addEventListener("touchstart", requestOnFirstInteraction, {
              once: true,
            });
            window.addEventListener("keydown", requestOnFirstInteraction, {
              once: true,
            });
            window.setTimeout(requestLocationOnEntry, 1200);
            return;
          }

          setLocationLoading(false);
          return;
        }
      } catch (permissionError) {
        void permissionError;
      }

      window.addEventListener("pointerdown", requestOnFirstInteraction, {
        once: true,
      });
      window.addEventListener("touchstart", requestOnFirstInteraction, {
        once: true,
      });
      window.addEventListener("keydown", requestOnFirstInteraction, {
        once: true,
      });
      window.setTimeout(requestLocationOnEntry, 1200);
    };

    void setupLocationRequest();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", requestOnFirstInteraction);
      window.removeEventListener("touchstart", requestOnFirstInteraction);
      window.removeEventListener("keydown", requestOnFirstInteraction);
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

  const handleOpenServiceDetails = (
    service: { id?: string; slug?: string },
    source: string,
  ) => {
    if (!service?.slug) return;
    if (service.id) {
      void trackServiceInteraction({
        serviceId: service.id,
        interactionType: "service_click",
        source,
      });
    }
    router.push(`/service/${service.slug}`);
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

  const categories = useMemo(
    () => [{ id: "all", label: "Tudo", icon: "apps" }, ...SERVICE_CATEGORIES],
    [],
  );

  const categoryUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    activeServices.forEach((service) => {
      const category =
        typeof service.category === "string" ? service.category.trim() : "";
      if (!category) return;
      map.set(category, (map.get(category) || 0) + 1);
    });
    return map;
  }, [activeServices]);

  const mobileQuickCategories = useMemo(() => {
    const allCategory = categories[0];
    const categoryOrder = new Map<string, number>(
      SERVICE_CATEGORIES.map((category, index) => [category.id, index]),
    );

    const rankedCategories = [...SERVICE_CATEGORIES].sort((a, b) => {
      const usageDiff =
        (categoryUsageMap.get(b.label) || 0) - (categoryUsageMap.get(a.label) || 0);
      if (usageDiff !== 0) return usageDiff;
      return (categoryOrder.get(a.id) || 0) - (categoryOrder.get(b.id) || 0);
    });

    const topCategories = rankedCategories.slice(0, 4);
    const selectedCategoryOption = categories.find(
      (category) =>
        (category.id === "all" && selectedCategory === "all") ||
        category.label === selectedCategory,
    );

    if (
      selectedCategoryOption &&
      selectedCategoryOption.id !== "all" &&
      !topCategories.some((category) => category.id === selectedCategoryOption.id)
    ) {
      return [allCategory, selectedCategoryOption, ...topCategories].slice(0, 5);
    }

    return [allCategory, ...topCategories];
  }, [categories, categoryUsageMap, selectedCategory]);

  const handleSelectCategory = useCallback((category: { id: string; label: string }) => {
    setSelectedCategory(category.id === "all" ? "all" : category.label);
    setIsCategorySheetOpen(false);
  }, []);

  const showInitialLoading = servicesLoading && services.length === 0;

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <TopAppBar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-32 pt-24 md:px-8 md:pt-28">
        {/* <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#30cc36]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#30cc36]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
                <Icon icon="verified" size={14} weight={700} />
                Rede de confiança
              </span>

              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/35">
                {user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Bem-vindo ao Conectaê"}
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl">
                Encontre serviços perto de você.
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/55 md:text-base">
                Profissionais, autônomos e moradores anunciando dentro das suas comunidades.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-[2rem] border border-white/20 bg-white/60 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
              <div className="rounded-[1.5rem] bg-[#30cc36]/10 px-4 py-3 text-center">
                <p className="text-xl font-black text-[#30cc36]">{activeServices.length}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Ativos
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/70 px-4 py-3 text-center dark:bg-white/[0.06]">
                <p className="text-xl font-black text-zinc-950 dark:text-white">
                  {environmentsWithServices.length}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Locais
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white/70 px-4 py-3 text-center dark:bg-white/[0.06]">
                <p className="text-xl font-black text-zinc-950 dark:text-white">
                  {categories.length - 1}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Categorias
                </p>
              </div>
            </div>
          </div>
        </section> */}
        <section className="relative overflow-visible rounded-[2rem] border border-white/20 bg-white/55 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#30cc36]/10 blur-3xl" />
          <div className="relative flex items-center justify-between px-1">
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

          <div className="relative flex overflow-x-auto px-1 pb-2 gap-4 no-scrollbar">
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

        <section className="space-y-5">
          <div className="rounded-[2rem] border border-white/20 bg-white/70 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Encontre eletricista, manicure, pedreiro..."
                />
              </div>

              {/* <div
                ref={filterDropdownRef}
                className="absolute right-0 top-full z-[9999] z-[80] shrink-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    environmentsWithServices.length > 0 &&
                    setIsFilterOpen((prev) => !prev)
                  }
                  disabled={environmentsWithServices.length === 0}
                  className="flex h-[46px] max-w-[126px] items-center gap-2 truncate rounded-full border border-white/20 bg-white/80 px-4 pr-9 text-xs font-black text-zinc-700 shadow-sm backdrop-blur-xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white sm:max-w-[200px]"
                >
                  <Icon icon="location_on" size={16} weight={700} />
                  <span className="truncate">{selectedEnvironmentName}</span>
                </button>

                <Icon
                  icon="expand_more"
                  size={16}
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-transform ${
                    isFilterOpen ? "rotate-180" : ""
                  }`}
                />

                {isFilterOpen && (
                  <div
                    className="
    absolute right-0 top-full z-[9999] mt-3
    w-72 max-w-[calc(100vw-24px)]
    overflow-hidden rounded-[1.5rem]
    border border-white/20 bg-white/95
    shadow-[0_24px_80px_rgba(15,23,42,0.22)]
    backdrop-blur-2xl
    dark:border-white/10 dark:bg-zinc-950/95
  "
                  >
                    {" "}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEnvironmentId("all");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-black transition-colors ${
                        selectedEnvironmentId === "all"
                          ? "bg-[#30cc36]/10 text-[#30cc36]"
                          : "text-zinc-700 hover:bg-[#30cc36]/5 dark:text-white"
                      }`}
                    >
                      Todos os locais
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
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                            selectedEnvironmentId === env.id
                              ? "bg-[#30cc36]/10 font-black text-[#30cc36]"
                              : "font-bold text-zinc-700 hover:bg-[#30cc36]/5 dark:text-white"
                          }`}
                        >
                          {env.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div> */}
            </div>
          </div>

          <div className="-mx-4 flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 pb-3 no-scrollbar scroll-smooth md:hidden">
            {mobileQuickCategories.map((category) => {
              const isSelected =
                (category.id === "all" && selectedCategory === "all") ||
                selectedCategory === category.label;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black whitespace-nowrap shadow-sm transition-all active:scale-95 ${
                    isSelected
                      ? "border-[#30cc36] bg-[#30cc36] text-white shadow-lg shadow-[#30cc36]/25"
                      : "border-white/20 bg-white/70 text-zinc-500 backdrop-blur-xl hover:border-[#30cc36]/30 hover:text-[#30cc36] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  }`}
                >
                  <Icon icon={category.icon} size={14} weight={isSelected ? 700 : 400} />
                  {category.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsCategorySheetOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/75 px-3 py-2 text-[11px] font-black text-zinc-600 shadow-sm backdrop-blur-xl transition-all active:scale-95 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
            >
              <Icon icon="tune" size={14} weight={700} />
              Mais
            </button>
          </div>

          <div className="hidden md:-mx-8 md:flex md:flex-wrap md:gap-2 md:px-8 md:pb-0">
            {categories.map((cat) => {
              const isSelected =
                (cat.id === "all" && selectedCategory === "all") ||
                selectedCategory === cat.label;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-black whitespace-nowrap shadow-sm transition-all active:scale-95 ${
                    isSelected
                      ? "border-[#30cc36] bg-[#30cc36] text-white shadow-lg shadow-[#30cc36]/25"
                      : "border-white/20 bg-white/70 text-zinc-500 backdrop-blur-xl hover:border-[#30cc36]/30 hover:text-[#30cc36] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                  }`}
                >
                  <Icon icon={cat.icon} size={14} weight={isSelected ? 700 : 400} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {isCategorySheetOpen && (
            <div className="fixed inset-0 z-[85] md:hidden">
              <button
                type="button"
                aria-label="Fechar seleção de categorias"
                onClick={() => setIsCategorySheetOpen(false)}
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              />

              <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[1.6rem] border border-white/20 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-zinc-700 dark:text-white/80">
                    Categorias
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCategorySheetOpen(false)}
                    className="rounded-full border border-zinc-200 p-1.5 text-zinc-500 dark:border-white/10 dark:text-white/70"
                  >
                    <Icon icon="close" size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const isSelected =
                      (category.id === "all" && selectedCategory === "all") ||
                      selectedCategory === category.label;

                    return (
                      <button
                        key={`sheet-${category.id}`}
                        type="button"
                        onClick={() => handleSelectCategory(category)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-black transition-all ${
                          isSelected
                            ? "border-[#30cc36] bg-[#30cc36]/12 text-[#30cc36]"
                            : "border-zinc-200/70 bg-white text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70"
                        }`}
                      >
                        <Icon icon={category.icon} size={16} weight={isSelected ? 700 : 400} />
                        <span className="truncate">{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {showInitialLoading ? (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/70 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
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
                      onClick={() =>
                        handleOpenServiceDetails(service, "home_list_card")
                      }
                      className="group/card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="relative h-48 w-full overflow-hidden border-b border-white/20 dark:border-white/10">
                        {service.image ? (
                          <img
                            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                            src={service.image}
                            alt={service.title}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#30cc36]/5">
                            <Icon
                              icon="image"
                              size={24}
                              className="text-primary/20"
                            />
                          </div>
                        )}
                        {service.image && shouldShowResidentPin(service) && (
                          <img
                            src="/pin.png"
                            alt="Morador"
                            className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 object-contain drop-shadow-md"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
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
                            {service.provider || "Usuario"}
                          </p>
                        </div>

                        <div className="mt-1 space-y-2">
                          <div className="flex items-center justify-between">
                            {(userLocation ||
                              service.distanceEnvironmentName) && (
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
                                {service.distanceEnvironmentName && (
                                  <span className="text-[9px] text-on-surface-variant font-medium">
                                    {service.distanceEnvironmentName}
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
                              handleOpenServiceDetails(
                                service,
                                "home_list_button",
                              );
                            }}
                            className="w-full rounded-full bg-[#30cc36] py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-[#30cc36]/20 transition-all hover:brightness-110 active:scale-95"
                          >
                            Ver anúncio
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displayedServices.length === 0 && (
                    <div className="col-span-full rounded-[2rem] border border-dashed border-[#30cc36]/25 bg-white/70 py-12 text-center text-sm font-bold italic text-zinc-400 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
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
                      onClick={() =>
                        handleOpenServiceDetails(service, "home_search_card")
                      }
                      className="group/card relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      <div className="relative h-48 w-full overflow-hidden border-b border-white/20 dark:border-white/10">
                        {service.image ? (
                          <img
                            className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                            src={service.image}
                            alt={service.title}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#30cc36]/5">
                            <Icon
                              icon="image"
                              size={24}
                              className="text-primary/20"
                            />
                          </div>
                        )}
                        {service.image && shouldShowResidentPin(service) && (
                          <img
                            src="/pin.png"
                            alt="Morador"
                            className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 object-contain drop-shadow-md"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
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
                            {service.provider || "Usuario"}
                          </p>
                          <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">
                            {service.description}
                          </p>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            {(userLocation ||
                              service.distanceEnvironmentName) && (
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
                                {service.distanceEnvironmentName && (
                                  <span className="text-[10px] text-on-surface-variant font-medium truncate">
                                    {service.distanceEnvironmentName}
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
                              handleOpenServiceDetails(
                                service,
                                "home_search_button",
                              );
                            }}
                            className="w-full rounded-full bg-[#30cc36] py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-[#30cc36]/20 transition-all hover:brightness-110 active:scale-95"
                          >
                            Ver anuncio
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {displayedServices.length === 0 && (
                    <div className="col-span-full rounded-[2rem] border border-dashed border-[#30cc36]/25 bg-white/70 py-12 text-center text-sm font-bold italic text-zinc-400 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
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
                      handleOpenServiceDetails(service, "home_provider_modal");
                    }}
                    className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-highest/40 p-3 flex items-center gap-3 text-left hover:bg-surface-container-highest transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
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
                      {service.image && shouldShowResidentPin(service) && (
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
                      {(service.distanceEnvironmentName ||
                        service.environmentName) && (
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {service.distanceEnvironmentName ||
                            service.environmentName}
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
                          className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={media.previewUrl}
                          alt="Midia selecionada"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-105"
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
