// Versão do cache — incrementar a cada deploy para forçar atualização
const CACHE_VERSION = 'v5';
const CACHE_NAME = `finanza-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/favicon.ico'
];

// ── INSTALL: abre o cache novo e pula espera ──────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cache ' + CACHE_NAME + ' instalado');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // CRÍTICO: não espera fechar as abas antigas — ativa imediatamente
    self.skipWaiting();
});

// ── ACTIVATE: apaga caches antigos E avisa todos os clientes ─────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // 1. Limpar caches antigos
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames.map((name) => {
                        if (name !== CACHE_NAME) {
                            console.log('[SW] Removendo cache antigo:', name);
                            return caches.delete(name);
                        }
                    })
                )
            ),
            // 2. Tomar controle de todas as abas abertas
            self.clients.claim()
        ])
    );

    // 3. Notificar todas as abas para recarregar a página automaticamente
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
            console.log('[SW] Recarregando aba:', client.url);
            client.navigate(client.url);
        });
    });
});

// ── FETCH ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Só intercepta requisições do mesmo domínio
    if (url.origin !== self.location.origin) return;

    // Só GET
    if (request.method !== 'GET') return;

    // API e dados do Next.js → sempre rede
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Ativos estáticos (_next/static) → Cache-First
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/icons/') ||
        request.destination === 'image' ||
        request.destination === 'script' ||
        request.destination === 'style'
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response?.status === 200) {
                        const toCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
                    }
                    return response;
                }).catch(() => {
                    if (request.destination === 'image') {
                        return caches.match('/icons/icon-192x192.png');
                    }
                });
            })
        );
        return;
    }

    // HTML e navegação → Network-First com fallback
    event.respondWith(
        fetch(request).then((response) => {
            if (response?.status === 200) {
                const toCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
            }
            return response;
        }).catch(() =>
            caches.match(request).then((cached) => {
                if (cached) return cached;
                if (request.mode === 'navigate') return caches.match('/');
            })
        )
    );
});
