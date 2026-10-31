import AxeBuilder from '@axe-core/playwright'
import { expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test'

/**
 * Lo que comparten las specs del sitio: las páginas de referencia, las preferencias por cookie, la
 * espera de la hidratación, axe con la excepción de la cabecera, el CLS y la lectura de la API.
 */

/** Las cuatro páginas del sitio que toda spec recorre (el caso más completo es La Rúcula). */
export const PAGES = ['/', '/projects', '/projects/la-rucula', '/about'] as const

/** Las seis obras publicadas y las dos que quedan en la base sin publicar (decisión 1). */
export const WORKS = ['la-rucula', 'argpiscinas', 'ynara', 'barberpole', 'ynara-web', 'eros'] as const
export const HIDDEN_WORKS = ['null-net', 'lampone'] as const

export const HYPERFOCUS_COOKIE = 'pf-hyperfocus'
export const A4 = { width: 794, height: 1123 }

/** Preferencias por cookie, como las lee el SSR (pf-theme, pf-hyperfocus). */
export async function prefs(context: BrowserContext, baseURL: string | undefined, theme: string, hyperfocus: boolean) {
  const url = baseURL ?? 'http://localhost:3000'
  await context.addCookies([
    { name: 'pf-theme', value: theme, url },
    ...(hyperfocus ? [{ name: HYPERFOCUS_COOKIE, value: 'true', url }] : []),
  ])
}

/** La sesión ya vio el cargador: el inicio llega quieto (el cargador lo prueba motion.spec). */
export const skipIntro = (page: Page) => page.addInitScript(() => {
  try {
    sessionStorage.setItem('mov-visited', '1')
  }
  catch {
    // Sin sessionStorage el script del head tampoco puede leerlo y el cargador corre igual.
  }
})

/** Carga la página y espera a que Vue la hidrate (deja `__vue_app__` en el contenedor). */
export async function open(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!(document.getElementById('__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__)
  await page.waitForTimeout(300)
  return res
}

/** Baja la página entera de a una pantalla, como quien la lee: las líneas y las palabras se encienden. */
export async function readThrough(page: Page) {
  // Scroll nativo (también en los proyectos táctiles, donde no hay rueda); Lenis y ScrollTrigger lo siguen.
  const steps = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight / innerHeight) + 1)
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => scrollBy({ top: innerHeight * 0.9, behavior: 'instant' }))
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(1200)
}

/**
 * axe sin violaciones. La cabecera usa mix-blend-difference: axe no aplica la mezcla y su contraste lo
 * mide scripts/check-contrast.mjs (docs/diseno.md §10). axe no admite dos corridas a la vez.
 */
export async function axeViolations(page: Page, impacts: string[] = ['critical', 'serious', 'moderate', 'minor']) {
  const all = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  const contrast = await new AxeBuilder({ page }).withRules(['color-contrast']).exclude('header[data-chrome]').analyze()
  return [...all.violations, ...contrast.violations]
    .filter(v => impacts.includes(v.impact ?? 'minor'))
    .map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
}

/** Cuánto se puede desplazar la página en horizontal (0: nada se sale de los costados). */
export const horizontalOverflow = (page: Page) => page.evaluate(() => {
  const root = document.documentElement
  return Math.max(0, root.scrollWidth - root.clientWidth)
})

/** Antes de cualquier script: suma los layout-shift sin input reciente (el CLS de la carga). */
export function observeShifts() {
  const w = window as unknown as { __cls: number, __shifts: string[] }
  w.__cls = 0
  w.__shifts = []
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as unknown as { value: number, hadRecentInput: boolean, sources?: { node?: Node }[] }[]) {
      if (entry.hadRecentInput) continue
      w.__cls += entry.value
      for (const source of entry.sources ?? []) {
        const el = source.node instanceof Element ? source.node : source.node?.parentElement
        w.__shifts.push(`${entry.value.toFixed(4)} ${el?.tagName.toLowerCase() ?? '?'}.${el?.className.toString().slice(0, 60) ?? ''}`)
      }
    }
  }).observe({ type: 'layout-shift', buffered: true })
}

export const cls = (page: Page) => page.evaluate(() => {
  const w = window as unknown as { __cls: number, __shifts: string[] }
  return { value: w.__cls, shifts: w.__shifts }
})

/** Una respuesta de la API pública por el proxy del sitio (el mismo origen que usa el navegador). */
export async function api<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(`/api${path}`)
  expect(res.status(), path).toBe(200)
  return ((await res.json()) as { data: T }).data
}

/** El valor de un campo de un Doc (about, contact) en el idioma pedido. */
export async function docValue(request: APIRequestContext, key: 'about' | 'contact', name: string, lang: 'es' | 'en' = 'es') {
  const doc = await api<{ fields: { name: string, value: string | string[] }[] }>(request, `/docs/${key}?lang=${lang}`)
  return doc.fields.find(f => f.name === name)?.value
}

/** El primer punto de un texto largo: lo bastante único para buscarlo en la página. */
export const head = (text: string, n = 40) => text.replace(/\s+/g, ' ').trim().slice(0, n)
