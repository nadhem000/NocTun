const CACHE_NAME = 'noctun-site-v3';
const OFFLINE_URL = '/offline.html';
const ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/manifest.json',
    '/assets/images/placeholder.jpg',
    '/assets/icons/noc-logo-192x192.png',
    '/assets/icons/noc-logo-512x512.png'
    // Removed potentially missing files
];

// Install Service Worker with safe caching
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('Caching critical assets');
                await cache.add(OFFLINE_URL); // Always cache offline page first
                
                // Cache other assets with individual error handling
                const promises = ASSETS.map(url => 
                    cache.add(url).catch(error => 
                        console.warn(`Failed to cache ${url}:`, error)
                    )
                );
                
                await Promise.all(promises);
            })
            .then(() => self.skipWaiting())
    );
});

// Improved fetch handler with network timeout
self.addEventListener('fetch', (event) => {
    // Handle navigation requests first
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    // Cache-first strategy for other assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) return cachedResponse;

                // Network request with timeout
                const fetchPromise = fetch(event.request);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                );

                return Promise.race([fetchPromise, timeoutPromise])
                    .then(networkResponse => {
                        // Cache the new response
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                        return networkResponse;
                    })
                    .catch(() => {
                        // Special handling for different file types
                        if (event.request.url.endsWith('.pdf')) {
                            return caches.match('/assets/offline.pdf');
                        }
                        if (event.request.headers.get('accept').includes('image/')) {
                            return caches.match('/assets/images/placeholder.jpg');
                        }
                        return new Response('Offline content unavailable', { 
                            status: 503,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(
                cacheNames.map(cacheName => 
                    cacheName !== CACHE_NAME ? caches.delete(cacheName) : null
                )
            )
        )
    );
});