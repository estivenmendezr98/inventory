import type { UnitsOfMeasureResponse } from '../../lib/units-of-measure';

interface Props {
  unitsGrouped: UnitsOfMeasureResponse['grouped'];
  inventoryUnitId: string;
  contentPerUnit: string;
  onContentPerUnitChange: (v: string) => void;
  contentUnitId: string;
  onContentUnitIdChange: (v: string) => void;
}

export function ProductContentUnitField({
  unitsGrouped,
  inventoryUnitId,
  contentPerUnit,
  onContentPerUnitChange,
  contentUnitId,
  onContentUnitIdChange,
}: Props) {
  const allUnits = unitsGrouped.flatMap((g) => g.units);
  const contentUnits = allUnits.filter((u) => u.id !== inventoryUnitId);

  return (
    <fieldset className="rounded-lg border border-border/80 p-3 space-y-3">
      <legend className="px-1 text-sm font-medium">
        Contenido por unidad de inventario (opcional)
      </legend>
      <p className="text-xs text-muted-foreground">
        Ejemplo: 10 tubos PVC en inventario; cada tubo mide 30 cm → inventario en{' '}
        <strong>unidad/pieza</strong>, cantidad <strong>30</strong>, medida{' '}
        <strong>centímetro</strong>. Así puede venderse por tubo o por cm.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted-foreground">Cantidad por pieza</span>
          <input
            type="number"
            min={0}
            step="any"
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="30"
            value={contentPerUnit}
            onChange={(e) => onContentPerUnitChange(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Unidad de esa medida</span>
          <select
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={contentUnitId}
            onChange={(e) => onContentUnitIdChange(e.target.value)}
          >
            <option value="">— Sin medida por pieza —</option>
            {contentUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
