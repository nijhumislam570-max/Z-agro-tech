const CACHE_NAME = 'zagrotech-v1';
const STATIC_ASSETS = [
  '/favicon.ico',
];

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
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
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