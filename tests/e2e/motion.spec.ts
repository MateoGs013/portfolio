import { expect, test, type Page } from '@playwright/test'
import { open, readThrough } from './support'

/**
 * Política de movimiento (docs/diseno.md §6), en el proyecto reduced-motion: con `prefers-reduced-motion`
 * todo llega a su estado final sin animar. Sin cargador, sin Lenis, sin pin, sin autoplay (póster y
 * controles) y nada transformado por GSAP. El bloque «con movimiento» es el control: lo mismo, con la
 * preferencia apagada, sí se mueve.
 */

/** Elementos del contenido con un transform o una opacidad puestos en línea (lo que escribe GSAP). */
const animated = (page: Page) => page.locator('#contenido *').evaluateAll(els => els
  .filter(el => /transform|translate|scale|rotate|opacity/.test((el as HTMLElement).getAttribute('style') ?? ''))
  .map(el => `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 40)}: ${el.getAttribute('style')}`))

test.describe('con reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('la primera visita al inicio no muestra el cargador ni crea Lenis', async ({ page }) => {
    const res = await open(page, '/')
    expect(await res?.text()).toContain('data-intro-loader')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.*/)
    await expect(page.locator('[data-intro-loader]')).toBeHidden()
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
    // El nombre está quieto: sus letras no tienen transform.
    expect(await animated(page)).toEqual([])
  })

  test('el caso: sin autoplay, con póster y controles; la captura no crece', async ({ page }) => {
    await open(page, '/projects/la-rucula')
    const videos = page.locator('#contenido video')
    expect(await videos.count()).toBeGreaterThan(0)
    for (const video of await videos.all()) {
      await video.evaluate(v => v.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(1200)
      expect(await video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, t: v.currentTime, poster: !!v.poster }))).toEqual({ paused: true, t: 0, poster: true })
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await readThrough(page)
    expect(await animated(page)).toEqual([])
    // Lo que se pide sigue andando: el botón reproduce.
    const cover = page.locator('[data-vt="cover"]')
    await cover.evaluate(el => el.scrollIntoView({ block: 'center' }))
    await cover.locator('button[data-chrome]').click()
    await expect.poll(() => cover.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 8000 }).toBeGreaterThan(0)
  })

  test('la obra: sin pista horizontal ni pin, y las tarjetas sin inclinación', async ({ page }) => {
    await open(page, '/projects')
    await readThrough(page)
    await expect(page.locator('section[data-track]')).toHaveCount(0)
    await expect(page.locator('.pin-spacer')).toHaveCount(0)
    expect(await animated(page)).toEqual([])
  })
})

test.describe('con movimiento (control)', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('la primera visita al inicio corre el cargador, que se va solo, y Lenis existe', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', '')
    await expect(page.locator('[data-intro-loader]')).toBeVisible()
    // Cuatro segundos como mucho, pase lo que pase (la regla de seguridad del CSS).
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.*/, { timeout: 6000 })
    await expect(page.locator('[data-intro-loader]')).toBeHidden()
    await expect(page.locator('html')).toHaveClass(/\blenis\b/)
    // La segunda visita de la sesión ya no lo muestra.
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('html')).not.toHaveAttribute('data-intro', /.*/)
  })

  test('la obra en 1440 px tiene la pista horizontal con pin', async ({ page }) => {
    await open(page, '/projects')
    await expect(page.locator('section[data-track]')).toHaveCount(1)
    await expect(page.locator('.pin-spacer')).not.toHaveCount(0)
  })
})
