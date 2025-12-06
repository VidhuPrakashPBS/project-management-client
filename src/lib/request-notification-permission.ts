import { toast } from 'sonner';
import api from './api';
import {
  getToken,
  initializeMessaging,
  isSupported,
  onMessage,
} from './firebase-config';

export const requestNotificationPermission = async (
  userId: string
): Promise<boolean> => {
  try {
    // Check if notifications are supported
    const supported = await isSupported();
    if (!supported) {
      toast.error('Push notifications are not supported in this browser.');
      return false;
    }

    // Initialize messaging if not already done
    const messaging = await initializeMessaging();
    if (!messaging) {
      toast.error('Failed to initialize messaging.');
      return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      toast.error('Notification permission denied');
      return false;
    }

    // Check if service worker is registered
    let registration = await navigator.serviceWorker.getRegistration(
      '/firebase-messaging-sw.js'
    );

    if (!registration) {
      registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      );
    }

    if (!registration) {
      toast.error('Service worker registration failed');
      return false;
    }

    await navigator.serviceWorker.ready;

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      return false;
    }

    // Send token to backend
    await api.post('/api/notification/save-fcm-token', {
      userId,
      fcmToken: token,
    });

    return true;
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'An error occurred while requesting notification permission.'
    );
    return false;
  }
};

/**
 * Sets up a foreground message listener.
 *
 * When a message is received while the app is in the foreground, it logs the message to the console and shows a browser notification with the message title and body.
 * If the notification permission is granted, it also automatically closes the notification after 5 seconds and focuses the window when the notification is clicked.
 */
export const setupForegroundMessageListener = async () => {
  const messaging = await initializeMessaging();
  if (!messaging) {
    return;
  }

  /*
  Sets up a foreground message listener.
  */
  return onMessage(messaging, (payload) => {
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationBody = payload.notification?.body || '';

    // Show browser notification even when app is in foreground
    if (Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon/web-app-manifest-192x192.png',
        badge: '/favicon/web-app-manifest-192x192.png',
        data: payload.data,
        tag: `foreground-${Date.now()}`,
      });

      /**
       * Called when the notification is clicked.
       * Focuses the window and closes the notification.
       */
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  });
};
