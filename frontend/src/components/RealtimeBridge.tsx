import { useAuthStore } from '../stores/auth.store';
import { useRealtimeConnection } from '../hooks/useRealtimeConnection';

/** Montado en el shell autenticado: mantiene WebSocket y sincroniza TanStack Query. */
export function RealtimeBridge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useRealtimeConnection(isAuthenticated);
  return null;
}
