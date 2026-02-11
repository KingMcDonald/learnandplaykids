/**
 * Service Worker - Enables offline functionality and caching
 * Implements offline-first strategy with cache fallback
 */

const CACHE_VERSION = 'v2.0';
const CACHE_NAME = `learn-play-kids-${CACHE_VERSION}`;
const RUNTIME_CACHE = `learn-play-runtime-${CACHE_VERSION}`;

// Assets to cache on install - Updated to include all files
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/stats-methods.js',
  '/admin.js',
  '/sync.js',
  '/additional.js',
  '/service-worker.js',
  '/manifest.json',
  '/netlify.toml',
  '/assets/Brainy_Web_App.png',
  '/assets/Main_viewPoint.jpg',
  '/assets/Sub_viewPoint.jpg',
  '/assets/themeBGM.mp3'
];

// Install event - cache essential assets with robust error handling
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v2.0: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching essential assets (' + ASSETS_TO_CACHE.length + ' files)...');
      
      // Cache each asset individually for robust handling
      return Promise.all(
        ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).then(() => {
            console.log('✅ Cached:', asset);
          }).catch((err) => {
            console.error('❌ Failed to cache:', asset, err.message);
            // Don't fail install for individual asset failures
          });
        })
      );
    }).then(() => {
      console.log('✅ Service Worker installed - All available assets cached');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating v2.0...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated - v2.0 ready');
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

  // Handle HTML/CSS/JS - cache-first with network update
  if (request.destination === 'document' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      // Try all caches first
      caches.match(request).then((cached) => {
        if (cached) {
          console.log('📦 Cache hit:', url.pathname);
          // Try to update cache in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
                console.log('♻️ Updated cache:', url.pathname);
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
              console.log('✅ Cached new asset:', url.pathname);
            });
            return response;
          })
          .catch(() => {
            console.warn('❌ Offline and no cache:', url.pathname);
            // Try runtime cache as last resort
            return caches.open(RUNTIME_CACHE).then((runtimeCache) => {
              return runtimeCache.match(request).then((fallback) => {
                if (fallback) {
                  console.log('📦 Using runtime cache fallback:', url.pathname);
                  return fallback;
                }
                return new Response('Offline - Resource not available', { status: 503 });
              });
            });
          });
      })
    );
    return;
  }

  // Handle images - cache-first, no SVG fallback
  if (request.destination === 'image' || url.pathname.includes('/assets/')) {
    event.respondWith(
      // Check both caches for the image
      Promise.resolve()
        .then(() => caches.match(request))
        .then((cached) => {
          if (cached) {
            console.log('📦 Image cache hit:', url.pathname);
            return cached;
          }
          // Try RUNTIME_CACHE as well
          return caches.open(RUNTIME_CACHE).then((runtimeCache) => {
            return runtimeCache.match(request).then((runtimeCached) => {
              if (runtimeCached) {
                console.log('📦 Image runtime cache hit:', url.pathname);
                return runtimeCached;
              }
              // Not in cache, try network
              return fetch(request).then((response) => {
                if (response.ok) {
                  // Cache successful response
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, response.clone());
                  });
                }
                return response;
              });
            });
          });
        })
        .catch(() => {
          console.warn('❌ Image unavailable offline:', url.pathname);
          // Return a simple response instead of failing
          return new Response('Image not available offline', { status: 404 });
        })
    );
    return;
  }

  // Handle audio files - cache-first, robust
  if (request.destination === 'audio' || url.pathname.includes('.mp3') || url.pathname.includes('.wav')) {
    event.respondWith(
      // Check both caches for audio
      Promise.resolve()
        .then(() => caches.match(request))
        .then((cached) => {
          if (cached) {
            console.log('🔊 Audio cache hit:', url.pathname);
            return cached;
          }
          // Try RUNTIME_CACHE
          return caches.open(RUNTIME_CACHE).then((runtimeCache) => {
            return runtimeCache.match(request).then((runtimeCached) => {
              if (runtimeCached) {
                console.log('🔊 Audio runtime cache hit:', url.pathname);
                return runtimeCached;
              }
              // Not in cache, try network
              return fetch(request).then((response) => {
                if (response.ok) {
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, response.clone());
                  });
                }
                return response;
              });
            });
          });
        })
        .catch(() => {
          console.warn('❌ Audio file unavailable offline:', url.pathname);
          return new Response('Audio not available offline', { status: 404 });
        })
    );
    return;
  }

  // Default strategy - network-first with offline fallback
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
        console.log('📚 Attempting offline fallback for:', url.pathname);
        return caches.match(request).catch(() => {
          console.warn('❌ No offline resource available:', url.pathname);
          return new Response('Offline - Resource not available', { status: 503 });
        });
      })
  );
});

// Message handler for cache clearing and precaching
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('🧹 Runtime cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
  
  // Precache all assets on demand
  if (event.data && event.data.type === 'PRECACHE_ASSETS') {
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Precaching assets on demand...');
      ASSETS_TO_CACHE.forEach((asset) => {
        cache.add(asset).then(() => {
          console.log('✅ Precached:', asset);
        }).catch((err) => {
          console.error('❌ Failed to precache:', asset, err.message);
        });
      });
      event.ports[0].postMessage({ success: true, message: 'Precaching started' });
    });
  }
});

console.log('✅ Service Worker v2.0 loaded - Offline support with full feature parity');

