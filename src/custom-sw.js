// Custom Service Worker — Schedify PWA
// Handles push notifications and notification clicks.
// All other service worker behaviour (caching, routing) is delegated to ngsw-worker.js.

// IMPORTANT: importScripts must come first so ngsw can set up its own event listeners
importScripts('./ngsw-worker.js');

self.addEventListener('push', (event) => {
  let title = 'Schedify';
  let options = {
    body: '',
    icon: 'assets/icons/icon-192x192.png',
    badge: 'assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,   // keeps notification visible until user acts
  };

  try {
    const payload = event.data ? event.data.json() : {};
    if (payload.title) title = payload.title;
    if (payload.body  !== undefined) options.body  = payload.body;
    if (payload.icon)  options.icon  = payload.icon;
    if (payload.badge) options.badge = payload.badge;
    if (payload.data)  options.data  = payload.data;
  } catch (e) {
    console.warn('[custom-sw] Failed to parse push payload, using defaults.', e);
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Build absolute URL — data.url is a path like '/appointments'
  const path = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/appointments';
  const urlToOpen = new URL(path, self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      for (const client of windowClients) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
