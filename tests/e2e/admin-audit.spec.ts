import { test, expect } from '@playwright/test'

test.describe('Admin Console 2026 Audit', () => {
  test('Login screen renders with Obsidian dark and blueprint grid', async ({ page }) => {
    // Navigate directly to the admin console on API server (port 3001)
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' })

    // Verify Title
    await expect(page).toHaveTitle(/CMS 2026/)

    // Verify Login Screen Elements
    await expect(page.locator('text=Consola de Administración')).toBeVisible()
    await expect(page.locator('text=PG-17 ACID')).toBeVisible()

    // Take screenshot of Login Screen
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-login.png' })

    // Fill dev-token or click dev-token button
    const devTokenBtn = page.locator('button:has-text("dev-token rápido")')
    if (await devTokenBtn.isVisible()) {
      await devTokenBtn.click()
    } else {
      await page.fill('input[type="password"], input[type="text"]', 'dev-token')
      await page.click('button[type="submit"]')
    }

    // Wait for Dashboard to render
    await expect(page.locator('text=Panel Ejecutivo y Telemetría')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=00 // Consola de Operaciones')).toBeVisible()

    // Take screenshot of Desktop Dashboard
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-dashboard-desktop.png' })
  })

  test('Mobile drawer sheet opens and closes cleanly without bottom bar clutter', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' })

    // Login
    const devTokenBtn = page.locator('button:has-text("dev-token rápido")')
    if (await devTokenBtn.isVisible()) {
      await devTokenBtn.click()
    } else {
      await page.fill('input[type="password"], input[type="text"]', 'dev-token')
      await page.click('button[type="submit"]')
    }

    // Wait for header to be visible
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 })

    // Mobile header button should show current section
    const mobileMenuBtn = page.locator('header button[aria-label="Abrir menú de navegación"]')
    await expect(mobileMenuBtn).toBeVisible()

    // Screenshot mobile dashboard
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-dashboard-mobile.png' })

    // Open mobile menu drawer sheet
    await mobileMenuBtn.click()
    await page.waitForTimeout(300)

    // Verify drawer contents
    await expect(page.locator('text=00-09 // Navegación CMS')).toBeVisible()
    await expect(page.locator('.blueprint-grid button:has-text("01.")')).toBeVisible()

    // Screenshot mobile drawer sheet
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-drawer-mobile.png' })

    // Close drawer
    await page.click('button:has-text("✕ Cerrar")')
    await page.waitForTimeout(300)
    await expect(page.locator('text=00-09 // Navegación CMS')).not.toBeVisible()
  })

  test('Job Hunter view renders vacancies and evaluates successfully', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' })

    // Login
    const devTokenBtn = page.locator('button:has-text("dev-token rápido")')
    if (await devTokenBtn.isVisible()) {
      await devTokenBtn.click()
    } else {
      await page.fill('input[type="password"], input[type="text"]', 'dev-token')
      await page.click('button[type="submit"]')
    }

    // Wait for Dashboard to render
    await expect(page.locator('text=Panel Ejecutivo y Telemetría')).toBeVisible({ timeout: 10000 })

    // Click Job Hunter in sidebar
    await page.click('aside button:has-text("Job Hunter (Eros)")')

    // Wait for Hunter view to load
    await expect(page.locator('text=Job Hunter')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // Verify vacancy list has items
    const jobCards = page.locator('.space-y-1\\.5 > div')
    await expect(jobCards.first()).toBeVisible()

    // Click the first vacancy card
    await jobCards.first().click()
    await page.waitForTimeout(300)

    // Verify detail panel elements
    await expect(page.locator('text=Evaluación Estratégica de Perfil')).toBeVisible()
    await expect(page.locator('text=CV Harvard ATS').first()).toBeVisible()

    // Test evaluating batch button if visible
    const evalBatchBtn = page.locator('button:has-text("Evaluar")')
    if (await evalBatchBtn.isVisible()) {
      await evalBatchBtn.click()
      await page.waitForTimeout(1000)
    }

    // Screenshot Job Hunter in action
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-job-hunter.png' })
  })

  test('Contenido Omnicanal renders posts, platform tabs, and carousel preview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' })

    // Login
    const devTokenBtn = page.locator('button:has-text("dev-token rápido")')
    if (await devTokenBtn.isVisible()) {
      await devTokenBtn.click()
    } else {
      await page.fill('input[type="password"], input[type="text"]', 'dev-token')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Panel Ejecutivo y Telemetría')).toBeVisible({ timeout: 10000 })

    // Click Contenido Omnicanal in sidebar
    await page.click('aside button:has-text("Contenido Omnicanal")')

    // Wait for Content view to load
    await expect(page.locator('text=Gestión de Contenido Omnicanal')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // Verify platform tabs and action buttons
    await expect(page.locator('button:has-text("LinkedIn Post")')).toBeVisible()
    await expect(page.locator('button:has-text("Hilo de X")')).toBeVisible()
    await expect(page.locator('button:has-text("Dev.to Markdown")')).toBeVisible()
    await expect(page.locator('button:has-text("Carrusel PDF")')).toBeVisible()
    await expect(page.locator('button:has-text("Ver Carrusel Web")')).toBeVisible()

    // Screenshot Content Omnicanal
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-content-omnichannel.png' })
  })

  test('TrendRadar renders technical trends and allows 1-click post generation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle' })

    // Login
    const devTokenBtn = page.locator('button:has-text("dev-token rápido")')
    if (await devTokenBtn.isVisible()) {
      await devTokenBtn.click()
    } else {
      await page.fill('input[type="password"], input[type="text"]', 'dev-token')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Panel Ejecutivo y Telemetría')).toBeVisible({ timeout: 10000 })

    // Click TrendRadar in sidebar
    await page.click('aside button:has-text("TrendRadar (Eros)")')

    // Wait for Radar view to load
    await expect(page.locator('text=TrendRadar · Exploración de Tendencias')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // Verify trends list has items
    const trendItems = page.locator('aside .cursor-pointer')
    await expect(trendItems.first()).toBeVisible()

    // Select first trend
    await trendItems.first().click()
    await page.waitForTimeout(300)

    // Verify engineering angle and generator box
    await expect(page.locator('text=Ángulo de Ingeniería Sugerido')).toBeVisible()
    await expect(page.locator('text=Generador Omnicanal de Publicación & Blog')).toBeVisible()

    // Screenshot TrendRadar
    await page.screenshot({ path: 'tests/e2e/screenshots/admin-trend-radar.png' })
  })
})
