// EcoShare AI - Progressive Web App Service Worker
// Version 2.0.0 - Robust GitHub Pages and Offline Shell Caching

const CACHE_NAME = 'ecoshare-v3';

// 1. Install Event: Pre-cache core application shell using scope base
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
        scope + 'icons.svg',
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

// 3. Fetch Event: Safe async response handling that NEVER resolves to undefined
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST handled by client adapter)
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension or external telemetry
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation requests (HTML pages for React Router)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const scope = self.registration.scope;
        try {
          const networkResponse = await fetch(request);
          // If server returns 404 (e.g. GitHub Pages on deep routes /evs/login), serve cached index.html
          if (networkResponse && networkResponse.status === 404) {
            const cachedIndex = await caches.match(scope + 'index.html') ||
                                await caches.match('./index.html') ||
                                await caches.match('/evs/index.html') ||
                                await caches.match(scope);
            if (cachedIndex) return cachedIndex;
          }
          return networkResponse;
        } catch (err) {
          // Offline navigation fallback: serve cached index.html
          const cachedIndex = await caches.match(scope + 'index.html') ||
                              await caches.match('./index.html') ||
                              await caches.match('/evs/index.html') ||
                              await caches.match(scope);
          if (cachedIndex) return cachedIndex;

          return new Response(
            '<!DOCTYPE html><html><head><title>EcoShare AI</title></head><body><h2>EcoShare AI is Offline</h2><p>Please reconnect to the network.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // B. Static Assets (/assets/*, .js, .css, .svg, .png, .woff2)
  // Cache-First with Network Revalidation
  if (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
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
          return new Response('', { status: 408, statusText: 'Asset Unavailable Offline' });
        }
      })()
    );
    return;
  }

  // C. Google Fonts / External CDN Cache
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
          const fallback = await caches.match(request);
          return fallback || new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        }
      })()
    );
    return;
  }

  // D. General Network Request with Guaranteed Non-Undefined Fallback
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    })()
  );
});
