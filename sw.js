// EcoShare AI - Progressive Web App Service Worker
// Version 3.0.0 - Rock-Solid GitHub Pages, Tile Fallback, and Offline Reliability

const CACHE_NAME = 'ecoshare-v7';

// Crisp vector street grid fallback tile for offline map tiles & failed network requests
const FALLBACK_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#f8fafc"/>
  <path d="M0,64 L256,64 M0,192 L256,192" stroke="#e2e8f0" stroke-width="4"/>
  <path d="M64,0 L64,256 M192,0 L192,256" stroke="#e2e8f0" stroke-width="4"/>
  <path d="M0,128 L256,128" stroke="#cbd5e1" stroke-width="8"/>
  <path d="M128,0 L128,256" stroke="#cbd5e1" stroke-width="8"/>
  <path d="M0,128 L256,128" stroke="#ffffff" stroke-width="5"/>
  <path d="M128,0 L128,256" stroke="#ffffff" stroke-width="5"/>
  <path d="M0,40 Q128,80 256,40" stroke="#fde047" stroke-width="3" fill="none" opacity="0.75"/>
  <path d="M40,256 Q80,128 40,0" stroke="#38bdf8" stroke-width="2.5" fill="none" opacity="0.6"/>
</svg>`;

// 1x1 transparent PNG buffer for general image fallbacks
const TRANSPARENT_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x60, 0x00, 0x00, 0x00,
  0x02, 0x00, 0x01, 0x73, 0x75, 0x01, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82
]);

// 1. Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const scope = self.registration.scope; // e.g. "https://varghesegt.github.io/evs/" or "http://localhost:5173/"
      const assets = [
        scope,
        scope + 'index.html',
        scope + '404.html',
        scope + 'manifest.json',
        scope + 'favicon.svg',
      ];
      try {
        await cache.addAll(assets);
        console.log('[SW] Pre-caching completed for scope:', scope);
      } catch (err) {
        console.warn('[SW] Pre-caching partial warning:', err);
      }
      return self.skipWaiting();
    })()
  );
});

// 2. Activate Event: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
      return self.clients.claim();
    })()
  );
});

// 3. Fetch Event: Safe async response handling that NEVER resolves to undefined or error 503/408
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST handled by client adapter)
  if (request.method !== 'GET') {
    return;
  }

  // Skip non-http schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;

  // A. Navigation requests (HTML pages for React Router)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const scope = self.registration.scope;
        try {
          const networkResponse = await fetch(request);
          // If server returns 404 (e.g. GitHub Pages on deep routes /evs/admin), serve cached index.html
          if (networkResponse && networkResponse.status === 404) {
            const cachedIndex = await caches.match(scope + 'index.html') ||
                                await caches.match('/evs/index.html') ||
                                await caches.match('./index.html') ||
                                await caches.match(scope);
            if (cachedIndex) return cachedIndex;
          }
          return networkResponse;
        } catch (err) {
          // Offline navigation fallback: serve cached index.html with 200 OK
          const cachedIndex = await caches.match(scope + 'index.html') ||
                              await caches.match('/evs/index.html') ||
                              await caches.match('./index.html') ||
                              await caches.match(scope);
          if (cachedIndex) return cachedIndex;

          return new Response(
            '<!DOCTYPE html><html><head><title>EcoShare AI</title></head><body><h2>EcoShare AI is Offline</h2><p>Please reconnect to the network.</p></body></html>',
            { status: 200, headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // B. External Map Tiles (OpenStreetMap, Esri, Carto, etc.)
  if (
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('openstreetmap.fr') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('cartocdn.com')
  ) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          // Standard and opaque cross-origin image responses (res.type === 'opaque' has status 0)
          if (res && (res.status === 200 || res.type === 'opaque' || res.ok)) {
            const tileCache = await caches.open('ecoshare-tiles-v2');
            tileCache.put(request, res.clone()).catch(() => {});
            return res;
          }
          const cached = await caches.match(request);
          if (cached) return cached;
          return res;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(FALLBACK_TILE_SVG, {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' },
          });
        }
      })()
    );
    return;
  }

  // C. Same-Origin Static Assets (/assets/*, .js, .css, .svg, .png, .woff2)
  if (
    isSameOrigin && (
      url.pathname.includes('/assets/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.woff2')
    )
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          // Revalidate in background
          fetch(request)
            .then(async (res) => {
              if (res && res.status === 200) {
                const c = await caches.open(CACHE_NAME);
                c.put(request, res);
              }
            })
            .catch(() => {});
          return cached;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          if (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
            return new Response(TRANSPARENT_PNG, { status: 200, headers: { 'Content-Type': 'image/png' } });
          }
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
    return;
  }

  // D. Google Fonts / External CDN Cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.status === 200) {
            const c = await caches.open(CACHE_NAME);
            c.put(request, res.clone());
          }
          return res;
        } catch (e) {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        }
      })()
    );
    return;
  }

  // E. API Requests: On GitHub Pages or offline, serve 200 with JSON payload, NEVER 503
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return new Response(JSON.stringify({ offline: true, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
    return;
  }

  // F. General Fallback with 200 status
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('', { status: 200 });
      }
    })()
  );
});
