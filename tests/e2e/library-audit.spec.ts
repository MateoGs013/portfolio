import { test, expect } from '@playwright/test'

test.describe('UI Component Library & Interactions Audit', () => {
  test('verifies all library components, filters, and interactions on /lab', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    // 1. Cargar la vista de laboratorio (/lab)
    await page.goto('/lab')
    await page.waitForLoadState('networkidle')

    // 2. Verificar cabecera y conteo reactivo de primitivas
    const labHeader = page.locator('.lab-header')
    await expect(labHeader).toBeVisible()
    await expect(page.locator('.lab-header')).toContainText('28 Primitives')

    // 3. Verificar que la grilla contiene los 28 componentes
    const cards = page.locator('.lab-card-wrapper')
    await expect(cards).toHaveCount(28)

    // 4. Probar búsqueda reactiva
    const searchInput = page.locator('.lab-search-input')
    await searchInput.fill('Odometer')
    await page.waitForTimeout(200)
    // Debe filtrar y mostrar únicamente UiRollingCounter
    await expect(page.locator('.lab-card-wrapper')).toHaveCount(1)
    await expect(page.locator('.lab-card-wrapper h2')).toHaveText('UiRollingCounter')

    // Limpiar búsqueda
    await searchInput.fill('')
    await page.waitForTimeout(200)
    await expect(page.locator('.lab-card-wrapper')).toHaveCount(28)

    // 5. Probar filtros por categoría
    // Filtro: Controles Táctiles
    const tactileBtn = page.locator('button:has-text("Controles Táctiles")')
    await tactileBtn.click()
    await page.waitForTimeout(200)
    const tactileCards = page.locator('.lab-card-wrapper')
    const tactileCount = await tactileCards.count()
    expect(tactileCount).toBeGreaterThan(0)

    // Volver a "Todos"
    const allBtn = page.locator('button:has-text("Todos")')
    await allBtn.click()
    await page.waitForTimeout(200)
    await expect(page.locator('.lab-card-wrapper')).toHaveCount(28)

    // 6. Probar interactividad de primitivas clave
    // a. UiRollingCounter (+ / -)
    const counterPlus = page.locator('.rct-btn.rct-inc')
    if (await counterPlus.count() > 0) {
      await counterPlus.first().click()
      await page.waitForTimeout(200)
    }

    // b. UiDynamicIsland (expandir y colapsar)
    const island = page.locator('.dyn-pill')
    if (await island.count() > 0) {
      await island.first().click()
      await page.waitForTimeout(300)
      await expect(page.locator('.dyn-title').first()).toBeVisible()
      // Cerrar
      await island.first().click()
      await page.waitForTimeout(300)
    }

    // c. UiAudioVisualizer (disparar sonido)
    const pokeSoundBtn = page.locator('button:has-text("Poke")')
    if (await pokeSoundBtn.count() > 0) {
      await pokeSoundBtn.first().click()
      await page.waitForTimeout(200)
    }

    // d. Copiar snippet import
    const importBtn = page.locator('.copy-import-btn').first()
    await importBtn.click()
    await page.waitForTimeout(200)
    await expect(importBtn).toContainText(/Copiado|Copied/)

    // 7. Capturar screenshots de alta resolución
    // Desktop Dark
    await page.screenshot({
      path: 'tests/e2e/screenshots/library-lab-desktop.png',
      fullPage: false,
    })

    // Scroll a la segunda mitad de la grilla
    await page.locator('#contenido').evaluate(el => el.scrollTop = 900)
    await page.waitForTimeout(300)
    await page.screenshot({
      path: 'tests/e2e/screenshots/library-lab-scrolled.png',
      fullPage: false,
    })
  })

  test('verifies library showcase on Home page (Bento block 04)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Scroll hasta el showcase de la librería en el inicio
    const benchShowcase = page.locator('.bench-showcase')
    await expect(benchShowcase).toBeVisible()

    // Cambiar de categoría en el switch segmentado de Bencho UI
    const tactileTab = benchShowcase.locator('button:has-text("Controles Táctiles")')
    if (await tactileTab.count() > 0) {
      await tactileTab.click()
      await page.waitForTimeout(300)
    }

    // Capturar screenshot del showcase en Home
    await benchShowcase.screenshot({
      path: 'tests/e2e/screenshots/library-home-showcase.png',
    })
  })
})
