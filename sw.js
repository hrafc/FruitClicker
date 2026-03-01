const CACHE_NAME = "fruit-clicker-v999"; // změň číslo vždy když testuješ

const FILES = [
  "./index.html",
  "./offline.html",
  "./logo.png",
  "./manifest.json",
  "./sw.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache po jednom (i když něco failne, ostatní se uloží)
    const results = await Promise.allSettled(
      FILES.map(async (url) => {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`${url} -> ${res.status}`);
        await cache.put(url, res);
        return url;
      })
    );

    // Logni co failuje (uvidíš v SW konzoli)
    results.forEach(r => {
      if (r.status === "rejected") console.log("CACHE FAIL:", r.reason);
      else console.log("CACHED:", r.value);
    });

    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Navigace: když offline → offline.html
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(event.request);
      } catch {
        return (await caches.match("./offline.html")) || new Response("OFFLINE", { status: 503 });
      }
    })());
    return;
  }

  // Ostatní: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      return await fetch(event.request);
    } catch {
      return (await caches.match("./offline.html")) || new Response("OFFLINE", { status: 503 });
    }
  })());
});
