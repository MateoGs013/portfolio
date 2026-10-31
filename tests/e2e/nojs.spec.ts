import { expect, test, type Page } from '@playwright/test'
import shell from '../../app/lib/dict/shell'
import { api, horizontalOverflow, PAGES } from './support'

/**
 * Sin JS (proyecto no-js): el SSR entrega la página entera y se navega por enlaces reales
 * (.claude/rules/explorer.md). Ninguna animación deja texto invisible, el cargador no aparece, el CV
 * y el registro llegan renderizados y el contacto es un mailto.
 */

/** Texto que ocupa lugar en la página pero no se ve: lo que una animación dejó a medio camino. */
const invisibleText = (page: Page) => page.locator('#contenido *').evaluateAll(els => els
  .filter(el => el.children.length === 0 && el.textContent?.trim())
  .filter(el => el.checkVisibility() && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
  .map(el => el.outerHTML.slice(0, 120)))

const EXTRA = ['/articles', '/about?cv=ats', '/projects?vista=registro', '/?lang=en', '/projects/eros?lang=en']

test.describe('cada página llega entera', () => {
  for (const path of [...PAGES, ...EXTRA]) {
    test(`${path}`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('h1')).not.toBeEmpty()
      await expect(page.locator('[data-intro-loader]')).toBeHidden()
      expect(await invisibleText(page)).toEqual([])
      // Las imágenes tienen su src en el HTML (la carga diferida es la nativa del navegador).
      expect(await page.locator('#contenido img:not([src])').count()).toBe(0)
      expect(await horizontalOverflow(page)).toBe(0)
    })
  }
})

test('se navega por enlaces reales: menú, tarjeta, siguiente obra y volver al inicio', async ({ page }) => {
  await page.goto('/')
  await page.locator('header[data-chrome] nav a', { hasText: shell['nav.work'].es }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.locator('#contenido a[data-card]')).toHaveCount(6)

  await page.locator('#contenido a[data-card]').first().click()
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/)
  const first = page.url()
  await page.locator('nav a[data-travel="next"]:visible').first().click()
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/)
  expect(page.url()).not.toBe(first)

  await page.locator('header[data-chrome] a[href="/"]').first().click()
  await expect(page).toHaveURL(/\/$/)
})

test('el contacto es un mailto con el email de la base', async ({ page, request }) => {
  const contact = await api<{ fields: { name: string, value: string }[] }>(request, '/docs/contact')
  const email = contact.fields.find(f => f.name === 'email')!.value
  await page.goto('/about')
  await expect(page.locator(`footer a[href="mailto:${email}"]`)).toBeVisible()
})

test('el CV se lee y se descarga sin JS', async ({ page }) => {
  await page.goto('/about?cv=ats')
  const sheet = page.locator('.cv-harvard')
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('section').first()).not.toBeEmpty()
  await expect(page.locator('a[href$="-ATS.pdf"]').first()).toBeAttached()
})

test('el registro de la obra es una tabla tipada', async ({ page }) => {
  await page.goto('/projects?vista=registro')
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro')
  await expect(page.locator('#contenido table tbody tr.f')).toHaveCount(6)
  await expect(page.locator('#contenido table th[scope="row"] a').first()).toHaveAttribute('href', /^\/projects\/[\w-]+/)
})
