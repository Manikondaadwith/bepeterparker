const CACHE_NAME = 'spiderquest-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Claim clients immediately
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('/api/')) {
    return;
  }

  // Network first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          // Check if we received a valid response
          if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic') {
            return fetchRes;
          }

          // Important: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = fetchRes.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return fetchRes;
        });
      })
    );
  }
});

// Handle push events (skeleton for future Push Notification setup)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Spider-Verse Alert!';
  const options = {
    body: data.body || 'New missions await you.',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕷️</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕸️</text></svg>',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
