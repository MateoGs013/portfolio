import { expect, test, type Page } from '@playwright/test'
import { ADMIN, auth, erosUrl, mod, noSeriousAxe, palette, shot, signedIn, withErosMock } from './admin-support'

/**
 * Artículos que escribe Eros y Tendencias: la línea del horario de los lunes con el último pedido,
 * «Pedir un artículo a Eros» (botón y paleta) con su progreso hasta el artículo publicado, el fallo
 * contado en el diálogo, y en Tendencias la lista honesta según Eros y «Escribir artículo», que
 * termina en el mismo lugar. Corre en los tres modos de Eros:
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-articulos-eros.spec.ts
 *   node scripts/admin-run.mjs --demo -- …            (la muestra de EROS_DEMO: tendencias de muestra, sin artículo de muestra)
 *   node scripts/admin-run.mjs --eros-mock -- …       (Eros simulado: tests/admin/eros-mock.ts)
 *
 * admin-run: sin Eros
 * admin-run: --demo
 * admin-run: --eros-mock
 *
 * Inventario de endpoints → control (el último test lo comprueba con --eros-mock):
 *   POST   /articles/generate         «Pedir un artículo a Eros» y «Escribir artículo» (el mismo diálogo)
 *   GET    /articles/runs             la línea del horario en Artículos y el artículo de una tendencia
 *   GET    /articles/runs/:id         el progreso del diálogo (cada 3 s)
 *   GET    /radar/trends              lista de Tendencias
 *   GET    /radar/trends/:id          registro de la tendencia
 *   POST   /radar/scan                «Buscar tendencias nuevas»
 *   PATCH  /radar/trends/:id/status   Más acciones → Descartar, Recuperar la tendencia
 * admin-run apaga el horario (ARTICLES_WEEKLY=off): la línea encendida se prueba con la respuesta de
 * /articles/runs reemplazada en el navegador.
 */
type Mode = 'offline' | 'demo' | 'mock'

/** Lo que el admin le pidió a /articles (de Eros) y /radar en toda la corrida, como «MÉTODO /ruta/:id». */
const reached = new Set<string>()

function record(page: Page): void {
  page.on('request', (req) => {
    const url = new URL(req.url())
    const match = url.pathname.match(/^\/api\/admin(\/(?:radar\/.*|articles\/(?:generate|runs.*)))$/)
    if (!match) return
    const path = match[1]!
      .replace(/^\/radar\/trends\/[^/]+/, '/radar/trends/:id')
      .replace(/^\/articles\/runs\/\d+$/, '/articles/runs/:id')
    reached.add(`${req.method()} ${path}`)
  })
}

async function open(page: Page, hash: string): Promise<void> {
  record(page)
  await signedIn(page, hash)
}

async function modeOf(page: Page): Promise<Mode> {
  if (withErosMock) return 'mock'
  const res = await page.request.get('/api/admin/radar/trends', { headers: auth })
  return res.ok() ? 'demo' : 'offline'
}

async function articleMode(modo: 'ok' | 'falla' | 'lento'): Promise<void> {
  await fetch(`${erosUrl}/__articulo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modo }) })
}

async function erosRequests(): Promise<{ method: string, path: string, body: Record<string, unknown> }[]> {
  const res = await fetch(`${erosUrl}/__requests`)
  return await res.json() as { method: string, path: string, body: Record<string, unknown> }[]
}

const RUNS = /\/api\/admin\/articles\/runs\?/
/**
 * Con el Eros simulado: suelta lo que quedó escribiendo de una prueba anterior y espera a que el
 * servidor no tenga ningún pedido en curso (si no, el próximo daría 409).
 */
async function idle(page: Page): Promise<void> {
  if (!withErosMock) return
  await articleMode('ok')
  await expect.poll(async () => {
    const res = await page.request.get('/api/admin/articles/runs?limit=5', { headers: auth })
    const { runs } = await res.json() as { runs: { status: string }[] }
    return runs.some(r => r.status === 'running')
  }, { timeout: 30000 }).toBe(false)
}

const toast = (page: Page, text: string | RegExp) => page.getByRole('region', { name: 'Avisos' }).getByText(text)
const runsLine = (page: Page) => page.locator('[data-runs-line]')
const askButton = (page: Page) => page.locator('#main').getByRole('button', { name: 'Pedir un artículo a Eros' })
const askDialog = (page: Page) => page.getByRole('dialog', { name: 'Pedir un artículo a Eros' })

test.describe('artículos de Eros', () => {
  test('la línea dice si el horario está encendido y cuándo es el próximo lunes', async ({ page }, info) => {
    await open(page, '#/articulos')
    await expect(runsLine(page)).toContainText('La publicación semanal está apagada')

    // Encendido (como en producción): la respuesta de la API, reemplazada en el navegador.
    await page.route(RUNS, route => route.fulfill({
      json: { runs: [], next: '2026-11-09T12:00:00.000Z', weekly: true },
    }))
    await page.reload()
    await expect(runsLine(page)).toContainText('Eros publica uno cada lunes a las 9:00 · próximo: lunes 9 de noviembre')
    await noSeriousAxe(page, 'Artículos con la línea del horario')
    await shot(page, info, 'articulos-horario-1440')
    await page.unroute(RUNS)
  })

  test('pedir desde Artículos: el diálogo, el progreso y el artículo publicado (o por qué no)', async ({ page }, info) => {
    const mode = await modeOf(page)
    await idle(page)
    await open(page, '#/articulos')
    if (mode === 'mock') await articleMode('lento')

    await askButton(page).click()
    const dialog = askDialog(page)
    await expect(dialog.getByLabel(/^Tema/)).toBeFocused()
    await dialog.getByLabel(/^Tema/).fill('Una sola forma de error')
    await dialog.getByLabel(/^Obra/).selectOption('la-rucula')
    await noSeriousAxe(page, 'diálogo de pedir')
    await dialog.getByRole('button', { name: 'Pedir el artículo' }).click()

    if (mode !== 'mock') {
      // Sin Eros (y con la muestra, que no tiene artículo de muestra) no se pide nada y se dice por qué.
      await expect(toast(page, /Eros no responde.*No se pidió el artículo/)).toBeVisible()
      await dialog.getByRole('button', { name: 'Cancelar' }).click()
      await expect(runsLine(page)).toContainText(/El último pedido, del .*, falló\. Eros no responde/)
      return
    }

    const writing = dialog.locator('[data-ask="writing"]')
    await expect(writing.getByRole('status')).toHaveText('Eros está escribiendo…')
    await expect(writing).toContainText(/Lleva \d+:\d\d/)
    await noSeriousAxe(page, 'diálogo escribiendo')
    await shot(page, info, 'pedir-escribiendo-1440')
    const sent = (await erosRequests()).filter(r => r.path === '/api/articles/generate').at(-1)?.body
    expect(sent?.['topic']).toBe('Una sola forma de error')
    expect(sent?.['project_slug']).toBe('la-rucula')
    expect(Array.isArray(sent?.['avoid_titles'])).toBe(true)

    // Eros termina: el diálogo lleva al editor del artículo, que ya está publicado.
    await articleMode('ok')
    await expect(page).toHaveURL(/#\/articulos\/\d+\?origen=eros$/, { timeout: 30000 })
    await expect(page.locator('#main h1')).toHaveText('Una sola forma de error para toda la API')
    await expect(toast(page, 'Eros publicó «Una sola forma de error para toda la API»: ya está en el sitio.')).toBeVisible()
    await expect(page.getByRole('region', { name: /Lo escribió Eros y ya está publicado/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Publicado/ })).toBeVisible()
    await shot(page, info, 'pedir-publicado-1440')

    await page.getByRole('link', { name: 'Artículos' }).first().click()
    await expect(runsLine(page).getByRole('link', { name: 'Una sola forma de error para toda la API' })).toBeVisible()
  })

  test('la paleta abre el mismo diálogo; si Eros falla, el diálogo dice por qué y deja probar de nuevo', async ({ page }) => {
    const mode = await modeOf(page)
    await idle(page)
    await open(page, '#/inicio')
    await page.keyboard.press(`${mod}+k`)
    await palette(page).getByRole('combobox').fill('pedir un articulo')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/articulos$/)
    const dialog = askDialog(page)
    await expect(dialog).toBeVisible()
    if (mode !== 'mock') {
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      return
    }
    await articleMode('falla')
    await dialog.getByRole('button', { name: 'Pedir el artículo' }).click()
    const why = dialog.getByRole('alert')
    await expect(why).toContainText('Eros no publicó el artículo', { timeout: 30000 })
    await expect(why).toContainText('El modelo de IA no está disponible')
    await noSeriousAxe(page, 'diálogo con el fallo')
    await dialog.getByRole('button', { name: 'Probar de nuevo' }).click()
    await expect(dialog.getByLabel(/^Tema/)).toBeVisible()
    await articleMode('ok')
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(runsLine(page)).toContainText(/falló\. La tarea falló en Eros: «El modelo de IA no está disponible\.»/)
  })
})

test.describe('tendencias', () => {
  test('lista con fuente, fecha real y enlace; vacía sin Eros; la muestra no se cambia', async ({ page }, info) => {
    const mode = await modeOf(page)
    await open(page, '#/busqueda/tendencias')
    await expect(page.getByRole('heading', { level: 1, name: 'Tendencias' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Búsqueda laboral' }).getByRole('link')).toHaveText(['Vacantes', 'Tendencias'])
    const scan = page.getByRole('button', { name: 'Buscar tendencias nuevas' })
    if (mode === 'offline') {
      await expect(page.getByRole('heading', { name: 'Sin Eros no hay tendencias para mostrar' })).toBeVisible()
      await expect(scan).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByRole('option')).toHaveCount(0)
    }
    else if (mode === 'demo') {
      await expect(page.getByRole('listbox', { name: 'Tendencias del radar' }).getByRole('option')).toHaveCount(3)
      await expect(scan).toHaveAttribute('aria-disabled', 'true')
      await page.getByRole('option').first().click()
      await expect(page.getByText(/^Es una muestra: se puede leer, pero no cambiar ni volverla artículo/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Escribir artículo' })).toHaveAttribute('aria-disabled', 'true')
    }
    else {
      const postgres = page.getByRole('option', { name: /PostgreSQL como base relacional/ })
      await expect(postgres).toContainText('Hacker News')
      await expect(postgres).toContainText('afinidad 87 %')
    }
    await noSeriousAxe(page, 'Tendencias')
    await shot(page, info, `tendencias-${mode}-1440`)
  })

  test('«Escribir artículo» desde una tendencia termina en el artículo publicado (con Eros)', async ({ page }, info) => {
    test.skip(!withErosMock, 'solo con el Eros simulado')
    await idle(page)
    await open(page, '#/busqueda/tendencias')
    await page.getByRole('button', { name: 'Buscar tendencias nuevas' }).click()
    await expect(toast(page, 'Eros revisó 12 notas y sumó 1 tendencia nueva.')).toBeVisible({ timeout: 20000 })
    await page.getByRole('option', { name: /PostgreSQL como base relacional/ }).click()
    await expect(page).toHaveURL(/#\/busqueda\/tendencias\/eros-mock-trend-postgres$/)
    await expect(page.getByText('Todavía no hay un artículo desde esta tendencia.')).toBeVisible()

    await page.getByRole('button', { name: 'Más acciones' }).click()
    await page.getByRole('menuitem', { name: 'Descartar' }).click()
    await expect(toast(page, 'La tendencia quedó en «Descartada».')).toBeVisible()

    await page.getByRole('button', { name: 'Escribir artículo' }).click()
    const dialog = page.getByRole('dialog', { name: 'Escribir artículo desde esta tendencia' })
    await expect(dialog).toContainText('PostgreSQL como base relacional y de vectores')
    await expect(dialog.getByLabel(/^Tema/)).toHaveCount(0)
    await expect(dialog.getByLabel(/^Obra/)).toBeFocused()
    await noSeriousAxe(page, 'diálogo desde la tendencia')
    await dialog.getByRole('button', { name: 'Escribir el artículo' }).click()
    await expect(page).toHaveURL(/#\/articulos\/\d+\?origen=eros$/, { timeout: 30000 })
    const sent = (await erosRequests()).filter(r => r.path === '/api/articles/generate').at(-1)?.body
    expect(sent?.['trend_id']).toBe('eros-mock-trend-postgres')
    expect(sent?.['topic']).toBeUndefined()
    await shot(page, info, 'tendencia-articulo-1440')

    await page.goto(`${ADMIN}#/busqueda/tendencias/eros-mock-trend-postgres`)
    await expect(page.getByText('Eros ya escribió un artículo desde esta tendencia y está publicado.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Abrir el artículo' })).toHaveAttribute('href', /#\/articulos\/\d+$/)
  })
})

test('cada endpoint de /articles de Eros y de /radar tiene un control alcanzable (con --eros-mock)', async ({ page }) => {
  const mode = await modeOf(page)
  if (mode !== 'mock') {
    const res = await page.request.get('/api/admin/radar/trends', { headers: auth })
    if (mode === 'offline') expect(await res.json()).toMatchObject({ code: 'offline', offline: true })
    else expect(res.headers()['x-eros-source']).toBe('demo')
    return
  }
  // Lo junta `record` en las pruebas de arriba (mismo worker, en orden): si una falló, esta también.
  const expected = [
    'POST /articles/generate',
    'GET /articles/runs',
    'GET /articles/runs/:id',
    'GET /radar/trends',
    'GET /radar/trends/:id',
    'POST /radar/scan',
    'PATCH /radar/trends/:id/status',
  ]
  expect(expected.filter(endpoint => !reached.has(endpoint))).toEqual([])
})
