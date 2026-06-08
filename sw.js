const CACHE_NAME = 'pharmround-v2';

// The essential files your app needs to load when offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
  // If you added app icons, add them here (e.g., './icon-192.png')
];

// 1. INSTALL EVENT - Caches the static UI
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// 2. ACTIVATE EVENT - Cleans up old caches when you update the app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Claim all clients immediately so updates apply right away
  self.clients.claim();
});

// 3. FETCH EVENT - Intercepts network requests
self.addEventListener('fetch', (event) => {
  // CRITICAL: Ignore Google Apps Script API calls! 
  // We want these to always try the network and fail gracefully so your local DB queue handles them.
  if (event.request.url.includes('script.google.com')) {
    return; // Let the browser handle it normally
  }

  // For the UI and layout (HTML, Manifest), use a "Stale-While-Revalidate" strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request).then((networkResponse) => {
        // Update the cache with the newest version behind the scenes
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch((err) => {
        // If network fails (offline), just return what we have in the cache silently
        console.log('[Service Worker] Network fetch failed, serving from cache:', event.request.url);
      });

      // Instantly return the cached version if we have it, otherwise wait for the network
      return cachedResponse || networkFetch;
    })
  );
});
