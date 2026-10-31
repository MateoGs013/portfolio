import { defineConfig, devices } from '@playwright/test'

/**
 * Las specs del admin nuevo (tests/e2e/admin-*.spec.ts, salvo admin-audit, que sigue en la config del
 * sitio mientras viva el admin actual). No levanta servidores: las corre scripts/admin-run.mjs, que
 * copia la base, levanta la API en un puerto libre y deja ADMIN_API_URL y PW_ADMIN_TOKEN:
 *
 *   node scripts/admin-run.mjs [--demo] [--eros-mock] [--web] -- pnpm exec playwright test -c playwright.admin.config.ts <spec>
 *
 * `pnpm test:e2e` (tests/e2e/run.mjs) hace eso con cada spec, con los flags que declara en su cabecera.
 */
const baseURL = process.env.ADMIN_API_URL
const listing = process.argv.includes('--list')

if (!baseURL && !listing) {
  throw new Error('Falta ADMIN_API_URL: correr con node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts …')
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /admin-(?!audit\.spec\.ts$)[^/\\]*\.spec\.ts$/,
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
