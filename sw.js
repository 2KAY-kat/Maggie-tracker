// export function registerServiceWorker() {
//     if ('serviceWorker' in navigator) {
//         navigator.serviceWorker.register('/sw.js')
//             .then(registration => {
//                 console.log('Service Worker registered', registration);

//                 registration.onupdatefound = () => {
//                     const installingWorker = registration.installing;
//                     installingWorker.onstatechange = () => {
//                         if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
//                             window.location.reload();
//                         }
//                     };
//                 };
//             })
//             .catch(err => console.error('Service Worker registration failed:', err));
//     }
// }

const CACHE_NAME = 'weight-tracker-cache-v1';
const ASSETS_TO_CACHE = [
  '/',                     
  '/index.html',
  '/js/app.js',            
  '/favicon.ico',           
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
