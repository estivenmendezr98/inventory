/** Clave JSON en `app_settings` — plantilla de ticket / comprobante simple. */
export const INVOICE_TEMPLATE_SETTING_KEY = 'invoice.template';

export type TicketPageSize = '80mm' | '58mm' | 'A4' | 'LETTER' | 'LEGAL' | 'A5';
export type TicketOrientation = 'portrait' | 'landscape';

export interface InvoiceTemplateConfig {
  pageSize: TicketPageSize;
  orientation: TicketOrientation;
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
  /** Pie de página libre del negocio (máx. 200 caracteres). */
  footerText: string;
  /** Si true, añade `invoice.footer_note` de configuración general. */
  appendFooterNote: boolean;
  /** Leyenda régimen simplificado al pie del ticket impreso. */
  showSimplifiedRegimeLine: boolean;
  /** Abrir diálogo de impresión antes de enviar (vista previa en pantalla). */
  previewBeforePrint: boolean;
  /**
   * Nota para el cajero: nombre de la impresora térmica en el diálogo del sistema.
   * El navegador no puede fijar la impresora por seguridad; selección manual.
   */
  printerHint: string;
  /** Reservado: apertura de cajón requiere ESC/POS (QZ Tray / app de escritorio). */
  openCashDrawer: boolean;
}

/** Textos heredados de facturación electrónica que no deben mostrarse. */
const LEGACY_ELECTRONIC_MARKERS = [
  'representación gráfica',
  'proveedor tecnológico',
  'firma digital',
  'ubl 2.1',
  'xml adjunto',
  'validación ante',
  'cufe',
  'cude',
  'resolución dian',
  'habilitación dian',
  'ambiente de pruebas',
  'ambiente de producción',
];

export function isLegacyElectronicFooter(text: string): boolean {
  const lower = text.toLowerCase();
  return LEGACY_ELECTRONIC_MARKERS.some((m) => lower.includes(m));
}

const DEFAULT_FOOTER_TEXT = 'Gracias por su compra.';

export function sanitizeFooterText(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s || isLegacyElectronicFooter(s)) {
    return DEFAULT_FOOTER_TEXT;
  }
  return s.slice(0, 200);
}

export function isThermalPageSize(pageSize: TicketPageSize): boolean {
  return pageSize === '58mm' || pageSize === '80mm';
}

function marginClamp(pageSize: TicketPageSize, mm: number): number {
  if (isThermalPageSize(pageSize)) return clamp(mm, 0, 5);
  return clamp(mm, 2, 40);
}

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateConfig = {
  pageSize: '80mm',
  orientation: 'portrait',
  marginTopMm: 2,
  marginRightMm: 2,
  marginBottomMm: 3,
  marginLeftMm: 2,
  fontSizeTitle: 10,
  fontSizeBody: 9,
  fontSizeItems: 8,
  fontSizeFooter: 7,
  headerBackgroundColor: '#f5f5f5',
  accentColor: '#1a1a1a',
  textColor: '#111111',
  showLogo: true,
  showItemSku: true,
  showSubtotal: true,
  showTax: true,
  footerText: DEFAULT_FOOTER_TEXT,
  appendFooterNote: true,
  showSimplifiedRegimeLine: true,
  previewBeforePrint: false,
  printerHint: '',
  openCashDrawer: false,
};

const PAGE_SIZES = new Set<TicketPageSize>(['80mm', '58mm', 'A4', 'LETTER', 'LEGAL', 'A5']);

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function hexColor(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const s = v.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
}

export function mmToPt(mm: number): number {
  return mm * 2.834645669;
}

/** Opciones de página PDF según tamaño (tickets térmicos = ancho fijo, alto largo). */
export function pdfDocSize(tpl: InvoiceTemplateConfig): {
  size: string | [number, number];
  layout: 'portrait' | 'landscape';
} {
  if (tpl.pageSize === '80mm') {
    return { size: [mmToPt(80), mmToPt(1200)], layout: 'portrait' };
  }
  if (tpl.pageSize === '58mm') {
    return { size: [mmToPt(58), mmToPt(1200)], layout: 'portrait' };
  }
  return { size: tpl.pageSize, layout: tpl.orientation };
}

export function parseInvoiceTemplateConfig(raw: string | null | undefined): InvoiceTemplateConfig {
  if (!raw?.trim()) return { ...DEFAULT_INVOICE_TEMPLATE };
  try {
    const o = JSON.parse(raw) as Partial<InvoiceTemplateConfig> & Record<string, unknown>;
    const pageSize = PAGE_SIZES.has(o.pageSize as TicketPageSize)
      ? (o.pageSize as TicketPageSize)
      : DEFAULT_INVOICE_TEMPLATE.pageSize;
    const orientation = isThermalPageSize(pageSize)
      ? 'portrait'
      : o.orientation === 'landscape' || o.orientation === 'portrait'
        ? o.orientation
        : DEFAULT_INVOICE_TEMPLATE.orientation;
    const rawFooter =
      typeof o.footerText === 'string'
        ? o.footerText
        : typeof o.legalFooterText === 'string'
          ? o.legalFooterText
          : '';
    return {
      pageSize,
      orientation,
      marginTopMm: marginClamp(pageSize, Number(o.marginTopMm)),
      marginRightMm: marginClamp(pageSize, Number(o.marginRightMm)),
      marginBottomMm: marginClamp(pageSize, Number(o.marginBottomMm)),
      marginLeftMm: marginClamp(pageSize, Number(o.marginLeftMm)),
      fontSizeTitle: clamp(Number(o.fontSizeTitle), 7, 16),
      fontSizeBody: clamp(Number(o.fontSizeBody), 7, 14),
      fontSizeItems: clamp(Number(o.fontSizeItems), 6, 12),
      fontSizeFooter: clamp(Number(o.fontSizeFooter), 6, 11),
      headerBackgroundColor: hexColor(
        o.headerBackgroundColor,
        DEFAULT_INVOICE_TEMPLATE.headerBackgroundColor,
      ),
      accentColor: hexColor(o.accentColor, DEFAULT_INVOICE_TEMPLATE.accentColor),
      textColor: hexColor(o.textColor, DEFAULT_INVOICE_TEMPLATE.textColor),
      showLogo: o.showLogo !== false,
      showItemSku: o.showItemSku !== false,
      showSubtotal: o.showSubtotal !== false,
      showTax: o.showTax !== false,
      footerText: sanitizeFooterText(rawFooter),
      appendFooterNote: o.appendFooterNote !== false,
      showSimplifiedRegimeLine: o.showSimplifiedRegimeLine !== false,
      previewBeforePrint: o.previewBeforePrint === true,
      printerHint: typeof o.printerHint === 'string' ? o.printerHint.trim() : '',
      openCashDrawer: o.openCashDrawer === true,
    };
  } catch {
    return { ...DEFAULT_INVOICE_TEMPLATE };
  }
}

export function serializeInvoiceTemplateConfig(config: InvoiceTemplateConfig): string {
  return JSON.stringify(config);
}
