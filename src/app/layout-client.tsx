"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { useServiceWorkerCleanup } from "@/app/service-worker-cleanup";

function ProtectedLayoutSkeleton() {
  const rows = Array.from({ length: 3 });

  return (
    <div
      className="min-h-screen bg-background animate-pulse text-transparent selection-none"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="fixed inset-x-0 top-0 z-40 h-16 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 flex items-center px-4">
        <div className="h-6 w-32 rounded-full bg-surface-container-lowest/60" />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-surface-container-lowest/60" />
          <div className="h-10 w-16 rounded-full bg-surface-container-lowest/60" />
        </div>
      </header>
      <main className="pt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-4 pb-28">
        <div className="h-6 w-3/4 rounded-full bg-surface-container-lowest/40" />
        <div className="h-4 w-1/2 rounded-full bg-surface-container-lowest/40" />
        {rows.map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-3xl bg-surface-container-lowest/40 border border-outline-variant/20"
          />
        ))}
      </main>
    </div>
  );
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading, selectedEnvironments } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [hasMounted, setHasMounted] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [hasSeenLocationPrompt, setHasSeenLocationPrompt] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [publicEnvironmentName, setPublicEnvironmentName] = useState<string>("");
  const [hasConfirmedExit, setHasConfirmedExit] = useState(false);

  const LOCATION_PROMPT_STORAGE_KEY = "zapzou-location-permission-prompted";

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/search" ||
    pathname === "/places" ||
    pathname === "/contact" ||
    pathname === "/favorites" ||
    pathname.startsWith("/service/") ||
    pathname.startsWith("/places/") ||
    pathname.startsWith("/auth/");

  // Pages that don't require location permission
  const locationExemptPages = [
    "/login",
    "/places",
    "/favorites",
    "/register-service",
    "/edit-profile",
    "/meus-anuncios",
    "/profile",
    "/terms",
    "/privacy",
    "/plans",
    "/plans/plus",
    "/plans/pro",
    "/bulletins",
    "/notifications",
    "/select-environments",
    "/admin",
    "/contact",
  ];

  useServiceWorkerCleanup();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    try {
      const storedPrompt = window.localStorage.getItem(
        LOCATION_PROMPT_STORAGE_KEY,
      );
      setHasSeenLocationPrompt(storedPrompt === "true");
    } catch {
      setHasSeenLocationPrompt(false);
    }
  }, []);

  useEffect(() => {
    // Check location permission status
    const checkLocationPermission = async () => {
      if (!navigator.permissions) {
        // Fallback for browsers without Permissions API
        setLocationPermission("unknown");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        setLocationPermission(permissionStatus.state);

        // Listen for permission changes
        permissionStatus.onchange = () => {
          setLocationPermission(permissionStatus.state);
        };
      } catch (err) {
        console.error("Error checking location permission:", err);
        setLocationPermission("unknown");
      }
    };

    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (loading === false && !user && !isPublicPage) {
      router.push("/login");
    }
  }, [user, loading, isPublicPage, router]);

  const placeId = searchParams?.get("placeId");
  const isPublicEnvironmentView =
    pathname.startsWith("/places/") && Boolean(placeId);

  useEffect(() => {
    if (placeId && pathname.startsWith("/places/")) {
      const stored = localStorage.getItem(`place_${placeId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPublicEnvironmentName(parsed.displayName?.text || "");
        } catch (e) {}
      }
    }
  }, [pathname, placeId]);

  useEffect(() => {
    if (!isPublicEnvironmentView) {
      setHasConfirmedExit(false);
      localStorage.removeItem("zapzou_public_exit_confirmed");
      return;
    }

    const confirmed = localStorage.getItem("zapzou_public_exit_confirmed");
    setHasConfirmedExit(confirmed === "true");
  }, [isPublicEnvironmentView]);

  const handleNavigation = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!isPublicEnvironmentView || !publicEnvironmentName || hasConfirmedExit) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      const button = target.closest("button");

      const href = anchor?.getAttribute("href");

      if (href && href.startsWith("/") && !href.startsWith("/places/")) {
        e.preventDefault();
        setPendingNavigation(href);
        setShowExitModal(true);
        return;
      }

      if (button && !button.getAttribute("data-exit-modal-ignore")) {
        const onClick = (button as any).onClick;
        if (onClick) {
          const buttonHtml = button.outerHTML || "";
          if (buttonHtml.includes("router.push") || buttonHtml.includes("onClick=")) {
            e.preventDefault();
            setPendingNavigation(null);
            setShowExitModal(true);
          }
        }
      }
    },
    [hasConfirmedExit, isPublicEnvironmentView, publicEnvironmentName],
  );

  useEffect(() => {
    document.addEventListener("click", handleNavigation);
    return () => document.removeEventListener("click", handleNavigation);
  }, [handleNavigation]);

  // Always show content for public pages, regardless of loading state
  if (isPublicPage) {
    return (
      <div className="min-h-screen">
        {children}
        {hasMounted && pathname && <BottomNav />}
      </div>
    );
  }

  if (loading) {
    return <ProtectedLayoutSkeleton />;
  }

  if (loading) {
    return <ProtectedLayoutSkeleton />;
  }

  // Show location permission modal if permission not granted and not on exempt page
  const isLocationExemptPath = locationExemptPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  const shouldShowLocationModal =
    locationPermission !== "granted" &&
    !hasSeenLocationPrompt &&
    !isLocationExemptPath;

  const showBottomNav = hasMounted && pathname ? true : false;

  return (
    <div className="min-h-screen">
      {children}
      {showBottomNav && <BottomNav />}
      {shouldShowLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-on-surface">
                Permissão de localização necessária
              </h2>
              <p className="text-on-surface-variant text-center">
                Para mostrar serviços próximos a você, precisamos acessar sua
                localização. Por favor, conceda permissão para continuar.
              </p>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => {
                        // Permission granted, update state
                        setLocationPermission("granted");
                        try {
                          window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, "true");
                        } catch {}
                        setHasSeenLocationPrompt(true);
                      },
                      () => {
                        // Permission denied
                        setLocationPermission("denied");
                        try {
                          window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, "true");
                        } catch {}
                        setHasSeenLocationPrompt(true);
                      },
                    );
                  } else {
                    // Geolocation not supported
                    setHasSeenLocationPrompt(true);
                  }
                }}
                className="w-full bg-primary text-white font-bold py-3 px-6 mt-6 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                  <span>Conceder permissão de localização</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de saída de ambiente público */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Icon icon="exit_to_app" size={32} className="text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">
                SAIR DO AMBIENTE {publicEnvironmentName.toUpperCase()}?
              </h2>
              <p className="text-on-surface-variant text-center mt-2">
                Você está visualizando um ambiente público. Ao sair, perde o acesso a este ambiente a menos que clique novamente no link.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    // Se há pendingNavigation, redireciona; senão deixa o clique original seguir
                    if (pendingNavigation) {
                      router.push(pendingNavigation);
                    }
                    // Armazenar que o usuário confirmou saída para permitir próximas ações
                    localStorage.setItem('zapzou_public_exit_confirmed', 'true');
                  }}
                  className="w-full bg-error text-white font-bold py-3 px-6 rounded-xl hover:bg-error/90 transition-colors"
                >
                  SIM, SAIR
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false);
                    setPendingNavigation(null);
                  }}
                  className="w-full bg-surface-container-high text-on-surface font-bold py-3 px-6 rounded-xl hover:bg-surface-container-highest transition-colors"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProtectedLayout;
