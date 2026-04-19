// Legacy PWA cleanup worker.
// It unregisters itself and clears old caches, but it does not intercept fetches.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.registration.unregister();
      } catch (error) {
        console.warn("Legacy PWA cleanup: failed to unregister service worker.", error);
      }

      try {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      } catch (error) {
        console.warn("Legacy PWA cleanup: failed to clear caches.", error);
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
