// sw.js
const CACHE_NAME = 'gym-max-cache-v4'; // Incremented version
const ESSENTIAL_ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js', 
  '/index.css', 
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
  '/sounds/timer-alarm.mp3',
  '/sounds/timer-start-pause.mp3',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Event: install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Caching essential app shell assets into ${CACHE_NAME}`);
        const cachePromises = ESSENTIAL_ASSETS_TO_CACHE.map(assetUrl => {
          const request = new Request(assetUrl, { mode: 'cors' });
          return fetch(request)
            .then(response => {
              if (response.ok || response.type === 'opaque') {
                console.log(`[SW] Caching: ${assetUrl} (Status: ${response.status})`);
                return cache.put(request, response.clone());
              }
              console.warn(`[SW] Failed to fetch and cache ${assetUrl}, status: ${response.status}`);
              return Promise.resolve(); // Allow other assets to cache
            })
            .catch(err => {
              console.warn(`[SW] Fetching ${assetUrl} for cache failed:`, err);
              if (assetUrl.includes("fonts.googleapis.com")) {
                const noCorsRequest = new Request(assetUrl, { mode: 'no-cors' });
                return fetch(noCorsRequest).then(opaqueResponse => {
                  if (opaqueResponse) {
                     console.log(`[SW] Caching (no-cors): ${assetUrl}`);
                     return cache.put(noCorsRequest, opaqueResponse.clone());
                  }
                  return Promise.resolve();
                }).catch(noCorsErr => {
                    console.warn(`[SW] Fetching ${assetUrl} (no-cors) also failed:`, noCorsErr);
                    return Promise.resolve();
                });
              }
              return Promise.resolve();
            });
        });
        return Promise.all(cachePromises)
          .then(() => console.log('[SW] All essential assets processed for caching.'))
          .catch(err => console.error('[SW] Error during individual asset caching:', err));
      })
      .catch(err => {
        console.error("[SW] Cache open/addAll failed during install", err);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Event: activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated and old caches cleaned.');
      return self.clients.claim(); // Crucial for SW to take control of the page immediately
    }).catch(err => console.error('[SW] Activation failed:', err))
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  // console.log(`[SW] Event: fetch, URL: ${event.request.url}, Mode: ${event.request.mode}`);

  if (
    requestUrl.hostname.includes('googleapis.com') && 
    !requestUrl.pathname.startsWith('/css2') 
  ) {
    // console.log(`[SW] Network-only for API call: ${event.request.url}`);
    event.respondWith(fetch(event.request));
    return;
  }
  
  if (requestUrl.hostname === 'esm.sh') {
    // console.log(`[SW] Stale-while-revalidate for esm.sh: ${event.request.url}`);
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchedResponsePromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            // console.log(`[SW] Updating cache for esm.sh: ${event.request.url}`);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // console.warn(`[SW] Fetch failed for ${event.request.url}, using cache if available. Error: ${err}`);
            return cachedResponse || Promise.reject(err); 
        });
        // if (cachedResponse) console.log(`[SW] Serving from cache (esm.sh): ${event.request.url}`);
        return cachedResponse || fetchedResponsePromise;
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    // console.log(`[SW] Navigate request: ${event.request.url}`);
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // if (response) console.log(`[SW] Serving navigate from cache: ${event.request.url}`);
          return response || fetch(event.request).catch(() => {
            // console.log(`[SW] Navigate fetch failed, trying /index.html from cache for ${event.request.url}`);
            return caches.match('/index.html');
          });
        })
        .catch(() => {
            // console.log(`[SW] All navigate attempts failed, trying / from cache for ${event.request.url}`);
            return caches.match('/');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // console.log(`[SW] Serving from cache: ${event.request.url}`);
        return cachedResponse;
      }
      // console.log(`[SW] Network request (not cached): ${event.request.url}`);
      return fetch(event.request).then((networkResponse) => {
        // Optionally cache new successful GET responses 
        // if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
        //   console.log(`[SW] Dynamically caching new asset: ${event.request.url}`);
        //   return caches.open(CACHE_NAME).then(cache => {
        //     cache.put(event.request, networkResponse.clone());
        //     return networkResponse;
        //   });
        // }
        return networkResponse;
      }).catch(error => {
        console.warn(`[SW] Network fetch failed for ${event.request.url}`, error);
        // Consider returning a fallback response for specific asset types if appropriate
      });
    })
  );
});