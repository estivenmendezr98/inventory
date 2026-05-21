import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fillKeycloakLoginForm } from './keycloak-login';

test.describe.configure({ mode: 'serial' });

const E2E_APP = (process.env.E2E_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');

function pathnameIsDocuments(u: string): boolean {
  if (!u || u.startsWith('chrome-error:')) return false;
  try {
    const parsed = new URL(u);
    if (!parsed.protocol.startsWith('http')) return false;
    const p = parsed.pathname;
    return p === '/documents' || p.endsWith('/documents');
  } catch {
    return false;
  }
}

function isAppOrKeycloakLoginUrl(u: string): boolean {
  if (!u || u.startsWith('chrome-error:') || u === 'about:blank') return false;
  return (
    u.includes('127.0.0.1:5173') ||
    u.includes('localhost:5173') ||
    u.includes(':8080/realms/') ||
    u.includes('127.0.0.1:8080/realms/')
  );
}

/** Navega a la SPA (o a Keycloak si redirige login) hasta URL estable. */
async function gotoSpa(page: Page, pathname: string) {
  const url = `${E2E_APP}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  await expect
    .poll(
      async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        const u = page.url();
        return isAppOrKeycloakLoginUrl(u) ? u : '';
      },
      { timeout: 120_000 },
    )
    .not.toBe('');
}

test.beforeAll(async ({ request }) => {
  const vite = await request.get(`${E2E_APP}/`);
  if (!vite.ok()) {
    throw new Error(
      `El frontend no responde en ${E2E_APP} (HTTP ${vite.status()}). Arranca Vite (p. ej. \`npm run dev\` en frontend) o revisa E2E_BASE_URL.`,
    );
  }
  const live = await request.get('http://127.0.0.1:3000/api/health/live');
  if (!live.ok()) {
    throw new Error(
      'El backend no responde en http://127.0.0.1:3000. Ejecuta `npm run start:dev` en la carpeta `backend`.',
    );
  }
  const probe = await request.get('http://127.0.0.1:3000/api/documents', {
    headers: { Authorization: 'Bearer invalid' },
  });
  if (probe.status() === 404) {
    throw new Error(
      'GET /api/documents devuelve 404: el proceso que escucha en el puerto 3000 es un API antiguo (sin módulo Documentos). Suele ocurrir tras `nest start --watch` con EADDRINUSE: libera el puerto 3000 y reinicia el backend.',
    );
  }
  if (probe.status() !== 401 && probe.status() !== 403) {
    throw new Error(`GET /api/documents inesperado: HTTP ${probe.status()}`);
  }
});

async function loginIfKeycloak(page: Page) {
  const username = process.env.E2E_KC_USERNAME ?? 'superadmin';
  const password = process.env.E2E_KC_PASSWORD ?? 'admin123';

  await gotoSpa(page, '/documents');

  await expect
    .poll(
      async () => {
        if (page.url().includes('8080')) {
          await fillKeycloakLoginForm(page, username, password);
          await page.waitForURL((u) => !String(u).includes('8080'), { timeout: 60_000 });
        }
        const u = page.url();
        if (u.startsWith('chrome-error:')) {
          await gotoSpa(page, '/documents');
          return false;
        }
        if (!pathnameIsDocuments(u) || u.includes('8080')) {
          await gotoSpa(page, '/documents');
          return false;
        }
        return await page.locator('main').isVisible().catch(() => false);
      },
      { timeout: 120_000 },
    )
    .toBe(true);

  const main = page.locator('main');
  const denied = main.getByText('No tienes permiso para ver documentos.');
  const heading = main.getByRole('heading', { name: 'Documentos' });
  await expect(heading.or(denied)).toBeVisible({ timeout: 90_000 });
  await expect(denied).not.toBeVisible();
  await expect(heading).toBeVisible();
}

test.describe('Documentos', () => {
  test('lista GET /api/documents responde 200 y la página carga', async ({ page }) => {
    test.setTimeout(150_000);

    await loginIfKeycloak(page);

    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page.locator('main').getByRole('heading', { name: 'Productos' })).toBeVisible({ timeout: 20_000 });

    const listReq = page.waitForResponse(
      (res) => {
        if (res.request().method() !== 'GET') return false;
        const u = res.url();
        return u.includes('/api/documents') && !u.includes('/file');
      },
      { timeout: 60_000 },
    );

    await gotoSpa(page, '/documents');
    await expect(page.locator('main').getByRole('heading', { name: 'Documentos' })).toBeVisible();

    const res = await listReq;
    const body = await res.text();
    expect(res.status(), body).toBe(200);
    const json = JSON.parse(body) as { data?: unknown[]; meta?: { total: number } };
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.meta?.total).toBeDefined();

    await expect(page.locator('main').getByRole('heading', { name: 'Documentos' })).toBeVisible();
    await expect(page.locator('main').getByText('No tienes permiso para ver documentos.')).not.toBeVisible();
  });

  test('sube un TXT y aparece en la tabla', async ({ page }) => {
    test.setTimeout(150_000);

    await loginIfKeycloak(page);

    const tmp = path.join(os.tmpdir(), `e2e-doc-${Date.now()}.txt`);
    fs.writeFileSync(tmp, 'contenido e2e documentos', 'utf8');

    const uploadResPromise = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('/api/documents'),
      { timeout: 60_000 },
    );

    await page.locator('input[type="file"]').setInputFiles(tmp);

    const uploadRes = await uploadResPromise;
    const uploadBody = await uploadRes.text();
    expect([200, 201].includes(uploadRes.status()), uploadBody).toBe(true);

    await page.getByRole('link', { name: 'Productos' }).click();
    await expect(page.locator('main').getByRole('heading', { name: 'Productos' })).toBeVisible({ timeout: 20_000 });

    const listReqAfter = page.waitForResponse(
      (res) => {
        if (res.request().method() !== 'GET') return false;
        const u = res.url();
        return u.includes('/api/documents') && !u.includes('/file');
      },
      { timeout: 60_000 },
    );

    await gotoSpa(page, '/documents');
    await expect(page.locator('main').getByRole('heading', { name: 'Documentos' })).toBeVisible();

    const listRes = await listReqAfter;
    expect(listRes.status(), await listRes.text()).toBe(200);

    await expect(page.getByText(path.basename(tmp), { exact: true })).toBeVisible({
      timeout: 20_000,
    });

    fs.unlinkSync(tmp);
  });
});
