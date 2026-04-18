const CACHE_NAME = 'zagrotech-v1';
const STATIC_ASSETS = [
  '/favicon.ico',
];
const MAX_IMAGE_CACHE_ENTRIES = 80;

// Install: cache only essential static assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches aggressively
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cap the cache to MAX_IMAGE_CACHE_ENTRIES by evicting the oldest entries
// (FIFO — Cache Storage doesn't expose access timestamps, so this is the
// pragmatic approximation of LRU). Keeps memory bounded when OptimizedImage
// generates many width-variant URLs for the same source.
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const overflow = keys.length - maxEntries;
  for (let i = 0; i < overflow; i++) {
    await cache.delete(keys[i]);
  }
}

// Fetch: network-first for everything, cache only images and fonts
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin API calls
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase')) return;

  // NEVER cache JS/CSS scripts — prevents stale bundle issues
  if (request.destination === 'script' || request.destination === 'style') {
    return; // Let browser handle normally (network only)
  }

  // Cache-first for images and fonts only
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).then(() => {
                // Trim only when we add an image — fonts are tiny and few
                if (request.destination === 'image') {
                  trimCache(CACHE_NAME, MAX_IMAGE_CACHE_ENTRIES);
                }
              });
            });
          }
          return response;
        })
      )
    );
    return;
  }

  // Network-first for navigation/documents
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
