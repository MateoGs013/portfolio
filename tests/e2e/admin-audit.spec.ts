import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { ADMIN, auth, erosUrl, jobStage, PASTED_EN, PASTED_ES, pasteJob, signedIn, visit, withErosMock, type PastedJob } from './admin-support'

/**
 * Invariante 6 sobre el admin nuevo: una vacante pegada se analiza, el CV Harvard ATS se adapta, se
 * previsualiza, se imprime en una sola hoja A4 dentro de la cota dual (248–265 mm) en español y en
 * inglés, y se copia en texto plano igual al /txt del servidor. Además: el ticket de otra vacante da
 * 401, un 409 se recupera solo y el portapapeles denegado deja el texto a mano. Corre dos veces:
 *
 * admin-run: sin Eros
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-audit.spec.ts
 *   node scripts/admin-run.mjs --eros-mock -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-audit.spec.ts
 *
 * Sin Eros ni muestra la cola está vacía y todo sale de la base. Con el Eros simulado, la vacante pegada
 * (manual-…) tampoco le llega: se comprueba en su registro de pedidos.
 */
const BOUNDS = { min: 248, max: 265 }
/** Una página de PDF (no el nodo /Pages que las agrupa). */
const PAGE = /\/Type\s*\/Page(?!s)/g
/** Una hoja A4 en puntos de PDF: 210 × 297 mm. */
const A4_PT = { width: 210 / 25.4 * 72, height: 297 / 25.4 * 72 }

/** El tamaño de cada página del PDF, de sus MediaBox. */
function pageSizes(pdf: string): { width: number, height: number }[] {
  return [...pdf.matchAll(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)]
    .map(([, x0, y0, x1, y1]) => ({ width: Number(x1) - Number(x0), height: Number(y1) - Number(y0) }))
}

interface Cv { data: { header: { name: string } } }

const cvName = async (request: APIRequestContext, lang: 'es' | 'en') => (await (await request.get(`/api/cv?lang=${lang}`)).json() as Cv).data.header.name
const sheet = (page: Page) => page.frameLocator('[data-cv-sheet]')
const measure = (page: Page) => page.locator('[data-cv-measure]')

async function adapt(page: Page): Promise<void> {
  await jobStage(page, 'CV').click()
  await page.getByRole('button', { name: 'Adaptar CV' }).click()
  await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
}

/** La medida que la hoja le manda al admin: una página y el alto dentro de la cota dual. */
async function withinBounds(page: Page, what: string): Promise<number> {
  await expect(measure(page), what).toHaveAttribute('data-pages', '1')
  const height = Number(await measure(page).getAttribute('data-height-mm'))
  expect(height, `${what}: alto en mm`).toBeGreaterThanOrEqual(BOUNDS.min)
  expect(height, `${what}: alto en mm`).toBeLessThanOrEqual(BOUNDS.max)
  return height
}

/** Imprime la hoja del iframe como la imprime el navegador: una sola página A4. */
async function printsOnePage(page: Page, what: string): Promise<void> {
  const src = await page.locator('[data-cv-sheet]').getAttribute('src')
  expect(src, what).toBeTruthy()
  const print = await page.context().newPage()
  await print.goto(src!.replace('measure=1', 'vista=1'), { waitUntil: 'networkidle' })
  await print.emulateMedia({ media: 'print' })
  const pdf = (await print.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1')
  await print.close()
  expect(pdf.match(PAGE)?.length, `${what}: páginas`).toBe(1)
  const sizes = pageSizes(pdf)
  expect(sizes.length, `${what}: MediaBox`).toBeGreaterThan(0)
  for (const size of sizes) {
    // Chromium redondea la hoja a píxeles enteros: hasta 2 pt (0,7 mm) de diferencia.
    expect(Math.abs(size.width - A4_PT.width), `${what}: ancho ${size.width} pt`).toBeLessThan(2)
    expect(Math.abs(size.height - A4_PT.height), `${what}: alto ${size.height} pt`).toBeLessThan(2)
  }
}

async function erosRequestsFor(request: APIRequestContext, id: string): Promise<string[]> {
  const received = await (await request.get(`${erosUrl}/__requests`)).json() as { method: string, path: string, body: unknown }[]
  return received.filter(r => r.path.includes(id) || JSON.stringify(r.body).includes(id)).map(r => `${r.method} ${r.path}`)
}

const CASES: { lang: 'es' | 'en', job: PastedJob }[] = [{ lang: 'es', job: PASTED_ES }, { lang: 'en', job: PASTED_EN }]

test.describe('invariante 6 con una vacante pegada', () => {
  for (const { lang, job } of CASES) {
    test(`${lang}: analiza, adapta, previsualiza, imprime una A4 de ${BOUNDS.min} a ${BOUNDS.max} mm y copia el /txt`, async ({ page, context, request }) => {
      if (withErosMock) await request.delete(`${erosUrl}/__requests`)
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await signedIn(page, '#/busqueda/vacantes')
      const id = await pasteJob(page, job)

      // Analizar: el veredicto en palabras, armado desde la base.
      await page.getByRole('button', { name: 'Analizar la vacante' }).click()
      await expect(page.getByText(/Muy compatible|Compatible|Dudosa|Descartar/).first()).toBeVisible()
      await expect(page.getByText('Armado desde la base, sin Eros').first()).toBeVisible()

      // Adaptar y previsualizar: la hoja en el idioma del aviso, con el nombre de /api/cv.
      await adapt(page)
      await expect(page.getByRole('heading', { name: 'CV adaptado', level: 2 })).toBeFocused()
      await expect(sheet(page).locator('html')).toHaveAttribute('lang', lang)
      await expect(sheet(page).locator('h1')).toContainText(await cvName(request, lang))
      const height = await withinBounds(page, `CV ${lang}`)
      console.log(`CV ${lang} de ${id}: ${height.toFixed(1)} mm en una página`)

      // Copiar texto plano: lo copiado es el /txt del servidor, sin marcado.
      await page.getByRole('button', { name: 'Copiar texto plano' }).click()
      await expect(page.getByRole('button', { name: 'Texto copiado' })).toBeVisible()
      const copied = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')
      const txt = await (await request.get(`/api/admin/hunter/cv/${encodeURIComponent(id)}/txt`, { headers: auth })).text()
      expect(copied).toBe(txt)
      expect(copied).toContain(await cvName(request, lang))
      expect(copied).not.toMatch(/<[a-z/][^>]*>|\*\*|^#+\s/m)

      // Imprimir: la ventana se abre en el gesto con auto_print, y la hoja impresa es una sola A4.
      const popup = page.waitForEvent('popup')
      await page.getByRole('button', { name: 'Imprimir o guardar como PDF' }).click()
      const win = await popup
      await win.waitForURL(/\/hunter\/cv\/.+\/html\?.*auto_print=true/)
      await win.close()
      await printsOnePage(page, `CV ${lang}`)

      if (withErosMock) expect(await erosRequestsFor(request, id), 'la vacante pegada no le llega a Eros').toEqual([])
    })
  }

  test('el ticket de una vacante no abre la hoja de otra: 401', async ({ page, request }) => {
    await signedIn(page, '#/busqueda/vacantes')
    const id = await pasteJob(page, PASTED_ES)
    await adapt(page)
    const src = (await page.locator('[data-cv-sheet]').getAttribute('src'))!
    expect((await request.get(src)).status(), 'con su propio ticket abre').toBe(200)
    const other = src.replace(`/cv/${encodeURIComponent(id)}/`, '/cv/manual-otra-vacante/')
    expect((await request.get(other)).status()).toBe(401)
    expect((await request.get(src.replace(/ticket=[^&]+/, 'ticket=no-es-un-ticket'))).status()).toBe(401)
    expect((await request.get(src.replace(/[?&]ticket=[^&]+/, ''))).status(), 'sin ticket ni sesión').toBe(401)
  })

  test('un 409 en la hoja y en el texto se recupera solo, con un POST /cv más cada vez', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await signedIn(page, '#/busqueda/vacantes')
    const id = await pasteJob(page, PASTED_ES)
    const path = `/api/admin/hunter/cv/${encodeURIComponent(id)}`
    let posts = 0
    page.on('request', (req) => {
      if (req.method() === 'POST' && new URL(req.url()).pathname === path) posts++
    })
    // La API se reinició: la caché ya no tiene el CV y el primer pedido de cada salida responde 409.
    const refused = new Set<string>()
    await page.route(/\/api\/admin\/hunter\/cv\/[^/]+\/(html|txt)/, async (route) => {
      const url = new URL(route.request().url())
      const kind = url.pathname.endsWith('/txt') ? 'txt' : 'html'
      if (!refused.has(kind) && !url.searchParams.has('ticket')) {
        refused.add(kind)
        await route.fulfill({ status: 409, json: { error: 'El CV ya no está en la caché.', code: 'cv_expired', errors: [] } })
        return
      }
      await route.continue()
    })
    await adapt(page)
    await expect(sheet(page).locator('h1')).toBeVisible()
    expect(refused.has('html')).toBe(true)
    expect(posts, 'adaptar y volver a armar tras el 409 de la hoja').toBe(2)

    await page.getByRole('button', { name: 'Copiar texto plano' }).click()
    await expect(page.getByRole('button', { name: 'Texto copiado' })).toBeVisible()
    expect(refused.has('txt')).toBe(true)
    expect(posts, 'y una vez más tras el 409 del texto').toBe(3)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Mateo')
  })

  test('con el portapapeles denegado avisa y deja el texto seleccionado para copiarlo a mano', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denegado', 'NotAllowedError')) } })
      document.execCommand = () => false
    })
    await signedIn(page, '#/busqueda/vacantes')
    await pasteJob(page, PASTED_EN)
    await adapt(page)
    await page.getByRole('button', { name: 'Copiar texto plano' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo copiar al portapapeles' })).toBeVisible()
    const area = page.locator('textarea[data-cv-text]')
    await expect(area).toBeFocused()
    const [start, end, length] = await area.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd, el.value.length])
    expect(start).toBe(0)
    expect(end).toBe(length)
    expect(length).toBeGreaterThan(200)
  })
})

test.describe('el CV base de Trayectoria', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: una página A4 de ${BOUNDS.min} a ${BOUNDS.max} mm`, async ({ page, request }) => {
      await signedIn(page, '#/inicio')
      await visit(page, `#/trayectoria/cv${lang === 'en' ? '?idioma=en' : ''}`)
      await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
      await expect(sheet(page).locator('html')).toHaveAttribute('lang', lang)
      await expect(sheet(page).locator('h1')).toContainText(await cvName(request, lang))
      const height = await withinBounds(page, `CV base ${lang}`)
      console.log(`CV base ${lang}: ${height.toFixed(1)} mm en una página`)
      await printsOnePage(page, `CV base ${lang}`)
    })
  }
})

test('sin sesión la API del admin responde 401 y el admin pide la clave', async ({ page, request }) => {
  expect((await request.get('/api/admin/projects')).status()).toBe(401)
  expect((await request.get('/api/admin/hunter/jobs', { headers: { Authorization: 'Bearer otra-cosa' } })).status()).toBe(401)
  expect((await request.get('/api/admin/meta', { headers: { Authorization: 'Bearer dev-token' } })).status()).toBe(401)
  await page.goto(`${ADMIN}#/busqueda/vacantes`)
  await expect(page).toHaveURL(/#\/ingresar\?volver=/)
  await expect(page.getByRole('main').getByLabel('Clave de acceso')).toBeFocused()
})
