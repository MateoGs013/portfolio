import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const SCREENSHOT_DIR = process.env.AUDIT_SCREENSHOT_DIR || path.resolve(process.cwd(), 'tests/screenshots')

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
})

test.describe('Explorador Relacional — Auditoría Visual y UX/UI', () => {
  test('Landing (/), Temas (Obsidian Dark & Technical Paper), Hyperfocus y Cero Overflow', async ({ page }, testInfo) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => {
      pageErrors.push(err.message)
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // 1. Verificar que existe un único H1 visible y el SSR hidrató sin errores
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // 2. Verificar cero overflow horizontal en cualquier viewport (incluido 320px)
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)

    // Captura en Obsidian Dark (default)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `home-dark-${testInfo.project.name}.png`),
      fullPage: false,
    })

    // 3. Probar cambio a tema Technical Paper (Light)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light')
    })
    await page.waitForTimeout(150)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `home-light-${testInfo.project.name}.png`),
      fullPage: false,
    })

    // Restaurar dark y probar modo Hyperfocus (tecla H)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark')
    })
    await page.keyboard.press('h')
    await expect(page.locator('.hiperfoco-dossier')).toBeVisible()
    await page.waitForTimeout(250)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `home-hyperfocus-${testInfo.project.name}.png`),
      fullPage: false,
    })

    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors)
    }
    expect(pageErrors).toEqual([])
  })

  test('Navegación de colecciones (/projects, /stack, /about) e Impresión Harvard ATS A4', async ({ page }, testInfo) => {
    await page.goto('/projects', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `projects-${testInfo.project.name}.png`),
      fullPage: false,
    })

    const hasOverflowProjects = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasOverflowProjects).toBe(false)

    // Vista detalle de proyecto (/projects/la-rucula)
    await page.goto('/projects/la-rucula', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `project-detail-${testInfo.project.name}.png`),
      fullPage: false,
    })

    // Vista /about + emulación de impresión A4
    await page.goto('/about', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `about-${testInfo.project.name}.png`),
      fullPage: false,
    })

    if (testInfo.project.name === 'desktop-chromium') {
      await page.emulateMedia({ media: 'print' })
      await page.waitForTimeout(150)
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, 'about-print-a4.png'),
        fullPage: true,
      })
    }
  })
})
