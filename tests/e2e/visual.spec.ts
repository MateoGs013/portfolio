import { expect, test, type Page } from '@playwright/test'
import { open, readThrough, skipIntro } from './support'

/**
 * Capturas de referencia (fase R7): las cinco vistas del sitio en cada proyecto de ancho y tema (375,
 * 768 y 1440 px, oscuro y claro), así un cambio de diseño se ve como diferencia de píxeles. Se toman
 * quietas: reduced motion (sin Lenis, sin partir texto, sin autoplay, la captura del caso no crece) y
 * las animaciones CSS desactivadas. La hora del pie es lo único que cambia sola: el reloj de la página
 * queda fijo (Date, no los timers), así el pie se captura con una hora estable en lugar de taparla.
 *
 * Las capturas dependen del contenido de la base: después de cambiar el diseño o el seed se regeneran
 * a propósito con `pnpm test:e2e visual --update-snapshots` y se revisan antes de commitearlas.
 */
const VIEWS = [
  ['inicio', '/'],
  ['obra', '/projects'],
  ['caso', '/projects/la-rucula'],
  ['sobre-mi', '/about'],
  ['cv', '/about?cv=ats'],
] as const

/**
 * Todo lo que la página va a mostrar ya llegó: fuentes, imágenes diferidas y pósters. Las imágenes que
 * no se ven (la tira de la vista previa del inicio, en opacidad 0 hasta apuntar una fila) quedan diferidas
 * a propósito y no se esperan.
 */
async function settle(page: Page) {
  await readThrough(page)
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => [...document.images]
    .filter(img => img.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
    .every(img => img.complete))
  await page.waitForTimeout(300)
}

// Sin traza: la de una captura de página entera (8000 px en el caso) colgó una corrida entera; si una
// captura difiere, Playwright ya deja la esperada, la actual y la diferencia en test-results/.
test.use({ trace: 'off' })

/** 12:00 en America/Argentina/Buenos_Aires, la zona de contact.time_zone. */
const NOON = new Date('2026-10-05T15:00:00Z')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOON)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await skipIntro(page)
})

for (const [name, path] of VIEWS) {
  test(`${name} (${path})`, async ({ page }) => {
    await open(page, path)
    await settle(page)
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    })
  })
}
