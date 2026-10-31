import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import focus from '../../app/lib/dict/focus'

/**
 * Hiperfoco (X1, docs/diseno.md §5): la cookie llega al SSR sin cambio de layout, la navegación sigue
 * entera, el botón alterna con aria-pressed sin perder el foco, Esc cierra capas antes de salir, Lenis
 * no existe en el modo, axe no encuentra violaciones serias y el CV se imprime en una página. Corre en
 * 375 y 1440 px, en oscuro y en claro (el viewport lo fija cada bloque: basta un proyecto).
 */
const PAGES = ['/', '/projects', '/projects/la-rucula', '/about'] as const
const WIDTHS = [375, 1440] as const
const THEMES = ['dark', 'light'] as const
const COOKIE = 'pf-hyperfocus'
const A4 = { width: 794, height: 1123 }

async function prefs(context: BrowserContext, baseURL: string | undefined, theme: string, hyperfocus: boolean) {
  const url = baseURL ?? 'http://localhost:3000'
  await context.addCookies([
    { name: 'pf-theme', value: theme, url },
    ...(hyperfocus ? [{ name: COOKIE, value: 'true', url }] : []),
  ])
}

async function focusCookie(context: BrowserContext) {
  return (await context.cookies()).find(c => c.name === COOKIE)?.value
}

/** Suma de los layout-shift sin input reciente desde el primer pintado (CLS de la carga). */
function observeShifts() {
  const w = window as unknown as { __cls: number }
  w.__cls = 0
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as unknown as { value: number, hadRecentInput: boolean }[]) {
      if (!entry.hadRecentInput) w.__cls += entry.value
    }
  }).observe({ type: 'layout-shift', buffered: true })
}

/** axe sin violaciones serias. La cabecera usa mix-blend-difference: su contraste lo mide check-contrast. */
async function seriousViolations(page: Page) {
  const serious = (v: { impact?: string | null }) => v.impact === 'serious' || v.impact === 'critical'
  // axe no admite dos corridas a la vez en la misma página.
  const all = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  const contrast = await new AxeBuilder({ page }).withRules(['color-contrast']).exclude('header[data-chrome]').analyze()
  return [...all.violations, ...contrast.violations].filter(serious).map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
}

/** En angosto el botón vive en el menú de la cabecera: se abre si el resumen se ve. */
async function toggleButton(page: Page) {
  const summary = page.locator('header[data-chrome] summary')
  if (await summary.isVisible()) await summary.click()
  const button = page.locator('header[data-chrome] button[aria-keyshortcuts="h"]')
  await expect(button).toBeVisible()
  return button
}

const isNarrow = async (page: Page) => page.locator('header[data-chrome] summary').isVisible()

// Cada bloque fija su viewport: correrlo también en mobile-320 duplicaría la corrida (y las ~200
// peticiones a la API) sin cubrir nada nuevo.
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'hyperfocus.spec fija sus propios viewports')
})

/** Marca el bloque que se está leyendo (el mismo criterio que useHyperfocus) y devuelve su alto. */
const anchorTop = (page: Page) => page.evaluate(() => {
  const floor = document.querySelector('header[data-chrome]')?.getBoundingClientRect().bottom ?? 0
  const readable = '#contenido :is(h1, h2, h3, p, li, dt, dd, figure, blockquote, pre, [data-row], [data-card])'
  const skip = '[data-hf="hide"], [data-ornament], [aria-hidden="true"]'
  const el = [...document.querySelectorAll<HTMLElement>(readable)]
    .find(b => !b.closest(skip) && b.getBoundingClientRect().height > 0 && b.getBoundingClientRect().bottom > floor)
  if (!el) throw new Error('no hay un bloque visible')
  el.dataset.anchorProbe = ''
  return el.getBoundingClientRect().top
})
const probeTop = (page: Page) => page.evaluate(() => document.querySelector('[data-anchor-probe]')!.getBoundingClientRect().top)

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    test.describe(`${width} px · ${theme}`, () => {
      test.use({ viewport: { width, height: width < 768 ? 812 : 900 } })

      for (const path of PAGES) {
        test(`${path}: SSR en Hiperfoco, sin cambio de layout, sin Lenis y sin violaciones serias`, async ({ page, context, baseURL }) => {
          await prefs(context, baseURL, theme, true)
          await page.addInitScript(observeShifts)
          // Primera carga para la caché: el cambio de fuente de la primera visita (Martian Mono en el
          // atajo de la cabecera) no es del modo. Se mide la segunda, la del SSR con la cookie.
          await page.goto(path, { waitUntil: 'networkidle' })
          const res = await page.reload({ waitUntil: 'networkidle' })
          expect(await res?.text()).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
          await page.waitForTimeout(800)

          expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0)
          await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
          await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
          await expect(page.locator('.pin-spacer')).toHaveCount(0)
          // Lo que el modo oculta no se ve y la columna de lectura mide 68ch como mucho.
          for (const hidden of await page.locator('[data-hf="hide"], [data-ornament]').all()) await expect(hidden).toBeHidden()
          const [columnWidth, measure] = await page.locator('#contenido article[data-hf="measure"]').evaluate(el => [el.getBoundingClientRect().width, parseFloat(getComputedStyle(el).maxWidth)])
          expect(columnWidth).toBeLessThanOrEqual(measure! + 0.5)
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

          expect(await seriousViolations(page)).toEqual([])
        })
      }

      test('la navegación sigue entera con el modo activo', async ({ page, context, baseURL }) => {
        await prefs(context, baseURL, theme, true)
        await page.goto('/', { waitUntil: 'networkidle' })

        await page.locator('header[data-chrome] nav a[href="/projects"]').click()
        await expect(page).toHaveURL(/\/projects$/)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('section[data-track]')).toHaveCount(0)

        await page.locator('#contenido a[data-card]').first().click()
        await expect(page).toHaveURL(/\/projects\/[\w-]+$/)
        // La escena de la siguiente obra no se ve; queda el enlace llano.
        await expect(page.locator('nav a[data-travel="next"]:visible')).toHaveCount(1)

        await page.locator('body').press('Backspace')
        await expect(page).toHaveURL(/\/projects$/)
        await page.locator('body').press('3')
        await expect(page).toHaveURL(/\/about$/)
        await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
      })

      test('el botón alterna con aria-pressed, conserva el foco y Esc cierra capas antes de salir', async ({ page, context, baseURL }) => {
        await prefs(context, baseURL, theme, false)
        await page.goto('/projects', { waitUntil: 'networkidle' })
        const html = page.locator('html')
        const status = page.locator('[role="status"][aria-live="polite"]')

        const button = await toggleButton(page)
        await expect(button).toHaveAttribute('aria-pressed', 'false')
        await button.click()
        await expect(button).toHaveAttribute('aria-pressed', 'true')
        await expect(html).toHaveAttribute('data-hyperfocus', 'true')
        await expect(button).toBeFocused()
        await expect(status).toHaveText(focus['focus.on'].es)
        expect(await focusCookie(context)).toBe('true')

        // H con el foco en el botón alterna y el foco no se mueve.
        await page.keyboard.press('h')
        await expect(button).toHaveAttribute('aria-pressed', 'false')
        await expect(html).not.toHaveAttribute('data-hyperfocus', /.*/)
        await expect(status).toHaveText(focus['focus.off'].es)
        await expect(button).toBeFocused()
        expect(await focusCookie(context)).toBeUndefined()
        await page.keyboard.press('h')
        await expect(html).toHaveAttribute('data-hyperfocus', 'true')

        // Esc: primero la capa abierta (el menú angosto), después el modo.
        if (await isNarrow(page)) {
          await page.keyboard.press('Escape')
          await expect(page.locator('header[data-chrome] details')).not.toHaveAttribute('open', /.*/)
          await expect(html).toHaveAttribute('data-hyperfocus', 'true')
        }
        await page.keyboard.press('Escape')
        await expect(html).not.toHaveAttribute('data-hyperfocus', /.*/)
        expect(await focusCookie(context)).toBeUndefined()
      })

      test('H no cambia el modo detrás de la paleta y Esc la cierra antes de salir', async ({ page, context, baseURL }) => {
        await prefs(context, baseURL, theme, true)
        await page.goto('/about', { waitUntil: 'networkidle' })
        const html = page.locator('html')

        await page.locator('body').press('/')
        const dialog = page.locator('dialog[open]')
        await expect(dialog).toBeVisible()
        await page.keyboard.press('h')
        await expect(html).toHaveAttribute('data-hyperfocus', 'true')
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(html).toHaveAttribute('data-hyperfocus', 'true')
        await page.keyboard.press('Escape')
        await expect(html).not.toHaveAttribute('data-hyperfocus', /.*/)
      })
    })
  }
}

test.describe('entrada y salida', () => {
  test('?foco=1 entra por el SSR, deja la cookie y se va de la URL al hidratar', async ({ page, context }) => {
    const res = await page.goto('/projects?foco=1', { waitUntil: 'networkidle' })
    expect(await res?.text()).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
    expect(await focusCookie(context)).toBe('true')
    // Salir borra la cookie: recargar ya no vuelve a entrar.
    await page.locator('body').press('h')
    await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)
  })

  for (const theme of THEMES) {
    test(`el CV se imprime en una página A4 con el modo activo (${theme})`, async ({ page, context, baseURL }, info) => {
      await prefs(context, baseURL, theme, true)
      await page.setViewportSize(A4)
      await page.goto('/about?cv=ats', { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
      await expect(page.locator('.cv-harvard').first()).toBeVisible()

      await page.emulateMedia({ media: 'print' })
      const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
      await info.attach(`cv-hiperfoco-${theme}.pdf`, { body: pdf, contentType: 'application/pdf' })
      expect(pdf.toString('binary').match(/\/Type\s*\/Page\b/g)?.length ?? 0).toBe(1)
    })
  }
})

test.describe('el cambio de modo', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('con movimiento corre una view transition de tipo hiperfoco', async ({ page, context, baseURL }) => {
    await prefs(context, baseURL, 'dark', false)
    await page.goto('/about', { waitUntil: 'networkidle' })
    const supported = await page.evaluate(() => typeof document.startViewTransition === 'function')
    test.skip(!supported, 'el navegador no tiene view transitions')
    await page.evaluate(() => {
      const w = window as unknown as { __types: string[] }
      w.__types = []
      const start = document.startViewTransition.bind(document)
      document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
        const types = typeof arg === 'object' && arg && 'types' in arg ? [...(arg.types ?? [])] : []
        w.__types.push(...types)
        return start(arg)
      }) as typeof document.startViewTransition
    })
    await page.locator('body').press('h')
    await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
    expect(await page.evaluate(() => (window as unknown as { __types: string[] }).__types)).toContain('hiperfoco')
  })

  test.describe('con reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('es instantáneo y la lectura queda a la misma altura', async ({ page, context, baseURL }) => {
      await prefs(context, baseURL, 'dark', false)
      await page.goto('/projects/la-rucula', { waitUntil: 'networkidle' })
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 3, behavior: 'instant' }))
      await page.waitForTimeout(300)

      const before = await anchorTop(page)
      await page.locator('body').press('h')
      await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
      await page.waitForTimeout(300)
      expect(Math.abs(await probeTop(page) - before)).toBeLessThanOrEqual(1)

      await page.evaluate(() => document.querySelector('[data-anchor-probe]')?.removeAttribute('data-anchor-probe'))
      const inside = await anchorTop(page)
      await page.locator('body').press('h')
      await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)
      await page.waitForTimeout(300)
      expect(Math.abs(await probeTop(page) - inside)).toBeLessThanOrEqual(1)
    })
  })
})

test('ningún componente se renderiza solo en Hiperfoco', () => {
  const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]))
  const offenders = files(join(process.cwd(), 'app/components'))
    .filter(file => file.endsWith('.vue') && /v-(?:if|show)="!?isHyperfocus/.test(readFileSync(file, 'utf8')))
  expect(offenders).toEqual([])
})
