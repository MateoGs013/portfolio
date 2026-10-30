import { defineConfig, devices } from '@playwright/test'

/**
 * Las pruebas corren contra el build (`pnpm build` antes; `node .output/server/index.mjs` lo sirve),
 * no contra el servidor de desarrollo. Los puertos van por variable de entorno para que cada copia
 * del repo use los suyos: PW_WEB_PORT (3000) y PW_API_PORT (3001). PLAYWRIGHT_BASE_URL apunta a un
 * sitio ya levantado y entonces no se arranca nada.
 */
const webPort = process.env.PW_WEB_PORT || '3000'
const apiPort = process.env.PW_API_PORT || '3001'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${webPort}`
const apiBase = `http://localhost:${apiPort}/api`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm start:api',
          url: `${apiBase}/schema`,
          reuseExistingServer: true,
          timeout: 60000,
          env: { API_PORT: apiPort, PORT: apiPort },
        },
        {
          command: 'node .output/server/index.mjs',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 60000,
          env: { PORT: webPort, NUXT_PUBLIC_API_BASE: apiBase },
        },
      ],
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-320',
      use: { ...devices['Pixel 5'], viewport: { width: 320, height: 568 } },
    },
  ],
})
