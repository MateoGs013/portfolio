import { test, expect } from '@playwright/test'

declare global {
  interface Window {
    __ROUTE_LOADER__?: {
      startLoading: (path: string) => void
      finishLoading: () => void
    }
  }
}

test.describe('Architectural Route Loader & Relational HUD (Fusion)', () => {
  test('verifies HUD specular capsule, laser beam, and contextual states', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 1. Probar estado dinámico: Dossier de Proyecto (/projects/la-rucula)
    await page.evaluate(() => {
      const loader = window.__ROUTE_LOADER__
      if (loader) {
        loader.startLoading('/projects/la-rucula')
      }
    })

    const backdrop = page.locator('.route-loader-backdrop')
    await expect(backdrop).toBeVisible()

    const hud = page.locator('.route-loader-hud')
    await expect(hud).toBeVisible()
    await expect(hud).toContainText('FETCH // DOSSIER: LA RUCULA')
    await expect(hud).toContainText('SELECT p.*, t.name FROM "Project"')
    await expect(hud).toContainText('MS')
    await expect(page.locator('.route-loader-laser')).toBeVisible()

    // Esperar a que culmine la transición de entrada para una captura nítida
    await page.waitForTimeout(250)

    // Capturar screenshot del HUD en estado Dossier
    await page.screenshot({
      path: 'tests/e2e/screenshots/route-loader-dossier.png',
      fullPage: false,
    })

    // 2. Probar estado dinámico: Laboratorio UI (/lab)
    await page.evaluate(() => {
      const loader = window.__ROUTE_LOADER__
      if (loader) {
        loader.startLoading('/lab')
      }
    })
    await page.waitForTimeout(100)
    await expect(hud).toContainText('CALIBRATE // BENCHO UI v2.0')
    await expect(hud).toContainText('INITIALIZING 28 SPRING PHYSICS & WEB AUDIO API')

    // Capturar screenshot del HUD en estado Lab
    await page.screenshot({
      path: 'tests/e2e/screenshots/route-loader-lab.png',
      fullPage: false,
    })

    // 3. Probar estado dinámico: Stack Tecnológico (/stack)
    await page.evaluate(() => {
      const loader = window.__ROUTE_LOADER__
      if (loader) {
        loader.startLoading('/stack')
      }
    })
    await page.waitForTimeout(100)
    await expect(hud).toContainText('CATALOG // TECH ARSENAL')
    await expect(hud).toContainText('22 packages')

    // Capturar screenshot del HUD en estado Stack
    await page.screenshot({
      path: 'tests/e2e/screenshots/route-loader-stack.png',
      fullPage: false,
    })

    // 4. Probar resolución y disolución óptica (finishLoading)
    await page.evaluate(() => {
      const loader = window.__ROUTE_LOADER__
      if (loader) {
        loader.finishLoading()
      }
    })

    // Debe mostrar brevemente el estado RESOLVED · 200 OK
    await expect(hud).toContainText('RESOLVED · 200 OK')

    // Capturar screenshot del HUD en estado resuelto
    await page.screenshot({
      path: 'tests/e2e/screenshots/route-loader-resolved.png',
      fullPage: false,
    })

    // Esperar a que la cortina se desvanezca por completo tras la resolución
    await expect(backdrop).not.toBeVisible({ timeout: 5000 })
  })

  test('verifies live navigation transitions across routes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const backdrop = page.locator('.route-loader-backdrop')
    const hud = page.locator('.route-loader-hud')

    // 1. Navegar a /projects haciendo click en el enlace o atajo
    const projectsLink = page.locator('a[href="/projects"]').first()
    if (await projectsLink.count() > 0) {
      await projectsLink.click()
      // En el instante de navegación, el HUD contextual debe activarse de inmediato
      await expect(backdrop).toBeVisible()
      await expect(hud).toContainText('INDEX // PRODUCTION APPLICATIONS')
      // Esperar a que concluya la transición y el backdrop se disuelva
      await expect(backdrop).not.toBeVisible({ timeout: 5000 })
      await expect(page).toHaveURL(/.*projects/)
    }

    // 2. Navegar a /lab
    const labLink = page.locator('a[href="/lab"]').first()
    if (await labLink.count() > 0) {
      await labLink.click()
      await expect(backdrop).toBeVisible()
      await expect(hud).toContainText('CALIBRATE // BENCHO UI v2.0')
      await expect(backdrop).not.toBeVisible({ timeout: 5000 })
      await expect(page).toHaveURL(/.*lab/)
    }
  })
})
