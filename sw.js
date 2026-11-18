// Service worker mínimo: permite instalar la app. No guarda copias para que siempre se vea la última versión.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
