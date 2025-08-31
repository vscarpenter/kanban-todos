// Minimal service worker for Cascade PWA
// Strategy:
// - Navigation requests: network-first, fallback to cache
// - Static assets: cache-first with background update
// - Supports immediate activation via postMessage { type: 'SKIP_WAITING' }

const CACHE_VERSION = 'v1-2025-08-31';
const ASSET_CACHE = `assets-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Activate the new SW as soon as it's finished installing
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches and take control immediately
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k !== ASSET_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        );
      } finally {
        await self.clients.claim();
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(req, res.clone()).catch(() => {});
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          // Fallback to root index if available
          const fallback = await caches.match('/index.html');
          return fallback || Response.error();
        }
      })()
    );
    return;
  }

  // Cache-first for versioned/static assets
  const isStaticAsset =
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/images/') ||
    /\.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => undefined);

        return cached || (await networkPromise) || Response.error();
      })()
    );
  }
});

