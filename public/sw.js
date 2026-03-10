const CACHE_NAME = 'finanzas-app-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/favicon.ico'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Só intercepta requisições do mesmo domínio
    if (url.origin !== self.location.origin) {
        return;
    }

    // Ignora requisições de API para o Supabase e arquivos de dados do Next.js (esses exigem rede)
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request);
            })
        );
        return;
    }

    // Estratégia de Cache-First para Ativos Estáticos (JS de chunks, CSS, Imagens)
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
                    }
                    return networkResponse;
                }).catch(() => {
                    // Fallback para imagens se offline e não cacheado
                    if (request.destination === 'image') {
                        return caches.match('/icons/icon-192x192.png');
                    }
                });
            })
        );
        return;
    }

    // Estratégia de Network-First com Fallback para Cache (para HTML e navegação principal)
    event.respondWith(
        fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                // Se for navegação e não tem no cache, retorna o root (SPA behavior)
                if (request.mode === 'navigate') {
                    return caches.match('/');
                }
            });
        })
    );
});
