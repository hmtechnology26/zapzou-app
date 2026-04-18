"use client";

import { useEffect } from "react";

async function clearServiceWorkersAndCaches() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map(async (registration) => {
        await registration.unregister();
      }),
    );
  } catch (error) {
    console.warn("PWA cleanup: failed to clear service workers.", error);
  }

  if (!("caches" in window)) {
    return;
  }

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((key) => caches.delete(key)));
  } catch (error) {
    console.warn("PWA cleanup: failed to clear caches.", error);
  }
}

export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    void clearServiceWorkersAndCaches();
  }, []);
}
