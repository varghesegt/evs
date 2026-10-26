// EcoShare AI - Progressive Web App Service Worker
// Version 1.0.0 - Full Offline App Shell & Asset Caching

const CACHE_NAME = 'ecoshare-v1';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icons.svg',
  './404.html',
];

// 1. Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching application shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent offline routing & caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST, PUT handled by client.js outbox queue)
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation requests (HTML pages for React Router)
  // If offline or navigating to any client route (/donor, /volunteer, /ngo), serve index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // B. Vite Assets & Static Files (/assets/*, .js, .css, .svg, .woff2)
  // Cache-First with Network Fallback
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // If totally offline and not cached yet, return empty or fallback
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // C. Google Fonts / External CDN Cache
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, resClone));
          return res;
        }).catch(() => caches.match(request));
      })
    );
    return;
  }

  // D. Default network request
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
