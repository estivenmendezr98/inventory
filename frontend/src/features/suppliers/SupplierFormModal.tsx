import { useEffect, useState } from 'react';
import { apiPatch, apiPost } from '../../lib/api';

export interface SupplierDto {
  id: string;
  nit: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  purchaseCount?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: SupplierDto | null;
}

export function SupplierFormModal({ open, onClose, onSaved, initial }: Props) {
  const [nit, setNit] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setNit(initial.nit);
      setName(initial.name);
      setContactName(initial.contactName ?? '');
      setEmail(initial.email ?? '');
      setPhone(initial.phone ?? '');
      setAddress(initial.address ?? '');
      setCity(initial.city ?? '');
    } else {
      setNit('');
      setName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const base = {
      nit,
      name,
      contactName: contactName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
    };
    try {
      if (initial) {
        await apiPatch(`/suppliers/${initial.id}`, {
          ...base,
          email: email.trim() === '' ? null : email.trim() || undefined,
        });
      } else {
        await apiPost('/suppliers', {
          ...base,
          email: email.trim() || undefined,
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">NIT *</span>
              <input
                required
                minLength={3}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Razón social / nombre *</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted-foreground">Contacto</span>
            <input
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Correo</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Teléfono</span>
              <input
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted-foreground">Dirección</span>
            <input
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Ciudad</span>
            <input
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
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
