const CACHE_NAME = 'hvylyna-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/audio/intro.mp3',
  '/audio/metronome.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
