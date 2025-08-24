// Dedicated service worker for Knets Jr PWA
const CACHE_NAME = 'knets-jr-pwa-v1.0';
const KNETS_JR_CACHE = [
  '/knets-jr',
  '/knets-jr-manifest.json',
  '/knets-jr-icon-192-real.png',
  '/knets-jr-icon-512-real.png'
];

// Install event - cache Knets Jr resources only
self.addEventListener('install', (event) => {
  console.log('[Knets Jr SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Knets Jr SW] Caching Knets Jr resources');
        return cache.addAll(KNETS_JR_CACHE);
      })
      .then(() => {
        console.log('[Knets Jr SW] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[Knets Jr SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.includes('knets-jr')) {
            console.log('[Knets Jr SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Knets Jr SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle requests within Knets Jr scope
  if (!event.request.url.includes('/knets-jr')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[Knets Jr SW] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[Knets Jr SW] Fetching from network:', event.request.url);
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        console.log('[Knets Jr SW] Offline - serving from cache failed');
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/knets-jr');
        }
      })
  );
});

// Push notification handler for Knets Jr
self.addEventListener('push', (event) => {
  console.log('[Knets Jr SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New message from parent dashboard',
      icon: '/knets-jr-icon-192-real.png',
      badge: '/knets-jr-icon-192-real.png',
      tag: 'knets-jr-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/knets-jr-icon-192-real.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Knets Jr Update', 
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Knets Jr SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clients) => {
      // Check if there's already a Knets Jr window open
      const existingClient = clients.find(client => 
        client.url.includes('/knets-jr')
      );
      
      if (existingClient) {
        return existingClient.focus();
      }
      
      // Open new Knets Jr window
      return self.clients.openWindow('/knets-jr');
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Knets Jr SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'knets-jr-sync') {
    event.waitUntil(
      // Sync any pending data when back online
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  console.log('[Knets Jr SW] Syncing offline data...');
  // Implementation for syncing offline actions
  // This would sync location updates, connection attempts, etc.
}