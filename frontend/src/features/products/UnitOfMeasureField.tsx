import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import {
  createUnitOfMeasureInDb,
  UNIT_CATEGORY_OPTIONS,
  type UnitOfMeasureDto,
  type UnitsOfMeasureResponse,
} from '../../lib/units-of-measure';

const PLACEHOLDER_BY_CATEGORY: Record<string, string> = {
  COUNT: 'Ej: caja x12, pack 6 und, bolsa 24 piezas',
  LENGTH: 'Ej: rollo 100 m, tubo 3 m, plancha 2,40 m',
  VOLUME: 'Ej: botella 500 mL, garrafa 3 L, bidón 20 L',
  WEIGHT: 'Ej: bolsa 1 kg, paquete 250 g, saco 50 kg',
  AREA: 'Ej: lámina 2 m², placa 1,22 x 2,44 m',
};

function unitLabel(u: UnitOfMeasureDto): string {
  return `${u.name} (${u.symbol})`;
}

interface Props {
  unitsGrouped: UnitsOfMeasureResponse['grouped'];
  unitOfMeasureId: string;
  onUnitChange: (id: string) => void;
  measureDetail: string;
  onMeasureDetailChange: (value: string) => void;
  canManageUnits?: boolean;
  onCatalogChange?: () => Promise<UnitsOfMeasureResponse>;
}

export function UnitOfMeasureField({
  unitsGrouped,
  unitOfMeasureId,
  onUnitChange,
  measureDetail,
  onMeasureDetailChange,
  canManageUnits = false,
  onCatalogChange,
}: Props) {
  const [search, setSearch] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newCategory, setNewCategory] = useState<string>('VOLUME');
  const [addUnitErr, setAddUnitErr] = useState<string | null>(null);
  const [addUnitSaving, setAddUnitSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const allUnits = useMemo(
    () =>
      unitsGrouped.flatMap((g) =>
        g.units.map((u) => ({ ...u, categoryLabel: g.categoryLabel }))
      ),
    [unitsGrouped]
  );

  const selectedUnit = allUnits.find((u) => u.id === unitOfMeasureId) ?? null;

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUnits;
    return allUnits.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.symbol.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        u.categoryLabel.toLowerCase().includes(q)
    );
  }, [allUnits, search]);

  const measurePlaceholder =
    (selectedUnit && PLACEHOLDER_BY_CATEGORY[selectedUnit.category]) ||
    'Ej: tamaño, presentación o contenido del producto';

  useEffect(() => {
    if (!listOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setListOpen(false);
        setSearch(selectedUnit ? unitLabel(selectedUnit) : '');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [listOpen, selectedUnit]);

  useEffect(() => {
    if (selectedUnit && !listOpen) {
      setSearch(unitLabel(selectedUnit));
    }
  }, [selectedUnit?.id, listOpen, selectedUnit]);

  const pickUnit = (u: UnitOfMeasureDto) => {
    onUnitChange(u.id);
    setSearch(unitLabel(u));
    setListOpen(false);
    setShowAddUnit(false);
  };

  const submitNewUnit = async () => {
    setAddUnitSaving(true);
    setAddUnitErr(null);
    try {
      const created = await createUnitOfMeasureInDb({
        code: newCode.trim(),
        name: newName.trim(),
        symbol: newSymbol.trim(),
        category: newCategory,
      });
      await onCatalogChange?.();
      pickUnit(created);
      setNewCode('');
      setNewName('');
      setNewSymbol('');
    } catch (e) {
      setAddUnitErr(e instanceof Error ? e.message : 'No se pudo guardar la unidad');
    } finally {
      setAddUnitSaving(false);
    }
  };

  return (
    <div ref={rootRef} className="space-y-3">
      <label className="block text-sm">
        <span className="text-muted-foreground">Unidad de medida *</span>
        <input
          type="text"
          required
          autoComplete="off"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls="unit-of-measure-listbox"
          aria-autocomplete="list"
          placeholder="Escriba: litro, metro, kg, pieza, caja…"
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setListOpen(true);
          }}
          onFocus={() => {
            setListOpen(true);
            if (selectedUnit && search === unitLabel(selectedUnit)) {
              setSearch('');
            }
          }}
        />
        {listOpen && filteredUnits.length > 0 && (
          <ul
            id="unit-of-measure-listbox"
            role="listbox"
            className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-border bg-popover shadow-md"
          >
            {filteredUnits.map((u) => (
              <li key={u.id} role="option" aria-selected={u.id === unitOfMeasureId}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    u.id === unitOfMeasureId && 'bg-primary/10 font-medium'
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickUnit(u)}
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted-foreground"> · {u.symbol}</span>
                  <span className="block text-xs text-muted-foreground">{u.categoryLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {listOpen && search.trim() && filteredUnits.length === 0 && !showAddUnit && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Sin coincidencias en el catálogo (base de datos).
            </p>
            {canManageUnits && (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  setShowAddUnit(true);
                  setNewName(search.trim());
                  setNewSymbol(search.trim().slice(0, 8));
                }}
              >
                + Registrar unidad en la base de datos
              </button>
            )}
          </div>
        )}
        {showAddUnit && canManageUnits && (
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium">Nueva unidad (se guarda en PostgreSQL)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs">
                Código
                <input
                  className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="GAL"
                  maxLength={16}
                />
              </label>
              <label className="text-xs">
                Símbolo
                <input
                  className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="gal"
                  maxLength={16}
                />
              </label>
            </div>
            <label className="text-xs block">
              Nombre
              <input
                className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Galón"
              />
            </label>
            <label className="text-xs block">
              Tipo
              <select
                className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {UNIT_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {addUnitErr && <p className="text-xs text-destructive">{addUnitErr}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="text-xs rounded border border-input px-2 py-1"
                onClick={() => setShowAddUnit(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={addUnitSaving || !newCode.trim() || !newName.trim() || !newSymbol.trim()}
                className="text-xs rounded bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50"
                onClick={() => void submitNewUnit()}
              >
                {addUnitSaving ? 'Guardando…' : 'Guardar en catálogo'}
              </button>
            </div>
          </div>
        )}
        <input type="hidden" name="unitOfMeasureId" value={unitOfMeasureId} required />
        <p className="mt-1 text-xs text-muted-foreground">
          Catálogo cargado desde la base de datos.{' '}
          {selectedUnit
            ? selectedUnit.allowsDecimals
              ? `Inventario en ${selectedUnit.symbol} con hasta ${selectedUnit.decimalPlaces} decimal(es).`
              : `Inventario en ${selectedUnit.symbol} (solo enteros).`
            : 'Seleccione la unidad con la que se compra, almacena y vende.'}
        </p>
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">Presentación / medida del producto</span>
        <input
          type="text"
          maxLength={255}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder={measurePlaceholder}
          value={measureDetail}
          onChange={(e) => onMeasureDetailChange(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Opcional. Se guarda en la ficha del producto. Describe tamaño o envase; el inventario
          sigue en{' '}
          {selectedUnit?.symbol ?? 'la unidad elegida'}.
        </p>
      </label>
    </div>
  );
}
