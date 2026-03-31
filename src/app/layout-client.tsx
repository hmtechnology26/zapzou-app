"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { BottomNav } from "@/components/BottomNav";

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
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
    pathname.startsWith("/service/") ||
    pathname.startsWith("/places/") ||
    pathname.startsWith("/auth/");

  // Pages that don't require location permission
  const locationExemptPages = [
    "/login",
    "/places",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show location permission modal if permission not granted and not on exempt page
  const isLocationExemptPath = locationExemptPages.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  const shouldShowLocationModal =
    locationPermission !== "granted" &&
    !hasSeenLocationPrompt &&
    !isLocationExemptPath;

  const tabPaths = ["/", "/places", "/places/", "/meus-anuncios", "/profile"];
  const showBottomNav = hasMounted && pathname && tabPaths.includes(pathname);

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
                  try {
                    window.localStorage.setItem(
                      LOCATION_PROMPT_STORAGE_KEY,
                      "true",
                    );
                    setHasSeenLocationPrompt(true);
                  } catch {
                    setHasSeenLocationPrompt(true);
                  }

                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => {
                        // Permission granted, update state
                        setLocationPermission("granted");
                      },
                      () => {
                        // Permission denied
                        setLocationPermission("denied");
                      },
                    );
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
