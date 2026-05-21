import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiPatch, apiPost } from '../../lib/api';
import {
  fetchUnitsOfMeasure,
  qtyInputStep,
  type UnitOfMeasureDto,
  type UnitsOfMeasureResponse,
} from '../../lib/units-of-measure';
import { ProductHowToCountField } from './ProductHowToCountField';

export interface ProductDto {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  costPrice: string;
  salePrice: string;
  taxRate: string;
  minStock: number;
  maxStock: number;
  stock: number;
  reservedQty: number;
  imageUrl: string | null;
  isActive: boolean;
  unitOfMeasureId: string;
  unitOfMeasure: UnitOfMeasureDto | null;
  measureDetail: string | null;
  contentPerUnit?: number | null;
  contentUnitId?: string | null;
  contentUnit?: UnitOfMeasureDto | null;
  alternateUnits?: Array<{
    unitOfMeasureId: string;
    factorToBase: number;
    label?: string | null;
    unitOfMeasure: UnitOfMeasureDto;
  }>;
}

interface CategoryOpt {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: CategoryOpt[];
  initial: ProductDto | null;
}

export function ProductFormModal({ open, onClose, onSaved, categories, initial }: Props) {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [minStock, setMinStock] = useState('0');
  const [maxStock, setMaxStock] = useState('0');
  const [unitOfMeasureId, setUnitOfMeasureId] = useState('');
  const [alternateUnits, setAlternateUnits] = useState<
    Array<{ unitOfMeasureId: string; factorToBase: string }>
  >([]);
  const [unitsGrouped, setUnitsGrouped] = useState<UnitsOfMeasureResponse['grouped']>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUnit =
    unitsGrouped.flatMap((g) => g.units).find((u) => u.id === unitOfMeasureId) ?? null;
  const stockStep = qtyInputStep(selectedUnit);

  const initialAlternates =
    initial?.alternateUnits?.map((a) => ({
      unitOfMeasureId: a.unitOfMeasureId,
      factorToBase: a.factorToBase,
    })) ??
    (initial?.contentUnitId && initial.contentPerUnit
      ? [
          {
            unitOfMeasureId: initial.contentUnitId,
            factorToBase: 1 / initial.contentPerUnit,
          },
        ]
      : []);

  useEffect(() => {
    if (!open) return;
    void fetchUnitsOfMeasure()
      .then((res) => {
        setUnitsGrouped(res.grouped);
        if (!initial) setUnitOfMeasureId(res.defaultUnitId);
      })
      .catch(() => setUnitsGrouped([]));
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setSku(initial.sku);
      setBarcode(initial.barcode ?? '');
      setName(initial.name);
      setDescription(initial.description ?? '');
      setCategoryId(initial.categoryId ?? '');
      setCostPrice(initial.costPrice);
      setSalePrice(initial.salePrice);
      setTaxRate(initial.taxRate);
      setMinStock(String(initial.minStock));
      setMaxStock(String(initial.maxStock));
      setUnitOfMeasureId(initial.unitOfMeasureId);
      setAlternateUnits(
        initialAlternates.map((a) => ({
          unitOfMeasureId: a.unitOfMeasureId,
          factorToBase: String(a.factorToBase),
        })),
      );
    } else {
      setSku('');
      setBarcode('');
      setName('');
      setDescription('');
      setCategoryId('');
      setCostPrice('');
      setSalePrice('');
      setTaxRate('0');
      setMinStock('0');
      setMaxStock('0');
      setAlternateUnits([]);
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitOfMeasureId) {
      setError('Indique cómo cuenta este producto en inventario.');
      return;
    }

    const parsedAlternates = alternateUnits
      .filter((r) => r.unitOfMeasureId && r.factorToBase.trim())
      .map((r) => ({
        unitOfMeasureId: r.unitOfMeasureId,
        factorToBase: Number(r.factorToBase.replace(',', '.')),
      }));
    for (const alt of parsedAlternates) {
      if (!Number.isFinite(alt.factorToBase) || alt.factorToBase <= 0) {
        setError('Cada factor de conversión debe ser un número mayor que cero.');
        return;
      }
      if (alt.unitOfMeasureId === unitOfMeasureId) {
        setError('Las unidades alternas deben ser distintas a la unidad base.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        sku,
        barcode: barcode.trim() || undefined,
        name,
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        unitOfMeasureId,
        alternateUnits: parsedAlternates.length ? parsedAlternates : undefined,
        costPrice: Number(costPrice),
        salePrice: Number(salePrice),
        taxRate: Number(taxRate || 0),
        minStock: Number(minStock) || 0,
        maxStock: Number(maxStock) || 0,
      };
      if (initial) {
        await apiPatch(`/products/${initial.id}`, payload);
      } else {
        await apiPost('/products', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <div className="flex min-h-full items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
          <h2 id="product-form-title" className="text-xl font-semibold">
            {initial ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Nombre, precios y cómo lo cuenta en bodega. Use los ejemplos si tiene tubos, galones o
            productos con medida dentro.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">SKU *</span>
                <div className="mt-1 flex gap-2">
                  <input
                    required
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={!!initial}
                    placeholder="TUBO-PVC-2M"
                  />
                  {!initial && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50"
                      onClick={() => setSku(`PROD-${Date.now()}`)}
                    >
                      Generar
                    </button>
                  )}
                </div>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Código de barras</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium">Nombre *</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tubo PVC 2 m"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Categoría</span>
                <select
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm sm:col-span-1">
                <span className="font-medium">Descripción</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <ProductHowToCountField
              unitsGrouped={unitsGrouped}
              unitOfMeasureId={unitOfMeasureId}
              onUnitChange={setUnitOfMeasureId}
              alternateUnits={alternateUnits}
              onAlternateUnitsChange={setAlternateUnits}
              initialAlternates={initialAlternates}
            />

            <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-border p-4">
              <p className="sm:col-span-2 text-sm font-medium">Precios y alertas</p>
              <label className="block text-sm">
                <span className="font-medium">Costo *</span>
                <input
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Precio venta *</span>
                <input
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">IVA %</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">
                  Stock bajo{selectedUnit ? ` (${selectedUnit.symbol})` : ''}
                </span>
                <input
                  type="number"
                  min={0}
                  step={stockStep}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">
                  Stock máximo{selectedUnit ? ` (${selectedUnit.symbol})` : ''}
                </span>
                <input
                  type="number"
                  min={0}
                  step={stockStep}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                />
              </label>
            </div>

            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
