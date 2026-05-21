import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch } from '../../lib/api';
import { SupplierFormModal, type SupplierDto } from './SupplierFormModal';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, ShoppingCart, Trash2, Truck } from 'lucide-react';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { purchasesPath } from '../../lib/module-links';

interface ListResponse {
  data: SupplierDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function SuppliersPage() {
  const { hasPermission } = useAuthStore();
  const [rows, setRows] = useState<SupplierDto[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, includeInactive]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (includeInactive) params.set('includeInactive', 'true');
    try {
      const res = await apiFetch<ListResponse>(`/suppliers?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const canCreate = hasPermission('suppliers.create');
  const canUpdate = hasPermission('suppliers.update');
  const canDelete = hasPermission('suppliers.delete');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            Proveedores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Proveedores vinculados a órdenes de compra e entradas de kardex.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditSupplier(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </button>
        )}
      </div>

      <DomainHubNav
        links={[
          { to: '/purchases', label: 'Compras', permission: 'purchases.view' },
          { to: '/products', label: 'Productos', permission: 'products.view' },
          { to: '/kardex', label: 'Kardex', permission: 'kardex.view' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre, NIT, ciudad…"
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
                  <th className="text-left p-3 font-medium">NIT</th>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Ciudad</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Teléfono</th>
                  <th className="text-right p-3 font-medium">Compras</th>
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
                      colSpan={canUpdate || canDelete ? 7 : 6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No hay proveedores con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{s.nit}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {s.city ?? '—'}
                      </td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">
                        {s.phone ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <span className="tabular-nums">{s.purchaseCount ?? 0}</span>
                        {(s.purchaseCount ?? 0) > 0 && (
                          <Link
                            to={purchasesPath({ supplierId: s.id })}
                            className="ml-2 inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                            title="Ver compras de este proveedor"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Ver
                          </Link>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            s.isActive
                              ? 'rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500'
                              : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                          }
                        >
                          {s.isActive ? 'Activo' : 'Inactivo'}
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
                                  setEditSupplier(s);
                                  setModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && s.isActive && (
                              <button
                                type="button"
                                title="Desactivar"
                                onClick={async () => {
                                  if (!window.confirm(`¿Desactivar el proveedor "${s.name}"?`))
                                    return;
                                  try {
                                    await apiDelete(`/suppliers/${s.id}`);
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Página {meta.page} de {meta.totalPages} ({meta.total} proveedores)
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

      <SupplierFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        initial={editSupplier}
      />
    </div>
  );
}
