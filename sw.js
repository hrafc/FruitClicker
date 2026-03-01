// Fruit Clicker Service Worker (stabilní offline + bez spam errorů)

const CACHE_NAME = "fruit-clicker-v5"; // <- zvedni při změnách
const OFFLINE_URL = "/FruitClicker/offline.html";
const LOGO_URL = "/FruitClicker/logo.png";

const FILES = [
  "/FruitClicker/",
  "/FruitClicker/index.html",
  "/FruitClicker/offline.html",
  "/FruitClicker/logo.png",
  "/FruitClicker/manifest.json",
  "/FruitClicker/sw.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // jen GET (POST atd. neřešíme)
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 0) Favicon -> vrať logo z cache (ať to offline neřve)
  if (url.origin === location.origin && url.pathname === "/favicon.ico") {
    event.respondWith(
      caches.match(LOGO_URL).then((res) => res || fetch(LOGO_URL))
    );
    return;
  }

  // 1) Navigace (otevření stránky / refresh)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 2) Ostatní soubory (cache-first)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached || caches.match(OFFLINE_URL)); // fallback
    })
  );
});

