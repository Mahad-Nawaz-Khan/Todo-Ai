// sw.js - Service Worker for offline functionality

const CACHE_NAME = 'todo-ai-v1';
const urlsToCache = [
  '/',
  '/sign-in',
  '/sign-up',
  '/profile',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Don't cache API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to return from cache for GET requests
          if (event.request.method === 'GET') {
            return caches.match(event.request)
              .then((response) => {
                // Return cached response or a custom offline response
                return response || caches.match('/offline.html');
              });
          }
        })
    );
  } else {
    // For non-API requests, try cache first then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response if found
          if (response) {
            return response;
          }

          // Otherwise, fetch from network
          return fetch(event.request)
            .then((response) => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Only cache GET requests (Cache API does not support POST/PUT/PATCH/DELETE)
              if (event.request.method !== 'GET') {
                return response;
              }

              // Clone the response for caching
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  // Handle sync requests from the client
  if (event.data && event.data.type === 'SYNC_REQUEST') {
    if (self.registration && self.registration.sync) {
      self.registration.sync.register('api-sync');
    }
  }
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'api-sync') {
    event.waitUntil(
      // Perform sync operations here
      performBackgroundSync()
    );
  }
});

// Function to perform background sync
async function performBackgroundSync() {
  console.log('Performing background sync...');
  // In a real implementation, this would sync pending operations
  // For now, just log that the sync was attempted
}