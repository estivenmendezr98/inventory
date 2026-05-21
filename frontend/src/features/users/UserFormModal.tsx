import { useEffect, useState } from 'react';
import { apiFetch, apiPatch, apiPost } from '../../lib/api';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  keycloakLinked: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  role: { id: string; name: string; description: string | null };
}

export interface RoleOption {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: UserDto | null;
  roles: RoleOption[];
  currentUserId: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMINISTRADOR: 'Super administrador',
  ADMINISTRADOR: 'Administrador',
  CAJERO: 'Cajero',
};

function roleLabel(name: string): string {
  return ROLE_LABEL[name] ?? name;
}

export function UserFormModal({ open, onClose, onSaved, initial, roles, currentUserId }: Props) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditingSelf = !!(initial && currentUserId && initial.id === currentUserId);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setEmail(initial.email);
      setFirstName(initial.firstName);
      setLastName(initial.lastName);
      setPhone(initial.phone ?? '');
      setRoleId(initial.role.id);
      setIsActive(initial.isActive);
      setPassword('');
    } else {
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setRoleId(roles[0]?.id ?? '');
      setIsActive(true);
      setPassword('');
    }
  }, [open, initial, roles]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        const body: Record<string, unknown> = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() === '' ? null : phone.trim(),
        };
        if (!isEditingSelf) {
          body.roleId = roleId;
          body.isActive = isActive;
        }
        if (password.trim() !== '') {
          body.password = password.trim();
        }
        await apiPatch(`/users/${initial.id}`, body);
      } else {
        if (!roleId) {
          setError('Selecciona un rol');
          setSaving(false);
          return;
        }
        await apiPost('/users', {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          password: password.trim(),
          roleId,
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
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">
          {initial ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        {!initial && (
          <p className="mt-2 text-xs text-muted-foreground">
            La contraseña se guarda en Keycloak. El servidor necesita acceso de administrador
            (KC_BASE_URL, KC_REALM y KC_ADMIN_* o KC_ADMIN_CLI_SECRET).
          </p>
        )}
        {initial && isEditingSelf && (
          <p className="mt-2 text-xs text-muted-foreground">
            Deja la contraseña en blanco si no quieres cambiarla.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {!initial && (
            <label className="block text-sm">
              <span className="text-muted-foreground">Correo</span>
              <input
                type="email"
                required
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {initial && (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Correo</span>
              <div className="font-medium">{initial.email}</div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Nombre</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Apellido</span>
              <input
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted-foreground">Teléfono</span>
              <input
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">
                Contraseña {initial && '(Opcional para actualizar)'}
              </span>
              <input
                type="password"
                required={!initial}
                minLength={6}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          {!initial && (
            <label className="block text-sm">
              <span className="text-muted-foreground">Rol</span>
              <select
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {roleLabel(r.name)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {initial && !isEditingSelf && (
            <>
              <label className="block text-sm">
                <span className="text-muted-foreground">Rol</span>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roleLabel(r.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-input"
                />
                <span>Usuario activo</span>
              </label>
            </>
          )}

          {initial && isEditingSelf && (
            <p className="text-xs text-muted-foreground">
              No puedes cambiar tu rol ni desactivar tu cuenta desde aquí.
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-muted/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
