import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { ADMIN } from './admin-support'

/**
 * Publicaciones y Tendencias (H2), pestañas de Búsqueda laboral: listas honestas según Eros (sin
 * datos inventados cuando no responde), el registro de una publicación con sus cuatro formatos
 * (LinkedIn se ve y se copia, el carrusel en su iframe con ticket), y un control por endpoint de
 * /content y /radar. Corre en los tres modos de Eros:
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-publicaciones.spec.ts
 *   node scripts/admin-run.mjs --demo -- …            (la muestra de EROS_DEMO: un post por artículo publicado)
 *   node scripts/admin-run.mjs --eros-mock -- …       (Eros simulado: tests/admin/eros-mock.ts)
 *
 * admin-run: sin Eros
 * admin-run: --demo
 * admin-run: --eros-mock
 *
 * Inventario de endpoints → control (el último test lo comprueba con --eros-mock):
 *   GET    /content/posts                 lista de Publicaciones
 *   GET    /content/posts/:id             registro de la publicación
 *   POST   /content/generate              «Generar una publicación» (formulario)
 *   PATCH  /content/posts/:id/status      Más acciones → Aprobar, Volver a borrador, Marcar como publicada, Descartar
 *   DELETE /content/posts/:id             Más acciones → Eliminar (con confirmación)
 *   POST   /content/carousel/:id/ticket   pestaña Carrusel, «Abrir en otra pestaña», «Imprimir o guardar como PDF»
 *   GET    /content/carousel/:id/html     el iframe de la pestaña Carrusel
 *   POST   /content/posts/:id/publish     «Publicar por n8n» (diálogo que nombra el canal)
 *   POST   /content/posts/:id/publish-to-blog  «Publicar en el blog» → #/articulos/:id en borrador
 *   GET    /radar/trends                  lista de Tendencias
 *   GET    /radar/trends/:id              registro de la tendencia
 *   POST   /radar/scan                    «Buscar tendencias nuevas»
 *   PATCH  /radar/trends/:id/status       Más acciones → Descartar, Recuperar la tendencia
 *   POST   /radar/trends/:id/generate     «Crear publicación desde esta tendencia»
 * Ninguno se retira. Las capturas (listas con datos y vacías a 1440 px, registro y formatos) quedan
 * en test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const auth = { Authorization: `Bearer ${token}` }
const erosUrl = process.env.HUNTER_API_URL ?? ''

type Mode = 'offline' | 'demo' | 'mock'

async function modeOf(request: APIRequestContext): Promise<Mode> {
  if (!/:9\/?$/.test(erosUrl)) return 'mock'
  const res = await request.get('/api/admin/content/posts', { headers: auth })
  return res.ok() ? 'demo' : 'offline'
}

/** Lo que el admin le pidió a /content y /radar en toda la corrida, como «MÉTODO /ruta/:id». */
const reached = new Set<string>()

function record(page: Page): void {
  page.on('request', (req) => {
    const url = new URL(req.url())
    const match = url.pathname.match(/^\/api\/admin(\/(?:content|radar)\/.*)$/)
    if (!match) return
    const path = match[1]!
      .replace(/^\/content\/(posts|carousel)\/[^/]+/, '/content/$1/:id')
      .replace(/^\/radar\/trends\/[^/]+/, '/radar/trends/:id')
    reached.add(`${req.method()} ${path}`)
  })
}

async function signedIn(page: Page, hash: string): Promise<void> {
  record(page)
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
}

/**
 * Los avisos se van solos a los pocos segundos: si uno empieza a fundirse mientras axe mide, el
 * contraste sale bajo. Se retienen como cuando el puntero está encima y se sueltan después.
 */
async function holdToasts(page: Page, hold: boolean): Promise<void> {
  await page.evaluate(h => document.querySelectorAll('section[aria-label="Avisos"] li').forEach(li => li.dispatchEvent(new PointerEvent(h ? 'pointerenter' : 'pointerleave'))), hold)
}

async function noSeriousAxe(page: Page): Promise<void> {
  await holdToasts(page, true)
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  await holdToasts(page, false)
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const main = document.getElementById('main')
    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
  expect(overflow).toBeLessThanOrEqual(0)
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page)
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
}

const toast = (page: Page, text: string | RegExp) => page.getByRole('region', { name: 'Avisos' }).getByText(text)
const rows = (page: Page, name: string) => page.getByRole('listbox', { name }).getByRole('option')

async function erosRequests(): Promise<{ method: string, path: string, body: Record<string, unknown> }[]> {
  const res = await fetch(`${erosUrl}/__requests`)
  return await res.json() as { method: string, path: string, body: Record<string, unknown> }[]
}

test.describe('publicaciones', () => {
  test('lista honesta según Eros, filtros, axe y capturas a 1440 y 390 px', async ({ page, request }, info) => {
    const mode = await modeOf(request)
    await signedIn(page, '#/busqueda/publicaciones')
    await expect(page.getByRole('heading', { level: 1, name: 'Publicaciones' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Búsqueda laboral' }).getByRole('link', { name: 'Publicaciones' })).toHaveAttribute('aria-current', 'page')
    const generate = page.getByRole('button', { name: /^Generar una publicación/ })
    if (mode === 'offline') {
      await expect(page.getByText('Eros no responde', { exact: true })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Sin Eros no hay publicaciones para mostrar' })).toBeVisible()
      await expect(generate).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByRole('option')).toHaveCount(0)
      await expect(page.locator('#main h1 + span')).toHaveCount(0)
    }
    else {
      await expect(rows(page, 'Publicaciones de Eros').first()).toBeVisible()
      if (mode === 'demo') {
        await expect(page.getByText(/Muestra de prueba: cada publicación/)).toBeVisible()
        await expect(generate).toHaveAttribute('aria-disabled', 'true')
      }
      else {
        await expect(rows(page, 'Publicaciones de Eros')).toHaveCount(2)
        await expect(page.getByRole('option', { name: /Diseño de una API con señales claras/ })).toContainText('La Rúcula')
        await page.getByRole('link', { name: /^Aprobadas/ }).click()
        await expect(page).toHaveURL(/filtro=aprobadas/)
        await expect(rows(page, 'Publicaciones de Eros')).toHaveCount(1)
        await page.getByRole('link', { name: /^Todas/ }).click()
      }
    }
    await noSeriousAxe(page)
    await shot(page, info, mode === 'offline' ? 'publicaciones-vacia-1440' : 'publicaciones-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    await noHorizontalScroll(page)
    await shot(page, info, 'publicaciones-390')
  })

  test('el cuerpo de LinkedIn del primer post se ve y se copia; los cuatro formatos', async ({ page, request, context }, info) => {
    const mode = await modeOf(request)
    if (mode === 'offline') {
      await signedIn(page, '#/busqueda/publicaciones/una-publicacion')
      await expect(page.getByRole('heading', { level: 1, name: 'No encontramos esta publicación' })).toBeVisible()
      await expect(page.getByText(/Eros no responde, así que no se puede leer/)).toBeVisible()
      await noSeriousAxe(page)
      return
    }
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const list = await (await request.get('/api/admin/content/posts', { headers: auth })).json() as { id: string, title: string, linkedin_text: string }[]
    const first = list[0]!
    await signedIn(page, '#/busqueda/publicaciones')
    const option = rows(page, 'Publicaciones de Eros').first()
    await option.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`#/busqueda/publicaciones/${first.id}$`))
    await expect(page.locator('#main h1')).toHaveText(first.title)
    await expect(page.getByRole('tab', { name: 'LinkedIn' })).toHaveAttribute('aria-selected', 'true')
    const panel = page.getByRole('tabpanel', { name: 'LinkedIn' })
    await expect(panel).toContainText(first.linkedin_text.split('\n')[0]!)
    await panel.getByRole('button', { name: 'Copiar el texto de LinkedIn' }).click()
    // El portapapeles de Windows guarda los saltos como CRLF: se compara el texto, no el sistema.
    await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(first.linkedin_text)
    await expect(panel.getByRole('button', { name: 'Copiado' }).first()).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'publicacion-linkedin-1440')

    await page.getByRole('tab', { name: /^Hilo/ }).click()
    await expect(page).toHaveURL(/formato=hilo/)
    await expect(page.getByRole('tabpanel', { name: /^Hilo/ }).getByText(/^Parte 1 de \d+$/)).toBeVisible()
    await page.getByRole('tab', { name: 'Dev.to' }).click()
    const devto = page.getByRole('tabpanel', { name: 'Dev.to' })
    await expect(devto.getByRole('heading', { name: 'Artículo en Markdown' })).toBeVisible()
    // Eros manda Dev.to anidado (devto.markdown_body): el artículo se ve, no el aviso de vacío.
    if (first.id === 'eros-mock-post-arquitectura') {
      await expect(devto).toContainText('Una sola forma de error')
      await expect(page.locator('#main header').first()).toContainText('Arquitectura')
    }
    await page.getByRole('tab', { name: /^Carrusel/ }).click()
    const frame = page.locator('iframe[data-carousel]')
    await expect(frame).toHaveAttribute('src', /\/api\/admin\/content\/carousel\/[^/]+\/html\?ticket=/)
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-modals')
    await expect(page.frameLocator('iframe[data-carousel]').getByRole('navigation', { name: 'Láminas del carrusel' })).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'publicacion-carrusel-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    await noHorizontalScroll(page)
    await shot(page, info, 'publicacion-carrusel-390')
    await page.setViewportSize({ width: 1440, height: 900 })

    // Recargar deja la misma publicación en el mismo formato; «← Publicaciones» vuelve a la lista.
    await page.reload()
    await expect(page.getByRole('tab', { name: /^Carrusel/ })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('link', { name: 'Publicaciones', exact: true }).first().click()
    await expect(page).toHaveURL(/#\/busqueda\/publicaciones$/)
  })

  test('cambiar, despachar y eliminar: con Eros llegan a Eros; sin él o con la muestra, se dice por qué no', async ({ page, request }) => {
    const mode = await modeOf(request)
    if (mode === 'offline') {
      await signedIn(page, '#/busqueda/publicaciones?generar=1')
      await expect(toast(page, 'Sin Eros no se generan ni se despachan publicaciones.')).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      return
    }
    await signedIn(page, '#/busqueda/publicaciones')
    await rows(page, 'Publicaciones de Eros').first().click()
    await expect(page.getByRole('tab', { name: 'LinkedIn' })).toBeVisible()
    if (mode === 'demo') {
      await expect(page.getByText(/^Es una muestra: se puede leer/)).toBeVisible()
      for (const name of ['Publicar por n8n', 'Publicar en el blog']) await expect(page.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
      await page.getByRole('button', { name: 'Más acciones' }).click()
      await expect(page.getByRole('menuitem', { name: 'Eliminar' })).toBeDisabled()
      return
    }
    // Estado.
    await page.getByRole('button', { name: 'Más acciones' }).click()
    await page.getByRole('menuitem', { name: 'Aprobar' }).click()
    await expect(toast(page, 'Publicación marcada como aprobada.')).toBeVisible()
    await expect(page.locator('#main header').getByText('Aprobada', { exact: true })).toBeVisible()

    // Despachar por n8n: el diálogo nombra el canal elegido, no ofrece Dev.to (se copia a mano) y el
    // aviso dice lo que contestó Eros: despachada, publicada cuando n8n confirme.
    await page.getByRole('button', { name: 'Publicar por n8n' }).click()
    const dialog = page.getByRole('dialog', { name: 'Publicar por n8n' })
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await expect(dialog.getByText(/Dev\.to no se publica solo/)).toBeVisible()
    await expect(dialog.getByRole('radio')).toHaveCount(3)
    await dialog.getByText('X (hilo)', { exact: true }).click()
    await noSeriousAxe(page)
    await dialog.getByRole('button', { name: 'Publicar en X (hilo)' }).click()
    await expect(toast(page, 'Eros se la pasó a n8n. Queda publicada cuando n8n confirme cada red.')).toBeVisible()
    const sent = (await erosRequests()).find(r => r.method === 'POST' && r.path.endsWith('/publish'))
    expect(sent?.body).toEqual({ channel: 'twitter' })

    // Eliminar, con confirmación: vuelve a la lista.
    await page.getByRole('button', { name: 'Más acciones' }).click()
    await page.getByRole('menuitem', { name: 'Eliminar' }).click()
    const confirm = page.getByRole('dialog', { name: 'Eliminar la publicación' })
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await confirm.getByRole('button', { name: 'Eliminar la publicación' }).click()
    await expect(page).toHaveURL(/#\/busqueda\/publicaciones$/)
    await expect(toast(page, 'Publicación eliminada.')).toBeVisible()
    expect((await erosRequests()).some(r => r.method === 'DELETE' && r.path.startsWith('/api/content/posts/'))).toBe(true)
  })

  test('«Publicar en el blog» abre el editor de un artículo en borrador; generar escribe en borrador', async ({ page, request }) => {
    const mode = await modeOf(request)
    await signedIn(page, '#/busqueda/publicaciones')
    if (mode !== 'mock') {
      await expect(page.getByRole('button', { name: /^Generar una publicación/ })).toHaveAttribute('aria-disabled', 'true')
      return
    }
    await page.getByRole('option', { name: /Diseño de una API con señales claras/ }).click()
    await page.getByRole('button', { name: 'Publicar en el blog' }).click()
    await expect(page).toHaveURL(/#\/articulos\/\d+\?origen=eros$/)
    await expect(toast(page, /Revisá tecnologías, obra e inglés antes de publicarlo/)).toBeVisible()
    const id = page.url().match(/articulos\/(\d+)/)![1]
    const article = await (await request.get(`/api/admin/articles/${id}`, { headers: auth })).json() as { status: string, publishedAt: string | null, title: string }
    expect(article).toMatchObject({ status: 'DRAFT', publishedAt: null, title: 'Diseño de una API con señales claras' })
    // El editor de U6 abre el borrador con el aviso de revisión.
    await expect(page.locator('#main h1')).toHaveText('Diseño de una API con señales claras')
    await expect(page.getByText('Llegó desde Publicaciones: revisalo antes de publicar')).toBeVisible()

    // Generar: el formulario pide el tema y Eros escribe la publicación en borrador.
    await page.goto(`${ADMIN}#/busqueda/publicaciones`)
    await expect(page.getByRole('heading', { level: 1, name: 'Publicaciones' })).toBeVisible()
    await expect(rows(page, 'Publicaciones de Eros').first()).toBeVisible()
    await page.keyboard.press('n')
    const dialog = page.getByRole('dialog', { name: 'Generar una publicación' })
    await expect(dialog.getByLabel('Tema')).toBeFocused()
    await dialog.getByRole('button', { name: 'Generar', exact: true }).click()
    await expect(dialog.getByText('Escribí el tema o el ángulo propio.')).toBeVisible()
    await dialog.getByLabel('Tema').fill('Una sola base para relaciones y vectores')
    await dialog.getByLabel('Enfoque').selectOption({ label: 'Rendimiento' })
    await dialog.getByLabel('Obra de la base').selectOption('la-rucula')
    await dialog.getByLabel('Puntos clave').fill('pgvector\n- índices HNSW')
    await noSeriousAxe(page)
    await dialog.getByRole('button', { name: 'Generar', exact: true }).click()
    await expect(toast(page, 'Eros escribió la publicación. Queda en borrador.')).toBeVisible()
    await expect(page).toHaveURL(/#\/busqueda\/publicaciones\/eros-mock-post-desde-tendencia$/)
    const body = (await erosRequests()).find(r => r.method === 'POST' && r.path === '/api/content/generate')?.body
    // A Eros le llegan sus enfoques y los puntos dentro de custom_instructions (key_points no existe en Eros).
    expect(body).toEqual({ topic: 'Una sola base para relaciones y vectores', pillar: 'performance_optimization', project_slug: 'la-rucula', custom_instructions: 'Puntos clave:\n- pgvector\n- índices HNSW' })
  })
})

test.describe('tendencias', () => {
  test('lista con fuente, fecha real y enlace; vacía sin Eros; axe y capturas', async ({ page, request }, info) => {
    const mode = await modeOf(request)
    await signedIn(page, '#/busqueda/tendencias')
    await expect(page.getByRole('heading', { level: 1, name: 'Tendencias' })).toBeVisible()
    const scan = page.getByRole('button', { name: 'Buscar tendencias nuevas' })
    if (mode === 'offline') {
      await expect(page.getByRole('heading', { name: 'Sin Eros no hay tendencias para mostrar' })).toBeVisible()
      await expect(scan).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByRole('option')).toHaveCount(0)
    }
    else if (mode === 'demo') {
      await expect(rows(page, 'Tendencias del radar')).toHaveCount(3)
      await expect(page.getByText(/Muestra de prueba: estas tendencias/)).toBeVisible()
      await expect(scan).toHaveAttribute('aria-disabled', 'true')
    }
    else {
      const postgres = page.getByRole('option', { name: /PostgreSQL como base relacional/ })
      await expect(postgres).toContainText('Hacker News')
      await expect(postgres).toContainText('example.com')
      await expect(postgres).toContainText(/30 oct/)
      await expect(postgres).toContainText('afinidad 87 %')
      // La de Nuxt trae un enlace javascript: y ninguna fecha: no se muestra ni se inventa.
      const nuxt = page.getByRole('option', { name: /Renderizado híbrido con Nuxt/ })
      await expect(nuxt).not.toContainText(/\d+ (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/)
    }
    await noSeriousAxe(page)
    await shot(page, info, mode === 'offline' ? 'tendencias-vacia-1440' : 'tendencias-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    await noHorizontalScroll(page)
  })

  test('registro: nota original, buscar, estado y crear publicación (solo con Eros)', async ({ page, request }, info) => {
    const mode = await modeOf(request)
    if (mode === 'offline') {
      await signedIn(page, '#/busqueda/tendencias/una-tendencia')
      await expect(page.getByRole('heading', { level: 1, name: 'No encontramos esta tendencia' })).toBeVisible()
      await noSeriousAxe(page)
      return
    }
    await signedIn(page, '#/busqueda/tendencias')
    if (mode === 'demo') {
      await rows(page, 'Tendencias del radar').first().click()
      await expect(page.getByText(/^Es una muestra: se puede leer/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Crear publicación desde esta tendencia' })).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByRole('link', { name: /Abrir la nota/ })).toHaveCount(0)
      await noSeriousAxe(page)
      await shot(page, info, 'tendencia-muestra-1440')
      return
    }
    await page.getByRole('button', { name: 'Buscar tendencias nuevas' }).click()
    await expect(toast(page, 'Eros revisó 12 notas y sumó 1 tendencia nueva.')).toBeVisible({ timeout: 20000 })

    await page.getByRole('option', { name: /PostgreSQL como base relacional/ }).click()
    await expect(page).toHaveURL(/#\/busqueda\/tendencias\/eros-mock-trend-postgres$/)
    await expect(page.locator('#main h1')).toHaveText('PostgreSQL como base relacional y de vectores')
    const original = page.getByRole('link', { name: /Abrir la nota/ })
    await expect(original).toHaveAttribute('href', 'https://example.com/notas/postgres-vectores')
    await expect(original).toHaveAttribute('target', '_blank')
    await expect(page.getByText('Una sola base para relaciones y vectores.')).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'tendencia-1440')

    await page.getByRole('button', { name: 'Más acciones' }).click()
    await page.getByRole('menuitem', { name: 'Descartar' }).click()
    await expect(toast(page, 'La tendencia quedó en «Descartada».')).toBeVisible()

    await page.getByRole('button', { name: 'Crear publicación desde esta tendencia' }).click()
    const dialog = page.getByRole('dialog', { name: 'Crear publicación desde esta tendencia' })
    await expect(dialog.getByLabel('Enfoque')).toBeFocused()
    await dialog.getByLabel('Ángulo propio').fill('Lo que ahorra no tener dos bases')
    await dialog.getByRole('button', { name: 'Crear la publicación' }).click()
    await expect(toast(page, 'Eros escribió la publicación desde la tendencia.')).toBeVisible()
    await expect(page).toHaveURL(/#\/busqueda\/publicaciones\/eros-mock-post-desde-tendencia$/)
    const body = (await erosRequests()).find(r => r.method === 'POST' && r.path.endsWith('/generate') && r.path.startsWith('/api/radar/'))?.body
    // Desde una tendencia el enfoque va siempre: sin elegir, el de arquitectura (sin él Eros da 500).
    expect(body).toEqual({ pillar: 'architecture', custom_angle: 'Lo que ahorra no tener dos bases' })
  })
})

test('cada endpoint de /content y /radar tiene un control alcanzable (con --eros-mock)', async ({ request }) => {
  const mode = await modeOf(request)
  if (mode !== 'mock') {
    // Sin Eros real, las lecturas dicen la verdad: 503 offline, o la muestra marcada como tal.
    for (const path of ['/api/admin/content/posts', '/api/admin/radar/trends']) {
      const res = await request.get(path, { headers: auth })
      if (mode === 'offline') expect(await res.json()).toMatchObject({ code: 'offline', offline: true })
      else expect(res.headers()['x-eros-source']).toBe('demo')
    }
    return
  }
  // Lo junta `record` en las pruebas de arriba (mismo worker, en orden): si una falló, esta también.
  const expected = [
    'GET /content/posts',
    'GET /content/posts/:id',
    'POST /content/generate',
    'PATCH /content/posts/:id/status',
    'DELETE /content/posts/:id',
    'POST /content/carousel/:id/ticket',
    'GET /content/carousel/:id/html',
    'POST /content/posts/:id/publish',
    'POST /content/posts/:id/publish-to-blog',
    'GET /radar/trends',
    'GET /radar/trends/:id',
    'POST /radar/scan',
    'PATCH /radar/trends/:id/status',
    'POST /radar/trends/:id/generate',
  ]
  expect(expected.filter(endpoint => !reached.has(endpoint))).toEqual([])
})
