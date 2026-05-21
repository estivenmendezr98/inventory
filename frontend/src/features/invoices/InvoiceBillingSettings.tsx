import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { apiDownloadBlob, apiFetch, apiPost, apiPut } from '../../lib/api';
import { printThermalReceipt } from '../../lib/thermal-print';
import type { ThermalReceiptPayload } from '../../lib/thermal-receipt-types';
import { Eye, Mail, Printer, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface InvoiceTemplateConfig {
  pageSize: '80mm' | '58mm' | 'A4' | 'LETTER' | 'LEGAL' | 'A5';
  orientation: 'portrait' | 'landscape';
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  fontSizeTitle: number;
  fontSizeBody: number;
  fontSizeItems: number;
  fontSizeFooter: number;
  headerBackgroundColor: string;
  accentColor: string;
  textColor: string;
  showLogo: boolean;
  showItemSku: boolean;
  showSubtotal: boolean;
  showTax: boolean;
  footerText: string;
  appendFooterNote: boolean;
  showSimplifiedRegimeLine: boolean;
  previewBeforePrint: boolean;
  printerHint: string;
  openCashDrawer: boolean;
}

export interface InvoiceEmailConfig {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromName: string;
  fromEmail: string;
  defaultSubject: string;
  defaultBody: string;
  attachPdf: boolean;
  replyTo: string;
  smtpPasswordSet?: boolean;
  configured?: boolean;
  issues?: string[];
}

const THERMAL_SIZES: InvoiceTemplateConfig['pageSize'][] = ['58mm', '80mm'];
const OFFICE_SIZES: InvoiceTemplateConfig['pageSize'][] = ['A4', 'LETTER', 'LEGAL', 'A5'];

function isThermal(pageSize: InvoiceTemplateConfig['pageSize']): boolean {
  return pageSize === '58mm' || pageSize === '80mm';
}

const LEGACY_FOOTER_RE =
  /dian|ubl\s*2\.1|cufe|cude|proveedor tecnológico|representación gráfica|firma digital|xml adjunto/i;

function cleanFooterText(text: string): string {
  const t = text.trim();
  if (!t || LEGACY_FOOTER_RE.test(t)) return 'Gracias por su compra.';
  return t.slice(0, 200);
}

function normalizeTemplate(t: InvoiceTemplateConfig): InvoiceTemplateConfig {
  return {
    ...t,
    footerText: cleanFooterText(t.footerText),
    orientation: isThermal(t.pageSize) ? 'portrait' : t.orientation,
    openCashDrawer: false,
  };
}

function emailBodyForSave(
  email: InvoiceEmailConfig,
  smtpPasswordInput: string,
): InvoiceEmailConfig & { smtpPassword?: string } {
  const body: InvoiceEmailConfig & { smtpPassword?: string } = {
    enabled: email.enabled,
    smtpHost: email.smtpHost,
    smtpPort: email.smtpPort,
    smtpSecure: email.smtpSecure,
    smtpUser: email.smtpUser,
    fromName: email.fromName,
    fromEmail: email.fromEmail,
    defaultSubject: email.defaultSubject,
    defaultBody: email.defaultBody,
    attachPdf: email.attachPdf,
    replyTo: email.replyTo,
  };
  if (smtpPasswordInput.trim()) body.smtpPassword = smtpPasswordInput.trim();
  return body;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      {children}
      {hint && <span className="mt-0.5 block text-[10px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-input"
      />
      {label}
    </label>
  );
}

export function InvoiceBillingSettings() {
  const [tab, setTab] = useState<'print' | 'email'>('print');
  const [template, setTemplate] = useState<InvoiceTemplateConfig | null>(null);
  const [email, setEmail] = useState<InvoiceEmailConfig | null>(null);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [tRes, eRes] = await Promise.all([
        apiFetch<{ data: InvoiceTemplateConfig }>('/invoices/template-config'),
        apiFetch<{ data: InvoiceEmailConfig }>('/invoices/email-config'),
      ]);
      setTemplate(normalizeTemplate(tRes.data));
      setEmail(eRes.data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTemplate = async () => {
    if (!template) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const payload = {
        ...template,
        footerText: template.footerText.slice(0, 200),
        orientation: isThermal(template.pageSize) ? 'portrait' : template.orientation,
        openCashDrawer: false,
      };
      const res = await apiPut<{ data: InvoiceTemplateConfig }>(
        '/invoices/template-config',
        payload,
      );
      setTemplate(res.data);
      setMsg('Configuración de ticket guardada.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async () => {
    if (!email) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await apiPut<{ data: InvoiceEmailConfig }>(
        '/invoices/email-config',
        emailBodyForSave(email, smtpPassword),
      );
      setEmail(res.data);
      setSmtpPassword('');
      setMsg('Correo guardado.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const previewPdf = async () => {
    setBusy(true);
    setErr(null);
    try {
      await apiDownloadBlob('/invoices/template-config/preview.pdf', 'comprobante-vista-previa.pdf');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error en vista previa');
    } finally {
      setBusy(false);
    }
  };

  const testThermalPrint = async () => {
    if (!template) return;
    setBusy(true);
    setErr(null);
    try {
      await apiPut('/invoices/template-config', {
        ...template,
        footerText: template.footerText.slice(0, 200),
        orientation: isThermal(template.pageSize) ? 'portrait' : template.orientation,
        openCashDrawer: false,
      });
      const data = await apiFetch<ThermalReceiptPayload>('/invoices/thermal-receipt/sample');
      printThermalReceipt(data);
      setMsg('Ticket de prueba: revise la ventana e imprima (Ctrl+P si no abre el diálogo).');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al imprimir prueba');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!testTo.trim()) {
      setErr('Indique un correo de prueba');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await apiPost('/invoices/email-config/test', { to: testTo.trim() });
      setMsg(`Correo de prueba enviado a ${testTo}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al enviar prueba');
    } finally {
      setBusy(false);
    }
  };

  if (!template || !email) {
    return <p className="text-sm text-muted-foreground">Cargando configuración…</p>;
  }

  const thermal = isThermal(template.pageSize);
  const marginMax = thermal ? 5 : 40;
  const marginMin = thermal ? 0 : 2;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Configuración del ticket</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Comprobante de venta local para régimen simplificado. Impresión en rollo térmico 58 mm u 80 mm
          desde el navegador.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setTab('print')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm',
            tab === 'print' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Printer className="inline h-4 w-4 mr-1" />
          Impresión
        </button>
        <button
          type="button"
          onClick={() => setTab('email')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm',
            tab === 'email' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          )}
        >
          <Mail className="inline h-4 w-4 mr-1" />
          Correo (opcional)
        </button>
      </div>

      {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}
      {err && <p className="text-sm text-destructive">{err}</p>}

      {tab === 'print' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Tamaño y márgenes</p>
            <Field label="Tamaño de papel" hint="Para térmica use 58 mm u 80 mm">
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={template.pageSize}
                onChange={(e) => {
                  const pageSize = e.target.value as InvoiceTemplateConfig['pageSize'];
                  setTemplate({
                    ...template,
                    pageSize,
                    orientation: isThermal(pageSize) ? 'portrait' : template.orientation,
                  });
                }}
              >
                <optgroup label="Impresora térmica">
                  {THERMAL_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Copia en hoja (opcional)">
                  {OFFICE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            {!thermal && (
              <Field label="Orientación">
                <select
                  className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  value={template.orientation}
                  onChange={(e) =>
                    setTemplate({
                      ...template,
                      orientation: e.target.value as 'portrait' | 'landscape',
                    })
                  }
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </select>
              </Field>
            )}
            {thermal && (
              <p className="text-xs text-muted-foreground">Orientación: vertical (térmica).</p>
            )}
            {(['marginTopMm', 'marginBottomMm', 'marginLeftMm', 'marginRightMm'] as const).map(
              (key) => (
                <Field
                  key={key}
                  label={key.replace('margin', 'Margen ').replace('Mm', ` (mm, ${marginMin}–${marginMax})`)}
                >
                  <input
                    type="number"
                    min={marginMin}
                    max={marginMax}
                    step={1}
                    className="mt-1 w-full rounded-lg border border-input px-2 py-1.5 text-sm"
                    value={template[key]}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        [key]: Math.min(
                          marginMax,
                          Math.max(marginMin, Number(e.target.value) || 0),
                        ),
                      })
                    }
                  />
                </Field>
              ),
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Contenido del ticket</p>
            <Toggle
              checked={template.showLogo}
              onChange={(v) => setTemplate({ ...template, showLogo: v })}
              label="Mostrar logo (Configuración → empresa)"
            />
            <Toggle
              checked={template.showItemSku}
              onChange={(v) => setTemplate({ ...template, showItemSku: v })}
              label="Mostrar SKU"
            />
            <Toggle
              checked={template.showSubtotal}
              onChange={(v) => setTemplate({ ...template, showSubtotal: v })}
              label="Mostrar subtotal"
            />
            <Toggle
              checked={template.showTax}
              onChange={(v) => setTemplate({ ...template, showTax: v })}
              label="Mostrar IVA (desglose)"
            />
            <Toggle
              checked={template.appendFooterNote}
              onChange={(v) => setTemplate({ ...template, appendFooterNote: v })}
              label="Añadir nota de pie desde Configuración general"
            />
            <Field label="Texto de pie de página" hint="Máximo 200 caracteres. Mensaje libre del negocio.">
              <textarea
                rows={3}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={template.footerText}
                onChange={(e) =>
                  setTemplate({ ...template, footerText: e.target.value.slice(0, 200) })
                }
                placeholder="Ej: Gracias por su compra. Cambios no válidos después de 3 días."
              />
              <span className="text-[10px] text-muted-foreground">
                {template.footerText.length}/200
              </span>
            </Field>
            <Toggle
              checked={template.showSimplifiedRegimeLine}
              onChange={(v) => setTemplate({ ...template, showSimplifiedRegimeLine: v })}
              label='Mostrar leyenda "No requiere factura electrónica"'
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4 lg:col-span-2">
            <p className="text-sm font-medium">Impresora térmica</p>
            <p className="text-xs text-muted-foreground">
              Al imprimir se abre el diálogo del sistema. Seleccione la impresora térmica instalada,
              papel 58 mm u 80 mm, márgenes en «Ninguno» y sin encabezados del navegador.
            </p>
            <Field
              label="Nombre de impresora (recordatorio para el cajero)"
              hint="El navegador no puede fijar la impresora automáticamente"
            >
              <input
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={template.printerHint}
                onChange={(e) => setTemplate({ ...template, printerHint: e.target.value })}
                placeholder="Ej: EPSON TM-T20"
              />
            </Field>
            <Toggle
              checked={template.previewBeforePrint}
              onChange={(v) => setTemplate({ ...template, previewBeforePrint: v })}
              label="Vista previa en pantalla antes de imprimir"
            />
            <Toggle
              checked={false}
              onChange={() => undefined}
              label="Abrir cajón al imprimir"
              disabled
            />
            <p className="text-[10px] text-muted-foreground pl-6 -mt-1">
              No disponible en navegador (requiere ESC/POS con driver nativo).
            </p>
          </div>

          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveTemplate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Guardar configuración
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void previewPdf()}
              className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm"
            >
              <Eye className="h-4 w-4" />
              Vista previa PDF
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void testThermalPrint()}
              className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm"
            >
              <Printer className="h-4 w-4" />
              Probar ticket térmico
            </button>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div className="space-y-3 rounded-xl border border-border p-4 max-w-xl">
          <p className="text-sm text-muted-foreground">
            Envío opcional del PDF del comprobante por correo al cliente.
          </p>
          <Toggle
            checked={email.enabled}
            onChange={(v) => setEmail({ ...email, enabled: v })}
            label="Habilitar envío por correo"
          />
          <Field label="Servidor SMTP">
            <input
              className="mt-1 w-full rounded-lg border border-input px-2 py-1.5 text-sm"
              value={email.smtpHost}
              onChange={(e) => setEmail({ ...email, smtpHost: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Puerto">
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-input px-2 py-1.5 text-sm"
                value={email.smtpPort}
                onChange={(e) => setEmail({ ...email, smtpPort: Number(e.target.value) })}
              />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle
                checked={email.smtpSecure}
                onChange={(v) => setEmail({ ...email, smtpSecure: v })}
                label="SSL/TLS"
              />
            </div>
          </div>
          <Field label="Usuario SMTP">
            <input
              className="mt-1 w-full rounded-lg border border-input px-2 py-1.5 text-sm"
              value={email.smtpUser}
              onChange={(e) => setEmail({ ...email, smtpUser: e.target.value })}
            />
          </Field>
          <Field label="Contraseña SMTP" hint={email.smtpPasswordSet ? 'Ya hay contraseña guardada' : undefined}>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-input px-2 py-1.5 text-sm"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
          </Field>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveEmail()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            Guardar correo
          </button>
        </div>
      )}
    </div>
  );
}
