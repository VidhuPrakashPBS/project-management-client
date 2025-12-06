'use client';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import UserTableSection from '@/components/settings/user-management/user-table-section';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsUsersPage() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const router = useRouter();
  const { hasPermission: hasPermissionCheck } = useAuth();

  const checkPermission = useCallback(() => {
    const response = hasPermissionCheck('SETTINGS-USER-MANAGEMENT');
    if (response) {
      setHasPermission(true);
    } else {
      router.replace('/dashboard');
    }
  }, [router, hasPermissionCheck]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="font-bold text-2xl">User management</h1>

      <UserTableSection />
    </div>
  );
}
