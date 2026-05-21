import { test, expect } from '@playwright/test';
import { fillKeycloakLoginForm } from './keycloak-login';

/**
 * E2E módulo Ventas (plan: sales.view, sales.create, listado vía GET /api/sales).
 * Requiere: Vite :5173, Keycloak, backend en el proxy (p. ej. 127.0.0.1:3000).
 * Credenciales: E2E_KC_USERNAME / E2E_KC_PASSWORD (por defecto superadmin / admin123).
 *
 * Roles adicionales (opcional, futuro): E2E_KC_CAJERO_USERNAME para matriz CAJERO.
 */
test.describe('Ventas — UI y API en :5173', () => {
  test('tras login, GET /api/sales responde y la página Ventas muestra cabecera y acción Nueva venta', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const username = process.env.E2E_KC_USERNAME ?? 'superadmin';
    const password = process.env.E2E_KC_PASSWORD ?? 'admin123';

    await page.goto('/');

    await expect(page).toHaveURL(/8080.*\/realms\/|127\.0\.0\.1:5173|localhost:5173/, { timeout: 45_000 });

    if (page.url().includes('8080')) {
      await fillKeycloakLoginForm(page, username, password);
      await expect(page).toHaveURL(/127\.0\.0\.1:5173|localhost:5173/, { timeout: 45_000 });
    }

    await expect(page).toHaveURL(/localhost:5173|127\.0\.0\.1:5173/, { timeout: 45_000 });
    await expect(page.getByRole('link', { name: 'Ventas' })).toBeVisible({ timeout: 30_000 });

    const salesList = page.waitForResponse((res) => {
      if (res.request().method() !== 'GET' || res.status() !== 200) return false;
      let path: string;
      try {
        path = new URL(res.url()).pathname;
      } catch {
        return false;
      }
      return path === '/api/sales';
    });

    await page.getByRole('link', { name: 'Ventas' }).click();

    const res = await salesList;
    const json = (await res.json()) as { data?: unknown[]; meta?: { total?: number; totalPages?: number } };
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.meta?.totalPages).toBeDefined();

    await expect(page.getByRole('heading', { name: 'Ventas' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Nueva venta' })).toBeVisible();

    const emptyList = page.getByText('No hay ventas.');
    const firstDataRow = page.getByRole('row').nth(1);
    await expect(emptyList.or(firstDataRow)).toBeVisible({ timeout: 25_000 });
  });

  test('CAJERO (opcional): Ventas y Nueva venta visibles con credenciales dedicadas', async ({ page }) => {
    test.skip(
      !process.env.E2E_KC_CAJERO_USERNAME?.trim() || !process.env.E2E_KC_CAJERO_PASSWORD,
      'Defina E2E_KC_CAJERO_USERNAME y E2E_KC_CAJERO_PASSWORD (usuario realm con rol CAJERO)',
    );
    test.setTimeout(90_000);

    const username = process.env.E2E_KC_CAJERO_USERNAME!.trim();
    const password = process.env.E2E_KC_CAJERO_PASSWORD!;

    await page.goto('/');
    await expect(page).toHaveURL(/8080.*\/realms\/|127\.0\.0\.1:5173|localhost:5173/, { timeout: 45_000 });
    if (page.url().includes('8080')) {
      await fillKeycloakLoginForm(page, username, password);
      await expect(page).toHaveURL(/127\.0\.0\.1:5173|localhost:5173/, { timeout: 45_000 });
    }
    await expect(page).toHaveURL(/localhost:5173|127\.0\.0\.1:5173/, { timeout: 45_000 });

    const salesGet = page.waitForResponse((res) => {
      if (res.request().method() !== 'GET' || res.status() !== 200) return false;
      try {
        return new URL(res.url()).pathname === '/api/sales';
      } catch {
        return false;
      }
    });
    await page.getByRole('link', { name: 'Ventas' }).click();
    await salesGet;
    await expect(page.getByRole('heading', { name: 'Ventas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nueva venta' })).toBeVisible();
  });
});
