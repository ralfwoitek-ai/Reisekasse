const VERSION = '1.0.4';
const CACHE = 'reisekasse-v' + VERSION;
const BASE = '/Reisekasse/';
const FILES = [BASE, BASE + 'index.html', BASE + 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Alter Cache gelöscht:', k);
          return caches.delete(k);
        })
      )
    ).then(() => {
      return self.clients.matchAll({type: 'window'}).then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first für HTML → immer frischeste Version
  if (e.request.url.includes('index.html') || e.request.url.endsWith(BASE)) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first für alles andere
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
