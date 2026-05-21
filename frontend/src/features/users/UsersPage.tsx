import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch } from '../../lib/api';
import { UserFormModal, type RoleOption, type UserDto } from './UserFormModal';
import { Pencil, Plus, Search, Trash2, UserCog } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ListResponse {
  data: UserDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface RolesResponse {
  data: RoleOption[];
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMINISTRADOR: 'Super administrador',
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
};

function roleLabel(name: string): string {
  return ROLE_LABEL[name] ?? name;
}

export function UsersPage() {
  const { hasPermission, user: authUser } = useAuthStore();
  const canView = hasPermission('users.view');
  const canCreate = hasPermission('users.create');
  const canUpdate = hasPermission('users.update');
  const canDelete = hasPermission('users.delete');

  const [rows, setRows] = useState<UserDto[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, includeInactive]);

  useEffect(() => {
    if (!canCreate && !canUpdate) {
      setRoles([]);
      return;
    }
    let cancelled = false;
    apiFetch<RolesResponse>('/users/roles')
      .then((res) => {
        if (!cancelled) setRoles(res.data);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canCreate, canUpdate]);

  const load = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (includeInactive) params.set('includeInactive', 'true');
    try {
      const res = await apiFetch<ListResponse>(`/users?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, includeInactive, canView]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-7 w-7 text-primary" />
            Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Perfiles locales y permisos; el inicio de sesión sigue siendo Keycloak.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditUser(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por correo, nombre, teléfono…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {canUpdate && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-input"
            />
            Mostrar inactivos
          </label>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Rol</th>
                  <th className="text-center p-3 font-medium hidden sm:table-cell">Keycloak</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  {(canUpdate || canDelete) && (
                    <th className="text-right p-3 font-medium">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canUpdate || canDelete ? 5 : 4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No hay usuarios con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => {
                    const isSelf = authUser?.id === u.id;
                    return (
                      <tr key={u.id} className="border-b border-border/60 hover:bg-muted/20">
                        <td className="p-3">
                          <div className="font-medium">
                            {u.firstName} {u.lastName}
                            {isSelf && (
                              <span className="ml-2 text-xs font-normal text-primary">(tú)</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">
                          {roleLabel(u.role.name)}
                        </td>
                        <td className="p-3 text-center hidden sm:table-cell">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              u.keycloakLinked
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-amber-500/10 text-amber-600'
                            )}
                          >
                            {u.keycloakLinked ? 'Vinculado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs',
                              u.isActive
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {(canUpdate || canDelete) && (
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              {canUpdate && (
                                <button
                                  type="button"
                                  title="Editar"
                                  onClick={() => {
                                    setEditUser(u);
                                    setModalOpen(true);
                                  }}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && u.isActive && !isSelf && (
                                <button
                                  type="button"
                                  title="Desactivar"
                                  onClick={async () => {
                                    if (
                                      !window.confirm(
                                        `¿Desactivar a "${u.firstName} ${u.lastName}"?`
                                      )
                                    )
                                      return;
                                    try {
                                      await apiDelete(`/users/${u.id}`);
                                      load();
                                    } catch (e) {
                                      alert(e instanceof Error ? e.message : 'Error');
                                    }
                                  }}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditUser(null);
        }}
        onSaved={load}
        initial={editUser}
        roles={roles}
        currentUserId={authUser?.id ?? null}
      />
    </div>
  );
}
