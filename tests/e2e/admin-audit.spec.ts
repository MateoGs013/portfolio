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
})
