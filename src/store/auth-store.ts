import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { toast } from 'sonner';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  permissionName: string;
  description: string | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  organisationId?: string;
}

interface AuthState {
  user: User | null;
  roles: Role[];
  permissions: Permission[];
  isAuthenticated: boolean;
  setAuth: (user: User, roles: Role[], permissions: Permission[]) => void;
  clearAuth: () => void;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyPermission: (permissionNames: string[]) => boolean;
  hasAllPermissions: (permissionNames: string[]) => boolean;
}

// Secure storage implementation with encryption
const secureStorage = {
  getItem: (name: string): string | null => {
    const encryptedValue = localStorage.getItem(name);
    if (!encryptedValue) {
      return null;
    }

    try {
      const bytes = AES.decrypt(
        encryptedValue,
        process.env.NEXT_PUBLIC_AES_SECRET as string
      );
      const decrypted = bytes.toString(Utf8);
      return decrypted || null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const encrypted = AES.encrypt(
        value,
        process.env.NEXT_PUBLIC_AES_SECRET as string
      ).toString();
      localStorage.setItem(name, encrypted);
    } catch (error) {
      toast.error(`Failed to encrypt storage: ${error}`);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,

      setAuth: (user, roles, permissions) => {
        set({
          user,
          roles,
          permissions,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          roles: [],
          permissions: [],
          isAuthenticated: false,
        });
      },

      hasPermission: (permissionName: string) => {
        const { permissions } = get();

        return permissions.some((p) => p.permissionName === permissionName);
      },

      hasRole: (roleName: string) => {
        const { roles } = get();
        return roles.some((r) => r.name === roleName);
      },

      hasAnyPermission: (permissionNames: string[]) => {
        const { permissions } = get();
        return permissionNames.some((name) =>
          permissions.some((p) => p.permissionName === name)
        );
      },

      hasAllPermissions: (permissionNames: string[]) => {
        const { permissions } = get();
        return permissionNames.every((name) =>
          permissions.some((p) => p.permissionName === name)
        );
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        roles: state.roles,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
