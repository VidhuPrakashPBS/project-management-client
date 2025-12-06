'use client';

import {
  BookUp,
  Calendar,
  Home,
  Menu,
  Projector,
  Settings,
  TicketCheck,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import logo from '../../../public/logo.png';

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    permissionKey: null,
  },
  {
    href: '/projects',
    icon: Projector,
    label: 'Projects',
    permissionKey: 'PROJECT-VIEW',
  },
  {
    href: '/tasks',
    icon: TicketCheck,
    label: 'Tasks',
    permissionKey: 'TASK-ASSIGNED-TO-ME',
  },
  {
    href: '/employees',
    icon: Users,
    label: 'Employees',
    permissionKey: 'EMPLOYEES-VIEW',
  },
  {
    href: '/leave-request',
    icon: Calendar,
    label: 'Leave Request',
    permissionKey: 'LEAVE-REQUEST-VIEW',
  },
  {
    href: '/timesheet',
    icon: BookUp,
    label: 'Timesheet',
    permissionKey: 'TIME-SHEET-VIEW',
  },
  {
    href: '/settings/users',
    icon: Settings,
    label: 'Settings',
    permissionKey: 'SETTINGS-VIEW',
  },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname.startsWith(`${href}?`)
    );
  };
}

const NavContent = ({ visibleItems }: { visibleItems: typeof navItems }) => {
  const isActive = useIsActive();

  return (
    <div className="flex h-full flex-col">
      <Link className="flex h-20 items-center p-4" href="/dashboard">
        <div className="flex items-center gap-2">
          <Image alt="logo" height={82} src={logo} width={82} />
        </div>
      </Link>
      <nav className="flex-1 space-y-2 p-4">
        {visibleItems?.map((item) => {
          const active = isActive(item.href);
          return (
            <Button
              asChild
              className={cn(
                'w-full justify-start text-base',
                active && 'font-bold'
              )}
              key={item.href}
              variant={active ? 'secondary' : 'ghost'}
            >
              <Link href={item.href}>
                <span>{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </div>
  );
};

export function FloatingNav() {
  const isActive = useIsActive();
  const { hasPermission, isAuthenticated } = useAuth();

  // Memoize the visible nav items based on user permissions
  const visibleNavItems = useMemo(() => {
    if (!isAuthenticated) {
      return [];
    }

    return navItems.filter((item) => {
      // Dashboard is always visible
      if (!item.permissionKey) {
        return true;
      }

      // Check if user has the required permission
      return hasPermission(item.permissionKey);
    });
  }, [hasPermission, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-64 border-r p-0" side="left">
            <NavContent visibleItems={visibleNavItems} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-24 flex-col items-center p-4 md:flex">
        <Link
          className="mb-4 flex h-16 w-16 items-center justify-center"
          href="/dashboard"
        >
          <Image alt="logo" height={82} src={logo} width={82} />
        </Link>
        <nav className="glass-card flex flex-col items-center gap-4 rounded-4xl p-2 shadow-2xl dark:shadow-secondary">
          {visibleNavItems?.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className={cn(
                      'h-14 w-14 transform rounded-xl text-muted-foreground transition-all duration-300 hover:scale-110 hover:text-primary',
                      active &&
                        'bg-blue-900 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground dark:bg-violet-500/30 dark:text-white dark:shadow-lg dark:shadow-violet-500/30'
                    )}
                    size="icon"
                    variant="ghost"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-7 w-7" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  className="z-50 border bg-popover text-popover-foreground backdrop-blur-lg"
                  side="right"
                >
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
