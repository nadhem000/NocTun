const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'content-sync';
const CONTENT_VERSION = 'v3';
const CACHE_NAME = `noctun-site-${CONTENT_VERSION}`;
const DB_NAME = 'syncQueueDB';
const STORE_NAME = 'syncQueue';

// Security improvement: Use strict CSP-compatible assets list
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/contact.html',
  '/our_members.html',
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
].map(url => new URL(url, self.location.origin).href); // Ensure absolute URLs

// ========================
// Installation & Activation
// ========================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Security improvement: Add cache.addAll error handling
        return cache.addAll(ASSETS).catch(error => {
          console.error('Failed to cache:', error);
          throw error;
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(cacheName => 
          cacheName.startsWith('noctun-site-') && cacheName !== CACHE_NAME ? 
            caches.delete(cacheName) : 
            null
        ).filter(Boolean) // Filter out null values
      )
    ).then(() => self.clients.claim())
  );
});

// ========================
// Fetch Handling (Security Enhanced)
// ========================
self.addEventListener('fetch', (event) => {
  // Security improvement: Skip non-GET requests and opaque responses
  if (event.request.method !== 'GET' || event.request.mode === 'no-cors') {
    return;
  }

  // Security improvement: Validate request URL
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return; // Skip cross-origin requests unless specifically handled
  }

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
    // Security improvement: Add timeout to fetch
    const networkResponse = await timeoutFetch(event.request.clone(), 5000);
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(OFFLINE_URL);
    return cachedResponse || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function handleMediaRequest(event) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(event.request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await timeoutFetch(event.request.clone(), 5000);
    // Security improvement: Validate response before caching
    if (networkResponse && networkResponse.ok) {
      await cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return serveMediaFallback(event.request);
  }
}

async function networkFirstThenCache(event) {
  try {
    const networkResponse = await timeoutFetch(event.request.clone(), 5000);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// ========================
// Background Sync (Security Enhanced)
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
      // Security improvement: Validate sync items
      if (!isValidSyncItem(item)) {
        await removeFromQueue(item.id);
        continue;
      }

      const response = await timeoutFetch(new Request(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body,
        credentials: 'same-origin' // Security: Restrict credentials
      }), 10000);
      
      if (!response.ok) throw new Error('HTTP error '+response.status);
      await removeFromQueue(item.id);
    } catch (error) {
      console.error(`Failed to sync ${item.url}:`, error);
      throw error;
    }
  }
}

// ========================
// IndexedDB Queue Management (Security Enhanced)
// ========================
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Security improvement: Create indexes for better validation
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToQueue(data) {
  // Security improvement: Validate queue data
  if (!isValidSyncData(data)) {
    throw new Error('Invalid sync data');
  }

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
// Utilities (Enhanced)
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
      headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
  }
  return caches.match('/assets/images/placeholder.jpg');
}

// Security improvement: Timeout wrapper for fetch
function timeoutFetch(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Security improvement: Validate sync data
function isValidSyncData(data) {
  try {
    return data && 
      typeof data.url === 'string' &&
      new URL(data.url).origin === self.location.origin &&
      ['GET', 'POST', 'PUT', 'DELETE'].includes(data.method) &&
      (data.headers === null || typeof data.headers === 'object') &&
      (data.body === null || typeof data.body === 'string');
  } catch {
    return false;
  }
}

// Security improvement: Validate sync item
function isValidSyncItem(item) {
  return item && 
    typeof item.id === 'number' &&
    isValidSyncData(item) &&
    typeof item.timestamp === 'string';
}

// ========================
// Periodic Sync (Security Enhanced)
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
      try {
        const fresh = await timeoutFetch(new Request(url, { cache: 'reload' }), 5000);
        if (fresh && fresh.ok) {
          await cache.put(url, fresh);
        }
      } catch (error) {
        console.error(`Failed to refresh ${url}:`, error);
      }
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

// Security improvement: Message handling
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
});