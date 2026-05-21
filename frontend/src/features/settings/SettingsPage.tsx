import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { apiFetch, apiPatch } from '../../lib/api';
import { RefreshCw, Save, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BrandingInfo } from '../../lib/company-branding';
import { companyLogoUrl } from '../../lib/company-branding';
import { useCompanyBrandingStore } from '../../stores/company-branding.store';
import { CompanyLogoSection } from './CompanyLogoSection';

const KEYS = [
  'company.name',
  'company.tax_id',
  'company.address',
  'company.phone',
  'company.email',
  'invoice.footer_note',
  'pos.receipt_header',
] as const;

const LABELS: Record<(typeof KEYS)[number], string> = {
  'company.name': 'Nombre comercial',
  'company.tax_id': 'NIT / identificación fiscal',
  'company.address': 'Dirección',
  'company.phone': 'Teléfono',
  'company.email': 'Correo de contacto',
  'invoice.footer_note': 'Nota adicional en tickets / comprobantes',
  'pos.receipt_header': 'Encabezado en recibo POS (texto libre)',
};

interface SettingItem {
  key: string;
  value: string;
  updatedAt: string | null;
}

interface SettingsResponse {
  items: SettingItem[];
  branding: BrandingInfo;
  meta: { nodeEnv: string };
}

export function SettingsPage() {
  const { hasPermission } = useAuthStore();
  const canView = hasPermission('settings.view');
  const canUpdate = hasPermission('settings.update');

  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [meta, setMeta] = useState<{ nodeEnv: string } | null>(null);
  const [branding, setBranding] = useState<BrandingInfo>({
    hasLogo: false,
    updatedAt: null,
    mimeType: null,
  });
  const setGlobalBranding = useCompanyBrandingStore((s) => s.setBranding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<SettingsResponse>('/settings');
      const v: Record<string, string> = {};
      for (const it of res.items) {
        v[it.key] = it.value;
      }
      setValues(v);
      setInitial({ ...v });
      setMeta(res.meta);
      setBranding(res.branding);
      setGlobalBranding(res.branding);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = KEYS.some((k) => (values[k] ?? '') !== (initial[k] ?? ''));

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!canUpdate || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const entries = KEYS.map((key) => ({ key, value: values[key] ?? '' }));
      const res = await apiPatch<SettingsResponse>('/settings', { entries });
      const v: Record<string, string> = {};
      for (const it of res.items) {
        v[it.key] = it.value;
      }
      setValues(v);
      setInitial({ ...v });
      setMeta(res.meta);
      setBranding(res.branding);
      setGlobalBranding(res.branding);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">No tienes permiso para ver la configuración.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
            <p className="text-sm text-muted-foreground">
              Datos de empresa y textos para facturación y POS. La edición requiere permiso «Editar configuración».
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-60"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Recargar
          </button>
          {canUpdate && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          )}
        </div>
      </div>

      {meta && (
        <p className="text-xs text-muted-foreground">
          Entorno API: <span className="font-mono">{meta.nodeEnv}</span>
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
        <CompanyLogoSection
          canUpdate={canUpdate}
          branding={branding}
          logoSrc={branding.hasLogo ? companyLogoUrl(branding.updatedAt) : null}
          onBrandingChange={setBranding}
        />
        <div className="space-y-6 rounded-xl border border-border bg-card p-6">
          {!canUpdate && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              Solo lectura: necesitas permiso «Editar configuración» para guardar cambios.
            </p>
          )}
          <div className="space-y-5">
            {KEYS.map((key) => {
              const isLong = key === 'invoice.footer_note' || key === 'pos.receipt_header';
              return (
                <label key={key} className="block text-sm">
                  <span className="font-medium text-foreground">{LABELS[key]}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">({key})</span>
                  {isLong ? (
                    <textarea
                      rows={3}
                      disabled={!canUpdate}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                      value={values[key] ?? ''}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  ) : (
                    <input
                      type={key === 'company.email' ? 'email' : 'text'}
                      disabled={!canUpdate}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
                      value={values[key] ?? ''}
                      onChange={(e) => setField(key, e.target.value)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
