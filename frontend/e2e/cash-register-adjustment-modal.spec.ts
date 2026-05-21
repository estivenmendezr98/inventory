import { test, expect } from '@playwright/test';
import { fillKeycloakLoginForm } from '../../tests/keycloak-login';

/**
 * Estabilidad del modal «Ajustar venta» (sin parpadeo que bloquee clics).
 * Ejecutar desde la raíz del monorepo:
 *   npx playwright test frontend/e2e/cash-register-adjustment-modal.spec.ts
 *
 * Requiere: stack local, superadmin, sesión con ventas COMPLETED.
 * E2E_SESSION_ID=uuid del turno en /cash-register/sessions/:id
 */
test.describe('Caja — modal ajuste de venta', () => {
  test('el diálogo permanece usable tras −1 (sin pantalla en blanco)', async ({ page }) => {
    test.setTimeout(120_000);

    const sessionId = process.env.E2E_SESSION_ID?.trim();
    test.skip(!sessionId, 'Defina E2E_SESSION_ID con un turno que tenga ventas');

    const username = process.env.E2E_KC_USERNAME ?? 'superadmin';
    const password = process.env.E2E_KC_PASSWORD ?? 'admin123';

    await page.goto('/');
    await expect(page).toHaveURL(/8080.*\/realms\/|localhost:5173|127\.0\.0\.1:5173/, {
      timeout: 45_000,
    });
    if (page.url().includes('8080')) {
      await fillKeycloakLoginForm(page, username, password);
      await expect(page).toHaveURL(/localhost:5173|127\.0\.0\.1:5173/, { timeout: 45_000 });
    }

    await page.goto(`/cash-register/sessions/${sessionId}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Ventas' }).click();

    const adjustBtn = page.getByRole('button', { name: 'Ajustar' }).first();
    await expect(adjustBtn).toBeVisible({ timeout: 15_000 });
    await adjustBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /Ajustar venta/ })).toBeVisible();
    await expect(dialog.getByText('Cargando venta…')).not.toBeVisible({ timeout: 15_000 });

    const minusOne = dialog.getByRole('button', { name: '−1' }).first();
    await expect(minusOne).toBeEnabled();
    await minusOne.click();

    await expect(dialog).toBeVisible();
    await expect(minusOne).toBeEnabled();
    await expect(dialog.getByText('Resumen (servidor)')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('Calculando…')).not.toBeVisible();

    const motivo = dialog.getByLabel(/Motivo/i);
    await motivo.fill('Prueba E2E estabilidad UI');
    await expect(motivo).toHaveValue('Prueba E2E estabilidad UI');

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
