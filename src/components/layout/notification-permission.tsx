'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import {
  requestNotificationPermission,
  setupForegroundMessageListener,
} from '@/lib/request-notification-permission';

/**
 * Sets up notifications for the given user ID.
 * @param {string} userId - The user ID to set up notifications for.
 * @param {(status: 'requesting' | 'granted' | 'denied') => void} setNotificationStatus - A callback to set the notification status.
 * @returns {Promise<void>} - A promise that resolves when the notifications are set up.
 */
const setupNotifications = async (
  userId: string,
  setNotificationStatus: (status: 'requesting' | 'granted' | 'denied') => void
) => {
  setNotificationStatus('requesting');

  try {
    const success = await requestNotificationPermission(userId);
    setNotificationStatus(success ? 'granted' : 'denied');

    if (success) {
      // Set up foreground message listener
      await setupForegroundMessageListener();
    }
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : 'Error setting up notifications:'
    );
    setNotificationStatus('denied');
  }
};

export default function NotificationHandler() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<
    'idle' | 'requesting' | 'granted' | 'denied'
  >('idle');

  useEffect(() => {
    // Get user session
    const getSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user?.id) {
          setUserId(data.user.id);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Error fetching user session'
        );
      }
    };

    getSession();
  }, []);

  useEffect(() => {
    if (userId && notificationStatus === 'idle') {
      setupNotifications(userId, setNotificationStatus);
    }
  }, [userId, notificationStatus]);

  return null;
}
