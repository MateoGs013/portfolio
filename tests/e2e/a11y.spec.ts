import { expect, test } from '@playwright/test'
import { axeViolations, horizontalOverflow, open, PAGES, prefs, readThrough, skipIntro } from './support'

/**
 * Accesibilidad (invariante 4): axe sin ninguna violación en las cuatro páginas y en la hoja del CV, con
 * y sin Hiperfoco, en cada proyecto de ancho y tema (el tema llega por la cookie del proyecto). La
 * página se lee entera antes de medir: las palabras que se encienden al leerlas empiezan atenuadas a
 * propósito. Un solo h1 y ningún scroll horizontal en cada caso.
 */
for (const hyperfocus of [false, true]) {
  test.describe(hyperfocus ? 'en Hiperfoco' : 'sin Hiperfoco', () => {
    for (const path of [...PAGES, '/about?cv=ats']) {
      test(`${path}: axe sin violaciones`, async ({ page, context, baseURL }) => {
        const theme = (await context.cookies()).find(c => c.name === 'pf-theme')?.value ?? 'dark'
        await prefs(context, baseURL, theme, hyperfocus)
        await skipIntro(page)
        await open(page, path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        if (hyperfocus) await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
        await readThrough(page)

        await expect(page.locator('h1')).toHaveCount(1)
        expect(await horizontalOverflow(page)).toBe(0)
        expect(await axeViolations(page)).toEqual([])
      })
    }
  })
}
