import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createServer, type AddressInfo } from 'node:net'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'

/**
 * Trayectoria (U2) sobre una copia de la base: lista, editor con dirección fija y «Cambiar dirección»,
 * viñetas en inglés que no se corren, la vista CV con el orden por teclado (PATCH /experience/order →
 * GET /api/cv en ese orden) y el aviso cuando la hoja A4 pasa de una página.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-trayectoria.spec.ts
 *
 * Levanta Vite en un puerto libre apuntando a la API de la corrida (ADMIN_API_URL) y lo apaga al
 * terminar. El token nunca se imprime. Las capturas quedan en test-results (1440 y 390 px).
 */
const token = process.env.PW_ADMIN_TOKEN!
const api = process.env.ADMIN_API_URL!
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const shell = process.platform === 'win32'

interface Exp {
  id: number
  slug: string
  kind: string
  role: string
  startedAt: string
  endedAt: string | null
  summary: string
  story: string | null
  highlights: string[]
  location: string | null
  cvOrder: number | null
  orgId: number | null
  org: { name: string } | null
  techs: { id: number }[]
  projects: { id: number, title: string }[]
  translations: { highlights: string[] }[]
}
interface CvDoc { data: { experience: { slug: string }[] } }

let vite: ChildProcess | null = null
let base = ''

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

test.beforeAll(async () => {
  test.setTimeout(120_000)
  const port = await freePort()
  vite = spawn('pnpm', ['exec', 'vite', '-c', 'server/admin/vite.config.ts'], {
    shell,
    stdio: 'ignore',
    env: { ...process.env, ADMIN_DEV_PORT: String(port), ADMIN_API_ORIGIN: api },
  })
  base = `http://localhost:${port}/admin-next/`
  for (let i = 0; i < 240; i++) {
    if (await fetch(base).then(r => r.ok, () => false)) return
    await new Promise(r => setTimeout(r, 250))
  }
  throw new Error('Vite no arrancó en 60 s.')
})

test.afterAll(() => {
  if (!vite?.pid) return
  if (shell) spawnSync('taskkill', ['/pid', String(vite.pid), '/T', '/F'], { stdio: 'ignore' })
  else vite.kill('SIGTERM')
})

async function admin<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${api}/api/admin${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  expect(res.ok, `${method} ${path}`).toBe(true)
  return await res.json() as T
}

const experiences = () => admin<Exp[]>('GET', '/experience')
const bySlug = async (slug: string) => (await experiences()).find(e => e.slug === slug)!
const publicStatus = (path: string) => fetch(`${api}/api${path}`).then(r => r.status)
const cvSlugs = async () => ((await (await fetch(`${api}/api/cv`)).json()) as CvDoc).data.experience.map(e => e.slug)
const titleOf = (e: Exp) => e.org?.name ?? e.projects[0]?.title ?? e.role

/** El PUT del admin con otras viñetas en español (sin `translations`: el inglés queda como está). */
function withHighlights(e: Exp, highlights: string[]) {
  return {
    kind: e.kind,
    role: e.role,
    startedAt: e.startedAt.slice(0, 10),
    endedAt: e.endedAt?.slice(0, 10) ?? null,
    summary: e.summary,
    story: e.story,
    highlights,
    location: e.location,
    cvOrder: e.cvOrder,
    orgId: e.orgId,
    techIds: e.techs.map(t => t.id),
    projectIds: e.projects.map(p => p.id),
  }
}

async function signedIn(page: Page, hash: string): Promise<void> {
  // Los iframes aislados de la hoja no tienen sessionStorage: ahí no se guarda nada.
  await page.addInitScript((key) => {
    try {
      sessionStorage.setItem('adm-token', key)
    }
    catch { /* hoja del CV (sandbox) */ }
  }, token)
  await page.goto(`${base}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
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

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const main = document.getElementById('main')
    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
  expect(overflow).toBeLessThanOrEqual(0)
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page)
  await page.screenshot({ path: info.outputPath(`${name}.png`) })
}

const h1 = (page: Page) => page.locator('#main h1')
const measureBox = (page: Page) => page.locator('[data-cv-measure]')
/** La hoja ya se midió (el postMessage de la hoja llegó). */
const measured = (page: Page) => expect(measureBox(page)).toHaveAttribute('data-height-mm', /\d/, { timeout: 20_000 })

test.describe.configure({ mode: 'serial' })

test('lista: filtros con conteo, filas que abren el editor; axe y capturas', async ({ page }, info) => {
  const rows = await experiences()
  await signedIn(page, '#/trayectoria')
  await expect(h1(page)).toHaveText('Trayectoria')
  const list = page.getByRole('listbox', { name: 'Trayectoria' })
  await expect(list.getByRole('option')).toHaveCount(rows.length)
  const education = rows.filter(e => e.kind === 'EDUCATION').length
  await page.getByRole('button', { name: /^Formación/ }).click()
  await expect(page).toHaveURL(/filtro=formacion/)
  await expect(list.getByRole('option')).toHaveCount(education)
  await page.getByRole('button', { name: /^Todas/ }).click()
  await noSeriousAxe(page)
  await shot(page, info, 'lista-1440')

  const piscinas = rows.find(e => e.slug === 'arg-piscinas')!
  await list.getByRole('option', { name: new RegExp(`^${titleOf(piscinas)}`) }).click()
  await expect(page).toHaveURL(new RegExp(`#/trayectoria/${piscinas.id}$`))
  await expect(h1(page)).toHaveText(titleOf(piscinas))
  await expect(page).toHaveTitle(`${titleOf(piscinas)} · Trayectoria · Admin`)
})

test('cambiar el cargo no mueve la dirección; «Cambiar dirección» sí', async ({ page }, info) => {
  const entry = await bySlug('arg-piscinas')
  await signedIn(page, `#/trayectoria/${entry.id}`)
  const role = page.getByLabel('Cargo · Español', { exact: true })
  await expect(role).toHaveValue(entry.role)
  await role.fill('Desarrollo a medida, front y back')
  const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/admin/experience/${entry.id}`))
  await role.press(`${mod}+s`)
  expect((await put).status()).toBe(200)
  await expect(page.getByText('Experiencia guardada').first()).toBeVisible()
  expect(await publicStatus('/experience/arg-piscinas')).toBe(200)
  expect((await bySlug('arg-piscinas')).role).toBe('Desarrollo a medida, front y back')
  await noSeriousAxe(page)
  await shot(page, info, 'editor-esencial-1440')

  await page.getByRole('button', { name: 'Cambiar dirección' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cambiar dirección' })
  await dialog.getByLabel('Dirección nueva').fill('arg-piscinas-web')
  const patch = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith(`/experience/${entry.id}/slug`))
  await dialog.getByRole('button', { name: 'Cambiar dirección' }).click()
  expect((await patch).status()).toBe(200)
  await expect(dialog).toBeHidden()
  await expect(page.locator('[data-slug-preview]')).toHaveText('/api/experience/arg-piscinas-web')
  expect(await publicStatus('/experience/arg-piscinas-web')).toBe(200)
  expect(await publicStatus('/experience/arg-piscinas')).toBe(404)
})

test('nueva experiencia: la dirección sale del cargo y queda fija; entra fuera del CV', async ({ page }) => {
  await signedIn(page, '#/trayectoria/nueva')
  await expect(h1(page)).toHaveText('Nueva experiencia')
  await page.getByLabel('Cargo · Español', { exact: true }).fill('Consultoría de accesibilidad')
  await expect(page.locator('[data-slug-preview]')).toHaveText('/api/experience/consultoria-de-accesibilidad')
  await page.getByLabel('Desde', { exact: true }).fill('2025-02-01')
  await page.getByRole('tab', { name: /^Relato/ }).click()
  await page.getByLabel('Síntesis · Español', { exact: true }).fill('Auditorías WCAG AA y correcciones en sitios de clientes.')
  const post = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/admin/experience'))
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  const created = await (await post).json() as Exp
  expect(created.slug).toBe('consultoria-de-accesibilidad')
  expect(created.cvOrder).toBeNull()
  await expect(page.getByText('Experiencia creada').first()).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`#/trayectoria/${created.id}([?]|$)`))
  expect(await publicStatus('/experience/consultoria-de-accesibilidad')).toBe(200)
})

test('editar la viñeta 2 en inglés no corre las demás', async ({ page }, info) => {
  const entry = await bySlug('la-rucula')
  const before = entry.translations[0]!.highlights
  expect(before.length).toBe(3)
  await signedIn(page, `#/trayectoria/${entry.id}?seccion=cv`)
  const second = page.getByLabel('Viñeta 2 · Inglés', { exact: true })
  await expect(second).toHaveValue(before[1]!)
  await second.fill('Built a self-hosted management panel with a local fallback for the menu.')
  const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/admin/experience/${entry.id}`))
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  expect((await put).status()).toBe(200)
  await expect(page.getByText('Experiencia guardada').first()).toBeVisible()
  const after = await bySlug('la-rucula')
  expect(after.highlights).toEqual(entry.highlights)
  expect(after.translations[0]!.highlights).toEqual([before[0], 'Built a self-hosted management panel with a local fallback for the menu.', before[2]])
  await noSeriousAxe(page)
  await shot(page, info, 'editor-cv-1440')
})

test('vista CV: reordenar con el teclado guarda el orden 1..n y GET /api/cv lo respeta', async ({ page }, info) => {
  const order = (await experiences()).filter(e => e.kind !== 'EDUCATION' && e.cvOrder !== null).sort((a, b) => a.cvOrder! - b.cvOrder!)
  expect(await cvSlugs()).toEqual(order.map(e => e.slug))
  const [first, second] = order
  await signedIn(page, '#/trayectoria/cv')
  await expect(h1(page)).toHaveText('Vista CV')
  await measured(page)

  const handle = page.getByRole('button', { name: `Mover ${titleOf(first!)}, puesto 1 de ${order.length}` })
  await handle.focus()
  const patch = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/api/admin/experience/order'))
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: `Mover ${titleOf(first!)}, puesto 2 de ${order.length}` })).toBeFocused()
  expect((await patch).status()).toBe(200)
  await expect(page.locator('[data-order-state]')).toHaveText('Orden guardado')

  const expected = [second!, first!, ...order.slice(2)].map(e => e.slug)
  expect(await cvSlugs()).toEqual(expected)
  const saved = (await experiences()).filter(e => e.cvOrder !== null).sort((a, b) => a.cvOrder! - b.cvOrder!)
  expect(saved.map(e => e.slug)).toEqual(expected)
  expect(saved.map(e => e.cvOrder)).toEqual(expected.map((_, i) => i + 1))
  await measured(page)
  await noSeriousAxe(page)
  await shot(page, info, 'vista-cv-1440')
})

test('sacar del CV y «Sumar» desde el editor la vuelve a poner al final', async ({ page }) => {
  const order = (await experiences()).filter(e => e.kind !== 'EDUCATION' && e.cvOrder !== null).sort((a, b) => a.cvOrder! - b.cvOrder!)
  const last = order.at(-1)!
  await signedIn(page, '#/trayectoria/cv')
  const patch = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/api/admin/experience/order'))
  await page.getByRole('button', { name: `Sacar ${titleOf(last)} del CV` }).click()
  expect((await patch).status()).toBe(200)
  await expect(page.getByRole('button', { name: `Sumar al CV: ${titleOf(last)}` })).toBeVisible()
  expect(await cvSlugs()).not.toContain(last.slug)

  await page.getByRole('link', { name: titleOf(last), exact: true }).click()
  await expect(h1(page)).toHaveText(titleOf(last))
  await page.getByRole('tab', { name: /^CV/ }).click()
  const place = page.locator('[data-cv-place]')
  await expect(place).toContainText('No entra al CV')
  const add = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith('/api/admin/experience/order'))
  await place.getByRole('button', { name: 'Sumar' }).click()
  expect((await add).status()).toBe(200)
  await expect(place).toContainText(`Entra al CV en el puesto ${order.length}`)
  expect((await cvSlugs()).at(-1)).toBe(last.slug)
})

test('aviso de una página: aparece con viñetas largas y se va al volver', async ({ page }, info) => {
  const long = 'Coordiné el desarrollo integral del producto, con métricas de rendimiento, accesibilidad AA y pruebas automatizadas en cada entrega a producción para el equipo.'
  expect(long.length).toBeLessThanOrEqual(160)
  const originals = (await experiences()).filter(e => e.highlights.length)
  for (const e of originals) await admin('PUT', `/experience/${e.id}`, withHighlights(e, [long, long, long]))

  await signedIn(page, '#/trayectoria/cv')
  await measured(page)
  const warning = page.getByText('El CV pasa de una página: acortá una viñeta o sacá una entrada')
  await expect(warning).toBeVisible()
  await expect(measureBox(page)).toHaveAttribute('data-long', 'true')
  await shot(page, info, 'vista-cv-aviso-1440')

  for (const e of originals) await admin('PUT', `/experience/${e.id}`, withHighlights(e, e.highlights))
  await page.getByRole('link', { name: 'Trayectoria', exact: true }).first().click()
  await expect(h1(page)).toHaveText('Trayectoria')
  await page.getByRole('link', { name: 'Vista CV' }).first().click()
  await expect(h1(page)).toHaveText('Vista CV')
  await measured(page)
  await expect(warning).toBeHidden()
  await expect(measureBox(page)).toContainText('Una página A4')
})

test('390 px: editor y vista CV sin scroll horizontal, axe y capturas', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const entry = await bySlug('la-rucula')
  await signedIn(page, `#/trayectoria/${entry.id}`)
  await noHorizontalScroll(page)
  await noSeriousAxe(page)
  await shot(page, info, 'editor-390')
  await page.goto(`${base}#/trayectoria/${entry.id}?seccion=cv`)
  await expect(page.getByLabel('Viñeta 1 · Español', { exact: true })).toBeVisible()
  await noHorizontalScroll(page)
  await shot(page, info, 'editor-cv-390')
  await page.goto(`${base}#/trayectoria/cv`)
  await expect(h1(page)).toHaveText('Vista CV')
  await measured(page)
  await noHorizontalScroll(page)
  await noSeriousAxe(page)
  await shot(page, info, 'vista-cv-390')
})
