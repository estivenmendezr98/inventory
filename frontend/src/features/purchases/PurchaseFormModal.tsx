import { useEffect, useState } from 'react';
import { apiFetch, apiPatch, apiPost } from '../../lib/api';
import { Plus, Trash2 } from 'lucide-react';
import {
  listSaleUnits,
  unitForSale,
  type ProductUnitsProfile,
} from '../../lib/product-units';
import {
  minQtyForUnit,
  parseQtyInput,
  qtyInputStep,
  type UnitOfMeasureDto,
} from '../../lib/units-of-measure';

function productProfile(p: ProductOpt): ProductUnitsProfile | null {
  if (!p.unitOfMeasure) return null;
  return {
    unitOfMeasureId: p.unitOfMeasureId ?? p.unitOfMeasure.id,
    unitOfMeasure: p.unitOfMeasure,
    saleUnits: p.saleUnits as ProductUnitsProfile['saleUnits'],
  };
}

interface SupplierOpt {
  id: string;
  nit: string;
  name: string;
}

interface ProductOpt {
  id: string;
  sku: string;
  name: string;
  unitOfMeasureId?: string;
  unitOfMeasure?: UnitOfMeasureDto | null;
  saleUnits?: Array<{ id: string; symbol: string; name: string; isBaseUnit?: boolean }>;
}

export interface PurchaseLineForm {
  productId: string;
  quantity: number;
  purchaseUnitId?: string;
  unitCost: number;
  taxRate: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  purchaseId: string | null;
}

export function PurchaseFormModal({ open, onClose, onSaved, purchaseId }: Props) {
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLineForm[]>([
    { productId: '', quantity: 1, purchaseUnitId: undefined, unitCost: 0, taxRate: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    apiFetch<{ suppliers: SupplierOpt[] }>('/suppliers/options/active')
      .then((r) => setSuppliers(r.suppliers))
      .catch(() => setSuppliers([]));
    apiFetch<{ data: ProductOpt[] }>('/products?limit=200')
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]));
  }, [open]);

  useEffect(() => {
    if (!open || !purchaseId) {
      if (open && !purchaseId) {
        setSupplierId('');
        setDate(new Date().toISOString().slice(0, 10));
        setNotes('');
        setLines([{ productId: '', quantity: 1, unitCost: 0, taxRate: 0 }]);
      }
      return;
    }
    setLoading(true);
    apiFetch<{
      supplier: { id: string };
      date: string;
      notes: string | null;
      items: Array<{
        productId: string;
        quantity: number;
        unitCost: string;
        taxRate: string;
      }>;
    }>(`/purchases/${purchaseId}`)
      .then((p) => {
        setSupplierId(p.supplier.id);
        setDate(p.date.slice(0, 10));
        setNotes(p.notes ?? '');
        setLines(
          p.items.length
            ? p.items.map((it) => ({
                productId: it.productId,
                quantity: it.quantity,
                unitCost: Number(it.unitCost),
                taxRate: Number(it.taxRate),
              }))
            : [{ productId: '', quantity: 1, unitCost: 0, taxRate: 0 }]
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [open, purchaseId]);

  if (!open) return null;

  const addLine = () => {
    setLines((prev) => [...prev, { productId: '', quantity: 1, unitCost: 0, taxRate: 0 }]);
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<PurchaseLineForm>) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('Seleccione proveedor');
      return;
    }
    const cleanLines = lines.filter((l) => l.productId);
    if (cleanLines.length === 0) {
      setError('Agregue al menos una línea con producto');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      supplierId,
      date: new Date(`${date}T12:00:00.000Z`).toISOString(),
      notes: notes.trim() || undefined,
      items: cleanLines.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        purchaseUnitId: l.purchaseUnitId,
        unitCost: Number(l.unitCost),
        taxRate: Number(l.taxRate),
      })),
    };
    try {
      if (purchaseId) {
        await apiPatch(`/purchases/${purchaseId}`, payload);
      } else {
        await apiPost('/purchases', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {purchaseId ? 'Editar compra (borrador)' : 'Nueva orden de compra'}
        </h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted-foreground">Proveedor *</span>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">— Seleccione —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nit} — {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Fecha *</span>
                <input
                  type="date"
                  required
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-muted-foreground">Notas</span>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Líneas</span>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 rounded-lg border border-input px-2 py-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Línea
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              {lines.map((line, idx) => {
                const lineProduct = products.find((p) => p.id === line.productId);
                const profile = lineProduct ? productProfile(lineProduct) : null;
                const saleUnits = profile ? listSaleUnits(profile) : [];
                const unitId =
                  line.purchaseUnitId ?? profile?.unitOfMeasureId ?? '';
                const qtyUnit =
                  profile && unitId ? unitForSale(profile, unitId) : null;
                return (
                <div
                  key={idx}
                  className="grid gap-2 sm:grid-cols-12 sm:items-end border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <label className="sm:col-span-4 text-xs">
                    Producto
                    <select
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={line.productId}
                      onChange={(e) => {
                        const p = products.find((x) => x.id === e.target.value);
                        updateLine(idx, {
                          productId: e.target.value,
                          purchaseUnitId: p?.unitOfMeasureId ?? p?.unitOfMeasure?.id,
                        });
                      }}
                    >
                      <option value="">—</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {saleUnits.length > 1 && (
                    <label className="sm:col-span-2 text-xs">
                      Unidad
                      <select
                        className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                        value={unitId ?? ''}
                        onChange={(e) =>
                          updateLine(idx, { purchaseUnitId: e.target.value })
                        }
                      >
                        {saleUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.symbol}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label
                    className={`text-xs ${saleUnits.length > 1 ? 'sm:col-span-2' : 'sm:col-span-3'}`}
                  >
                    Cant.
                    <input
                      type="number"
                      min={minQtyForUnit(qtyUnit)}
                      step={qtyInputStep(qtyUnit)}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, {
                          quantity:
                            parseQtyInput(e.target.value, minQtyForUnit(qtyUnit) || 1) ||
                            minQtyForUnit(qtyUnit) ||
                            1,
                        })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 text-xs">
                    Costo u.
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={line.unitCost}
                      onChange={(e) =>
                        updateLine(idx, { unitCost: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <label className="sm:col-span-2 text-xs">
                    IVA %
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="mt-1 w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                      value={line.taxRate}
                      onChange={(e) =>
                        updateLine(idx, { taxRate: Number(e.target.value) || 0 })
                      }
                    />
                  </label>
                  <div className="sm:col-span-1 flex justify-end">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        title="Quitar línea"
                        onClick={() => removeLine(idx)}
                        className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-input px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar borrador'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
