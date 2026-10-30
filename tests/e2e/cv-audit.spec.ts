import { expect, test } from '@playwright/test'

/**
 * El CV de /about?cv=ats entra en una sola página A4 (cota dual, .claude/rules/explorer.md). Solo lee:
 * nunca escribe public/cv (los PDF los genera scripts/cv-pdf.mjs, F6). La cota de alto 248–265 mm la
 * suma Q1 cuando la hoja salga de /api/cv.
 */
const A4 = { width: 794, height: 1123 }

for (const lang of ['es', 'en'] as const) {
  test(`CV ${lang.toUpperCase()} en /about?cv=ats imprime una sola página A4`, async ({ page }, info) => {
    await page.setViewportSize(A4)
    await page.goto(`/about?cv=ats${lang === 'en' ? '&lang=en' : ''}`, { waitUntil: 'networkidle' })
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('.cv-harvard').first()).toBeVisible()

    await page.emulateMedia({ media: 'print' })
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    const pages = pdf.toString('binary').match(/\/Type\s*\/Page\b/g)?.length ?? 0
    await info.attach(`cv-${lang}.pdf`, { body: pdf, contentType: 'application/pdf' })
    expect(pages).toBe(1)
  })
}
