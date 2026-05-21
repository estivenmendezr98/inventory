import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/utils';
import type { UnitsOfMeasureResponse } from '../../lib/units-of-measure';

type AlternateInput = { unitOfMeasureId: string; factorToBase: string };

const QUICK = [
  {
    id: 'tube',
    label: 'Tubos PVC (2 m)',
    baseId: 'uom-un',
    altId: 'uom-m',
    factor: '0.5',
  },
  {
    id: 'paint',
    label: 'Galón pintura (3.785 L)',
    baseId: 'uom-un',
    altId: 'uom-l',
    factor: '3.785',
  },
] as const;

interface Props {
  unitsGrouped: UnitsOfMeasureResponse['grouped'];
  unitOfMeasureId: string;
  onUnitChange: (id: string) => void;
  alternateUnits: AlternateInput[];
  onAlternateUnitsChange: (rows: AlternateInput[]) => void;
  initialAlternates?: Array<{ unitOfMeasureId: string; factorToBase: number }>;
}

function sym(unitsGrouped: UnitsOfMeasureResponse['grouped'], id: string) {
  return unitsGrouped.flatMap((g) => g.units).find((u) => u.id === id)?.symbol ?? '?';
}

export function ProductHowToCountField({
  unitsGrouped,
  unitOfMeasureId,
  onUnitChange,
  alternateUnits,
  onAlternateUnitsChange,
  initialAlternates = [],
}: Props) {
  const [quickId, setQuickId] = useState<string | null>(null);
  const allUnits = useMemo(() => unitsGrouped.flatMap((g) => g.units), [unitsGrouped]);
  const hasUnit = (id: string) => allUnits.some((u) => u.id === id);

  useEffect(() => {
    if (initialAlternates.length && alternateUnits.length === 0) {
      onAlternateUnitsChange(
        initialAlternates.map((a) => ({
          unitOfMeasureId: a.unitOfMeasureId,
          factorToBase: String(a.factorToBase),
        })),
      );
    }
  }, [initialAlternates, alternateUnits.length, onAlternateUnitsChange]);

  const applyQuick = (q: (typeof QUICK)[number]) => {
    if (!hasUnit(q.baseId) || !hasUnit(q.altId)) return;
    setQuickId(q.id);
    onUnitChange(q.baseId);
    onAlternateUnitsChange([{ unitOfMeasureId: q.altId, factorToBase: q.factor }]);
  };

  const addAlternate = () => {
    onAlternateUnitsChange([...alternateUnits, { unitOfMeasureId: '', factorToBase: '' }]);
  };

  const updateAlt = (idx: number, patch: Partial<AlternateInput>) => {
    const next = alternateUnits.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onAlternateUnitsChange(next);
    setQuickId(null);
  };

  const removeAlt = (idx: number) => {
    onAlternateUnitsChange(alternateUnits.filter((_, i) => i !== idx));
    setQuickId(null);
  };

  const baseSym = sym(unitsGrouped, unitOfMeasureId);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-muted/15 p-4">
      <div>
        <p className="text-sm font-medium">Unidad base *</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stock, mínimos y kardex siempre en esta unidad. Las compras/ventas pueden usar otras con
          factor.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => applyQuick(q)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs transition',
              quickId === q.id
                ? 'border-primary bg-primary/10'
                : 'border-input bg-background hover:border-primary/50',
            )}
          >
            {q.label}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <select
          required
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
          value={unitOfMeasureId}
          onChange={(e) => {
            setQuickId(null);
            onUnitChange(e.target.value);
          }}
        >
          {unitsGrouped.map((g) => (
            <optgroup key={g.category} label={g.categoryLabel}>
              {g.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Otras unidades de compra/venta</p>
          <button
            type="button"
            onClick={addAlternate}
            className="text-xs text-primary hover:underline"
          >
            + Agregar
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Factor: cuántas <strong>{baseSym}</strong> equivalen a 1 unidad alterna (ej. 1 caja = 12{' '}
          {baseSym} → factor 12; 1 m con base tubo de 2 m → factor 0.5).
        </p>
        {alternateUnits.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Solo unidad base.</p>
        ) : (
          alternateUnits.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">1</span>
              <select
                required
                className="rounded-lg border border-input bg-background px-2 py-1.5 min-w-[7rem]"
                value={row.unitOfMeasureId}
                onChange={(e) => updateAlt(idx, { unitOfMeasureId: e.target.value })}
              >
                <option value="">Unidad…</option>
                {allUnits
                  .filter((u) => u.id !== unitOfMeasureId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.symbol} — {u.name}
                    </option>
                  ))}
              </select>
              <span className="text-muted-foreground">=</span>
              <input
                type="number"
                min={0}
                step="any"
                required
                placeholder="12"
                className="w-24 rounded-lg border border-input px-2 py-1.5 text-center font-semibold"
                value={row.factorToBase}
                onChange={(e) => updateAlt(idx, { factorToBase: e.target.value })}
              />
              <span className="text-muted-foreground">{baseSym}</span>
              <button
                type="button"
                onClick={() => removeAlt(idx)}
                className="text-xs text-destructive hover:underline"
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
