const CACHE_NAME = 'grecko-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Grecko SW] Installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Grecko SW] Activated');
  event.waitUntil(clients.claim());
});

// Fetch event - basic passthrough (add caching later if needed)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
