const CACHE_NAME = 'noctun-site-v1'; // Changed cache name
const ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/assets/icons/noc-logo-512x512.png', // Cache specific icons
  '/assets/icons/noc-logo-192x192.png',
  '/assets/icons/noc-logo-144x144.png',
  '/assets/icons/noc-logo-96x96.png',
  '/assets/icons/noc-logo-72x72.png',
  '/assets/icons/noc-logo-48x48.png',
  // Add other essential assets used on the main page
  // For example:
  // '/assets/images/presentation-placeholder.jpg', // If you have placeholder images
  // '/assets/sounds/placeholder-sound.mp3', // If you have placeholder sounds
  // '/styles/fonts/your-font.woff2', // If you use custom fonts
  // '/scripts/another-script.js' // If you have other JS files
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(error => {
        console.error('Failed to cache assets:', error);
      })
  );
});

// Add a fetch event listener to serve cached assets
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => {
        // If the asset is in the cache, serve it
        if (response) {
          return response;
        }
        // Otherwise, fetch it from the network
        return fetch(e.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // You could serve an offline page here if needed
      })
  );
});

// Add an activate event listener to clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
});