const CACHE_NAME = 'noctun-site-v3';
const OFFLINE_URL = '/offline.html';
const SYNC_QUEUE = 'media-sync-queue'; // IndexedDB store name for pending syncs
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

// ========================
// Enhanced Cache Strategies
// ========================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => 
            Promise.all(
                cacheNames.map((cacheName) => 
                    cacheName !== CACHE_NAME ? caches.delete(cacheName) : null
                )
            )
        )
    );
});

// ========================
// Background Sync Integration
// ========================

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-media') {
        event.waitUntil(
            processMediaSync()
                .catch(error => {
                    console.error('Sync failed, retrying next sync:', error);
                    return Promise.reject(error); // Triggers automatic retry
                })
        );
    }
});

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'refresh-content') {
        event.waitUntil(
            refreshContent()
                .then(() => cleanOldMedia())
        );
    }
});

// ========================
// Sync Processing Functions
// ========================

async function processMediaSync() {
    const queue = await getSyncQueue();
    for (const item of queue) {
        try {
            await handleMediaSyncItem(item);
            await removeFromSyncQueue(item.id);
        } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error);
            throw error; // Retry entire queue on failure
        }
    }
}

async function handleMediaSyncItem(item) {
    // Customize based on your media handling needs
    switch (item.type) {
        case 'photo':
            return syncPhoto(item);
        case 'pdf':
            return syncPDF(item);
        case 'video':
            return syncVideo(item);
        default:
            throw new Error(`Unknown media type: ${item.type}`);
    }
}

async function refreshContent() {
    // Fetch fresh content and update cache
    const updatedContent = await fetch('/api/recent-content');
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/recent-content', updatedContent.clone());
    return updatedContent;
}

// ========================
// Media Type Handlers
// ========================

async function syncPhoto(item) {
    const formData = new FormData();
    formData.append('photo', item.file);
    return fetch('/api/upload-photo', {
        method: 'POST',
        body: formData
    });
}

async function syncPDF(item) {
    return fetch('/api/upload-pdf', {
        method: 'POST',
        headers: {'Content-Type': 'application/pdf'},
        body: item.file
    });
}

async function syncVideo(item) {
    // Implement resumable upload logic if needed
    return fetch('/api/upload-video', {
        method: 'POST',
        body: item.file
    });
}

// ========================
// Queue Management
// ========================

async function getSyncQueue() {
    // Implement IndexedDB access for your queue
    return []; // Return queued items from database
}

async function removeFromSyncQueue(id) {
    // Implement IndexedDB removal
}

// ========================
// Enhanced Fetch Handler
// ========================

self.addEventListener('fetch', (event) => {
    // Media-specific cache handling
    if (isMediaRequest(event.request)) {
        handleMediaFetch(event);
    } else {
        handleStandardFetch(event);
    }
});

function handleMediaFetch(event) {
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetchWithNetworkFallback(event))
    );
}

async function fetchWithNetworkFallback(event) {
    try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
        return response;
    } catch (error) {
        return handleMediaOffline(event.request);
    }
}

function handleMediaOffline(request) {
    if (request.url.includes('.jpg')) return caches.match('/assets/images/placeholder.jpg');
    if (request.url.includes('.pdf')) return caches.match('/assets/offline.pdf');
    return new Response('Offline', {status: 503});
}

function isMediaRequest(request) {
    return request.url.match(/\.(jpg|jpeg|png|pdf|mp4)$/i);
}

// ========================
// Maintenance Tasks
// ========================

async function cleanOldMedia() {
    // Implement logic to remove old cached media
    // Example: Keep only last 50 media items
}