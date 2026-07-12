// ─────────────────────────────────────────────────
// БЛОКНОТ — Service Worker
// Версия кэша (поднимай вручную при каждом деплое)
// ─────────────────────────────────────────────────
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

// ── УСТАНОВКА: кешируем статику, НЕ делаем skipWaiting ──
self.addEventListener('install', event => {
  console.log(`[SW] Установка версии: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Cache addAll failed (some assets may be missing):', err);
      });
    })
  );
  // skipWaiting НЕ вызываем — ждём сигнала от клиента
});

// ── АКТИВАЦИЯ: чистим старые кеши, оповещаем клиентов о новой версии ──
self.addEventListener('activate', event => {
  console.log(`[SW] Активирована версия: ${CACHE_VERSION}`);
  event.waitUntil(
    (async () => {
      // Чистим все старые кеши, не совпадающие с текущей версией
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => {
          console.log(`[SW] Удаляю старый кеш: ${key}`);
          return caches.delete(key);
        })
      );

      // Оповещаем все открытые клиенты о том, что кеш обновлён
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_UPDATED',
          version: CACHE_VERSION
        });
      });
      console.log(`[SW] Оповещено клиентов: ${clients.length}`);
    })()
  );
  // clients.claim НЕ вызываем — старый worker продолжает обслуживать страницы,
  // пока они не перезагрузятся
});

// ── ОЖИДАНИЕ СИГНАЛА ОТ КЛИЕНТА ДЛЯ АКТИВАЦИИ ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Получен сигнал SKIP_WAITING, активирую новую версию...');
    self.skipWaiting();
  }
});

// ── FETCH: cache-first для статики, пропускаем Firebase/API ──
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
    return; // не перехватываем — network-first по умолчанию
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