'use client';

import { Building, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const TABS = [
  {
    href: '/settings/users',
    label: 'Users',
    icon: UserRound,
    permissionKey: 'canAccessUser',
  },
  {
    href: '/settings/organisation',
    label: 'Organisation',
    icon: Building,
    permissionKey: 'canAccessorganisation',
  },
  {
    href: '/settings/roles-and-permissions',
    label: 'Roles and Permissions',
    icon: Building,
    permissionKey: 'canAccessRolesAndPermissions',
  },
];
export function TabsNav() {
  const [userPermission, setUserPermission] = useState({
    canAccessUser: false,
    canAccessorganisation: false,
  });
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const checkPermissions = useCallback(() => {
    const userManagePermission = hasPermission('SETTINGS-USER-MANAGEMENT');
    const organisationManagePermission = hasPermission(
      'SETTINGS-ORGANISATION-MANAGEMENT'
    );
    const rolesAndPermissionManage = hasPermission(
      'SETTINGS-ROLE-PERMISSION-MANAGEMENT'
    );

    setUserPermission((prev) => ({
      ...prev,
      canAccessUser: userManagePermission ?? false,
      canAccessorganisation: organisationManagePermission ?? false,
      canAccessRolesAndPermissions: rolesAndPermissionManage ?? false,
    }));
  }, [hasPermission]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const visibleTabs = TABS.filter((tab) => {
    return userPermission[tab.permissionKey as keyof typeof userPermission];
  });

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute shadow-2xl dark:shadow-secondary" />
      <div className="relative overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav
          aria-label="Settings Tabs"
          className={cn('flex h-full gap-2 rounded-2xl p-2')}
        >
          {TABS?.map((t) => {
            const Icon = t.icon;
            const active =
              pathname === t.href ||
              pathname.startsWith(`${t.href}/`) ||
              pathname.startsWith(`${t.href}?`);

            return (
              <Link
                aria-selected={active}
                className={cn(
                  'flex items-center gap-2 rounded-2xl p-2 shadow-xl',
                  active
                    ? ['text-foreground', 'border-primary/40'].join(' ')
                    : 'text-muted-foreground hover:border-border/60 hover:bg-muted/60 hover:text-foreground'
                )}
                href={t.href}
                key={t.href}
                role="tab"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground group-hover:text-primary'
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="font-medium">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
