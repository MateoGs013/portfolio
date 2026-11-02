import { defineConfig, devices } from '@playwright/test'

/**
 * Las specs del admin nuevo (tests/e2e/admin-*.spec.ts, admin-audit incluida). No levanta servidores:
 * las corre scripts/admin-run.mjs, que copia la base, levanta la API en un puerto libre y deja
 * ADMIN_API_URL y PW_ADMIN_TOKEN (y ADMIN_WEB_URL con --web). Las piezas comunes están en
 * tests/e2e/admin-support.ts.
 *
 *   pnpm build:admin
 *   node scripts/admin-run.mjs [--demo] [--eros-mock] [--web] -- pnpm exec playwright test -c playwright.admin.config.ts <spec>
 *
 * `pnpm test:e2e admin` (tests/e2e/run.mjs) compila el admin y corre cada spec una vez por cada línea
 * `admin-run: …` de su cabecera, con esos flags.
 */
const baseURL = process.env.ADMIN_API_URL
const listing = process.argv.includes('--list')

if (!baseURL && !listing) {
  throw new Error('Falta ADMIN_API_URL: correr con node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts …')
}

/** Una carpeta por corrida (por el puerto de su API): dos corridas a la vez no se borran las trazas. */
const port = baseURL ? new URL(baseURL).port : 'list'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: `test-results/admin-${port}`,
  testMatch: /admin-[^/\\]*\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'admin', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
})
