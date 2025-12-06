'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { NotificationPrefs } from '@/types/user';

export default function ProfileSettings({
  onSuccess,
  className = '',
}: {
  onSuccess?: () => void;
  className?: string;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: false,
    push: false,
    app: false,
  });
  const [initialPrefs, setInitialPrefs] = useState<NotificationPrefs>({
    email: false,
    push: false,
    app: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load notification preferences from session
  useEffect(() => {
    if (session?.user) {
      const user = session.user as {
        isEmailNotification?: boolean;
        isPushNotification?: boolean;
        isInappNotification?: boolean;
      };

      const userPrefs: NotificationPrefs = {
        email: user.isEmailNotification ?? false,
        push: user.isPushNotification ?? false,
        app: user.isInappNotification ?? false,
      };

      setPrefs(userPrefs);
      setInitialPrefs(userPrefs);
    }
  }, [session?.user]);

  const isDirty = useMemo(
    () =>
      prefs.email !== initialPrefs.email ||
      prefs.push !== initialPrefs.push ||
      prefs.app !== initialPrefs.app,
    [prefs, initialPrefs]
  );

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleCancel = () => {
    setPrefs(initialPrefs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.patch(
        `/api/user/${session?.user.id}/notification-preferences`,
        {
          isEmailNotification: prefs.email,
          isPushNotification: prefs.push,
          isInappNotification: prefs.app,
        }
      );

      if (response.data.success === false) {
        toast.error(
          response.data.message || 'Failed to update notification preferences'
        );
        return;
      }

      if (response.data) {
        toast.success('Notification preferences updated successfully');
        setInitialPrefs(prefs);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update notification preferences'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className={`grid gap-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <form className={`grid gap-6 ${className}`} onSubmit={handleSubmit}>
      <div>
        <h3 className="font-medium text-muted-foreground text-sm">
          Notifications
        </h3>
        <div className="mt-3 grid gap-3">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="pr-4">
              <Label className="text-base" htmlFor="email-notifications">
                Email notifications
              </Label>
              <p className="text-muted-foreground text-sm">
                Receive updates and alerts via email.
              </p>
            </div>
            <Switch
              checked={prefs.email}
              disabled={isSubmitting}
              id="email-notifications"
              onCheckedChange={() => toggle('email')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="pr-4">
              <Label className="text-base" htmlFor="push-notifications">
                Push notifications
              </Label>
              <p className="text-muted-foreground text-sm">
                Get push alerts on supported devices.
              </p>
            </div>
            <Switch
              checked={prefs.push}
              disabled={isSubmitting}
              id="push-notifications"
              onCheckedChange={() => toggle('push')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="pr-4">
              <Label className="text-base" htmlFor="app-notifications">
                In‑app notifications
              </Label>
              <p className="text-muted-foreground text-sm">
                Show alerts inside the application.
              </p>
            </div>
            <Switch
              checked={prefs.app}
              disabled={isSubmitting}
              id="app-notifications"
              onCheckedChange={() => toggle('app')}
            />
          </div>
        </div>
      </div>

      {isDirty && (
        <div className="flex items-center justify-end gap-2">
          <Button
            disabled={isSubmitting}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
