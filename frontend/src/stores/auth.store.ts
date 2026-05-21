import { create } from 'zustand';
import { getSeedPermissionsForRole, isSuperAdministratorRole } from '../lib/role-permissions-fallback';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    const perms = user.permissions ?? [];
    // Super admin: acceso UI total (la API sigue validando en cada endpoint)
    if (isSuperAdministratorRole(user.role)) {
      return true;
    }
    if (perms.includes(permission)) return true;
    // BD o role_permissions desactualizados: alinear con seed (p. ej. documents.*)
    return getSeedPermissionsForRole(user.role).includes(permission);
  },

  logout: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
}));
