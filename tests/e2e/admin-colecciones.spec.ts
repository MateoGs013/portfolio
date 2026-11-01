import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createServer, type AddressInfo } from 'node:net'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Marco de colecciones (C0) sobre la colección de prueba del Muestrario (#/muestrario/coleccion), que
 * edita las empresas de una copia de la base: lista con teclado, editor con secciones, guardado
 * demorado, errores por campo, ?campo=, borrador después de un 401, dirección fija y «Cambiar
 * dirección», creación en línea de una tecnología, borrado con reasignación y accesibilidad.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-colecciones.spec.ts
 *
 * El Muestrario existe solo en `pnpm dev:admin`: la spec levanta Vite en un puerto libre apuntando a
 * la API de la corrida (ADMIN_API_URL) y lo apaga al terminar. El token nunca se imprime.
 */
const token = process.env.PW_ADMIN_TOKEN!
const api = process.env.ADMIN_API_URL!
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const shell = process.platform === 'win32'

interface Org { id: number, slug: string, name: string, city: string | null, _count: { projects: number, experiences: number } }
interface Impact { projects: { id: number, title: string }[], experiences: { id: number, title: string }[], total: number }

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

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${api}/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } })
  expect(res.ok, `GET ${path}`).toBe(true)
  return await res.json() as T
}

/** Entra con la clave en sessionStorage, como la deja el ingreso, y espera el h1 de la vista. */
async function signedIn(page: Page, hash: string): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${base}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

/** Ingreso por el formulario (la clave no queda fija en cada carga, para poder vencerla). */
async function logIn(page: Page): Promise<void> {
  const key = page.getByRole('main').getByLabel('Clave de acceso')
  await expect(key).toBeVisible()
  await key.fill(token)
  await key.press('Enter')
}

async function noSeriousAxe(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

const h1 = (page: Page) => page.locator('#main h1')
/** El estado del guardado, al pie del editor. */
const saveState = (page: Page, text: string | RegExp) => page.locator('#main footer').getByText(text, { exact: typeof text === 'string' }).first()
const nameField = (page: Page) => page.getByLabel('Nombre', { exact: true })
const saveButton = (page: Page) => page.getByRole('button', { name: 'Guardar', exact: true })
const record = (id: number, rest = '') => `#/muestrario/coleccion/${id}${rest}`

test.describe.configure({ mode: 'serial' })

test('lista: Tab, ↓↓ y Enter abren el tercer registro; las flechas recorren las pestañas; Ctrl+S guarda desde un campo', async ({ page }) => {
  const orgs = await apiGet<Org[]>('/orgs')
  expect(orgs.length).toBeGreaterThanOrEqual(3)
  await signedIn(page, '#/muestrario/coleccion')
  await expect(h1(page)).toHaveText('Empresas')
  await expect(page.getByRole('listbox', { name: 'Empresas' }).getByRole('option')).toHaveCount(orgs.length)
  await noSeriousAxe(page)

  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement?.getAttribute('role')) === 'option') break
  }
  await expect(page.getByRole('option').first()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  const third = orgs[2]!
  await expect(page).toHaveURL(new RegExp(`#/muestrario/coleccion/${third.id}$`))
  await expect(h1(page)).toHaveText(third.name)
  await expect(page).toHaveTitle(`${third.name} · Muestrario · Admin`)

  const tabs = page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab')
  await tabs.first().focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/\/ubicacion$/)

  const city = page.getByLabel('Ciudad', { exact: true })
  await city.fill('Ciudad de prueba')
  await expect(saveState(page, 'Cambios sin guardar')).toBeVisible()
  await expect(tabs.nth(1)).toHaveAccessibleName(/con cambios sin guardar/)
  const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/admin/orgs/${third.id}`))
  await city.press(`${mod}+s`)
  expect((await put).status()).toBe(200)
  await expect(saveState(page, /^Guardado/)).toBeVisible()
  await expect(page.getByText('Empresa guardada').first()).toBeVisible()
  await expect(city).toHaveValue('Ciudad de prueba')
  await noSeriousAxe(page)
})

test('503 en la lista: ErrorState con Reintentar y ningún guardado posible', async ({ page }) => {
  const [first] = await apiGet<Org[]>('/orgs')
  const writes: string[] = []
  page.on('request', (r) => {
    if (r.method() !== 'GET' && r.url().includes('/api/admin/orgs')) writes.push(`${r.method()} ${r.url()}`)
  })
  const down = { status: 503, json: { error: 'La base de datos no responde.', code: 'db_unavailable', errors: [] } }
  await page.route(/\/api\/admin\/orgs(\/\d+)?$/, route => (route.request().method() === 'GET' ? route.fulfill(down) : route.continue()))

  await signedIn(page, '#/muestrario/coleccion')
  const alert = page.getByRole('alert').filter({ hasText: 'No se pudo cargar' })
  await expect(alert).toContainText('La base de datos no responde')
  await expect(alert.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await expect(page.getByRole('listbox')).toHaveCount(0)

  await page.goto(`${base}${record(first!.id)}`)
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo cargar' })).toBeVisible()
  await expect(saveButton(page)).toHaveCount(0)
  await page.keyboard.press(`${mod}+s`)
  await page.waitForTimeout(300)
  expect(writes).toEqual([])
})

test('PUT demorado 5 s: solo lectura con aria-busy, salir no pregunta y el editor queda en el registro nuevo', async ({ page }) => {
  const [a, b] = await apiGet<Org[]>('/orgs')
  await page.route(new RegExp(`/api/admin/orgs/${a!.id}$`), async (route) => {
    if (route.request().method() === 'PUT') await new Promise(r => setTimeout(r, 5000))
    await route.continue()
  })
  await signedIn(page, record(a!.id))
  await nameField(page).fill(`${a!.name} con demora`)
  const put = page.waitForResponse(r => r.request().method() === 'PUT', { timeout: 15_000 })
  await saveButton(page).click()
  await expect(page.locator('#main form')).toHaveAttribute('aria-busy', 'true')
  await expect(nameField(page)).toHaveAttribute('readonly', '')

  await page.evaluate(hash => (location.hash = hash), record(b!.id))
  await expect(h1(page)).toHaveText(b!.name)
  await expect(page.getByRole('dialog', { name: 'Tenés cambios sin guardar' })).toHaveCount(0)
  expect((await put).status()).toBe(200)
  await page.waitForTimeout(300)
  await expect(page).toHaveURL(new RegExp(`#/muestrario/coleccion/${b!.id}$`))
  await expect(h1(page)).toHaveText(b!.name)
  await expect(nameField(page)).toHaveValue(b!.name)
  await expect(nameField(page)).not.toHaveAttribute('readonly', '')
  expect((await apiGet<Org>(`/orgs/${a!.id}`)).name).toBe(`${a!.name} con demora`)
})

test('400 con dos campos: aria-invalid en los dos, foco en el primero y marca en su pestaña; ?campo= enfoca', async ({ page }) => {
  const [a] = await apiGet<Org[]>('/orgs')
  const errors = [
    { path: 'city', message: '«Ciudad» admite hasta 120 caracteres (tiene 130).' },
    { path: 'url', message: '«Sitio» tiene que ser una dirección web, como https://ejemplo.com.' },
  ]
  await page.route(new RegExp(`/api/admin/orgs/${a!.id}$`), route => (route.request().method() === 'PUT'
    ? route.fulfill({ status: 400, json: { error: 'Hay 2 campos para revisar.', code: 'invalid', errors } })
    : route.continue()))
  await signedIn(page, record(a!.id))
  await nameField(page).fill(`${a!.name} revisada`)
  await nameField(page).press(`${mod}+s`)

  await expect(page).toHaveURL(/\/ubicacion$/)
  const site = page.getByLabel('Sitio', { exact: true })
  const city = page.getByLabel('Ciudad', { exact: true })
  await expect(site).toHaveAttribute('aria-invalid', 'true')
  await expect(city).toHaveAttribute('aria-invalid', 'true')
  await expect(site).toBeFocused()
  await expect(city).toHaveCSS('border-bottom-color', 'rgb(240, 82, 79)')
  await expect(page.getByRole('tab', { name: /Sitio y ciudad\s*, con errores/ })).toBeVisible()
  await expect(saveState(page, 'No se pudo guardar')).toBeVisible()
  await expect(page.getByText(errors[0]!.message).first()).toBeVisible()

  await page.getByRole('button', { name: 'Descartar' }).click()
  await expect(saveState(page, 'Sin cambios')).toBeVisible()
  await page.goto(`${base}#/muestrario/coleccion`)
  await expect(h1(page)).toHaveText('Empresas')
  await page.goto(`${base}${record(a!.id, '?campo=city')}`)
  await expect(page).toHaveURL(/\/ubicacion\?campo=city$/)
  await expect(page.getByLabel('Ciudad', { exact: true })).toBeFocused()
})

test('401 a mitad de la edición: después de volver a entrar, «Recuperar cambios» devuelve lo escrito; recargar lo ofrece', async ({ page }) => {
  const [a] = await apiGet<Org[]>('/orgs')
  page.on('dialog', dialog => void dialog.accept())
  await page.goto(`${base}${record(a!.id)}`)
  await logIn(page)
  await expect(h1(page)).toHaveText(a!.name)

  await nameField(page).fill('Lo que escribí antes de que venza')
  await page.waitForTimeout(700)
  await page.evaluate(() => sessionStorage.setItem('adm-token', 'clave-vencida'))
  await nameField(page).press(`${mod}+s`)
  await expect(page.getByRole('dialog', { name: 'La sesión venció' })).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL(/#\/ingresar\?volver=/)
  await logIn(page)
  await expect(h1(page)).toHaveText(a!.name)
  const recover = page.getByRole('button', { name: /^Recuperar cambios del \d{2}\/\d{2} \d{2}:\d{2}$/ })
  await expect(recover).toBeVisible()
  await noSeriousAxe(page)
  await recover.click()
  await expect(nameField(page)).toHaveValue('Lo que escribí antes de que venza')
  await expect(saveState(page, 'Cambios sin guardar')).toBeVisible()

  await page.waitForTimeout(700)
  await page.reload()
  await expect(h1(page)).toHaveText(a!.name)
  await expect(recover).toBeVisible()
  await page.getByRole('button', { name: 'Descartarlos' }).click()
  await expect(recover).toHaveCount(0)
})

test('dirección: automática al crear, fija después; «Cambiar dirección» hace PATCH y actualiza la URL', async ({ page }) => {
  await signedIn(page, '#/muestrario/coleccion/nueva')
  await expect(h1(page)).toHaveText('Nueva empresa')
  const preview = page.locator('[data-slug-preview]')
  await nameField(page).fill('Estudio Ñandú Prueba')
  await expect(preview).toHaveText('/projects?org=estudio-nandu-prueba')
  await expect(h1(page)).toHaveText('Estudio Ñandú Prueba')
  const post = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/admin/orgs'))
  await saveButton(page).click()
  const created = await (await post).json() as Org
  expect(created.slug).toBe('estudio-nandu-prueba')
  await expect(page).toHaveURL(new RegExp(`#/muestrario/coleccion/${created.id}$`))

  await nameField(page).fill('Estudio con otro nombre')
  await expect(preview).toHaveText('/projects?org=estudio-nandu-prueba')
  await page.getByRole('button', { name: 'Descartar' }).click()

  await page.getByRole('button', { name: 'Cambiar dirección' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cambiar dirección' })
  await expect(dialog).toContainText('dejar de andar')
  await dialog.getByLabel('Dirección nueva').fill('estudio-nandu')
  const patch = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().endsWith(`/orgs/${created.id}/slug`))
  await dialog.getByRole('button', { name: 'Cambiar dirección' }).click()
  expect((await patch).status()).toBe(200)
  await expect(dialog).toBeHidden()
  await expect(preview).toHaveText('/projects?org=estudio-nandu')
  await expect(page.getByLabel('Dirección', { exact: true })).toHaveValue('estudio-nandu')
  await expect(saveState(page, 'Sin cambios')).toBeVisible()
  expect((await apiGet<Org>(`/orgs/${created.id}`)).slug).toBe('estudio-nandu')
})

test('InlineCreate crea una tecnología y queda elegida', async ({ page }) => {
  const [a] = await apiGet<Org[]>('/orgs')
  await signedIn(page, record(a!.id, '/componentes'))
  const combo = page.getByRole('combobox', { name: 'Tecnologías' })
  await combo.fill('Tecnología de prueba C0')
  await page.getByRole('option', { name: 'Crear «Tecnología de prueba C0»' }).click()
  const step = page.getByRole('group', { name: 'Crear «Tecnología de prueba C0»' })
  await expect(step.getByLabel('Categoría')).toBeFocused()
  await step.getByLabel('Categoría').selectOption({ label: 'Herramientas' })
  const post = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/api/admin/techs'))
  await step.getByRole('button', { name: 'Crear', exact: true }).click()
  expect((await post).status()).toBe(201)
  await expect(page.getByRole('list', { name: 'Tecnologías' })).toContainText('Tecnología de prueba C0')
  await expect(combo).toBeFocused()
  const techs = await apiGet<{ name: string, category: string }[]>('/techs')
  expect(techs.find(t => t.name === 'Tecnología de prueba C0')?.category).toBe('TOOLING')
  await noSeriousAxe(page)
})

test('DeleteDialog: muestra el impacto de una empresa con obras, empieza en Cancelar y reasigna', async ({ page }) => {
  const orgs = await apiGet<Org[]>('/orgs')
  const used = orgs.find(o => o._count.projects > 0)!
  const target = orgs.find(o => o.id !== used.id)!
  const impact = await apiGet<Impact>(`/orgs/${used.id}/impact`)
  await signedIn(page, record(used.id))
  await page.getByRole('button', { name: 'Más acciones' }).click()
  await page.getByRole('menuitem', { name: 'Eliminar empresa…' }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar esta empresa' })
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  for (const p of impact.projects) await expect(dialog.getByText(p.title, { exact: true })).toBeVisible()
  await expect(dialog).toContainText(`Lo usan ${impact.total} registros`)
  await noSeriousAxe(page)

  await dialog.getByLabel('Qué pasa con lo que lo usa').selectOption({ label: target.name })
  const del = page.waitForResponse(r => r.request().method() === 'DELETE')
  await dialog.getByRole('button', { name: 'Eliminar esta empresa' }).click()
  const res = await del
  expect(res.url()).toContain(`reassignTo=${target.id}`)
  expect(res.status()).toBe(200)
  await expect(page).toHaveURL(/#\/muestrario\/coleccion$/)
  await expect(page.getByRole('option', { name: new RegExp(used.name) })).toHaveCount(0)
  const after = await apiGet<Org>(`/orgs/${target.id}`)
  expect(after._count.projects).toBe(target._count.projects + used._count.projects)
})

test('en el celular: las secciones son una lista de opciones y no hay scroll horizontal', async ({ page }) => {
  const [a] = await apiGet<Org[]>('/orgs')
  await page.setViewportSize({ width: 390, height: 844 })
  await signedIn(page, record(a!.id))
  await expect(page.getByRole('tablist')).toHaveCount(0)
  await page.getByLabel('Sección', { exact: true }).selectOption({ label: 'Sitio y ciudad' })
  await expect(page).toHaveURL(/\/ubicacion$/)
  await expect(page.getByLabel('Ciudad', { exact: true })).toBeVisible()
  const overflow = await page.evaluate(() => {
    const main = document.getElementById('main')!
    return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main.scrollWidth - main.clientWidth)
  })
  expect(overflow).toBeLessThanOrEqual(0)
  await noSeriousAxe(page)
})
