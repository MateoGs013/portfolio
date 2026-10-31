import { expect, test } from '@playwright/test'

/**
 * El CV de /about?cv=ats entra en una sola página A4 con la cota dual (.claude/rules/explorer.md): sin
 * desborde (una página) y sin vacío (la hoja impresa mide entre 248 y 265 mm). El idioma sale de
 * ?lang. Mide como scripts/cv-pdf.mjs, con el ancho imprimible de la hoja, y solo lee: nunca escribe
 * public/cv (los PDF los genera ese script).
 */
const MM_PER_PX = 25.4 / 96
/** A4 menos el margen único de print.css (10,5 mm arriba y abajo, 12 mm a los lados). */
const PRINTABLE = { width: 210 - 24, height: 297 - 21 }
const BOUNDS = { min: 248, max: 265 }

test.use({ viewport: { width: Math.round(PRINTABLE.width / MM_PER_PX), height: Math.round(PRINTABLE.height / MM_PER_PX) } })

for (const lang of ['es', 'en'] as const) {
  test(`CV ${lang.toUpperCase()}: una página A4 de ${BOUNDS.min} a ${BOUNDS.max} mm`, async ({ page }, info) => {
    await page.goto(`/about?cv=ats${lang === 'en' ? '&lang=en' : ''}`, { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    const sheet = page.locator('.cv-harvard')
    await expect(sheet).toHaveCount(1)
    await expect(sheet).toHaveAttribute('lang', lang)

    await page.emulateMedia({ media: 'print' })
    await page.evaluate(() => document.fonts.ready)
    const heightMm = await sheet.evaluate(el => el.getBoundingClientRect().height) * MM_PER_PX
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    await info.attach(`cv-${lang}.pdf`, { body: pdf, contentType: 'application/pdf' })

    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0).toBe(1)
    expect(heightMm).toBeGreaterThanOrEqual(BOUNDS.min)
    expect(heightMm).toBeLessThanOrEqual(BOUNDS.max)
  })
}
