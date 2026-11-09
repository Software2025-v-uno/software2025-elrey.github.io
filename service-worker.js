// Service Worker para Supermercado El Rey (PWA)
const CACHE = "el-rey-v1";

// App shell: recursos locales que se guardan para uso sin conexión.
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./logo.png",
  "./fondo-chat.jpg",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // No fallar la instalación si algún recurso opcional no existe.
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo gestionamos peticiones GET del mismo origen (los recursos locales).
  // Firebase, Firestore y otros servicios externos van directo a la red.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  // Navegaciones: red primero, con respaldo a la caché (modo sin conexión).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Recursos estáticos: caché primero, y si no está, red (y se guarda).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
    )
  );
});
