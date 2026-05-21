import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** URL de la pantalla de login de Keycloak (realm). */
export function isKeycloakLoginUrl(url: string): boolean {
  return /8080\/realms\/[^/]+\/protocol\/openid-connect\/auth/i.test(url);
}

/**
 * Rellena el formulario estándar de Keycloak (ids #username / #password).
 * Más estable que getByRole('textbox', { name }) porque el label varía por idioma/skin.
 */
export async function fillKeycloakLoginForm(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const redirectErr = page.getByText('Invalid parameter: redirect_uri');
  if (await redirectErr.isVisible().catch(() => false)) {
    throw new Error(
      'Keycloak rechazó redirect_uri. Use E2E_BASE_URL=http://localhost:5173 (recomendado) o añada la URL exacta del SPA en el cliente inventory-app → Valid redirect URIs.',
    );
  }
  const userInput = page.locator('#username');
  await expect(userInput).toBeVisible({ timeout: 25_000 });
  await userInput.fill(username);
  await page.locator('#password').fill(password);
  const submit = page
    .locator('input[type="submit"]#kc-login')
    .or(page.locator('input[type="submit"][name="login"]'))
    .or(page.locator('button#kc-login'))
    .or(page.getByRole('button', { name: /sign in|iniciar sesión|log in/i }));
  await submit.first().click();
}
