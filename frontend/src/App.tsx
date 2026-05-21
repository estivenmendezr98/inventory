import { useEffect, useState } from 'react';
import { useCompanyBrandingStore } from './stores/company-branding.store';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './stores/auth.store';
import keycloak, { initKeycloakOnce } from './lib/keycloak';
import { pickAppRoleFromToken } from './lib/realm-role';
import { apiPost } from './lib/api';
import { Box, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

const AUTH_ME_FETCH_MS = 25_000;

function userFromKeycloakToken() {
  const tokenParsed = keycloak.tokenParsed;
  const realmRoles = [
    ...(Array.isArray(tokenParsed?.realm_roles) ? tokenParsed.realm_roles : []),
    ...(Array.isArray(tokenParsed?.realm_access?.roles) ? tokenParsed.realm_access.roles : []),
  ] as string[];
  return {
    id: tokenParsed?.sub || '',
    email: tokenParsed?.email || '',
    firstName: tokenParsed?.given_name || '',
    lastName: tokenParsed?.family_name || '',
    role: pickAppRoleFromToken(realmRoles),
    permissions: [] as string[],
  };
}

export default function App() {
  const { setUser, setLoading, isLoading, isAuthenticated } = useAuthStore();
  const [initError, setInitError] = useState<string | null>(null);

  const loadBranding = useCompanyBrandingStore((s) => s.load);

  useEffect(() => {
    void loadBranding();
  }, [loadBranding]);

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    initKeycloakOnce()
      .then(async (authenticated) => {
        if (authenticated && !keycloak.token) {
          console.warn('Keycloak authenticated but no token yet; finishing load.');
          setLoading(false);
          return;
        }
        if (authenticated && keycloak.token) {
          try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), AUTH_ME_FETCH_MS);
            try {
              const response = await fetch(
                `${import.meta.env.VITE_API_URL || '/api'}/auth/me`,
                {
                  headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                  },
                  signal: controller.signal,
                },
              );

              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                try {
                  const sess = await apiPost<{ sessionId: string }>('/auth/sessions', {});
                  if (sess?.sessionId) {
                    sessionStorage.setItem('inventory_app_session_id', sess.sessionId);
                  }
                } catch {
                  /* sesión de app opcional si el backend aún no expone /auth/sessions */
                }
              } else {
                console.warn('Backend /api/auth/me returned', response.status, '- using token fallback');
                setUser(userFromKeycloakToken());
              }
            } finally {
              window.clearTimeout(timeoutId);
            }
          } catch (fetchError) {
            console.warn('Error fetching /api/auth/me - using token fallback:', fetchError);
            setUser(userFromKeycloakToken());
          }
        } else {
          // Not authenticated - Keycloak will handle redirect
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Keycloak init error:', err);
        let errorMsg = 'Error al conectar con el servidor de autenticación.';
        if (typeof err === 'object' && err !== null) {
          errorMsg = err.error_description || err.error || errorMsg;
        }
        setInitError(errorMsg);
        setLoading(false);
      });
  }, [setUser, setLoading]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
            <Box className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Iniciando sistema...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (initError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="max-w-md rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-4">
            <Box className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Error de Conexión</h2>
          <p className="mt-2 text-sm text-muted-foreground">{initError}</p>
          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = import.meta.env.BASE_URL;
              }}
              className="rounded-lg border border-input bg-background px-6 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Limpiar Sesión Local
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render app
  if (isAuthenticated) {
    return (
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    );
  }

  // Waiting for Keycloak redirect (brief moment before redirect happens)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
          <Box className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Redirigiendo a inicio de sesión...
          </span>
        </div>
      </div>
    </div>
  );
}
