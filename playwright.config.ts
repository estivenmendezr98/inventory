import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /** `localhost` debe coincidir con «Valid redirect URIs» del cliente Keycloak (127.0.0.1 suele fallar si el realm no está actualizado). */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--host-resolver-rules=MAP localhost 127.0.0.1'],
        },
      },
    },
    ...(process.env.CI
      ? ([
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ] as const)
      : []),
  ],

  /* Vite en :5173 (reuse si ya corre `npm run dev` en frontend) */
  webServer: {
    command: 'npm run dev',
    cwd: path.join(process.cwd(), 'frontend'),
    url: 'http://localhost:5173/',
    // false: evita E2E contra un Vite antiguo en memoria (HMR no siempre aplica todos los cambios).
    reuseExistingServer: process.env.E2E_REUSE_VITE === '1',
    timeout: 120_000,
  },
});
