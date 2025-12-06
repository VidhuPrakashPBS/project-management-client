import { useCallback, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useAuth } from './use-auth';

/**
 * Hook to check if the user has the admin-create permission.
 *
 * @returns {{ adminCreate: boolean, checkPermissions: () => Promise<boolean | null> }}
 *   adminCreate: Whether the user has the admin-create permission.
 *   checkPermissions: A function to check if the user has the admin-create permission.
 *     It returns a boolean indicating whether the user has the permission, or null if the user is not logged in.
 */
export const useProjectPermissions = () => {
  const [adminCreate, setAdminCreate] = useState<boolean>(false);
  const { hasPermission } = useAuth();

  const checkPermissions = useCallback(async () => {
    const permission = hasPermission('PROJECT-ADMIN-CREATE');
    if (permission) {
      setAdminCreate(true);
      return true;
    }

    setAdminCreate(false);
    const session = await authClient.getSession();
    return session.data?.user.id || null;
  }, [hasPermission]);

  return { adminCreate, checkPermissions };
};
