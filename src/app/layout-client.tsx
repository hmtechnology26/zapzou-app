"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { useServiceWorkerRegistration } from "@/app/useServiceWorkerRegistration";

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
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [hasMounted, setHasMounted] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [hasSeenLocationPrompt, setHasSeenLocationPrompt] = useState(false);

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
    const checkLocationPermission = async () => {
      if (!navigator.permissions) {
        setLocationPermission("unknown");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        setLocationPermission(permissionStatus.state);

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

  useServiceWorkerRegistration();

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
                        setLocationPermission("granted");
                        try {
                          window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, "true");
                        } catch {}
                        setHasSeenLocationPrompt(true);
                      },
                      () => {
                        setLocationPermission("denied");
                        try {
                          window.localStorage.setItem(LOCATION_PROMPT_STORAGE_KEY, "true");
                        } catch {}
                        setHasSeenLocationPrompt(true);
                      },
                    );
                  } else {
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
    </div>
  );
}

export default ProtectedLayout;