// Service worker: siempre pide la versión más nueva de cada archivo (red primero),
// para que nunca se mezclen archivos de versiones distintas por el caché del navegador.
// Si no hay internet, usa la última copia guardada.
const CACHE = 'alimichu';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  evento.respondWith(
    (async () => {
      try {
        // no-cache: el navegador pregunta al servidor si hay versión nueva antes de usar su copia.
        const respuesta = await fetch(request, { cache: 'no-cache' });
        if (respuesta.ok) evento.waitUntil(guardar(request, respuesta.clone()));
        return respuesta;
      } catch {
        return (await buscar(request)) ?? Response.error();
      }
    })(),
  );
});

// Si el caché no está disponible (por ejemplo, en modo privado), la app sigue funcionando desde la red.
async function guardar(request, respuesta) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, respuesta);
  } catch {
    // Sin caché: solo se pierde el modo sin conexión.
  }
}

async function buscar(request) {
  try {
    return await caches.match(request);
  } catch {
    return undefined;
  }
}
