"use client";

import { useEffect } from "react";

export function useServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage({ type: "SKIP_WAITING" });
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
