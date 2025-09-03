const CACHE_NAME = 'weight-tracker-cache-v1';
const ASSETS_TO_CACHE = [
  '/',                     // your index.html
  '/index.html',
  '/js/app.js',            // your main JS
  '/css/tailwind.css',     // local Tailwind CSS
  '/favicon.ico',           // any icons
  // add images, chart.js, or any other static files you need offline
];

// Install event – cache everything
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event – cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event – serve cached assets first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedRes => {
      if (cachedRes) {
        return cachedRes;
      }
      return fetch(event.request)
        .then(networkRes => {
          // Optional: cache new requests dynamically
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          // Fallback if offline and asset not cached
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
