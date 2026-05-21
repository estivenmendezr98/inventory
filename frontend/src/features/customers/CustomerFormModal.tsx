import { useEffect, useState } from 'react';
import { apiPatch, apiPost } from '../../lib/api';
import { DOCUMENT_TYPE_OPTIONS } from './customerDocument';

export interface CustomerDto {
  id: string;
  documentType: string;
  documentNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  saleCount?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: CustomerDto | null;
}

export function CustomerFormModal({ open, onClose, onSaved, initial }: Props) {
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [name, setName] = useState('');
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
      setDocumentType(initial.documentType);
      setDocumentNumber(initial.documentNumber);
      setName(initial.name);
      setEmail(initial.email ?? '');
      setPhone(initial.phone ?? '');
      setAddress(initial.address ?? '');
      setCity(initial.city ?? '');
    } else {
      setDocumentType('CC');
      setDocumentNumber('');
      setName('');
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
      documentType,
      documentNumber,
      name,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
    };
    try {
      if (initial) {
        await apiPatch(`/customers/${initial.id}`, {
          ...base,
          email: email.trim() === '' ? null : email.trim() || undefined,
        });
      } else {
        await apiPost('/customers', {
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
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {initial ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Tipo documento *</span>
              <select
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Número documento *</span>
              <input
                required
                minLength={3}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-muted-foreground">Nombre *</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
