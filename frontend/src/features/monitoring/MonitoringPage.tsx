import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, buildApiUrl } from '../../lib/api';
import keycloak from '../../lib/keycloak';
import {
  Activity,
  ExternalLink,
  Database,
  HeartPulse,
  RefreshCw,
  Server,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HealthBody {
  status: string;
  timestamp: string;
  services?: { database: string; api: string };
  version?: string;
}

const NETDATA_URL =
  import.meta.env.VITE_NETDATA_URL?.replace(/\/$/, '') || 'http://localhost:19999';

async function fetchOptionalJson(path: string): Promise<{ ok: boolean; status: number; body: HealthBody | null }> {
  const token = keycloak.token;
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(buildApiUrl(path), { headers });
  let body: HealthBody | null = null;
  try {
    if (res.headers.get('content-type')?.includes('application/json')) {
      body = (await res.json()) as HealthBody;
    }
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

export function MonitoringPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('monitoring.view');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthBody | null>(null);
  const [readyOk, setReadyOk] = useState<boolean | null>(null);
  const [readyStatus, setReadyStatus] = useState<number | null>(null);
  const [liveOk, setLiveOk] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const [h, r, l] = await Promise.all([
        apiFetch<HealthBody>('/health').catch(() => null),
        fetchOptionalJson('/health/ready'),
        fetchOptionalJson('/health/live'),
      ]);
      setHealth(h);
      setReadyOk(r.ok);
      setReadyStatus(r.status);
      setLiveOk(l.ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar el estado de la API');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        No tienes permiso para ver el apartado de monitoreo.
      </div>
    );
  }

  const dbOk = health?.services?.database === 'ok';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            Monitoreo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estado de la API, readiness y enlace a Netdata (infraestructura).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <HeartPulse className="h-4 w-4" />
            Liveness
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {liveOk === null ? '—' : liveOk ? 'Operativo' : 'Fallo'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">GET /api/health/live</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Database className="h-4 w-4" />
            Readiness (BD)
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {readyOk === null ? '—' : readyOk ? 'Listo' : 'No listo'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            GET /api/health/ready
            {readyStatus != null && !readyOk && ` · HTTP ${readyStatus}`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Server className="h-4 w-4" />
            Resumen API
          </div>
          <p className="mt-3 text-2xl font-semibold capitalize">
            {loading && !health ? '…' : health?.status ?? '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            BD:{' '}
            <span className={dbOk ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
              {health?.services?.database ?? '—'}
            </span>
            {health?.version != null && ` · v${health.version}`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Netdata</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Métricas del host y contenedores. Si usas Docker Compose, el servicio expone el puerto configurado en{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">NETDATA_PORT</code> (por defecto 19999).
        </p>
        <a
          href={NETDATA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir Netdata
        </a>
        <p className="mt-2 text-xs text-muted-foreground break-all">{NETDATA_URL}</p>
      </div>
    </div>
  );
}
