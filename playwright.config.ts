import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    deviceScaleFactor: 2,
  },
  webServer: [
    {
      command: 'pnpm start:api',
      url: 'http://localhost:3001/api/schema',
      reuseExistingServer: true,
      timeout: 60000,
      env: {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://portfolio:portfolio@localhost:5432/portfolio?schema=public',
        API_PORT: '3001',
        PORT: '3001',
      },
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120000,
      env: {
        NUXT_PUBLIC_API_BASE: 'http://localhost:3001/api',
      },
    },
  ],
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-320',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 320, height: 568 },
      },
    },
  ],
})
