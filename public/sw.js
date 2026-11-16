// Minimal offline support: cache the app shell and every same-origin GET we see.
// Bump VERSION to force clients to drop old caches after a deploy.
const VERSION = "v1";
const CACHE = `tether-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["/", "/manifest.webmanifest", "/icon.svg"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Hashed build assets never change: cache first. Pages: network first, fall back to cache.
  const immutable = url.pathname.startsWith("/_next/static/");
  event.respondWith(
    immutable
      ? caches.match(req).then((hit) => hit || fetchAndCache(req))
      : fetchAndCache(req).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});

function fetchAndCache(req) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  });
}
