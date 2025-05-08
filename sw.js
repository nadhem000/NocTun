const CACHE_NAME = 'noctun-site-v2';  // Updated version
const OFFLINE_URL = '/offline.html';
const ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/manifest.json',
    '/assets/images/placeholder.jpg',
    '/assets/icons/noc-logo-192x192.png',
    '/assets/icons/noc-logo-512x512.png',  // Added for better PWA support
    '/assets/screenshots/screenshot_01.png',
    '/assets/screenshots/screenshot_02.png',
    '/assets/screenshots/screenshot_03.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching essential assets');
                return cache.addAll(ASSETS);
            })
            .catch((err) => {
                console.error('Failed to cache', err);
            })
    );
});

// Fetch Strategy: Cache First, then Network with Offline Fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and external URLs
    if (event.request.method !== 'GET' || 
        !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // For HTML pages, use network first with offline fallback
                if (event.request.headers.get('accept').includes('text/html')) {
                    return fetch(event.request)
                        .then((networkResponse) => {
                            // Cache the new response
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        })
                        .catch(() => {
                            // If offline and not in cache, show offline page
                            return caches.match(OFFLINE_URL);
                        });
                }

                // For other assets (CSS, JS, images), try network
                return fetch(event.request)
                    .then((response) => {
                        // Cache new assets
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, response.clone());
                                return response;
                            });
                    })
                    .catch(() => {
                        // Return placeholder for images if offline
                        if (event.request.url.includes('.jpg') || 
                            event.request.url.includes('.png')) {
                            return caches.match('/assets/images/placeholder.jpg');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Optional: Message handler for updates
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
   self.addEventListener('install', (e) => {
       e.waitUntil(
           caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
       );
   });

   self.addEventListener('fetch', (e) => {
       e.respondWith(
           caches.match(e.request)
               .then(res => res || fetch(e.request))
       );
   });
