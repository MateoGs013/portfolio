import { test, expect } from '@playwright/test'

test.describe('Progressive Blur & Edge Vignette Audit', () => {
  test('progressive blur is fixed at the bottom and does not scroll with content', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 1. Verificar que .canvas-viewport y .pbl existen
    const canvasViewport = page.locator('.canvas-viewport')
    await expect(canvasViewport).toBeVisible()

    const blur = page.locator('.pbl-bottom')
    await expect(blur).toBeVisible()

    // 2. Obtener posición inicial del blur en el viewport
    const initialBox = await blur.boundingBox()
    expect(initialBox).not.toBeNull()

    // Capturar screenshot en la parte superior (home)
    await page.screenshot({
      path: 'tests/e2e/screenshots/blur-home-top.png',
      fullPage: false,
    })

    // 3. Hacer scroll hacia la mitad de la página
    const mainContent = page.locator('#contenido')
    await mainContent.evaluate((el) => {
      el.scrollTop = 800
    })
    await page.waitForTimeout(300)

    // El blur debe mantenerse exactamente en la misma posición Y del viewport
    const scrolledBox = await blur.boundingBox()
    expect(scrolledBox).not.toBeNull()
    expect(Math.round(scrolledBox!.y)).toBeCloseTo(Math.round(initialBox!.y), 1)

    // Capturar screenshot a mitad del scroll
    await page.screenshot({
      path: 'tests/e2e/screenshots/blur-home-scrolled.png',
      fullPage: false,
    })

    // 4. Hacer scroll hasta el fondo (footer de contacto en el inicio)
    await mainContent.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(300)

    // El blur sigue exactamente en la misma posición Y fija
    const bottomBox = await blur.boundingBox()
    expect(bottomBox).not.toBeNull()
    expect(Math.round(bottomBox!.y)).toBeCloseTo(Math.round(initialBox!.y), 1)

    // Capturar screenshot al fondo
    await page.screenshot({
      path: 'tests/e2e/screenshots/blur-home-bottom.png',
      fullPage: false,
    })
  })
})
