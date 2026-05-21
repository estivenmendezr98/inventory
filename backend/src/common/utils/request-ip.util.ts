/** IP del cliente detrás de proxy (nginx) o conexión directa. */
export function extractClientIp(req: unknown): string | undefined {
  const r = req as {
    ip?: string;
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
  };
  const forwarded = r.headers?.['x-forwarded-for'];
  let first: string | undefined;
  if (typeof forwarded === 'string') {
    first = forwarded.split(',')[0]?.trim();
  } else if (Array.isArray(forwarded)) {
    first = forwarded[0]?.split(',')[0]?.trim();
  }
  return first || r.ip || r.socket?.remoteAddress || undefined;
}
