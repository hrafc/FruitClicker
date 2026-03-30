const CACHE_NAME = "fruit-clicker-v1.2.4";

const FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/icon.png",
  "/logo.png",
  "/manifest.json"
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
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nech externí služby být, ať je SW nerozbíjí
  if (
    url.origin !== location.origin ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("googlesyndication.com") ||
    url.hostname.includes("doubleclick.net") ||
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("firebasestorage.app")
  ) {
    return;
  }

  // HTML stránky
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => response)
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Ostatní soubory
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });

          return response;
        })
        .catch(() => {
          if (req.destination === "image") {
            return caches.match("/icon.png");
          }

          if (req.destination === "document") {
            return caches.match("/offline.html");
          }

          return new Response("", {
            status: 204,
            statusText: "No Content"
          });
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
