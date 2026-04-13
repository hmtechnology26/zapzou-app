// Keep the worker lightweight: cache only static assets and use network-first
// for navigations so the app stays fresh without heavy shell caches.
const STATIC_CACHE = "zapzou-static-v5";
const CACHE_PREFIX = "zapzou-";
const IS_LOCALHOST =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.hostname === "::1";

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
    <div class="badge">Conectae offline</div>
    <h1>Sem conexão agora</h1>
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

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return buildOfflineResponse();
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && response.ok) {
    void cache.put(request, response.clone());
  }
  return response;
}

function isStaticAssetRequest(request) {
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return false;
  }

  return (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "manifest" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/pwa-") ||
    url.pathname.startsWith("/apple-touch-icon") ||
    url.pathname.startsWith("/favicon")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter((key) => key.startsWith(CACHE_PREFIX))
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

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAssetRequest(request)) {
    event.respondWith(cacheFirstAsset(request));
  }
});
