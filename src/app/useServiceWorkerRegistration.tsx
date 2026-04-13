"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";
const PWA_MIGRATION_KEY = "zapzou-pwa-migration-v2";
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

async function clearLegacyServiceWorkersAndCaches() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map(async (registration) => {
        const scriptUrls = [
          registration.active?.scriptURL,
          registration.installing?.scriptURL,
          registration.waiting?.scriptURL,
        ].filter((scriptURL): scriptURL is string => Boolean(scriptURL));

        const hasCurrentWorker = scriptUrls.some((scriptURL) =>
          scriptURL.includes(SERVICE_WORKER_PATH),
        );

        if (!hasCurrentWorker) {
          await registration.unregister();
        }
      }),
    );
  } catch (error) {
    console.warn("PWA migration: failed to clear legacy service workers.", error);
  }

  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.startsWith("zapzou-"))
        .map((key) => caches.delete(key)),
    );
  } catch (error) {
    console.warn("PWA migration: failed to clear legacy caches.", error);
  }
}

export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (!window.isSecureContext && !LOCALHOST_HOSTNAMES.has(window.location.hostname)) {
      return;
    }

    let cancelled = false;
    let shouldReload = false;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;
    let loadListener: (() => void) | null = null;

    const handleControllerChange = () => {
      if (!shouldReload || cancelled) {
        return;
      }

      shouldReload = false;
      window.location.reload();
    };

    const register = async () => {
      try {
        const migrationCompleted = (() => {
          try {
            return window.localStorage.getItem(PWA_MIGRATION_KEY) === "true";
          } catch {
            return true;
          }
        })();

        if (!migrationCompleted) {
          await clearLegacyServiceWorkersAndCaches();

          try {
            window.localStorage.setItem(PWA_MIGRATION_KEY, "true");
          } catch {
            // Ignore storage failures; the app can still register the worker.
          }
        }

        if (cancelled) {
          return;
        }

        const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: "/",
        });

        if (cancelled) {
          return;
        }

        const promoteWaitingWorker = (worker: ServiceWorker | null | undefined) => {
          if (!worker || !navigator.serviceWorker.controller) {
            return;
          }

          shouldReload = true;
          worker.postMessage({ type: "SKIP_WAITING" });
        };

        promoteWaitingWorker(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (cancelled) {
              return;
            }

            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promoteWaitingWorker(installingWorker);
            }
          });
        });

        void registration.update();
      } catch (error) {
        console.warn("PWA registration failed.", error);
      }
    };

    const startRegistration = () => {
      if (cancelled) return;

      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(() => {
          void register();
        }, { timeout: 4000 });
        return;
      }

      timeoutHandle = window.setTimeout(() => {
        void register();
      }, 1200);
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    if (document.readyState === "complete") {
      startRegistration();
    } else {
      loadListener = () => startRegistration();
      window.addEventListener("load", loadListener, { once: true });
    }

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      if (loadListener) {
        window.removeEventListener("load", loadListener);
      }
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);
}
