import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  deleteCompanyLogo,
  uploadCompanyLogo,
  type BrandingInfo,
} from '../../lib/company-branding';
import { useCompanyBrandingStore } from '../../stores/company-branding.store';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

interface CompanyLogoSectionProps {
  canUpdate: boolean;
  branding: BrandingInfo;
  logoSrc: string | null;
  onBrandingChange: (branding: BrandingInfo) => void;
}

export function CompanyLogoSection({
  canUpdate,
  branding,
  logoSrc,
  onBrandingChange,
}: CompanyLogoSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const setBranding = useCompanyBrandingStore((s) => s.setBranding);

  const pickFile = () => inputRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file || !canUpdate) return;
    setLocalError(null);
    setUploading(true);
    try {
      const next = await uploadCompanyLogo(file);
      setBranding(next);
      onBrandingChange(next);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'No se pudo subir el logo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    if (!canUpdate || !branding.hasLogo) return;
    if (!window.confirm('¿Quitar el logo de la empresa?')) return;
    setLocalError(null);
    setRemoving(true);
    try {
      const next = await deleteCompanyLogo();
      setBranding(next);
      onBrandingChange(next);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'No se pudo quitar el logo');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold">Logo de la empresa</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se muestra en el menú lateral y actualiza el favicon del navegador automáticamente.
          Formatos: PNG, JPEG, WebP o SVG (máx. 2 MB).
        </p>
      </div>

      {localError && (
        <p className="text-sm text-destructive">{localError}</p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            'flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30',
            !logoSrc && 'text-muted-foreground',
          )}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Logo de la empresa"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <ImagePlus className="h-8 w-8 opacity-50" aria-hidden />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={!canUpdate || uploading}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {canUpdate && (
            <>
              <button
                type="button"
                onClick={pickFile}
                disabled={uploading || removing}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? 'Subiendo…' : branding.hasLogo ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {branding.hasLogo && (
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={uploading || removing}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted/50 disabled:opacity-50"
                >
                  {removing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Quitar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!canUpdate && (
        <p className="text-xs text-muted-foreground">
          Solo lectura: necesitas permiso «Editar configuración» para cambiar el logo.
        </p>
      )}
    </section>
  );
}
