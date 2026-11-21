/* Wallex service worker: app shell works fully offline.
   Strategy: serve from cache instantly, refresh the cache in the background,
   so changes to your files show up on the next launch. */
const CACHE = 'wallex-shell-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './chart.umd.min.js',
  './manifest.json',
  './icon-64.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './logo-dragonfi.png',
  './logo-gcash.png',
  './logo-gotyme.png',
  './logo-landbank.png',
  './logo-maribank.png',
  './logo-maya.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const network = fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
      return hit || network;
    })
  );
});
