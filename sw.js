// Fruit Clicker Service Worker
// Režim: když je OFFLINE a jde o otevření stránky -> vždy vrátí offline.html

const CACHE_NAME = "fruit-clicker-v5";

const FILES = [
  "/FruitClicker/",
  "/FruitClicker/index.html",
  "/FruitClicker/offline.html",
  "/FruitClicker/logo.png",
  "/FruitClicker/manifest.json",
  "/FruitClicker/sw.js"
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

  // ✅ NAVIGACE (otevření stránky / reload / přechod) -> NETWORK FIRST
  // Offline = ukaž offline.html (i když je index.html v cache)
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (e) {
        return caches.match("/FruitClicker/offline.html");
      }
    })());
    return;
  }

  // ✅ Ostatní soubory -> CACHE FIRST (rychlé)
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone());
      return fresh;
    } catch (e) {
      // když nejde síť a soubor není v cache, vrať aspoň offline stránku
      return caches.match("/FruitClicker/offline.html");
    }
  })());
});
