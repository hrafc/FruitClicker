// 🍓 Fruit Clicker – Service Worker (OFFLINE READY)

// 👉 změň číslo verze vždy když něco upravíš
const CACHE_NAME = "fruit-clicker-v1";

// 👉 co se má uložit do offline cache
const FILES_TO_CACHE = [
  "/FruitClicker/",
  "/FruitClicker/index.html",
  "/FruitClicker/offline.html",
  "/FruitClicker/logo.png",
  "/FruitClicker/manifest.json"
];


// ===============================
// INSTALL → uloží soubory do cache
// ===============================
self.addEventListener("install", (event) => {
  console.log("SW: Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Caching files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting(); // aktivuje se hned
});


// ===============================
// ACTIVATE → smaže staré cache
// ===============================
self.addEventListener("activate", (event) => {
  console.log("SW: Activating...");

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("SW: Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim(); // začne řídit stránku okamžitě
});


// ===============================
// FETCH → co dělat při načítání stránky
// ===============================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response; // online → normálně načti
      })
      .catch(() => {
        // offline → zkus cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/FruitClicker/offline.html");
        });
      })
  );
});
