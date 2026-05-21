/** Claves permitidas en `app_settings` (orden de presentación en UI). */
export const APP_SETTING_KEYS_ORDER = [
  'company.name',
  'company.tax_id',
  'company.address',
  'company.phone',
  'company.email',
  'invoice.footer_note',
  'pos.receipt_header',
] as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS_ORDER)[number];

export const APP_SETTING_KEY_SET = new Set<string>(APP_SETTING_KEYS_ORDER);
