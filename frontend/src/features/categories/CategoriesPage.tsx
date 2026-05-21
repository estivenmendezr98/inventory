import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch } from '../../lib/api';
import { CategoryFormModal, type CategoryDto } from './CategoryFormModal';
import { FolderTree, Pencil, Plus, Search, Trash2 } from 'lucide-react';

interface ListResponse {
  data: CategoryDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface FlatResponse {
  categories: { id: string; name: string; parentId: string | null }[];
}

export function CategoriesPage() {
  const { hasPermission } = useAuthStore();
  const [rows, setRows] = useState<CategoryDto[]>([]);
  const [flat, setFlat] = useState<{ id: string; name: string; parentId: string | null }[]>(
    []
  );
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryDto | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, includeInactive]);

  const loadFlat = useCallback(async () => {
    try {
      const res = await apiFetch<FlatResponse>('/categories/options/flat');
      setFlat(res.categories);
    } catch {
      setFlat([]);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '50',
    });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (includeInactive) params.set('includeInactive', 'true');
    try {
      const res = await apiFetch<ListResponse>(`/categories?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, includeInactive]);

  useEffect(() => {
    loadFlat();
  }, [loadFlat]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const canCreate = hasPermission('categories.create');
  const canUpdate = hasPermission('categories.update');
  const canDelete = hasPermission('categories.delete');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-primary" />
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Árbol opcional de categorías; permisos según el plan.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setEditCategory(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre…"
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
            Mostrar inactivas
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
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Padre</th>
                  <th className="text-right p-3 font-medium">Productos</th>
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
                      No hay categorías con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  rows.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">
                        {c.parent?.name ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums">{c.productCount ?? '—'}</td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            c.isActive
                              ? 'rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500'
                              : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                          }
                        >
                          {c.isActive ? 'Activa' : 'Inactiva'}
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
                                  setEditCategory(c);
                                  setModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && c.isActive && (
                              <button
                                type="button"
                                title="Desactivar"
                                onClick={async () => {
                                  if (
                                    !window.confirm(`¿Desactivar la categoría "${c.name}"?`)
                                  )
                                    return;
                                  try {
                                    await apiDelete(`/categories/${c.id}`);
                                    loadCategories();
                                    loadFlat();
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
                Página {meta.page} de {meta.totalPages} ({meta.total} categorías)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((q) => Math.max(1, q - 1))}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((q) => q + 1)}
                  className="rounded-lg border border-input px-3 py-1 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          loadCategories();
          loadFlat();
        }}
        flatCategories={flat}
        initial={editCategory}
      />
    </div>
  );
}
