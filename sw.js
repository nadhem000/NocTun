
const CACHE_NAME = 'noctun-site-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/styles/main.css',
    '/manifest.json',
    '/scripts/main.js',
    '/assets/images/placeholder.jpg',
    // Only cache essential assets
    '/assets/icons/noc-logo-192x192.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request)
                .catch(() => caches.match('/offline.html')))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
