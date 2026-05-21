/** Clave JSON en `app_settings` (contraseña SMTP en campo separado). */
export const INVOICE_EMAIL_SETTING_KEY = 'invoice.email';
export const INVOICE_EMAIL_PASSWORD_KEY = 'invoice.email.smtp_password';

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
  attachXml: boolean;
  replyTo: string;
}

export const DEFAULT_INVOICE_EMAIL: InvoiceEmailConfig = {
  enabled: false,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  fromName: 'Comprobantes',
  fromEmail: '',
  defaultSubject: 'Comprobante {{fullNumber}} — {{companyName}}',
  defaultBody:
    'Estimado/a {{customerName}},\n\nAdjuntamos el comprobante {{fullNumber}} por un total de {{total}}.\n\nSaludos cordiales,\n{{companyName}}',
  attachPdf: true,
  attachXml: false,
  replyTo: '',
};

export function parseInvoiceEmailConfig(raw: string | null | undefined): InvoiceEmailConfig {
  if (!raw?.trim()) return { ...DEFAULT_INVOICE_EMAIL };
  try {
    const o = JSON.parse(raw) as Partial<InvoiceEmailConfig>;
    return {
      enabled: o.enabled === true,
      smtpHost: typeof o.smtpHost === 'string' ? o.smtpHost.trim() : '',
      smtpPort: clampPort(Number(o.smtpPort)),
      smtpSecure: o.smtpSecure === true,
      smtpUser: typeof o.smtpUser === 'string' ? o.smtpUser.trim() : '',
      fromName:
        typeof o.fromName === 'string' && o.fromName.trim()
          ? o.fromName.trim()
          : DEFAULT_INVOICE_EMAIL.fromName,
      fromEmail: typeof o.fromEmail === 'string' ? o.fromEmail.trim() : '',
      defaultSubject:
        typeof o.defaultSubject === 'string' && o.defaultSubject.trim()
          ? o.defaultSubject.trim()
          : DEFAULT_INVOICE_EMAIL.defaultSubject,
      defaultBody:
        typeof o.defaultBody === 'string' && o.defaultBody.trim()
          ? o.defaultBody
          : DEFAULT_INVOICE_EMAIL.defaultBody,
      attachPdf: o.attachPdf !== false,
      attachXml: o.attachXml === true,
      replyTo: typeof o.replyTo === 'string' ? o.replyTo.trim() : '',
    };
  } catch {
    return { ...DEFAULT_INVOICE_EMAIL };
  }
}

function clampPort(n: number): number {
  if (!Number.isFinite(n)) return 587;
  return Math.min(65535, Math.max(1, Math.round(n)));
}

export function serializeInvoiceEmailConfig(config: InvoiceEmailConfig): string {
  const { ...rest } = config;
  return JSON.stringify(rest);
}

export function applyEmailTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

/** Complementa configuración de BD con variables de entorno (opcional, ver .env.example). */
export function mergeInvoiceEmailFromEnv(
  config: InvoiceEmailConfig,
  env: NodeJS.ProcessEnv = process.env,
): InvoiceEmailConfig {
  const host = env.INVOICE_SMTP_HOST?.trim();
  const user = env.INVOICE_SMTP_USER?.trim();
  const from = env.INVOICE_SMTP_FROM_EMAIL?.trim();
  const portRaw = env.INVOICE_SMTP_PORT?.trim();
  const enabledEnv = env.INVOICE_SMTP_ENABLED?.trim().toLowerCase();
  return {
    ...config,
    enabled:
      config.enabled ||
      enabledEnv === '1' ||
      enabledEnv === 'true' ||
      Boolean(host),
    smtpHost: config.smtpHost || host || '',
    smtpPort: portRaw ? clampPort(Number(portRaw)) : config.smtpPort,
    smtpSecure:
      config.smtpSecure ||
      env.INVOICE_SMTP_SECURE === '1' ||
      env.INVOICE_SMTP_SECURE === 'true',
    smtpUser: config.smtpUser || user || '',
    fromEmail: config.fromEmail || from || user || '',
    fromName: config.fromName || env.INVOICE_SMTP_FROM_NAME?.trim() || config.fromName,
  };
}

export function invoiceEmailPasswordFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return env.INVOICE_SMTP_PASSWORD?.trim() ?? '';
}

/** Campos obligatorios que faltan antes de enviar correo. */
export function invoiceEmailConfigIssues(
  config: InvoiceEmailConfig & { smtpPassword?: string },
  opts?: { requireEnabled?: boolean },
): string[] {
  const issues: string[] = [];
  if (opts?.requireEnabled !== false && !config.enabled) {
    issues.push('active «Habilitar envío por correo»');
  }
  if (!config.smtpHost.trim()) {
    issues.push('servidor SMTP (host), p. ej. smtp.gmail.com');
  }
  if (!config.fromEmail.trim()) {
    issues.push('correo remitente (From)');
  }
  const needsAuth = Boolean(config.smtpUser.trim());
  if (needsAuth && !config.smtpPassword?.trim()) {
    issues.push('contraseña SMTP (o defina INVOICE_SMTP_PASSWORD en .env del backend)');
  }
  return issues;
}
