export const COMPANY_LOGO_SETTING_KEY = 'company.logo';

export const COMPANY_LOGO_BASENAME = 'company-logo';

export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const COMPANY_LOGO_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

export const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};
