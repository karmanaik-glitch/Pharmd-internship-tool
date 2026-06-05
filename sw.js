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
  // 1. Always ignore POST requests (like when we upload the queue)
  if (event.request.method !== 'GET') return;

  // 2. EXPLICIT BYPASS: Never intercept calls to your Google Apps Script API
  // This ensures the app always gets fresh data from Sheets, never a cached version
  if (event.request.url.includes('script.google.com') || event.request.url.includes('script.googleusercontent.com')) {
    return; // Let the browser handle this request normally over the network
  }

  // 3. For everything else (HTML, icons), check the cache first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached file if found (instant offline load)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
