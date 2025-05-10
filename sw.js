const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'content-sync';
const CONTENT_VERSION = 'v3';
const CACHE_NAME = `noctun-site-${CONTENT_VERSION}`;
const DB_NAME = 'syncQueueDB';
const STORE_NAME = 'syncQueue';

const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/contact.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/manifest.json',
  '/assets/images/placeholder.jpg',
  '/assets/icons/noc-logo-192x192.png',
  '/assets/icons/noc-logo-512x512.png',
  '/assets/screenshots/screenshot_01.png',
  '/assets/screenshots/screenshot_02.png',
  '/assets/screenshots/screenshot_03.png',
  '/assets/icons/pdf-icon-256x256.png',
  '/assets/icons/image-icon-256x256.png',
  '/assets/icons/video-icon-256x256.png',
  '/assets/pdf/iau_strategy_2030.pdf'
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
    ).then(() => self.clients.claim())
  );
});

// ========================
// Fetch Handling
// ========================
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (isMediaRequest(event.request)) {
    event.respondWith(handleMediaRequest(event));
    return;
  }

  event.respondWith(networkFirstThenCache(event));
});

async function handleNavigationRequest(event) {
  try {
    const networkResponse = await fetch(event.request);
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(OFFLINE_URL);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function handleMediaRequest(event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(event.request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(event.request);
    await cache.put(event.request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return serveMediaFallback(event.request);
  }
}

async function networkFirstThenCache(event) {
  try {
    const networkResponse = await fetch(event.request);
    if (event.request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// ========================
// Background Sync
// ========================
self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      handleBackgroundSync()
        .catch(error => {
          console.error('Sync failed:', error);
          return Promise.reject(error);
        })
    );
  }
});

async function handleBackgroundSync() {
  const queue = await getSyncQueue();
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body
      });
      
      if (!response.ok) throw new Error('HTTP error '+response.status);
      await removeFromQueue(item.id);
    } catch (error) {
      console.error(`Failed to sync ${item.url}:`, error);
      throw error;
    }
  }
}

// ========================
// IndexedDB Queue Management
// ========================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToQueue(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({
      id: Date.now(),
      ...data,
      timestamp: new Date().toISOString()
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getSyncQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromQueue(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ========================
// Utilities
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
// Periodic Sync
// ========================
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-refresh') {
    event.waitUntil(refreshContent());
  }
});

async function refreshContent() {
  const cache = await caches.open(CACHE_NAME);
  try {
    await Promise.all(ASSETS.map(async url => {
      const fresh = await fetch(url, { cache: 'reload' });
      await cache.put(url, fresh);
    }));
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'content-updated',
        updated: new Date().toISOString()
      });
    });
    
    return true;
  } catch (error) {
    console.error('Refresh failed:', error);
    return false;
  }
}