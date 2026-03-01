// Fruit Clicker Service Worker
// Cíl: když je offline a jde o otevření stránky (navigate), vrátí offline.html
// Assety (png/js/json) jedou cache-first.

const CACHE_NAME = "fruit-clicker-v3"; // 🔥 změň vždycky když chceš vynutit update

const FILES = [
  "/FruitClicker/",
  "/FruitClicker/index.html",
  "/FruitClicker/offline.html",
  "/FruitClicker/logo.png",
  "/FruitClicker/manifest.json",
  "/FruitClicker/sw.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting(); // ať se nový SW nasadí hned
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim(); // ať začne řídit stránky hned
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 👉 každé otevření stránky (index.html / refresh)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => {
          // 🔥 když není internet → VŽDY offline stránka
          return caches.match("/FruitClicker/offline.html");
        })
    );
    return;
  }

  // 👉 ostatní soubory (obrázky atd.)
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req);
    })
  );
});

  // 2) Ostatní soubory (png/js/css/json) -> cache-first, fallback na fetch
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => {
          // když by něco chybělo
          return caches.match("/FruitClicker/offline.html");
        });
    })
  );
});

