// Offline support: fetch from the network when possible (so updates arrive),
// fall back to the cached copy when offline. Requests skip the browser's HTTP
// cache ("no-cache" still allows a cheap 304 reply), so a new release is picked
// up on the next start instead of minutes later.
const CACHE = 'sailboatparts-__BUILD__';
const FILES = ['./', 'index.html', 'app.js', 'app.css', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The same request, but revalidated with the server instead of read from the HTTP cache. */
function fresh(req) {
  return req.mode === 'navigate'
    ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
    : new Request(req, { cache: 'no-cache' });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // the version check must always ask the server, and is never kept offline
  if (url.pathname.endsWith('/version.json')) return;
  e.respondWith(
    fetch(fresh(e.request))
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit ?? caches.match('index.html'))),
  );
});
