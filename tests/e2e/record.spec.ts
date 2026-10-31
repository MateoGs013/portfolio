import { expect, test, type Page } from '@playwright/test'
import { skipIntro } from './support'

/**
 * Ver como registro (X2, docs/diseno.md §2.1): R cambia `?vista=registro` al instante y el morph es solo
 * la lectura del cambio. Una segunda R mientras corre se ignora, con reduced motion el cambio es
 * instantáneo, con JS apagado `?vista=registro` llega renderizado por el SSR y la capa del morph no
 * deja nodos. En el caso más largo (Ynara), R y R de nuevo dejan el primer valor visible a ±8 px y
 * ningún texto cambia de ancho mientras viaja.
 */
const CASE = '/projects/ynara'
const LAYER = '[data-morph-layer]'

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' })
  // Hidratada: Vue montó la app (deja `__vue_app__` en el contenedor) y los atajos escuchan.
  await page.waitForFunction(() => !!(document.getElementById('__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__)
  await page.waitForTimeout(300)
}

/** El morph terminó: sin `data-morphing`, sin capa y con las comillas de vuelta. */
async function settled(page: Page) {
  await page.waitForFunction(sel => !document.documentElement.hasAttribute('data-morphing')
    && !document.querySelector(sel) && !document.querySelector('.quotes-off'), LAYER, { timeout: 5000 })
}

const isRecordUrl = (page: Page) => new URL(page.url()).searchParams.get('vista') === 'registro'

/**
 * Los valores de la página con la misma clave que usa el morph (la cadena de `[data-f]` y su orden en
 * el campo): el nodo de diseño se vuelve a crear al volver del registro, la clave no cambia.
 */
function installValueKeys() {
  (window as unknown as { __values: () => [string, HTMLElement][] }).__values = () => {
    const root = document.getElementById('contenido')!
    const traveler = '.fv:not(.fv-list), .flip'
    const counts = new Map<string, number>()
    const out: [string, HTMLElement][] = []
    for (const el of root.querySelectorAll<HTMLElement>(traveler)) {
      if (el.parentElement?.closest(traveler)) continue
      const path: string[] = []
      for (let n = el.closest<HTMLElement>('[data-f]'); n && root.contains(n); n = n.parentElement?.closest<HTMLElement>('[data-f]') ?? null) path.unshift(n.dataset.f!)
      if (!path.length) continue
      const field = path.join('/')
      const i = counts.get(field) ?? 0
      counts.set(field, i + 1)
      out.push([`${field}#${i}`, el])
    }
    return out
  }
}

type ValuesWindow = Window & { __values: () => [string, HTMLElement][] }

/** El primer valor que empieza en pantalla, debajo de la cabecera fija. */
function firstValue(page: Page) {
  return page.evaluate(() => {
    const floor = document.querySelector('header[data-chrome]')?.getBoundingClientRect().bottom ?? 0
    return (window as unknown as ValuesWindow).__values()
      .filter(([, el]) => el.getClientRects().length)
      .map(([key, el]) => ({ key, top: el.getBoundingClientRect().top }))
      .filter(({ top }) => top >= floor && top < innerHeight)
      .sort((a, b) => a.top - b.top)[0] ?? null
  })
}

function topOf(page: Page, key: string) {
  return page.evaluate(key => (window as unknown as ValuesWindow).__values().find(([k]) => k === key)?.[1].getBoundingClientRect().top ?? null, key)
}

/** Baja a la mitad del caso, donde el diseño y el registro tienen alturas más distintas. */
async function scrollToMiddle(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.3, behavior: 'instant' }))
  await page.waitForTimeout(400)
}

test.describe('con movimiento', () => {
  test.beforeEach(({ page }) => page.addInitScript(installValueKeys))

  test('R alterna ?vista=registro al instante y el morph no deja nodos', async ({ page }) => {
    await open(page, CASE)
    await page.keyboard.press('r')
    // La URL ya cambió mientras la lectura todavía se transforma.
    await expect.poll(() => isRecordUrl(page), { timeout: 300 }).toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-morphing', '')
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro')
    await page.waitForTimeout(2000)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-morphing', '')
    await expect(page.locator('#contenido .quotes-off')).toHaveCount(0)
    await expect(page.locator('#contenido.quotes-off')).toHaveCount(0)
    await expect(page.locator('#contenido .f[data-f="title"] .fk')).toBeVisible()

    await page.keyboard.press('r')
    await expect.poll(() => isRecordUrl(page), { timeout: 300 }).toBe(false)
    await page.waitForTimeout(2000)
    await expect(page.locator(LAYER)).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-vista', 'registro')
    // Nada queda con estilos del vuelo.
    const leftovers = await page.locator('#contenido .fv').evaluateAll(els => els.filter(el => (el as HTMLElement).style.transform || (el as HTMLElement).style.opacity || (el as HTMLElement).style.width).length)
    expect(leftovers).toBe(0)
  })

  test('una segunda R mientras corre se ignora', async ({ page }) => {
    await open(page, CASE)
    await page.keyboard.press('r')
    await expect(page.locator('html')).toHaveAttribute('data-morphing', '')
    await page.keyboard.press('r')
    await settled(page)
    expect(isRecordUrl(page)).toBe(true)
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro')
  })

  test('en Ynara, R y R de nuevo dejan la lectura en su lugar', async ({ page }) => {
    await open(page, CASE)
    await scrollToMiddle(page)
    const start = await firstValue(page)
    expect(start).not.toBeNull()

    await page.keyboard.press('r')
    await settled(page)
    // En registro el mismo valor sigue donde estaba (si la página alcanza para anclarlo).
    const inRecord = await topOf(page, start!.key)
    expect(inRecord).not.toBeNull()

    await page.keyboard.press('r')
    await settled(page)
    const back = await topOf(page, start!.key)
    expect(back).not.toBeNull()
    expect(Math.abs(back! - start!.top)).toBeLessThanOrEqual(8)
  })

  // §2.1: sin mover el scroll en registro, la segunda R vuelve al scroll exacto de antes, también
  // dentro de la galería con pin de Obra (donde un ancla de lectura no alcanza).
  for (const [path, y] of [['/', 0], ['/projects', 0], ['/projects', 1500]] as const) {
    test(`en ${path} desde ${y}, R y R de nuevo vuelven al mismo scroll`, async ({ page }) => {
      // El cargador de la primera visita al inicio no deja usar las teclas mientras corre.
      await skipIntro(page)
      await open(page, path)
      await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForTimeout(600)
      const start = await page.evaluate(() => window.scrollY)

      await page.keyboard.press('r')
      await settled(page)
      expect(isRecordUrl(page)).toBe(true)
      await page.keyboard.press('r')
      await settled(page)
      await page.waitForTimeout(300)
      expect(Math.abs(await page.evaluate(() => window.scrollY) - start)).toBeLessThanOrEqual(2)
    })
  }

  test('ningún texto cambia de ancho mientras viaja', async ({ page }) => {
    await open(page, CASE)
    await scrollToMiddle(page)
    // Cada cuadro del morph: el ancho de layout de cada valor y de cada fantasma.
    await page.evaluate(() => {
      const w = window as unknown as { __widths: Map<Element, number[]> }
      w.__widths = new Map()
      let started = false
      const sample = () => {
        const morphing = document.documentElement.hasAttribute('data-morphing')
        started ||= morphing
        // Mientras dura y un cuadro después: el último ancho es el de reposo.
        for (const el of started ? document.querySelectorAll<HTMLElement>('#contenido .fv:not(.fv-list), [data-morph-layer] > *') : []) {
          if (!el.getClientRects().length) continue
          const list = w.__widths.get(el) ?? []
          list.push(el.offsetWidth)
          w.__widths.set(el, list)
        }
        if (!started || morphing) requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    await page.keyboard.press('r')
    await settled(page)
    const spread = await page.evaluate(() => {
      const w = window as unknown as { __widths: Map<Element, number[]> }
      return [...w.__widths.values()].filter(list => list.length > 2).map(list => Math.max(...list) - Math.min(...list))
    })
    expect(spread.length).toBeGreaterThan(0)
    expect(Math.max(...spread)).toBeLessThanOrEqual(0.5)
  })
})

test.describe('con reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('el cambio es instantáneo, sin capa ni morph', async ({ page }) => {
    await page.addInitScript(installValueKeys)
    await page.addInitScript(() => {
      const w = window as unknown as { __morphSeen: boolean }
      w.__morphSeen = false
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute('data-morphing') || document.querySelector('[data-morph-layer]')) w.__morphSeen = true
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-morphing'] })
    })
    await open(page, CASE)
    await scrollToMiddle(page)
    const start = await firstValue(page)
    await page.keyboard.press('r')
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro', { timeout: 300 })
    await expect(page.locator('#contenido .f[data-f="title"] .fk')).toBeAttached()
    // El cambio corrige el ancla dos cuadros después (el estilo final llega un cuadro tarde con reduced
    // motion); una R en ese lapso se ignora como cualquier segunda R.
    await page.waitForTimeout(250)
    await page.keyboard.press('r')
    await expect(page.locator('html')).not.toHaveAttribute('data-vista', 'registro', { timeout: 300 })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => (window as unknown as { __morphSeen: boolean }).__morphSeen)).toBe(false)
    const back = await topOf(page, start!.key)
    expect(Math.abs(back! - start!.top)).toBeLessThanOrEqual(8)
  })
})

test.describe('sin JS', () => {
  test.use({ javaScriptEnabled: false })

  test('?vista=registro llega renderizado por el SSR', async ({ page }) => {
    await page.goto(`${CASE}?vista=registro`)
    await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro')
    const title = page.locator('#contenido .f[data-f="title"]')
    await expect(title.locator('.fk')).toHaveText('title')
    await expect(title.locator('.ft')).toHaveText('string')
    await expect(page.locator('#contenido .f[data-f="status"] .fv')).toHaveText('WIP')
    // Lo del diseño no está en registro.
    await expect(page.locator('#contenido h2.ed-only').first()).toBeHidden()
    await expect(page.locator(LAYER)).toHaveCount(0)
  })
})
