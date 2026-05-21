import keycloak from './keycloak';

async function withFreshAccessToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) return undefined;
  try {
    await keycloak.updateToken(70);
  } catch {
    /* si falla el refresh, se intenta con el token vigente */
  }
  return keycloak.token ?? undefined;
}

/** Extrae el mensaje legible de errores Nest (`{ message, statusCode }`). */
export function parseApiErrorMessage(text: string, status?: number): string {
  const trimmed = text.trim();
  if (!trimmed) return status ? `HTTP ${status}` : 'Error de API';
  try {
    const j = JSON.parse(trimmed) as { message?: string | string[] };
    if (typeof j.message === 'string') return j.message;
    if (Array.isArray(j.message)) return j.message.join(', ');
  } catch {
    /* no JSON */
  }
  return trimmed;
}

/** Base URL for API requests (same as Vite proxy `/api` or `VITE_API_URL`). */
export function buildApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = import.meta.env.VITE_API_URL || '/api';
  return `${String(base).replace(/\/$/, '')}${normalized}`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await withFreshAccessToken();
  const headers: HeadersInit = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(buildApiUrl(path), { ...init, headers });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(parseApiErrorMessage(text, res.status));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    /** Nest/Express puede enviar 200 con cuerpo vacío si el handler devolvió `null`/`undefined`. */
    return undefined as T;
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(
      `La API no devolvió JSON válido en ${path}. Revise proxy/VITE_API_URL o el servidor.`,
    );
  }
}

/** Descarga binaria (p. ej. PDF/XML) con el mismo JWT que `apiFetch`. */
export async function apiDownloadBlob(path: string): Promise<Blob> {
  const token = await withFreshAccessToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(buildApiUrl(path), { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.blob();
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiDelete<T = void>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE', ...init });
}
