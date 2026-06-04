/**
 * Service Worker — The Maze Game PWA.
 *
 * Strategy:
 *   - Navigations: network-first, falling back to the cached app shell
 *     (index.html) so the game launches and deep-links work fully offline.
 *   - Same-origin static assets: cache-first, then network (and cache it).
 *   - API (cross-origin Vercel) is left to the browser; any same-origin
 *     /api/ call is network-first with a cache fallback.
 *
 * Paths are RELATIVE to this script's location, so the worker works whether
 * the site is served from the domain root (Render) or a sub-path (GitHub Pages).
 */

const VERSION = 'v1.4.0';
const CACHE_NAME = `maze-game-${VERSION}`;
const RUNTIME_CACHE = `maze-game-runtime-${VERSION}`;
const APP_SHELL = './index.html';

// Core assets cached on install (relative → resolved against the SW scope).
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/css/style.css',
  './src/js/game.js',
  './src/js/ui-components.js',
  './src/js/auth.js',
  './src/js/i18n.js',
  './src/html/about.html',
  './utils/favicon.ico',
  './utils/image-72x72.png',
  './utils/image-192x192.png',
  './utils/image-384x384.png',
  './utils/image-512x512.png',
  './utils/MazeUI.png',
];

// Install — precache the app shell + core assets. Tolerate individual misses
// (a single 404 must not abort the whole install on a static host).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          // `cache: 'reload'` bypasses the browser HTTP cache so a version bump
          // always precaches the freshest files (avoids stale-asset traps).
          PRECACHE_ASSETS.map((asset) => cache.add(new Request(asset, { cache: 'reload' })))
        )
      )
      .then(() => self.skipWaiting())
  );
});

// Activate — drop caches from older versions, take control immediately.
self.addEventListener('activate', (event) => {
  const keep = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

// Let the page trigger an immediate update (postMessage 'SKIP_WAITING').
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET (POST/PUT etc. must always hit the network).
  if (request.method !== 'GET') return;

  // Navigations: network-first, fall back to the cached app shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(APP_SHELL)) || Response.error();
        })
    );
    return;
  }

  // Cross-origin (e.g. the Vercel API, Google Fonts) — let the browser handle it.
  if (!request.url.startsWith(self.location.origin)) return;

  // Same-origin API — network-first, cache fallback.
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin static assets — cache-first, then network (and cache it).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

// ---- Background sync for offline score submissions ----
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending-scores', 'readonly');
    const store = tx.objectStore('pending-scores');
    const scores = await store.getAll();

    for (const score of scores) {
      try {
        const response = await fetch('/api/v1/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score.data),
        });
        if (response.ok) {
          const deleteTx = db.transaction('pending-scores', 'readwrite');
          await deleteTx.objectStore('pending-scores').delete(score.id);
        }
      } catch (error) {
        console.error('Failed to sync score:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('maze-game-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-scores')) {
        db.createObjectStore('pending-scores', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// ---- Push notifications ----
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'The Maze Game';
  const options = {
    body: data.body || 'New update available!',
    icon: './utils/image-192x192.png',
    badge: './utils/image-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || './',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
