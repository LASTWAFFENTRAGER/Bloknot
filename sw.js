const CACHE_VERSION = 'bloknot-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './desktop.html',
  './shared.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Установка: кешируем статику
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Cache addAll failed (some assets may be missing):', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация: чистим старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: стратегия cache-first для статики, network-first для всего остального
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  // Пропускаем Firebase и gstatic (всегда свежие данные)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('trycloudflare.com')
  ) {
    return; // network-first по умолчанию (просто не перехватываем)
  }

  // Для статики — cache-first
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, cloned));
          }
          return networkResponse;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});