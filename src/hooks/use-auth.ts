import { useAuthStore } from '@/store/auth-store';

/**
 * Custom hook to access authentication state and methods
 * @returns Authentication state and helper methods
 */
export function useAuth() {
  const {
    user,
    roles,
    permissions,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    clearAuth,
  } = useAuthStore();

  return {
    user,
    roles,
    permissions,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    logout: clearAuth,
  };
}
