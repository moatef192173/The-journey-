// sw.js — simple offline cache for PE Coach Pro F3
const CACHE = "pe-coach-f3-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./Script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(res => res || fetch(req).then(net => {
      try {
        if (new URL(req.url).origin === location.origin) {
          const clone = net.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
      } catch {}
      return net;
    }))
  );
});
