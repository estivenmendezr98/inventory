import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPut } from '../../lib/api';
import { RefreshCw, Save, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface RoleDetail {
  role: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    userCount: number;
    createdAt: string;
    updatedAt: string;
  };
  assignedPermissionIds: string[];
  allPermissions: { module: string; items: PermissionItem[] }[];
}

interface ListResponse {
  data: RoleRow[];
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMINISTRADOR: 'Super administrador',
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
};

function roleLabel(name: string): string {
  return ROLE_LABEL[name] ?? name;
}

function sortedCopy(ids: string[]): string[] {
  return [...ids].sort();
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = sortedCopy(a);
  const sb = sortedCopy(b);
  return sa.every((v, i) => v === sb[i]);
}

export function RolesPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('roles.view');
  const canManage = hasPermission('roles.manage');

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (!canView) return;
    setListLoading(true);
    setError(null);
    try {
      const res = await apiFetch<ListResponse>('/roles');
      setRoles(res.data);
      setSelectedId((prev) => prev ?? (res.data[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar roles');
    } finally {
      setListLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const d = await apiFetch<RoleDetail>(`/roles/${id}`);
      setDetail(d);
      setDraftIds(new Set(d.assignedPermissionIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el rol');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView || !selectedId) return;
    void loadDetail(selectedId);
  }, [canView, selectedId, loadDetail]);

  const dirty = useMemo(() => {
    if (!detail) return false;
    return !setsEqual([...draftIds], detail.assignedPermissionIds);
  }, [detail, draftIds]);

  const toggle = (id: string) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInModule = (items: PermissionItem[], checked: boolean) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      for (const it of items) {
        if (checked) next.add(it.id);
        else next.delete(it.id);
      }
      return next;
    });
  };

  const save = async () => {
    if (!selectedId || !canManage || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiPut<RoleDetail>(`/roles/${selectedId}/permissions`, {
        permissionIds: [...draftIds],
      });
      setDetail(updated);
      setDraftIds(new Set(updated.assignedPermissionIds));
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Roles y permisos</h1>
            <p className="text-sm text-muted-foreground">
              Asigna permisos por rol. Los cambios aplican a la sesión en el próximo inicio de sesión.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadList()}
            disabled={listLoading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', listLoading && 'animate-spin')} />
            Actualizar lista
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty || !selectedId}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar permisos'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border bg-card p-3">
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roles
          </h2>
          {listLoading ? (
            <p className="px-2 text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <ul className="space-y-1">
              {roles.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      selectedId === r.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'hover:bg-muted/60 text-foreground'
                    )}
                  >
                    <div>{roleLabel(r.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.permissionCount} permisos · {r.userCount} usuarios
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          {!selectedId ? (
            <p className="text-sm text-muted-foreground">Selecciona un rol.</p>
          ) : detailLoading ? (
            <p className="text-sm text-muted-foreground">Cargando permisos…</p>
          ) : detail ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{roleLabel(detail.role.name)}</h2>
                {detail.role.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{detail.role.description}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {detail.role.userCount} usuario(s) con este rol
                </p>
              </div>

              {!canManage && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                  Solo lectura: no tienes permiso para gestionar roles.
                </p>
              )}

              <div className="max-h-[calc(100vh-16rem)] space-y-6 overflow-y-auto pr-1">
                {detail.allPermissions.map((group) => {
                  const allOn = group.items.every((it) => draftIds.has(it.id));
                  return (
                    <div key={group.module} className="border-b border-border/60 pb-4 last:border-0">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold capitalize">{group.module}</h3>
                        {canManage && (
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={allOn}
                              onChange={(e) => selectAllInModule(group.items, e.target.checked)}
                              className="rounded border-input"
                            />
                            Marcar / desmarcar módulo
                          </label>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {group.items.map((p) => (
                          <li key={p.id} className="flex gap-2 text-sm">
                            <input
                              type="checkbox"
                              id={`perm-${p.id}`}
                              checked={draftIds.has(p.id)}
                              disabled={!canManage}
                              onChange={() => toggle(p.id)}
                              className="mt-0.5 rounded border-input"
                            />
                            <label htmlFor={`perm-${p.id}`} className="cursor-pointer leading-snug">
                              <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                              <span className="ml-2">{p.name}</span>
                              {p.description && (
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {p.description}
                                </span>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
