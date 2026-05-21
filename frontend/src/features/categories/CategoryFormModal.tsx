import { useEffect, useState } from 'react';
import { apiPatch, apiPost } from '../../lib/api';

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  imageUrl: string | null;
  isActive: boolean;
  productCount?: number;
}

interface FlatCat {
  id: string;
  name: string;
  parentId: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  flatCategories: FlatCat[];
  initial: CategoryDto | null;
}

export function CategoryFormModal({
  open,
  onClose,
  onSaved,
  flatCategories,
  initial,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setName(initial.name);
      setDescription(initial.description ?? '');
      setParentId(initial.parentId ?? '');
    } else {
      setName('');
      setDescription('');
      setParentId('');
    }
  }, [open, initial]);

  if (!open) return null;

  const parentChoices = flatCategories.filter((c) => c.id !== initial?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await apiPatch(`/categories/${initial.id}`, {
          name,
          description: description.trim() || undefined,
          parentId: parentId ? parentId : null,
        });
      } else {
        await apiPost('/categories', {
          name,
          description: description.trim() || undefined,
          parentId: parentId || undefined,
        });
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
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {initial ? 'Editar categoría' : 'Nueva categoría'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-muted-foreground">Nombre *</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Descripción</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Categoría padre</span>
            <select
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">— Raíz —</option>
              {parentChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
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
  );
}
