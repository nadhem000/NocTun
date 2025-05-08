const CACHE_NAME = 'noctun-site-v3';
const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'media-sync';
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
    '/assets/screenshots/screenshot_03.png',
    '/assets/screenshots/pdf-icon-256x256.png',
    '/assets/screenshots/image-icon-256x256.png',
    '/assets/screenshots/video-icon-256x256.png',
    '/assets/pdf/iau_strategy_2030.pdf'  // Add a generic offline PDF placeholder
];

// ========================
// Installation & Activation
// ========================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

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

// ========================
// Background Sync Handling
// ========================

self.addEventListener('sync', event => {
    if (event.tag === SYNC_TAG) {
        event.waitUntil(
            handleBackgroundSync()
                .catch(error => {
                    console.error('Sync failed, will retry:', error);
                    return Promise.reject(error);
                })
        );
    }
});

async function handleBackgroundSync() {
    const queue = await getSyncQueue();
    for (const item of queue) {
        try {
            await syncMediaItem(item);
            await removeFromQueue(item.id);
        } catch (error) {
            console.error(`Failed to sync ${item.type}:`, error);
            throw error;
        }
    }
}

// ========================
// Enhanced Fetch Handling
// ========================

self.addEventListener('fetch', (event) => {
    // Handle navigation requests separately
    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event));
        return;
    }

    // Handle media requests with cache-first strategy
    if (isMediaRequest(event.request)) {
        event.respondWith(handleMediaRequest(event));
        return;
    }

    // Default network-first strategy for other assets
    event.respondWith(networkFirstThenCache(event));
});

async function handleNavigationRequest(event) {
    try {
        const networkResponse = await fetch(event.request);
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse || Response.error();
    }
}

async function handleMediaRequest(event) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);
    
    if (cachedResponse) return cachedResponse;

    try {
        const networkResponse = await fetch(event.request);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        return serveMediaFallback(event.request);
    }
}

async function networkFirstThenCache(event) {
    try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || Response.error();
    }
}

// ========================
// Offline Support Utilities
// ========================

function isMediaRequest(request) {
    return /\.(jpg|jpeg|png|pdf|mp4|webm)$/i.test(request.url);
}

function serveMediaFallback(request) {
    if (request.url.includes('.pdf')) {
        return caches.match('/assets/pdf/iau_strategy_2030.pdf');
    }
    if (/\.(mp4|webm)$/i.test(request.url)) {
        return new Response('Video unavailable offline', { 
            status: 503,
            headers: {'Content-Type': 'text/plain'}
        });
    }
    return caches.match('/assets/images/placeholder.jpg');
}

// ========================
// Sync Queue Management (Stubs - implement with IndexedDB)
// ========================

async function getSyncQueue() {
    // Implement with your IndexedDB logic
    return [];
}

async function removeFromQueue(id) {
    // Implement with your IndexedDB logic
}

async function syncMediaItem(item) {
    // Implement based on your media type handling
    const formData = new FormData();
    formData.append('file', item.file);
    
    return fetch(`/api/upload-${item.type}`, {
        method: 'POST',
        body: formData
    });
}

// ========================
// Periodic Content Refresh
// ========================

self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-refresh') {
        event.waitUntil(refreshContent());
    }
});

async function refreshContent() {
    try {
        const [pages, translations] = await Promise.all([
            fetch('/api/updated-pages'),
            fetch('/api/translations')
        ]);
        
        const cache = await caches.open(CACHE_NAME);
        await Promise.all([
            cache.put('/api/updated-pages', pages.clone()),
            cache.put('/api/translations', translations.clone())
        ]);
        
        return clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({type: 'content-updated'}));
        });
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}