const CACHE_NAME = 'pharmround-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Add any local icon files here:
  // './icon-192.png',
  // './icon-512.png'
];

// Install Event: Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches if the version changes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Serve from cache first, then fall back to network
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests for the app shell, not POST requests to your API
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached file if found
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        // Optionally, you can dynamically cache external fonts (like Google Fonts) here
        // But for a simple offline app shell, returning the network response is fine.
        return networkResponse;
      });
    })
  );
});
