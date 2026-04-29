// Custom Service Worker — Schedify PWA
// Handles push notifications and notification clicks.
// All other service worker behaviour (caching, routing) is delegated to ngsw-worker.js.

self.addEventListener('push', (event) => {
  let title = 'Schedify';
  let options = { body: '', icon: 'assets/icons/icon-192x192.png', badge: 'assets/icons/icon-72x72.png' };

  try {
    const payload = event.data ? event.data.json() : {};
    if (payload.title) title = payload.title;
    if (payload.body !== undefined) options.body = payload.body;
    if (payload.icon) options.icon = payload.icon;
    if (payload.data) options.data = payload.data;
  } catch (e) {
    console.warn('[custom-sw] Failed to parse push payload, using defaults.', e);
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : self.registration.scope;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Delegate all other SW behaviour to the Angular ngsw worker
importScripts('./ngsw-worker.js');
