import { mkdirSync } from 'node:fs';
import * as path from 'node:path';

export function resolveDocumentsStorageDir(): string {
  const raw = process.env.DOCUMENTS_STORAGE_PATH || 'storage/documents';
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

export function ensureDocumentsDir(): string {
  const dir = resolveDocumentsStorageDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}
