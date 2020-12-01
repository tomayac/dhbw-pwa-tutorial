console.log('Hello from service worker');
// 5
const cacheName = 'offline-cache';

const files = [
  '.',
  'index.html',
  'about.html',
  'app.js',
  'helpers.js',
  'icon.png',
  'style.css',
  'manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      self.skipWaiting();
      const cache = await caches.open(cacheName);
      await cache.addAll(files);
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = event.request.url;
      const cache = await caches.open(cacheName);
      try {
        const networkResponse = await fetch(url);
        if (networkResponse.ok) {
          console.log(`From network: ${url}.`);
          return networkResponse;
        }
        throw Error(`Fetch failed with status ${networkResponse.status}`);
      } catch (err) {
        console.log(`From cache: ${url}.`);
        return cache.match(url);
      }
    })()
  );
});
