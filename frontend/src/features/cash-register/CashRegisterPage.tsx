import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPost } from '../../lib/api';
import { DollarSign, Eye, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DomainHubNav } from '../../components/domain/DomainHubNav';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const MOVEMENT_LABEL: Record<string, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Salida',
  SALE: 'Venta (efectivo)',
};

interface RegisterRow {
  id: string;
  name: string;
  isActive: boolean;
}

interface MovementRow {
  id: string;
  type: string;
  amount: string;
  description: string | null;
  createdAt: string;
  userName: string;
}

interface SessionDetail {
  id: string;
  cashRegisterId: string;
  cashRegisterName: string;
  userId: string;
  userName: string;
  openingAmount: string;
  closingAmount: string | null;
  expectedAmount: string | null;
  difference: string | null;
  openedAt: string;
  closedAt: string | null;
  status: string;
  movementCount: number;
  salesCount?: number;
  salesTotal?: string;
  movements: MovementRow[];
}

interface SessionListRow {
  id: string;
  cashRegisterName: string;
  userName: string;
  openingAmount: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  expectedAmount: string | null;
  difference: string | null;
  movementCount: number;
}

function expectedFromMovements(opening: number, movements: MovementRow[]): number {
  let b = opening;
  for (const m of movements) {
    const a = Number(m.amount);
    if (m.type === 'INCOME' || m.type === 'SALE') b += a;
    else if (m.type === 'EXPENSE') b -= a;
  }
  return Math.round(b * 100) / 100;
}

export function CashRegisterPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const canOpen = hasPermission('cash_register.open');
  const canClose = hasPermission('cash_register.close');
  const canMovement = hasPermission('cash_register.movement');
  const canViewAll = hasPermission('cash_register.view_all');

  const [registers, setRegisters] = useState<RegisterRow[]>([]);
  const [registerId, setRegisterId] = useState('');
  const [opening, setOpening] = useState(0);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [movType, setMovType] = useState('INCOME');
  const [movAmount, setMovAmount] = useState(0);
  const [movDesc, setMovDesc] = useState('');

  const [closing, setClosing] = useState(0);
  const [history, setHistory] = useState<SessionListRow[]>([]);
  const [historyMeta, setHistoryMeta] = useState({ page: 1, totalPages: 1 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyAll, setHistoryAll] = useState(false);

  const loadRegisters = useCallback(async () => {
    const r = await apiFetch<{ data: RegisterRow[] }>('/cash-register/registers');
    setRegisters(r.data);
    return r.data;
  }, []);

  const refreshCurrent = useCallback(async () => {
    const res = await apiFetch<{ data: SessionDetail | null }>('/cash-register/sessions/current');
    setSession(res.data);
    if (res.data) {
      const exp = expectedFromMovements(
        Number(res.data.openingAmount),
        res.data.movements || [],
      );
      setClosing(exp);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(historyPage),
      limit: '15',
    });
    if (historyAll && canViewAll) params.set('allUsers', 'true');
    const res = await apiFetch<{
      data: SessionListRow[];
      meta: { totalPages: number; page: number };
    }>(`/cash-register/sessions?${params}`);
    setHistory(res.data);
    setHistoryMeta({ page: res.meta.page, totalPages: res.meta.totalPages });
  }, [historyPage, historyAll, canViewAll]);

  useEffect(() => {
    if (!canOpen) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const regs = await loadRegisters();
        setRegisterId((prev) => (prev ? prev : regs[0]?.id ?? ''));
        await refreshCurrent();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, [canOpen, loadRegisters, refreshCurrent]);

  useEffect(() => {
    if (!canOpen) return;
    loadHistory().catch(() => setHistory([]));
  }, [canOpen, loadHistory]);

  const expectedLive = useMemo(() => {
    if (!session || session.status !== 'OPEN') return 0;
    return expectedFromMovements(Number(session.openingAmount), session.movements || []);
  }, [session]);

  const diffPreview = useMemo(
    () => Math.round((closing - expectedLive) * 100) / 100,
    [closing, expectedLive],
  );

  const openSession = async () => {
    if (!registerId) return;
    setBusy(true);
    setError(null);
    try {
      const s = await apiPost<SessionDetail>('/cash-register/sessions/open', {
        cashRegisterId: registerId,
        openingAmount: opening,
      });
      setSession(s);
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const addMovement = async () => {
    if (!session?.id || movAmount <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const s = await apiPost<SessionDetail>(`/cash-register/sessions/${session.id}/movements`, {
        type: movType,
        amount: movAmount,
        description: movDesc.trim() || undefined,
      });
      setSession(s);
      setMovAmount(0);
      setMovDesc('');
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const closeSession = async () => {
    if (!session?.id) return;
    if (!window.confirm('¿Cerrar sesión de caja?')) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/cash-register/sessions/${session.id}/close`, {
        closingAmount: closing,
      });
      setSession(null);
      await loadHistory();
      await loadRegisters();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!canOpen) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No tiene permiso para caja (<code className="text-xs">cash_register.open</code>).
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-7 w-7 text-primary" />
          Caja registradora
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Obligatorio antes de vender en POS o registrar ventas. Saldo esperado: fondo inicial +
          entradas + ventas en efectivo (automáticas al cobrar) − salidas.
        </p>
      </div>

      <DomainHubNav
        links={[
          { to: '/pos', label: 'POS', permission: 'pos.access' },
          { to: '/sales', label: 'Ventas', permission: 'sales.view' },
          { to: '/invoices', label: 'Ticket / Comprobante local', permission: 'invoices.view' },
        ]}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : session && session.status === 'OPEN' ? (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Caja</p>
              <p className="font-semibold">{session.cashRegisterName}</p>
              <p className="text-xs text-muted-foreground mt-2">Abierta</p>
              <p className="text-sm">{new Date(session.openedAt).toLocaleString('es-CO')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Fondo inicial</p>
              <p className="text-lg font-semibold tabular-nums">
                {cop.format(Number(session.openingAmount))}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Saldo esperado ahora</p>
              <p className="text-lg font-semibold text-primary tabular-nums">
                {cop.format(expectedLive)}
              </p>
              {session.salesCount != null && session.salesCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Ventas del turno: {session.salesCount} ·{' '}
                  {cop.format(Number(session.salesTotal ?? 0))}
                </p>
              )}
              <Link
                to={`/cash-register/sessions/${session.id}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <Eye className="h-4 w-4" />
                Ver informe completo
              </Link>
            </div>
          </div>

          {canMovement && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="text-sm font-medium">Registrar movimiento</h2>
              <div className="flex flex-wrap gap-3 items-end">
                <label className="text-xs text-muted-foreground">
                  Tipo
                  <select
                    className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={movType}
                    onChange={(e) => setMovType(e.target.value)}
                  >
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Salida</option>
                  </select>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Las ventas en efectivo se registran solas al cobrar en POS o Ventas.
                  </p>
                </label>
                <label className="text-xs text-muted-foreground">
                  Monto
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    className="mt-1 block w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={movAmount || ''}
                    onChange={(e) => setMovAmount(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="text-xs text-muted-foreground flex-1 min-w-[8rem]">
                  Descripción
                  <input
                    className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={movDesc}
                    onChange={(e) => setMovDesc(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || movAmount <= 0}
                  onClick={() => void addMovement()}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Registrar
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium mb-2">Movimientos recientes</h2>
            <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
              {(session.movements || []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sin movimientos aún.</p>
              ) : (
                (session.movements || []).map((m) => (
                  <div key={m.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
                    <span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          m.type === 'EXPENSE'
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-green-500/15 text-green-500'
                        )}
                      >
                        {MOVEMENT_LABEL[m.type] ?? m.type}
                      </span>
                      <span className="text-muted-foreground ml-2 text-xs">{m.userName}</span>
                    </span>
                    <span className="tabular-nums font-medium">{cop.format(Number(m.amount))}</span>
                    {m.description && (
                      <p className="w-full text-xs text-muted-foreground">{m.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {canClose && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <h2 className="text-sm font-medium">Cierre de caja</h2>
              <label className="block text-xs text-muted-foreground">
                Efectivo contado al cerrar
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 block max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={closing || ''}
                  onChange={(e) => setClosing(Number(e.target.value) || 0)}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Esperado según sistema: {cop.format(expectedLive)} · Diferencia (conteo − esperado):{' '}
                <span className={cn('font-medium', diffPreview !== 0 && 'text-amber-500')}>
                  {cop.format(diffPreview)}
                </span>
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void closeSession()}
                className="rounded-lg bg-destructive/90 px-4 py-2 text-sm text-destructive-foreground"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-md">
          <h2 className="text-lg font-semibold">Abrir sesión</h2>
          <p className="text-sm text-muted-foreground">
            Sin un turno abierto no podrá cobrar en el POS ni crear ventas desde el módulo Ventas.
          </p>
          <label className="block text-sm text-muted-foreground">
            Caja física
            <select
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={registerId}
              onChange={(e) => setRegisterId(e.target.value)}
            >
              {registers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-muted-foreground">
            Fondo inicial (efectivo en caja)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={opening || ''}
              onChange={(e) => setOpening(Number(e.target.value) || 0)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !registerId}
            onClick={() => void openSession()}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Abrir caja
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Historial de sesiones</h2>
          {canViewAll && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={historyAll}
                onChange={(e) => {
                  setHistoryAll(e.target.checked);
                  setHistoryPage(1);
                }}
              />
              Ver todas las cajas
            </label>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left p-2 font-medium">Caja</th>
                <th className="text-left p-2 font-medium hidden sm:table-cell">Usuario</th>
                <th className="text-left p-2 font-medium">Apertura</th>
                <th className="text-right p-2 font-medium">Inicial</th>
                <th className="text-right p-2 font-medium hidden md:table-cell">Diferencia</th>
                <th className="text-center p-2 font-medium">Estado</th>
                <th className="text-right p-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Sin sesiones.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-border/60 hover:bg-muted/20 cursor-pointer"
                    onClick={() => navigate(`/cash-register/sessions/${h.id}`)}
                  >
                    <td className="p-2">{h.cashRegisterName}</td>
                    <td className="p-2 hidden sm:table-cell text-muted-foreground">{h.userName}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {new Date(h.openedAt).toLocaleString('es-CO')}
                    </td>
                    <td className="p-2 text-right tabular-nums">{cop.format(Number(h.openingAmount))}</td>
                    <td className="p-2 text-right tabular-nums hidden md:table-cell">
                      {h.difference != null ? (
                        <span
                          className={cn(
                            Number(h.difference) === 0
                              ? 'text-muted-foreground'
                              : Number(h.difference) > 0
                                ? 'text-green-600'
                                : 'text-destructive'
                          )}
                        >
                          {cop.format(Number(h.difference))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs',
                          h.status === 'OPEN' ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {h.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cash-register/sessions/${h.id}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {historyMeta.totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              disabled={historyPage <= 1}
              className="rounded border border-input px-3 py-1 text-xs disabled:opacity-40"
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={historyPage >= historyMeta.totalPages}
              className="rounded border border-input px-3 py-1 text-xs disabled:opacity-40"
              onClick={() => setHistoryPage((p) => p + 1)}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
