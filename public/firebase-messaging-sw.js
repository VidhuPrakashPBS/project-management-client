importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js'
);

const firebaseConfig = {
  apiKey: 'AIzaSyBTlo2EsgDjfm8dE3rL1q4dmORRm8vOIUQ',
  authDomain: 'fletten-project-management.firebaseapp.com',
  projectId: 'fletten-project-management',
  storageBucket: 'fletten-project-management.firebasestorage.app',
  messagingSenderId: '726780494451',
  appId: '1:726780494451:web:aa252fd95170e502a16006',
  measurementId: 'G-EBRBX1DR9Y',
};

self.firebase.initializeApp(firebaseConfig);

const messaging = self.firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `notification-${Date.now()}`,
    sticky: true,
    data: {
      url: payload.fcmOptions?.link || payload.data?.url || '/',
      ...payload.data,
    },
    persistent: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (
            client.url.includes(
              new URL(targetUrl, self.location.origin).pathname
            ) &&
            'focus' in client
          ) {
            return client.focus();
          }
        }
        // If no window/tab is already open, open a new one
        return clients.openWindow(targetUrl);
      })
  );
});
