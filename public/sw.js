const CACHE_NAME = 'hvylyna-cache-v3';
const URLS_TO_CACHE = [
  '/hvylyna-movchannya/',
  '/hvylyna-movchannya/manifest.json',
  '/hvylyna-movchannya/audio/intro.mp3',
  '/hvylyna-movchannya/audio/intro_alt.m4a',
  '/hvylyna-movchannya/audio/metronome.mp3',
  '/hvylyna-movchannya/audio/metronome_only.mp3',
  '/hvylyna-movchannya/audio/solemn_music.mp3',
  '/hvylyna-movchannya/icons/icon-192x192.png',
  '/hvylyna-movchannya/icons/icon-512x512.png'
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
