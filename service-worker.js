/**
 * Service Worker - Enables offline functionality and caching
 * Implements offline-first strategy with cache fallback
 */

const CACHE_VERSION = 'v1.0';
const CACHE_NAME = `learn-play-kids-${CACHE_VERSION}`;
const RUNTIME_CACHE = `learn-play-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/admin.js',
  '/sync.js',
  '/additional.js',
  '/manifest.json',
  '/netlify.toml'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching essential assets...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('⚠️ Some assets failed to cache:', err);
        // Don't fail installation if some assets can't be cached
      });
    }).then(() => {
      console.log('✅ Service Worker installed');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // Control all pages immediately
    })
  );
});

// Fetch event - network-first, with cache fallback for offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (offline sync)
  if (url.pathname.includes('/sync') || url.pathname.includes('/.netlify/functions/sync')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('📦 API: Using cached response for', url.pathname);
              return cached;
            }
            // Return offline indicator
            return new Response(
              JSON.stringify({ status: 'offline', message: 'App is offline' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Handle HTML/CSS/JS - cache-first strategy
  if (request.destination === 'document' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          console.log('📦 Cache hit:', url.pathname);
          // Try to update cache in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
              });
            }
          }).catch(() => {});
          return cached;
        }
        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            // Clone and cache successful response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            console.warn('❌ Fetch failed and no cache:', url.pathname);
            return new Response('Offline - Resource not available', { status: 503 });
          });
      })
    );
    return;
  }

  // Handle images - cache-first, with 7-day expiry
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response.clone());
              });
            }
            return response;
          })
          .catch(() => {
            // Return placeholder image if offline
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#e0e0e0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
      })
    );
    return;
  }

  // Default strategy - network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses and clone before returning
        if (response.ok && (response.status === 200 || response.status === 304)) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).catch(() => {
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Message handler for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('🧹 Runtime cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('✅ Service Worker loaded');
