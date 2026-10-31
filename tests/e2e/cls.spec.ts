import { expect, test } from '@playwright/test'
import { cls, observeShifts, skipIntro, WORKS } from './support'

/**
 * Estabilidad (invariante 4): CLS 0 al cargar el inicio y cada caso, en cada ancho y tema. La primera
 * visita es la que cuenta: fuentes locales que llegan tarde, el cargador del inicio, la portada que
 * crece y los números que cuentan no pueden correr nada de lugar. Se mide hasta que todo se asentó.
 */
test.beforeEach(({ page }) => page.addInitScript(observeShifts))

test('el inicio en la primera visita, con el cargador', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  // El cargador dura 2,75 s y una regla CSS lo apaga a los 4 s pase lo que pase.
  await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.*/, { timeout: 6000 })
  await page.waitForTimeout(800)
  expect(await cls(page)).toEqual({ value: 0, shifts: [] })
})

test('el inicio en una visita siguiente', async ({ page }) => {
  await skipIntro(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  expect(await cls(page)).toEqual({ value: 0, shifts: [] })
})

for (const slug of WORKS) {
  test(`el caso ${slug}`, async ({ page }) => {
    await page.goto(`/projects/${slug}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1800)
    expect(await cls(page)).toEqual({ value: 0, shifts: [] })
  })
}
