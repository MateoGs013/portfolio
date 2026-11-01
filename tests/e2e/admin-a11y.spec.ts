import { expect, test, type Page } from '@playwright/test'
import { ADMIN, allViews, horizontalOverflow, mod, noSeriousAxe, openFresh, palette, signedIn, visit, watchCsp, type View } from './admin-support'

/**
 * Accesibilidad y piso visual de cada pantalla del admin nuevo: axe sin violaciones serias ni
 * críticas en cada vista, editor y etapa; sin scroll horizontal de 390 a 1920 px; con movimiento
 * reducido no corre ninguna transición; ningún texto por debajo de 12 px; ninguna mayúscula forzada
 * fuera de la hoja del CV; y la consola sin violaciones de CSP en ninguna vista. Con la muestra de
 * EROS_DEMO, para que Búsqueda laboral tenga vacantes, publicaciones y tendencias que abrir:
 *
 * admin-run: --demo
 *
 *   node scripts/admin-run.mjs --demo -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-a11y.spec.ts
 */
const WIDTHS = [390, 768, 1024, 1280, 1440, 1920]
const MIN_FONT_PX = 12

/** Lo que se ve y lleva texto propio: tamaño de letra y mayúsculas forzadas (fuera de la hoja del CV). */
async function typeFloor(page: Page): Promise<{ small: string[], upper: string[] }> {
  return page.evaluate((min) => {
    const small: string[] = []
    const upper: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.closest('[data-cv-sheet], script, style, svg, noscript')) continue
      const own = [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
      if (!own || !el.getClientRects().length) continue
      const style = getComputedStyle(el)
      if (style.visibility === 'hidden') continue
      const text = el.textContent!.trim().slice(0, 40)
      const size = Number.parseFloat(style.fontSize)
      // Lo visualmente oculto para lectores de pantalla (1 px recortado) no se lee en pantalla.
      const clipped = el.getBoundingClientRect().width <= 1
      if (size < min && !clipped) small.push(`${size}px «${text}»`)
      if (style.textTransform === 'uppercase' || style.fontVariantCaps.includes('small-caps')) upper.push(`«${text}»`)
    }
    return { small, upper }
  }, MIN_FONT_PX)
}

test.describe('cada vista y editor', () => {
  test.setTimeout(420_000)

  test('axe sin serias ni críticas, letra de 12 px o más, sin mayúsculas forzadas ni violaciones de CSP', async ({ page, request }) => {
    const views = await allViews(request)
    expect(views.length, 'con --demo entran las etapas, la publicación y la tendencia').toBeGreaterThanOrEqual(34)
    const violations = await watchCsp(page)
    await signedIn(page)
    const problems: string[] = []
    for (const view of views) {
      await openFresh(page, view.hash)
      try {
        await noSeriousAxe(page, view.name)
      }
      catch (err) {
        problems.push(`${view.name}: ${err instanceof Error ? err.message.split('\n').slice(0, 12).join(' ') : err}`)
      }
      const { small, upper } = await typeFloor(page)
      if (small.length) problems.push(`${view.name}: letra chica ${small.slice(0, 5).join(', ')}`)
      if (upper.length) problems.push(`${view.name}: mayúsculas forzadas ${upper.slice(0, 5).join(', ')}`)
      const csp = await violations()
      if (csp.length) problems.push(`${view.name}: CSP ${csp.join(' | ')}`)
    }
    expect(problems).toEqual([])
  })

  test('diálogos y capas: la paleta, Pegar una vacante y el borrado, sin serias ni críticas', async ({ page, request }) => {
    const views = await allViews(request)
    const org = views.find(v => v.name === 'Empresa')!
    await signedIn(page, '#/busqueda/vacantes')
    await page.keyboard.press(`${mod}+k`)
    await palette(page).getByRole('combobox').fill('ru')
    await noSeriousAxe(page, 'paleta')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /^Pegar una vacante/ }).click()
    await expect(page.getByRole('dialog', { name: 'Pegar una vacante' })).toBeVisible()
    await noSeriousAxe(page, 'Pegar una vacante')
    await page.keyboard.press('Escape')
    await visit(page, org.hash)
    await page.locator('#main').getByRole('button', { name: 'Más acciones' }).click()
    await page.getByRole('menuitem', { name: /^Eliminar/ }).click()
    await expect(page.getByRole('dialog', { name: /^Eliminar/ })).toBeVisible()
    await noSeriousAxe(page, 'Eliminar empresa')
  })

  test('el ingreso, sin sesión', async ({ page }) => {
    const violations = await watchCsp(page)
    await page.goto(`${ADMIN}#/obras`)
    await expect(page.getByRole('main').getByLabel('Clave de acceso')).toBeFocused()
    await noSeriousAxe(page, 'ingreso')
    expect((await typeFloor(page)).small).toEqual([])
    expect(await violations()).toEqual([])
  })
})

for (const width of WIDTHS) {
  test(`sin scroll horizontal a ${width} px en ninguna vista`, async ({ page, request }) => {
    test.setTimeout(240_000)
    const views = await allViews(request)
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    await signedIn(page)
    const wide: string[] = []
    for (const view of views) {
      await openFresh(page, view.hash)
      const overflow = await horizontalOverflow(page)
      if (overflow > 0) wide.push(`${view.name}: ${overflow} px`)
    }
    expect(wide).toEqual([])
  })
}

test.describe('con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' })

  /** Las animaciones que corren y las transiciones declaradas que duran más que un instante. */
  async function motion(page: Page): Promise<{ animations: string[], transitions: string[], viewTransitions: number }> {
    return page.evaluate(() => {
      const animations = document.getAnimations()
        .filter(a => Number(a.effect?.getComputedTiming().duration ?? 0) > 1 || Number(a.effect?.getComputedTiming().delay ?? 0) > 1)
        .map(a => `${(a as CSSAnimation).animationName ?? a.constructor.name} ${String(a.effect?.getComputedTiming().duration)}ms`)
      const seconds = (value: string) => Math.max(...value.split(',').map(v => v.trim().endsWith('ms') ? Number.parseFloat(v) / 1000 : Number.parseFloat(v)))
      const transitions = [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => {
          const style = getComputedStyle(el)
          return seconds(style.transitionDuration) > 0.001 || seconds(style.transitionDelay) > 0.001
        })
        .slice(0, 5)
        .map(el => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`)
      return { animations, transitions, viewTransitions: (window as unknown as { __viewTransitions: number }).__viewTransitions }
    })
  }

  test('ninguna transición: ni el paso entre pantallas, ni las filas, ni los diálogos', async ({ page, request }) => {
    test.setTimeout(240_000)
    await page.addInitScript(() => {
      Object.defineProperty(window, '__viewTransitions', { value: 0, writable: true })
      const original = document.startViewTransition?.bind(document)
      if (original) {
        document.startViewTransition = ((cb: () => Promise<void>) => {
          (window as unknown as { __viewTransitions: number }).__viewTransitions++
          return original(cb)
        }) as typeof document.startViewTransition
      }
    })
    const views: View[] = await allViews(request)
    await signedIn(page, '#/obras')
    const moving: string[] = []
    const check = async (where: string) => {
      const { animations, transitions } = await motion(page)
      if (animations.length) moving.push(`${where}: animaciones ${animations.join(', ')}`)
      if (transitions.length) moving.push(`${where}: transiciones ${transitions.join(', ')}`)
    }
    // Pasos entre pantallas dentro del admin: de la fila al editor, una pestaña, la navegación y Atrás.
    const nav = page.getByRole('navigation', { name: 'Secciones' })
    await page.getByRole('listbox', { name: 'Obras' }).getByRole('option').first().click()
    await expect(page).toHaveURL(/#\/obras\/\d+$/)
    await check('fila al editor')
    await page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab', { name: /^Relato/ }).click()
    await nav.getByRole('link', { name: /^Trayectoria/ }).click()
    await expect(page.locator('#main h1')).toHaveText('Trayectoria')
    await check('navegación')
    await page.goBack()
    await page.keyboard.press(`${mod}+k`)
    await expect(palette(page)).toBeVisible()
    await check('paleta')
    await page.keyboard.press('Escape')
    expect((await motion(page)).viewTransitions, 'View Transitions iniciadas').toBe(0)

    for (const view of views) {
      await openFresh(page, view.hash)
      await check(view.name)
    }
    expect(moving).toEqual([])

    // El contador sí cuenta: sin movimiento reducido, la misma fila arranca la View Transition.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await openFresh(page, '#/obras')
    await page.getByRole('listbox', { name: 'Obras' }).getByRole('option').first().click()
    await expect(page).toHaveURL(/#\/obras\/\d+$/)
    expect((await motion(page)).viewTransitions).toBeGreaterThan(0)
  })
})
