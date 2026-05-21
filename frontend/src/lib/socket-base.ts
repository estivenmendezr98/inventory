/** Origen HTTP del backend (sin `/api`) para Socket.IO en dev/prod. */
export function buildSocketBaseUrl(): string {
  const api = import.meta.env.VITE_API_URL?.trim();
  if (api) {
    const base = api.replace(/\/?api\/?$/i, '').replace(/\/$/, '');
    if (base) return base;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
