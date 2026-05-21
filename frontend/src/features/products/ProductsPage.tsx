import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiDelete, apiFetch, apiPost } from '../../lib/api';
import { ProductFormModal, type ProductDto } from './ProductFormModal';
import { Link } from 'react-router-dom';
import { BookOpen, Package, Pencil, Plus, Search, Trash2, Warehouse } from 'lucide-react';
import { DomainHubNav } from '../../components/domain/DomainHubNav';
import { kardexPath } from '../../lib/module-links';
import { formatQtyNumber, formatUnitSymbol } from '../../lib/units-of-measure';

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

interface ListResponse {
  data: ProductDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function ProductsPage() {
  const { hasPermission } = useAuthStore();
  const [rows, setRows] = useState<ProductDto[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null);
  const [importSkuCount, setImportSkuCount] = useState<number | null>(null);
  const [importSkuBusy, setImportSkuBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, includeInactive]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiFetch<{ categories: { id: string; name: string }[] }>(
        '/products/options/categories'
      );
      setCategories(res.categories);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
    });
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (categoryId) params.set('categoryId', categoryId);
    if (includeInactive) params.set('includeInactive', 'true');
    try {
      const res = await apiFetch<ListResponse>(`/products?${params.toString()}`);
      setRows(res.data);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryId, includeInactive]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadImportSkuCandidates = useCallback(async () => {
    if (!hasPermission('products.delete')) return;
    try {
      const r = await apiFetch<{ count: number }>('/products/maintenance/numeric-skus');
      setImportSkuCount(r.count);
    } catch {
      setImportSkuCount(null);
    }
  }, [hasPermission]);

  useEffect(() => {
    void loadImportSkuCandidates();
  }, [loadImportSkuCandidates]);

  const purgeImportSkus = async (dryRun: boolean) => {
    setImportSkuBusy(true);
    try {
      const r = await apiPost<{
        dryRun: boolean;
        deleted: number;
        wouldDelete: number;
        items: { sku: string; name: string }[];
      }>(`/products/maintenance/purge-numeric-skus?dryRun=${dryRun ? 'true' : 'false'}`);
      if (dryRun) {
        const preview = r.items
          .slice(0, 8)
          .map((i) => `${i.sku} — ${i.name}`)
          .join('\n');
        const more = r.wouldDelete > 8 ? `\n… y ${r.wouldDelete - 8} más` : '';
        const ok = window.confirm(
          `Se desactivarían ${r.wouldDelete} producto(s) con SKU numérico 0–740 y nombre vacío o genérico.\n\n${preview}${more}\n\n¿Continuar?`,
        );
        if (ok) await purgeImportSkus(false);
      } else {
        window.alert(`Se desactivaron ${r.deleted} producto(s).`);
        await loadImportSkuCandidates();
        await loadProducts();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error en limpieza');
    } finally {
      setImportSkuBusy(false);
    }
  };

  const canCreate = hasPermission('products.create');
  const canUpdate = hasPermission('products.update');
  const canDelete = hasPermission('products.delete');

  const openCreate = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    setEditProduct(p);
    setModalOpen(true);
  };

  const handleDeactivate = async (p: ProductDto) => {
    if (!window.confirm(`¿Desactivar el producto "${p.name}"?`)) return;
    try {
      await apiDelete(`/products/${p.id}`);
      loadProducts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo, stock y movimientos vinculados a compras y ventas.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </button>
        )}
      </div>

      <DomainHubNav
        links={[
          { to: '/categories', label: 'Categorías', permission: 'categories.view' },
          { to: '/inventory', label: 'Inventario', permission: 'inventory.view' },
          { to: '/kardex', label: 'Kardex', permission: 'kardex.view' },
          { to: '/purchases', label: 'Compras', permission: 'purchases.view' },
          { to: '/sales', label: 'Ventas', permission: 'sales.view' },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar por nombre, SKU o código…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:w-56"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Categoría</th>
                  <th className="text-right p-3 font-medium">P. venta</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-center p-3 font-medium hidden sm:table-cell">U.M.</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Mín.</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium hidden lg:table-cell">Enlaces</th>
                  {(canUpdate || canDelete) && (
                    <th className="text-right p-3 font-medium">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canUpdate || canDelete ? 10 : 9}
                        className="p-8 text-center text-muted-foreground"
                      >
                      No hay productos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/20">
                      <td className="p-3 font-mono text-xs">{p.sku}</td>
                      <td className="p-3 font-medium">
                        {p.name}
                        {(p.measureDetail || p.unitOfMeasure) && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {[p.measureDetail, p.unitOfMeasure?.symbol]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {cop.format(Number(p.salePrice))}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">
                        <span
                          className={
                            p.minStock > 0 && p.stock < p.minStock ? 'text-warning' : ''
                          }
                        >
                          {formatQtyNumber(p.stock, p.unitOfMeasure)}
                        </span>
                      </td>
                      <td className="p-3 text-center text-muted-foreground hidden sm:table-cell">
                        {formatUnitSymbol(p.unitOfMeasure)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                        {p.minStock > 0 ? formatQtyNumber(p.minStock, p.unitOfMeasure) : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            p.isActive
                              ? 'rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500'
                              : 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                          }
                        >
                          {p.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right hidden lg:table-cell">
                        <div className="flex justify-end gap-1">
                          <Link
                            to={kardexPath({ productId: p.id })}
                            title="Kardex del producto"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <BookOpen className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/inventory?search=${encodeURIComponent(p.sku)}`}
                            title="Ver en inventario"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Warehouse className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                      {(canUpdate || canDelete) && (
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdate && (
                              <button
                                type="button"
                                title="Editar"
                                onClick={() => openEdit(p)}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && p.isActive && (
                              <button
                                type="button"
                                title="Desactivar"
                                onClick={() => handleDeactivate(p)}
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
                Página {meta.page} de {meta.totalPages} ({meta.total} productos)
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

      {canDelete && importSkuCount != null && importSkuCount > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <h2 className="text-sm font-semibold">Limpieza de importación (SKU 0–740)</h2>
          <p className="text-xs text-muted-foreground">
            Hay {importSkuCount} producto(s) con SKU numérico y nombre vacío o genérico (típico de
            importación errónea). Se desactivan en bloque; no se borran ventas históricas.
          </p>
          <button
            type="button"
            disabled={importSkuBusy}
            onClick={() => void purgeImportSkus(true)}
            className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Revisar y desactivar en bloque
          </button>
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadProducts}
        categories={categories}
        initial={editProduct}
      />
    </div>
  );
}
