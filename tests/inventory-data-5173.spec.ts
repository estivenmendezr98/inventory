import { test, expect } from '@playwright/test';
import { fillKeycloakLoginForm } from './keycloak-login';

/**
 * Valida que, con Vite en :5173, el proxy `/api` responde y la UI muestra datos de BD (productos).
 * Requiere: `npm run dev` en frontend, Keycloak en VITE_KC_URL (8080), y API alcanzable vía proxy.
 */
test.describe('Inventory — datos desde API en :5173', () => {
  test('tras login, GET /api/products devuelve filas y la tabla no está vacía', async ({
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
    await expect(page.getByRole('link', { name: 'Productos' })).toBeVisible({ timeout: 30_000 });

    const productsList = page.waitForResponse((res) => {
      if (res.request().method() !== 'GET' || res.status() !== 200) return false;
      let path: string;
      try {
        path = new URL(res.url()).pathname;
      } catch {
        return false;
      }
      // Evitar confundir con GET /api/products/options/categories
      return path === '/api/products';
    });

    await page.getByRole('link', { name: 'Productos' }).click();

    const res = await productsList;
    const json = (await res.json()) as { data?: unknown[] };
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(json.data!.length).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
    await expect(page.getByText('No hay productos con los filtros actuales.')).not.toBeVisible();
    // Primera fila de cabecera (índice 0); siguiente fila = primer producto en tbody.
    await expect(page.getByRole('row').nth(1)).toBeVisible();
  });
});
