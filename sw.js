// Fruit Clicker Service Worker (stabilní offline + bez spam errorů)

const CACHE_NAME = "fruit-clicker-v18"; // <- zvedni při změnách
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

  // Navigace (otevření stránky / refresh)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/FruitClicker/offline.html", { ignoreSearch: true })
      )
    );
    return;
  }

  // Assety: cache-first + ignoruj ?v=...
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          const url = new URL(req.url);

// ukládej do cache jen vlastní soubory (ne cizí requesty)
if (url.origin === self.location.origin) {
  url.search = ""; // zahodí ?v=... z GitHub Pages
  caches.open(CACHE_NAME).then((cache) => cache.put(url.toString(), copy));
}
          return res;
        })
        .catch(() =>
          caches.match("/FruitClicker/offline.html", { ignoreSearch: true })
        );
    })
  );
});












