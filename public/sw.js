// Keep the worker lightweight: we avoid app-shell caching so the web version
// stays fresh and only provide a network-first offline fallback for pages.
const CACHE_VERSION = "v4";
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

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return buildOfflineResponse();
  }
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
  }
});
