'use client';

import { Bell, LogOut, Moon, Sun, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { Notification, NotificationResponse } from '@/types/notifications';

export function Header() {
  const [profilePicture, setProfilePicture] = useState<string>(
    'https://api.dicebear.com/9.x/glass/svg'
  );
  const [userId, setUserId] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  useEffect(() => {
    const fetchUser = async () => {
      const session = await authClient.getSession();
      const imageUrl = (session.data?.user.image as string)?.trim();
      if (imageUrl) {
        setProfilePicture(imageUrl);
      }
      if (session.data?.user.id) {
        setUserId(session.data.user.id);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await api.get<NotificationResponse>(
          '/api/notification/list-notifications',
          {
            params: {
              page: '1',
              pageSize: '10',
              userId,
            },
          }
        );

        if (response.data.success) {
          setNotifications(response.data.notifications);
          const unreadExists: boolean = response.data.notifications.some(
            (notification: Notification) => !notification.isRead
          );
          setHasUnread(unreadExists);
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications'
        );
      }
    };

    fetchNotifications();
  }, [userId]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await api.post('/api/notification/mark-as-read', {
        notificationIds,
        userId,
      });

      if (response.data.success) {
        setNotifications((prev) =>
          prev?.map((notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          )
        );

        const stillHasUnread = notifications.some(
          (notification) =>
            !(notificationIds.includes(notification.id) || notification.isRead)
        );
        setHasUnread(stillHasUnread);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark notifications as read'
      );
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      ?.map((notification) => notification.id);

    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'Just now';
    }
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    }
    if (seconds < 86_400) {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
    if (seconds < 604_800) {
      return `${Math.floor(seconds / 86_400)}d ago`;
    }
    return date.toLocaleDateString();
  };

  const signOut = async () => {
    await authClient.signOut();
    logout();
    router.push('/');
  };

  const newNotifications = notifications.filter(
    (notification) => !notification.isRead
  );
  const earlierNotifications = notifications.filter(
    (notification) => notification.isRead
  );

  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex h-20 items-center justify-end md:p-6">
      <div className="flex items-center gap-2 bg-background/60 p-4 backdrop-blur md:gap-4">
        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          size="icon"
          variant="ghost"
        >
          <Sun className="dark:-rotate-90 h-6 w-6 rotate-0 scale-100 transition-all dark:scale-0" />
          <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notification Dropdown */}
        <DropdownMenu
          onOpenChange={setIsNotificationOpen}
          open={isNotificationOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button className="relative" size="icon" variant="ghost">
              <Bell className="h-6 w-6" />
              {hasUnread && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-card w-[380px] p-0"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">Notifications</h3>
                {hasUnread && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 font-medium text-white text-xs">
                    {newNotifications.length}
                  </span>
                )}
              </div>
              {hasUnread && (
                <Button
                  className="h-auto px-2 py-1 text-xs hover:bg-accent"
                  onClick={handleMarkAllAsRead}
                  size="sm"
                  variant="ghost"
                >
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notification List with hidden scrollbar using Tailwind arbitrary values */}
            <div className="max-h-[450px] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-12">
                  <Bell className="mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-center text-muted-foreground text-sm">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-center text-muted-foreground/70 text-xs">
                    We'll notify you when something arrives
                  </p>
                </div>
              ) : (
                <>
                  {/* New Notifications */}
                  {newNotifications.length > 0 && (
                    <div>
                      <div className="sticky top-0 z-10 bg-background/95 px-4 py-2 font-semibold text-muted-foreground text-xs backdrop-blur">
                        NEW
                      </div>
                      {newNotifications?.map((notification) => (
                        <button
                          className="group relative w-full border-b px-4 py-3 text-left transition-all hover:bg-accent/50 dark:hover:bg-white/5"
                          key={notification.id}
                          onClick={() => markAsRead([notification.id])}
                          type="button"
                        >
                          <div className="flex items-start gap-3">
                            {/* User Avatar */}
                            <div className="relative h-10 w-10 flex-shrink-0">
                              {notification?.createdBy?.image ? (
                                <Image
                                  alt={notification.createdBy.name}
                                  className="rounded-full object-cover"
                                  fill
                                  src={notification.createdBy.image}
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              {/* Blue indicator dot on avatar */}
                              {!notification.isRead && (
                                <div className="-top-0.5 -right-0.5 absolute h-3 w-3 rounded-full border-2 border-background bg-blue-500" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm">
                                  {notification?.createdBy?.name}
                                </p>
                                <p className="flex-shrink-0 text-muted-foreground text-xs">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              <p className="mt-1 text-foreground/90 text-sm leading-relaxed">
                                {notification.firstMessage}
                              </p>
                              {notification.secondMessage && (
                                <p className="mt-0.5 text-muted-foreground text-sm leading-relaxed">
                                  {notification.secondMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Earlier Notifications */}
                  {earlierNotifications.length > 0 && (
                    <div>
                      <div className="sticky top-0 z-10 bg-background/95 px-4 py-2 font-semibold text-muted-foreground text-xs backdrop-blur">
                        EARLIER
                      </div>
                      {earlierNotifications?.map((notification) => (
                        <div
                          className="group border-b px-4 py-3 transition-colors hover:bg-accent/30 dark:hover:bg-white/5"
                          key={notification.id}
                        >
                          <div className="flex items-start gap-3">
                            {/* User Avatar */}
                            <div className="relative h-10 w-10 flex-shrink-0">
                              {notification?.createdBy?.image ? (
                                <Image
                                  alt={notification.createdBy.name}
                                  className="rounded-full object-cover"
                                  fill
                                  src={notification.createdBy.image}
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-muted-foreground text-sm">
                                  {notification?.createdBy?.name}
                                </p>
                                <p className="flex-shrink-0 text-muted-foreground text-xs">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                                {notification.firstMessage}
                              </p>
                              {notification.secondMessage && (
                                <p className="mt-0.5 text-muted-foreground text-sm leading-relaxed">
                                  {notification.secondMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-full" size="icon" variant="ghost">
              <Image
                alt="Profile"
                className="rounded-full"
                height={32}
                src={profilePicture}
                width={32}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card w-48">
            <DropdownMenuItem className="focus:bg-accent dark:focus:bg-white/10">
              <Link href={'/profile'}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-accent dark:focus:bg-white/10"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
