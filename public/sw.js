const CACHE_NAME = 'hvylyna-cache-v12';
const URLS_TO_CACHE = [
  '/hvylyna-movchannya/',
  '/hvylyna-movchannya/manifest.json',
  '/hvylyna-movchannya/audio/intro.mp3',
  '/hvylyna-movchannya/audio/intro_alt.m4a',
  '/hvylyna-movchannya/audio/metronome.mp3',
  '/hvylyna-movchannya/audio/metronome_only.mp3',
  '/hvylyna-movchannya/audio/solemn_music.mp3',
  '/hvylyna-movchannya/audio/silence.mp3',
  '/hvylyna-movchannya/icons/icon-192x192.png',
  '/hvylyna-movchannya/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Strategy: Network First for HTML and Manifest
  if (event.request.mode === 'navigate' || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Strategy: Cache First for assets
  event.respondWith(
    caches.match(event.request)
      .then((cacheResponse) => {
        return cacheResponse || fetch(event.request).then((fetchResponse) => {
          // Optional: cache other assets on the fly
          return fetchResponse;
        }).catch(() => {
          console.warn('Fetch failed for:', event.request.url);
        });
      })
  );
});
