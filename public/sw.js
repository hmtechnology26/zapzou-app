const CACHE_VERSION = "v1";
const STATIC_CACHE = `zapzou-static-${CACHE_VERSION}`;
const PAGE_CACHE = `zapzou-pages-${CACHE_VERSION}`;
const CACHE_PREFIX = "zapzou-";
const PRECACHE_PAGE_URLS = ["/"];
const PRECACHE_ASSET_URLS = [
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
];
const STATIC_ASSET_EXTENSIONS = [
  ".css",
  ".js",
  ".mjs",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".gif",
  ".ico",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".map",
];
const IS_LOCALHOST =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname === "::1";

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) {
    return true;
  }

  if (url.pathname.startsWith("/_next/image")) {
    return true;
  }

  if (PRECACHE_ASSET_URLS.includes(url.pathname)) {
    return true;
  }

  return STATIC_ASSET_EXTENSIONS.some((extension) =>
    url.pathname.toLowerCase().endsWith(extension),
  );
}

function buildOfflineResponse() {
  return new Response(
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conectae offline</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f8fafc;
      color: #0f172a;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
    }
    main {
      max-width: 480px;
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
      text-align: center;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 1.5rem;
      line-height: 1.2;
    }
    p {
      margin: 0;
      color: #475569;
      line-height: 1.6;
    }
    .badge {
      display: inline-block;
      margin-bottom: 18px;
      padding: 8px 14px;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <main>
    <div class="badge">ZapZou offline</div>
    <h1>Sem conexao agora</h1>
    <p>Abra o app novamente quando a internet voltar para ver os ambientes e servicos mais recentes.</p>
  </main>
</body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

async function networkFirstNavigation(request) {
  const pageCache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await pageCache.put(request, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await pageCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const rootResponse = await pageCache.match("/");
    if (rootResponse) {
      return rootResponse;
    }

    return buildOfflineResponse();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const [pageCache, assetCache] = await Promise.all([
        caches.open(PAGE_CACHE),
        caches.open(STATIC_CACHE),
      ]);

      await Promise.all([
        pageCache.addAll(PRECACHE_PAGE_URLS),
        assetCache.addAll(PRECACHE_ASSET_URLS),
      ]);

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (!isSameOrigin(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (isStaticAsset(url)) {
    if (IS_LOCALHOST && url.pathname.startsWith("/_next/")) {
      return;
    }

    event.respondWith(cacheFirst(request));
  }
});
