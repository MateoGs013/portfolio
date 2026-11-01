import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createServer, type AddressInfo } from 'node:net'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'

/**
 * Artículos (U6) sobre una copia de la base: la lista con sus filtros, un artículo que nace borrador y
 * sin fecha, la dirección que sale del título («ñandú» → nandu) y después queda fija, el inglés con su
 * vista previa, la publicación con «Mostrar en el sitio» (la API pública lo muestra, en ?lang=en con el
 * inglés), «Cambiar dirección», Archivar, el aviso de un borrador que llega de Publicaciones y la vista
 * previa comparada bloque por bloque con el HTML de /articles/:slug del sitio.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-articulos.spec.ts
 *
 * El sitio es el de ADMIN_WEB_URL si la corrida lo trae (--web); si no, la spec levanta `nuxt dev`
 * en un puerto libre contra la API de la corrida y lo apaga al terminar. El token nunca se imprime.
 * Las capturas a 1440 px quedan en test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const api = process.env.ADMIN_API_URL!
const ADMIN = '/admin-next/'
const auth = { Authorization: `Bearer ${token}` }
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const shell = process.platform === 'win32'

const TITLE = 'Arquitectura rápida en ñandú'
const SLUG = 'arquitectura-rapida-en-nandu'
const MOVED = 'arquitectura-en-nandu'
const BODY = [
  '## Por qué un ñandú',
  '',
  'Corre rápido y con **poco** gasto: igual que una API con `pg` y una sola consulta.',
  '',
  '```ts',
  'const filas = await db.article.findMany({ where: { status: \'PUBLISHED\' } })',
  'console.log(filas.length)',
  '```',
  '',
  '| Capa | Tiempo |',
  '|------|--------|',
  '| Base | 4 ms |',
  '',
  '- Primero la consulta',
  '- Después la vista',
].join('\n')
const BODY_EN = BODY.replace('## Por qué un ñandú', '## Why a rhea').replace('Corre rápido', 'It runs fast')

let nuxt: ChildProcess | null = null
let site = process.env.ADMIN_WEB_URL ?? ''

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      server.close(() => resolve(port))
    })
  })
}

/** El sitio para comparar la vista previa: el de la corrida o un `nuxt dev` propio contra esta API. */
async function startSite(): Promise<void> {
  if (site) return
  const port = await freePort()
  site = `http://localhost:${port}`
  nuxt = spawn('pnpm', ['exec', 'nuxt', 'dev', '--port', String(port)], {
    shell,
    stdio: 'ignore',
    env: { ...process.env, PORT: String(port), NUXT_PUBLIC_API_BASE: `${api}/api`, NUXT_PUBLIC_SITE_URL: site },
  })
  for (let i = 0; i < 480; i++) {
    const html = await fetch(`${site}/articles`).then(r => (r.ok ? r.text() : ''), () => '')
    if (html.includes('<h1')) return
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('El sitio no arrancó en 4 minutos.')
}

test.afterAll(() => {
  if (!nuxt?.pid) return
  if (shell) spawnSync('taskkill', ['/pid', String(nuxt.pid), '/T', '/F'], { stdio: 'ignore' })
  else nuxt.kill('SIGTERM')
})

interface Article { id: number, slug: string, title: string, status: string, publishedAt: string | null, readingTimeMin: number, translations: { title: string | null }[] }

async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(`${api}/api/admin${path}`, { headers: auth })
  expect(res.ok, `GET ${path}`).toBe(true)
  return await res.json() as T
}

async function publicGet(path: string): Promise<{ status: number, body: { data: unknown } | null }> {
  const res = await fetch(`${api}/api${path}`)
  return { status: res.status, body: res.ok ? await res.json() as { data: unknown } : null }
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
}

async function noSeriousAxe(page: Page): Promise<void> {
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page)
  await page.screenshot({ path: info.outputPath(`${name}-1440.png`), fullPage: true })
}

async function signedIn(page: Page, hash: string): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

const h1 = (page: Page) => page.locator('#main h1')
const saved = (page: Page) => page.locator('#main footer').getByText(/^Guardado/)
const tab = (page: Page, name: string) => page.getByRole('tab', { name: new RegExp(`^${name}`) })

async function save(page: Page): Promise<void> {
  await page.keyboard.press(`${mod}+s`)
  await expect(saved(page)).toBeVisible()
}

/** Cada bloque del cuerpo como etiqueta y texto: la forma que comparten el sitio y la vista previa. */
function blocksOf(page: Page, selector: string) {
  return page.locator(selector).evaluate(root => [...root.children].map((el) => {
    const pre = el.querySelector('pre')
    const text = pre
      ? `${el.querySelector('figcaption')?.textContent?.trim() ?? ''}\n${pre.textContent ?? ''}`
      : [...(el.matches('ul, ol') ? el.children : [el])].map(n => (n.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' | ')
    return { tag: el.tagName.toLowerCase(), text }
  }))
}

async function siteBlocks(browser: Browser, path: string) {
  // Sin JS: el HTML que entrega el SSR, sin las líneas partidas de RevealLines.
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${site}${path}`)
  const title = (await page.locator('h1').first().textContent())?.trim()
  const blocks = await blocksOf(page, '[data-f="content"] > div > div')
  await context.close()
  return { title, blocks }
}

test.describe.configure({ mode: 'serial' })

let created = 0

test('lista: filas grandes con su estado, filtros con conteo y la búsqueda sin acentos', async ({ page }, info) => {
  const all = await adminGet<Article[]>('/articles')
  await signedIn(page, '#/articulos')
  await expect(h1(page)).toHaveText('Artículos')
  await expect(page.getByRole('listbox', { name: 'Artículos' }).getByRole('option')).toHaveCount(all.length)
  for (const name of ['Todos', 'Publicados', 'Borradores', 'Falta inglés']) {
    await expect(page.getByRole('group', { name: 'Filtros' }).getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
  }
  await expect(page.getByRole('option').first()).toContainText(/Publicado|Borrador|Programado|Archivado/)
  await noSeriousAxe(page)
  await shot(page, info, 'lista')
})

test('nuevo: nace borrador y sin fecha, la dirección sale del título y no llega a la API pública', async ({ page }, info) => {
  await signedIn(page, '#/articulos/nuevo')
  await expect(h1(page)).toHaveText('Nuevo artículo')
  await page.getByLabel('Título · Español').fill(TITLE)
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue(SLUG)
  await expect(page.locator('[data-slug-preview]')).toHaveText(`/articles/${SLUG}`)
  await page.getByLabel('Bajada · Español').fill('Una API rápida con una sola consulta y la vista en el mismo viaje.')
  // Sin publicación hasta crearlo: el servidor lo deja en borrador igual.
  await expect(page.getByRole('button', { name: /Borrador ·/ })).toHaveCount(0)
  await tab(page, 'Texto').click()
  await page.getByRole('textbox', { name: 'Texto · Español' }).fill(BODY)
  await noSeriousAxe(page)
  await save(page)
  await expect(page).toHaveURL(/#\/articulos\/\d+$/)
  created = Number(page.url().match(/articulos\/(\d+)/)![1])

  const record = await adminGet<Article>(`/articles/${created}`)
  expect(record).toMatchObject({ slug: SLUG, title: TITLE, status: 'DRAFT', publishedAt: null })
  const list = await publicGet('/articles')
  expect((list.body!.data as { slug: string }[]).some(a => a.slug === SLUG)).toBe(false)
  expect((await publicGet(`/articles/${SLUG}`)).status).toBe(404)
  await expect(page.getByRole('button', { name: /^Borrador · Faltan/ })).toBeVisible()
  await shot(page, info, 'nuevo-texto')
})

test('vista previa: el render del sitio para el código y la tabla; el inglés con la suya', async ({ page }, info) => {
  await signedIn(page, `#/articulos/${created}?seccion=texto`)
  const es = page.locator('[data-field="content"]')
  await es.getByRole('button', { name: 'Vista previa' }).click()
  await expect(es.getByRole('region', { name: 'Bloque de código en ts' })).toContainText('findMany')
  await expect(es.locator('[data-preview] h2')).toHaveText('Por qué un ñandú')
  const en = page.locator('[data-field="translations.en.content"]')
  await expect(en.getByText('Falta el inglés')).toBeVisible()
  await en.getByRole('textbox', { name: 'Texto · Inglés' }).fill(BODY_EN)
  await en.getByRole('button', { name: 'Vista previa' }).click()
  await expect(en.locator('[data-preview] h2')).toHaveText('Why a rhea')
  await noSeriousAxe(page)
  await shot(page, info, 'vista-previa')
  await save(page)
})

test('publicar: el título no cambia la dirección, el inglés aparece en ?lang=en y la vista previa coincide con el sitio', async ({ page, browser }, info) => {
  test.setTimeout(330_000)
  await signedIn(page, `#/articulos/${created}`)
  await page.getByLabel('Título · Español').fill(`${TITLE}, en serio`)
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue(SLUG)
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveAttribute('readonly', '')
  await page.getByLabel('Título · Inglés').fill('Fast architecture on a rhea')
  await page.getByLabel('Bajada · Inglés').fill('A fast API with a single query and the view on the same trip.')
  await page.getByRole('button', { name: 'Calcular' }).click()
  await expect(page.getByLabel('Minutos de lectura')).toHaveValue('1')

  await page.getByRole('button', { name: /^Borrador ·/ }).click()
  await page.getByRole('switch', { name: 'Mostrar en el sitio' }).click()
  // Falta una tecnología: pide confirmación.
  await page.getByRole('button', { name: 'Publicar igual' }).click()
  await expect(page.getByRole('button', { name: /^Publicado ·/ })).toBeVisible()
  await shot(page, info, 'publicacion')
  await page.keyboard.press('Escape')
  await save(page)

  const record = await adminGet<Article>(`/articles/${created}`)
  expect(record.status).toBe('PUBLISHED')
  expect(record.publishedAt).not.toBeNull()
  expect(record.slug).toBe(SLUG)
  const list = await publicGet('/articles')
  expect((list.body!.data as { slug: string }[]).some(a => a.slug === SLUG)).toBe(true)
  const english = await publicGet(`/articles/${SLUG}?lang=en`)
  expect(english.body!.data).toMatchObject({ title: 'Fast architecture on a rhea', content: BODY_EN })
  await expect(page.getByRole('link', { name: 'Ver en el sitio' })).toHaveAttribute('href', `/articles/${SLUG}`)

  await startSite()
  await page.goto(`${ADMIN}#/articulos/${created}?seccion=texto`)
  for (const [field, path, title] of [
    ['content', `/articles/${SLUG}`, `${TITLE}, en serio`],
    ['translations.en.content', `/articles/${SLUG}?lang=en`, 'Fast architecture on a rhea'],
  ] as const) {
    const box = page.locator(`[data-field="${field}"]`)
    await box.getByRole('button', { name: 'Vista previa' }).click()
    const preview = await blocksOf(page, `[data-field="${field}"] [data-preview]`)
    const rendered = await siteBlocks(browser, path)
    expect(rendered.title).toBe(title)
    expect(preview.map(b => b.tag)).toEqual(['h2', 'p', 'figure', 'p', 'ul'])
    expect(preview).toEqual(rendered.blocks)
  }
})

test('cambiar dirección: avisa, cambia la URL del sitio y la vieja deja de andar', async ({ page }) => {
  await signedIn(page, `#/articulos/${created}`)
  await page.getByRole('button', { name: 'Cambiar dirección' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cambiar dirección' })
  await expect(dialog).toContainText('van a dejar de andar')
  await dialog.getByLabel('Dirección nueva').fill(MOVED)
  await dialog.getByRole('button', { name: 'Cambiar dirección' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue(MOVED)
  expect((await adminGet<Article>(`/articles/${created}`)).slug).toBe(MOVED)
  expect((await publicGet(`/articles/${MOVED}`)).status).toBe(200)
  expect((await publicGet(`/articles/${SLUG}`)).status).toBe(404)
})

test('archivar: sale del sitio y queda en la lista como Archivado', async ({ page }) => {
  await signedIn(page, `#/articulos/${created}`)
  await page.getByRole('button', { name: 'Más acciones' }).click()
  await page.getByRole('menuitem', { name: 'Archivar' }).click()
  await page.getByRole('dialog', { name: 'Archivar este artículo' }).getByRole('button', { name: 'Archivar' }).click()
  await expect(page.getByRole('button', { name: /^Archivado ·/ })).toBeVisible()
  expect((await adminGet<Article>(`/articles/${created}`)).status).toBe('ARCHIVED')
  expect((await publicGet(`/articles/${MOVED}`)).status).toBe(404)
  await page.getByRole('link', { name: 'Artículos' }).first().click()
  await expect(page.getByRole('option', { name: new RegExp(TITLE) })).toContainText('Archivado')
})

test('desde Publicaciones: el borrador avisa qué revisar; Falta inglés lo lista', async ({ page }, info) => {
  const res = await fetch(`${api}/api/admin/articles`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Borrador de Eros', summary: 'Armado desde una publicación.', content: 'Texto del borrador.' }),
  })
  expect(res.status).toBe(201)
  const draft = await res.json() as Article
  await signedIn(page, `#/articulos/${draft.id}?origen=eros`)
  const notice = page.getByRole('region', { name: /Llegó desde Publicaciones/ })
  await expect(notice).toBeVisible()
  await noSeriousAxe(page)
  await shot(page, info, 'aviso-eros')
  await notice.getByRole('button', { name: 'Entendido' }).click()
  await expect(notice).toBeHidden()

  await page.goto(`${ADMIN}#/articulos?filtro=falta-ingles`)
  await expect(page.getByRole('option', { name: /Borrador de Eros/ })).toBeVisible()
  await expect(page.getByRole('option', { name: /Borrador de Eros/ })).toContainText('Falta inglés')
})

test('a 390 px: la lista y el texto con su vista previa entran sin scroll horizontal', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = () => page.evaluate(() => {
    const main = document.getElementById('main')
    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
  await signedIn(page, '#/articulos')
  await settle(page)
  expect(await overflow()).toBeLessThanOrEqual(0)
  await page.goto(`${ADMIN}#/articulos/${created}?seccion=texto`)
  const en = page.locator('[data-field="translations.en.content"]')
  await en.getByRole('button', { name: 'Vista previa' }).click()
  await settle(page)
  expect(await overflow()).toBeLessThanOrEqual(0)
  await page.screenshot({ path: info.outputPath('texto-390.png') })
})
