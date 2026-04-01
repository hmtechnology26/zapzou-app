'use client';

import { useEffect } from "react";

export function useServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let isCancelled = false;

    const unregisterAll = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch (error) {
        console.warn("ServiceWorkerCleanup failed to unregister:", error);
      }
    };

    const clearCaches = async () => {
      if (!("caches" in window)) {
        return;
      }

      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (error) {
        console.warn("ServiceWorkerCleanup failed to clear caches:", error);
      }
    };

    void (async () => {
      if (isCancelled) return;
      await unregisterAll();
      if (isCancelled) return;
      await clearCaches();
    })();

    return () => {
      isCancelled = true;
    };
  }, []);
}
