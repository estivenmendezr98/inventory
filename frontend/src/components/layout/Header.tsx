import { useAuthStore } from '../../stores/auth.store';
import { useSidebarStore } from '../../stores/sidebar.store';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import keycloak from '../../lib/keycloak';
import { buildApiUrl } from '../../lib/api';
import { NotificationBell } from '../notifications/NotificationBell';

export function Header() {
  const { user, hasPermission } = useAuthStore();
  const { isCollapsed, toggle } = useSidebarStore();
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const canNotifications = hasPermission('notifications.view');

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    const sessionId = sessionStorage.getItem('inventory_app_session_id');
    const token = keycloak.token;
    if (token) {
      try {
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        if (sessionId) headers['X-App-Session-Id'] = sessionId;
        await fetch(buildApiUrl('/auth/sessions/current'), { method: 'DELETE', headers });
      } catch {
        /* continuar con logout de Keycloak */
      }
    }
    sessionStorage.removeItem('inventory_app_session_id');
    keycloak.logout({ redirectUri: `${window.location.origin}${import.meta.env.BASE_URL}` });
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '??';

  const roleBadgeColor: Record<string, string> = {
    SUPER_ADMINISTRADOR: 'bg-red-500/10 text-red-400 border-red-500/20',
    ADMINISTRADOR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CAJERO: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6 transition-all duration-300',
        isCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Left: Menu toggle + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-medium text-muted-foreground">
          Sistema de Inventario
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <NotificationBell enabled={canNotifications} />

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">
              {user?.firstName} {user?.lastName}
            </p>
            <span
              className={cn(
                'mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                roleBadgeColor[user?.role || ''] || 'bg-muted text-muted-foreground'
              )}
            >
              {user?.role?.replace(/_/g, ' ') || 'Sin rol'}
            </span>
          </div>

          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {initials}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
