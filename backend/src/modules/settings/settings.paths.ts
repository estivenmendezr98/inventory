import { mkdirSync } from 'node:fs';
import * as path from 'node:path';

export function resolveBrandingStorageDir(): string {
  const raw = process.env.BRANDING_STORAGE_PATH || 'storage/branding';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function ensureBrandingDir(): string {
  const dir = resolveBrandingStorageDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}
