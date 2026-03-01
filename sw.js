const CACHE_NAME = "fruit-clicker-v4";

const FILES = [
  "./",
  "./index.html",
  "./offline.html",
  "./logo.png",
  "./manifest.json",
  "./sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith((async () => {
    // 1) zkus cache
    const cached = await caches.match(event.request);
    if (cached) return cached;

    // 2) zkus síť
    try {
      const fresh = await fetch(event.request);
      // uložit do cache pro příště
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone());
      return fresh;
    } catch (e) {
      // 3) offline fallback
      return caches.match("./offline.html");
    }
  })());
});
