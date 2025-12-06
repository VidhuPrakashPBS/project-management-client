import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: ReturnType<typeof getMessaging> | null = null;

/**
 * Initializes Firebase Cloud Messaging for the web app.
 * If the window object is defined (i.e. this is a web app), it checks if messaging is supported.
 * If it is, it initializes the messaging client with the app instance and returns the messaging client.
 * If an error occurs during initialization, it displays a toast error message.
 * If the window object is not defined (i.e. this is a server-side app), it returns null.
 * @returns {Promise<ReturnType<typeof getMessaging>|null>} A promise that resolves to the messaging client if supported, or null otherwise.
 */
const initializeMessaging = async () => {
  if (typeof window !== 'undefined') {
    try {
      const supported = await isSupported();

      if (supported) {
        messaging = getMessaging(app);
        return messaging;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error initializing messaging'
      );
    }
  }
  return null;
};

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  initializeMessaging();
}

export { messaging, initializeMessaging };
export { getToken, isSupported, onMessage } from 'firebase/messaging';
