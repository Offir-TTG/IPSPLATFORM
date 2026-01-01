/**
 * Service Worker for Push Notifications
 * Handles push events and displays notifications
 */

// Service Worker Version
const SW_VERSION = 'v1.0.0';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing', SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating', SW_VERSION);
  event.waitUntil(clients.claim());
});

// Push event - Display notification
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  if (!event.data) {
    console.log('[Service Worker] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.message || data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.notification_id || data.tag || 'notification',
      data: {
        actionUrl: data.action_url || data.actionUrl,
        notification_id: data.notification_id,
        category: data.category,
        priority: data.priority,
        ...data.data
      },
      actions: data.action_url ? [
        { action: 'view', title: data.action_label || 'View' },
        { action: 'close', title: 'Dismiss' }
      ] : [],
      requireInteraction: data.priority === 'urgent',
      vibrate: data.priority === 'urgent' ? [200, 100, 200] : [100],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'New Notification', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = '/notifications'; // Default fallback

  if (event.action === 'view' && data.actionUrl) {
    urlToOpen = data.actionUrl;
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else if (data.actionUrl) {
    // Click on notification body
    urlToOpen = data.actionUrl;
  }

  // Open the URL
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);
});

console.log('[Service Worker] Loaded', SW_VERSION);
