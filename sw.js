const OFFLINE_URL = '/offline.html';
const SYNC_TAG = 'content-sync';
// Add versioned content handling
const CONTENT_VERSION = 'v3'; // Update when content changes
const CACHE_NAME = `noctun-site-${CONTENT_VERSION}`;
async function refreshContent() {
  const cache = await caches.open(CACHE_NAME);
  try {
    const versionedAssets = ASSETS.map(url => 
      `${url}${url.includes('?') ? '&' : '?'}v=${CONTENT_VERSION}`
    );
    
    const updated = await Promise.all(
      versionedAssets.map(async url => {
        try {
          const fresh = await fetch(url, {cache: 'reload'});
          await cache.put(url.replace(`?v=${CONTENT_VERSION}`, ''), fresh);
          return true;
        } catch(e) {
          return false;
        }
      })
    );
    
    if(updated.some(Boolean)) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'content-updated',
          version: CONTENT_VERSION
        });
      });
    }
    return true;
  } catch(error) {
    console.error('Refresh failed:', error);
    return false;
  }
}
const ASSETS = [
    '/',
    '/index.html',
    '/offline.html',,
    '/contact.html',
    '/styles/main.css',
    '/scripts/main.js',
    '/manifest.json',
    '/assets/images/placeholder.jpg',
    '/assets/icons/noc-logo-192x192.png',
    '/assets/icons/noc-logo-512x512.png',  // Added for better PWA support
    '/assets/screenshots/screenshot_01.png',
    '/assets/screenshots/screenshot_02.png',
    '/assets/screenshots/screenshot_03.png',
    '/assets/icons/pdf-icon-256x256.png',
    '/assets/icons/image-icon-256x256.png',
    '/assets/icons/video-icon-256x256.png',
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
      const response = await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body
      });
      
      if (!response.ok) throw new Error('HTTP error '+response.status);
      await removeFromQueue(item.id);
    } catch (error) {
      console.error(`Failed to sync ${item.url}:`, error);
      // Keep in queue for retry
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
// Modify networkFirstThenCache to prevent cache flooding
async function networkFirstThenCache(event) {
  try {
    const networkResponse = await fetch(event.request);
    const cache = await caches.open(CACHE_NAME);
    // Only cache safe-to-store requests
    if (event.request.method === 'GET' && !isMediaRequest(event.request)) {
      cache.put(event.request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse || Response.error();
  }
}
const DB_NAME = 'syncQueueDB';
const STORE_NAME = 'syncQueue';
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
		request.onerror = (e) => reject(e.target.error);
	});
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
// Periodic Content Refresh
// ========================
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-refresh') {
        event.waitUntil(refreshContent());
	}
});
// ========================
// IndexedDB Queue Management
// ========================
async function addToQueue(data) {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	const store = tx.objectStore(STORE_NAME);
	store.put({ 
		id: Date.now(), 
		...data,
		timestamp: new Date().toISOString()
	});
	return tx.complete;
}
// ========================
// Sync Queue Management (Stubs - implement with IndexedDB)
// ========================
async function getSyncQueue() {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const store = tx.objectStore(STORE_NAME);
	return store.getAll();
}
async function removeFromQueue(id) {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	const store = tx.objectStore(STORE_NAME);
	store.delete(id);
	return tx.complete;
}
// Update the syncMediaItem function
async function syncMediaItem(item) {
	try {
		const response = await fetch(item.url, {
			method: item.method || 'POST',
			headers: item.headers,
			body: item.body
		});
		if (!response.ok) throw new Error('Sync failed');
		return response;
		} catch (error) {
		console.error('Sync error:', error);
		throw error;
	}
}
// Update periodic sync handler
// Update periodic sync handler to single implementation
async function refreshContent() {
  const cache = await caches.open(CACHE_NAME);
  try {
    // Refresh core content with cache-busting
    const updated = await Promise.all(
      ASSETS.map(async url => {
        try {
          const fresh = await fetch(url, {cache: 'reload'});
          await cache.put(url, fresh);
          return true;
        } catch (e) {
          return false;
        }
      })
    );
    
    // Only notify if updates succeeded
    if (updated.some(Boolean)) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'content-updated',
          updated: new Date().toISOString()
        });
      });
    }
    return true;
  } catch (error) {
    console.error('Refresh failed:', error);
    return false;
  }
}