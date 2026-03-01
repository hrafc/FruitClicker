// Fruit Clicker Service Worker
// - Navigace (otevření stránky/refresh): když nejde síť -> offline.html
// - Assety: cache-first, fallback na network
// - Update: SKIP_WAITING přes message + clients.claim

const CACHE_NAME = "fruit-clicker-v3";

const FILES = [
  "/FruitClicker/",
  "/FruitClicker/index.html",
  "/FruitClicker/offline.html",
  "/FruitClicker/logo.png",
  "/FruitClicker/manifest.json",
  "/FruitClicker/sw.js",
];

// 1) Install: nacacheuj soubory
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// 2) Activate: smaž staré cache + převezmi kontrolu
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 3) Message: umožníme index.html poslat "SKIP_WAITING"
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 4) Fetch: navigace -> network, při offline -> offline.html
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navigace (HTML stránky)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/FruitClicker/offline.html"))
    );
    return;
  }

  // Ostatní soubory: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
