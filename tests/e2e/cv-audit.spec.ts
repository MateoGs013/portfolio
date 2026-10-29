import { test, expect } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

test.describe('CV A4 Single Page Verification & PDF Unification', () => {
  test('CV en /about (Español) debe generar exactamente 1 página A4 sin overflow y unificar archivos public/cv', async ({ page }) => {
    await page.setViewportSize({ width: 794, height: 1123 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      localStorage.setItem('portfolio-locale', 'es')
      document.documentElement.setAttribute('lang', 'es')
    })

    await page.goto('/about', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const cvWrapper = page.locator('.cv-wrapper')
    await expect(cvWrapper).toBeVisible()

    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(200)

    const box = await page.locator('.cv-harvard').boundingBox()
    const heightMm = box ? (box.height * 25.4 / 96).toFixed(2) : '0'
    console.log(`[CV ES BOX] w=${box?.width.toFixed(1)}px, h=${box?.height.toFixed(1)}px (${heightMm}mm)`)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    const pdfText = pdfBuffer.toString('binary')
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g)
    const pageCount = pageMatches ? pageMatches.length : 0

    console.log(`[TEST CV ES] Generado PDF con ${pageCount} página(s). Tamaño buffer: ${pdfBuffer.length} bytes`)

    const outDir = path.resolve(process.cwd(), 'tests/screenshots')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'test-cv-es.pdf'), pdfBuffer)

    await page.screenshot({
      path: path.join(outDir, 'about-print-a4.png'),
      fullPage: false,
    })

    // Actualizar PDFs estáticos unificados para descarga en Español
    const cvDir = path.resolve(process.cwd(), 'public/cv')
    if (!fs.existsSync(cvDir)) fs.mkdirSync(cvDir, { recursive: true })
    fs.writeFileSync(path.join(cvDir, 'CV-ES-Mateo-Sonzogni-ATS.pdf'), pdfBuffer)
    fs.writeFileSync(path.join(cvDir, 'CV-ES-Mateo-Sonzogni.pdf'), pdfBuffer)

    expect(pageCount).toBe(1)
  })

  test('CV en /about (English) debe generar exactamente 1 página A4 sin overflow y unificar archivos public/cv', async ({ page }) => {
    await page.setViewportSize({ width: 794, height: 1123 })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      localStorage.setItem('portfolio-locale', 'en')
      document.documentElement.setAttribute('lang', 'en')
    })

    await page.goto('/about', { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)

    const cvWrapper = page.locator('.cv-wrapper')
    await expect(cvWrapper).toBeVisible()

    await page.emulateMedia({ media: 'print' })
    await page.waitForTimeout(200)

    const box = await page.locator('.cv-harvard').boundingBox()
    const heightMm = box ? (box.height * 25.4 / 96).toFixed(2) : '0'
    console.log(`[CV ES BOX] w=${box?.width.toFixed(1)}px, h=${box?.height.toFixed(1)}px (${heightMm}mm)`)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    const pdfText = pdfBuffer.toString('binary')
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g)
    const pageCount = pageMatches ? pageMatches.length : 0

    console.log(`[TEST CV EN] Generado PDF con ${pageCount} página(s). Tamaño buffer: ${pdfBuffer.length} bytes`)

    const outDir = path.resolve(process.cwd(), 'tests/screenshots')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'test-cv-en.pdf'), pdfBuffer)

    await page.screenshot({
      path: path.join(outDir, 'test-about-print-a4-en.png'),
      fullPage: false,
    })

    // Actualizar PDFs estáticos unificados para descarga en Inglés
    const cvDir = path.resolve(process.cwd(), 'public/cv')
    if (!fs.existsSync(cvDir)) fs.mkdirSync(cvDir, { recursive: true })
    fs.writeFileSync(path.join(cvDir, 'CV-EN-Mateo-Sonzogni-ATS.pdf'), pdfBuffer)
    fs.writeFileSync(path.join(cvDir, 'CV-EN-Mateo-Sonzogni.pdf'), pdfBuffer)

    expect(pageCount).toBe(1)
  })
})
