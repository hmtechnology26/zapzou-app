const SW_VERSION = "v3";
const CACHE_PREFIX = "conectae";
const STATIC_CACHE = CACHE_PREFIX + "-static-" + SW_VERSION;
const RUNTIME_CACHE = CACHE_PREFIX + "-runtime-" + SW_VERSION;
const IMAGE_CACHE = CACHE_PREFIX + "-images-" + SW_VERSION;

const PRECACHE_URLS = [
  "/manifest.json",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
  "/conectae_logo.png",
  "/conectae_logo_light.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) =>
            key.startsWith(CACHE_PREFIX + "-") &&
            ![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key)
          )
          .map((key) => caches.delete(key))
      );

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

function isCacheableRequest(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/_next/image")) return false;
  return true;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;
  return networkPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (!isCacheableRequest(request, url)) {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font";

  const isImageAsset =
    request.destination === "image" ||
    /\.(?:png|jpg|jpeg|webp|gif|svg|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (isImageAsset) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, preloadResponse.clone());
            return preloadResponse;
          }
        } catch (_) {
        }

        try {
          return await networkFirst(request, RUNTIME_CACHE);
        } catch (error) {
          const cache = await caches.open(RUNTIME_CACHE);
          const cachedPage = await cache.match(request);
          if (cachedPage) return cachedPage;
          const root = await cache.match("/");
          if (root) return root;
          throw error;
        }
      })()
    );
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
