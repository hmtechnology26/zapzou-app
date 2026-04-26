"use client";

import { useEffect } from "react";

const SW_BUILD_VERSION = "2026-04-26-r1";
const CACHE_RESET_MARKER_KEY = "conectae-pwa-cache-reset-version";
const CONTROLLER_RELOAD_MARKER = "conectae-pwa-controller-reloaded";

export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Keep dev flow clean and avoid stale SWs while coding locally.
    if (process.env.NODE_ENV !== "production") {
      void (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch (error) {
          void error;
        }
      })();
      return;
    }

    let cancelled = false;

    const hardResetPwaCachesIfNeeded = async () => {
      try {
        const appliedVersion = window.localStorage.getItem(CACHE_RESET_MARKER_KEY);
        if (appliedVersion === SW_BUILD_VERSION) return;

        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.startsWith("conectae-") || key.startsWith("workbox-"))
              .map((key) => caches.delete(key)),
          );
        }

        window.localStorage.setItem(CACHE_RESET_MARKER_KEY, SW_BUILD_VERSION);
        window.sessionStorage.removeItem(CONTROLLER_RELOAD_MARKER);
      } catch (error) {
        console.warn("PWA cache reset failed.", error);
      }
    };

    const registerServiceWorker = async () => {
      try {
        await hardResetPwaCachesIfNeeded();

        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${SW_BUILD_VERSION}`,
          {
            scope: "/",
            updateViaCache: "none",
          },
        );

        await registration.update();

        const triggerSkipWaiting = () => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        };

        triggerSkipWaiting();

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (window.sessionStorage.getItem(CONTROLLER_RELOAD_MARKER) === "1") {
            return;
          }
          window.sessionStorage.setItem(CONTROLLER_RELOAD_MARKER, "1");
          window.location.reload();
        });

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              triggerSkipWaiting();
            }
          });
        });
      } catch (error) {
        console.warn("PWA registration failed.", error);
      }
    };

    const schedule = () => {
      if (cancelled) return;
      void registerServiceWorker();
    };

    if (typeof (window).requestIdleCallback === "function") {
      const id = (window).requestIdleCallback(schedule, { timeout: 2500 });
      return () => {
        cancelled = true;
        if (typeof (window).cancelIdleCallback === "function") {
          (window).cancelIdleCallback(id);
        }
      };
    }

    const timeout = window.setTimeout(schedule, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);
}
