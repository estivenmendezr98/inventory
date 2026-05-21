import { buildApiUrl } from './api';

export interface BrandingInfo {
  hasLogo: boolean;
  updatedAt: string | null;
  mimeType?: string | null;
}

const DEFAULT_FAVICON = '/vite.svg';
const DEFAULT_FAVICON_TYPE = 'image/svg+xml';

export function companyLogoUrl(updatedAt?: string | null): string | null {
  if (!updatedAt) return null;
  const q = encodeURIComponent(updatedAt);
  return buildApiUrl(`/settings/company-logo?v=${q}`);
}

export function applyCompanyFavicon(branding: BrandingInfo | null | undefined): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (branding?.hasLogo && branding.updatedAt) {
    link.href = companyLogoUrl(branding.updatedAt)!;
    link.type = branding.mimeType || 'image/png';
    return;
  }

  link.href = DEFAULT_FAVICON;
  link.type = DEFAULT_FAVICON_TYPE;
}

export async function fetchPublicBranding(): Promise<BrandingInfo> {
  const res = await fetch(buildApiUrl('/settings/branding'), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    return { hasLogo: false, updatedAt: null, mimeType: null };
  }
  return (await res.json()) as BrandingInfo;
}

async function withFreshAccessToken(): Promise<string | undefined> {
  const keycloak = (await import('./keycloak')).default;
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(70);
  } catch {
    /* token vigente */
  }
  return keycloak.token ?? undefined;
}

export async function uploadCompanyLogo(file: File): Promise<BrandingInfo> {
  const token = await withFreshAccessToken();
  const form = new FormData();
  form.append('file', file);
  const headers: HeadersInit = { Accept: 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(buildApiUrl('/settings/company-logo'), {
    method: 'POST',
    headers,
    body: form,
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    const { parseApiErrorMessage } = await import('./api');
    throw new Error(parseApiErrorMessage(text, res.status));
  }
  return JSON.parse(text) as BrandingInfo;
}

export async function deleteCompanyLogo(): Promise<BrandingInfo> {
  const { apiDelete } = await import('./api');
  return apiDelete<BrandingInfo>('/settings/company-logo');
}
