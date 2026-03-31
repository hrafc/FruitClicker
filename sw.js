const CACHE_NAME = "fruit-clicker-v1.7.6";

const FILES = [
  "./",
  "./index.html",
  "./offline.html",
  "./icon.png",
  "./manifest.json",
  "./logo.png"
];

const OFFLINE_URL = new URL("./offline.html", self.location).href;
const ICON_URL = new URL("./icon.png", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    for (const file of FILES) {
      try {
        await cache.add(file);
      } catch (err) {
        console.warn("[SW] Nepodařilo se uložit do cache:", file, err);
      }
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Externí věci nech být
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML stránky
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response("Offline", { status: 503 });
      }
    })());
    return;
  }

  // Ostatní soubory
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const response = await fetch(req);

      if (response && response.status === 200 && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, response.clone());
      }

      return response;
    } catch {
      if (req.destination === "image") {
        const fallbackIcon = await caches.match(ICON_URL);
        if (fallbackIcon) return fallbackIcon;
      }

      if (req.destination === "document") {
        const offlinePage = await caches.match(OFFLINE_URL);
        if (offlinePage) return offlinePage;
      }

      return new Response("", {
        status: 204,
        statusText: "No Content"
      });
    }
  })());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
