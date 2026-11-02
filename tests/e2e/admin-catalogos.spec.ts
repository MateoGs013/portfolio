import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { ADMIN } from './admin-support'

/**
 * Catálogos (U3): Tecnologías agrupadas por categoría con sus rótulos, la ficha con «Desde», el
 * criterio bilingüe y el color (solo para el registro R), el alta desde la lista y su borrado;
 * Empresas con sitio (https:// completado), ciudad, alta con ?nueva=1 y el borrado de ARG Piscinas
 * con su impacto y la reasignación a otra empresa. En cada pantalla: ningún select con el valor crudo
 * de un enum y axe sin violaciones serias ni críticas. Capturas a 1440 px en test-results/.
 *
 *   pnpm build:admin
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-catalogos.spec.ts
 *
 * admin-run copia la base: los cambios y el borrado nunca tocan la de trabajo.
 */
const token = process.env.PW_ADMIN_TOKEN!
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const auth = { Authorization: `Bearer ${token}` }
const RAW_ENUM = /^[A-Z][A-Z0-9_]+$/

interface Org { id: number, slug: string, name: string, url: string | null, city: string | null, _count: { projects: number, experiences: number } }
interface Tech { id: number, slug: string, name: string, category: string, since: number, note: string | null, color: string | null, translations: { note: string | null }[], _count: { projects: number, experiences: number, articles: number } }
interface Impact { projects: { id: number, title: string }[], experiences: { id: number, title: string }[], articles: { id: number, title: string }[], total: number }

async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(`/api/admin${path}`, { headers: auth })
  expect(res.ok(), `GET ${path}`).toBe(true)
  return await res.json() as T
}

async function signedIn(page: Page, hash: string): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
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

/** Ningún <select> visible (ni sus opciones) muestra LANGUAGE, FRAMEWORK… */
async function noRawSelect(page: Page): Promise<void> {
  const texts = await page.locator('select option').allTextContents()
  expect(texts.map(t => t.trim()).filter(t => RAW_ENUM.test(t))).toEqual([])
}

async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  await settle(page)
  await page.screenshot({ path: info.outputPath(`${name}.png`) })
}

const h1 = (page: Page) => page.locator('#main h1')
const footer = (page: Page) => page.locator('#main footer')
const saveButton = (page: Page) => page.getByRole('button', { name: 'Guardar', exact: true })

test.describe.configure({ mode: 'serial' })

test('tecnologías: agrupadas por categoría con rótulos, cantidad de obras y teclado hasta la ficha', async ({ page, request }, info) => {
  const techs = await apiGet<Tech[]>(request, '/techs')
  await signedIn(page, '#/tecnologias')
  await expect(h1(page)).toHaveText('Tecnologías')
  const main = page.locator('#main')
  await expect(main.getByRole('heading', { level: 2, name: /^Lenguajes/ })).toBeVisible()
  await expect(main.getByRole('heading', { level: 2, name: /^Frameworks/ })).toBeVisible()
  await expect(main.getByRole('option')).toHaveCount(techs.length)
  const mainText = await main.innerText()
  for (const raw of ['LANGUAGE', 'FRAMEWORK', 'MOTION', 'TOOLING', 'BACKEND']) expect(mainText).not.toContain(raw)

  const used = [...techs].sort((a, b) => b._count.projects - a._count.projects)[0]!
  const row = page.getByRole('option').filter({ hasText: used.name }).first()
  await expect(row).toContainText(`${used._count.projects} obras`)
  await expect(row).toContainText(`Desde ${used.since}`)
  await noSeriousAxe(page)
  await shot(page, info, 'tecnologias-lista-1440')

  const languages = page.getByRole('listbox', { name: 'Lenguajes' })
  const first = languages.getByRole('option').first()
  const firstName = (await first.locator('[data-title]').innerText()).trim()
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/tecnologias\/\d+$/)
  await expect(h1(page)).toHaveText(firstName)
  await expect(page).toHaveTitle(`${firstName} · Tecnologías · Admin`)

  await page.goto(`${ADMIN}#/tecnologias?filtro=sin-uso`)
  await expect(page.getByRole('button', { name: /^Sin uso/ })).toHaveAttribute('aria-pressed', 'true')
  const unused = techs.filter(t => !t._count.projects && !t._count.experiences && !t._count.articles)
  await expect(page.getByRole('option')).toHaveCount(unused.length)
})

test('ficha de tecnología: categoría rotulada, «Desde» validado, color en hex y criterio con su inglés', async ({ page, request }, info) => {
  const techs = await apiGet<Tech[]>(request, '/techs')
  const tech = techs.find(t => t.color && t.note)!
  await signedIn(page, `#/tecnologias/${tech.id}`)
  await expect(h1(page)).toHaveText(tech.name)

  const category = page.getByLabel('Categoría', { exact: true })
  await expect(category.locator('option:checked')).not.toHaveText(RAW_ENUM)
  await noRawSelect(page)
  await expect(page.locator('[data-field="color"]')).toContainText(tech.color!)
  await expect(page.locator('[data-field="color"]')).toContainText('Solo se ve en el registro R')
  await expect(page.locator('[data-slug-preview]')).toHaveText(`/projects?stack=${tech.slug}`)
  await expect(page.getByRole('heading', { name: 'Dónde se usa' })).toBeVisible()
  await noSeriousAxe(page)
  await shot(page, info, 'tecnologia-ficha-1440')
  await page.getByRole('heading', { name: 'Dónde se usa' }).scrollIntoViewIfNeeded()
  await shot(page, info, 'tecnologia-color-y-uso-1440')

  const since = page.getByLabel('Desde', { exact: true })
  await since.fill('1985')
  await since.press(`${mod}+s`)
  await expect(since).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('[data-field="since"]')).toContainText(`entre 1990 y ${new Date().getFullYear()}`)
  await since.fill('2020')

  await page.locator('[data-field="color"] input[type="color"]').fill('#12ab9c')
  await expect(page.locator('[data-field="color"]')).toContainText('#12ab9c')
  await page.getByLabel('Criterio · Inglés', { exact: true }).fill('')
  await expect(page.locator('[data-field="translations.en.note"]')).toContainText('Falta el inglés')

  const put = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/api/admin/techs/${tech.id}`))
  await saveButton(page).click()
  expect((await put).status()).toBe(200)
  await expect(footer(page).getByText(/^Guardado/).first()).toBeVisible()
  let saved = (await apiGet<Tech[]>(request, '/techs')).find(t => t.id === tech.id)!
  expect(saved.since).toBe(2020)
  expect(saved.color).toBe('#12ab9c')
  expect(saved.translations[0]?.note ?? null).toBeNull()

  await page.getByRole('button', { name: 'Quitar el color' }).click()
  await expect(page.locator('[data-field="color"]')).toContainText('Sin color')
  await saveButton(page).click()
  await expect(footer(page).getByText(/^Guardado/).first()).toBeVisible()
  saved = (await apiGet<Tech[]>(request, '/techs')).find(t => t.id === tech.id)!
  expect(saved.color).toBeNull()

  await page.getByRole('link', { name: 'Tecnologías', exact: true }).first().click()
  const row = page.getByRole('option').filter({ hasText: tech.name }).first()
  await expect(row).toContainText('Falta el inglés')
})

test('nueva tecnología con N: el diálogo pide nombre, categoría y año; creada se abre y se elimina sin impacto', async ({ page }, info) => {
  await signedIn(page, '#/tecnologias')
  await page.locator('#main h1').click()
  await page.keyboard.press('n')
  const dialog = page.getByRole('dialog', { name: 'Nueva tecnología' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Nombre', { exact: true })).toBeFocused()
  await noRawSelect(page)
  await dialog.getByRole('button', { name: 'Crear y abrir' }).click()
  await expect(dialog.getByText('Completá «Nombre».')).toBeVisible()
  await expect(dialog.getByText('Completá «Categoría».')).toBeVisible()

  await dialog.getByLabel('Nombre', { exact: true }).fill('Astro de prueba')
  await dialog.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Frameworks' })
  await dialog.getByLabel('Desde', { exact: true }).fill('2024')
  await noSeriousAxe(page)
  await shot(page, info, 'tecnologia-nueva-1440')
  await dialog.getByLabel('Desde', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/tecnologias\/\d+$/)
  await expect(h1(page)).toHaveText('Astro de prueba')
  await expect(page.locator('[data-slug-preview]')).toHaveText('/projects?stack=astro-de-prueba')

  await page.getByRole('button', { name: 'Más acciones' }).click()
  await page.getByRole('menuitem', { name: 'Eliminar tecnología…' }).click()
  const remove = page.getByRole('dialog', { name: 'Eliminar esta tecnología' })
  await expect(remove).toContainText('Nada del sitio lo usa')
  await remove.getByRole('button', { name: 'Eliminar esta tecnología' }).click()
  await expect(page).toHaveURL(/#\/tecnologias$/)
  await expect(page.getByRole('option').filter({ hasText: 'Astro de prueba' })).toHaveCount(0)
})

test('empresas: filas con uso, ficha con sitio completado con https:// y alta con ?nueva=1', async ({ page, request }, info) => {
  const orgs = await apiGet<Org[]>(request, '/orgs')
  await signedIn(page, '#/empresas')
  await expect(h1(page)).toHaveText('Empresas')
  await expect(page.getByRole('listbox', { name: 'Empresas' }).getByRole('option')).toHaveCount(orgs.length)
  const arg = orgs.find(o => o.slug === 'arg-piscinas')!
  await expect(page.getByRole('option').filter({ hasText: arg.name })).toContainText('1 obra · 1 experiencia')
  await noSeriousAxe(page)
  await shot(page, info, 'empresas-lista-1440')

  const noSite = orgs.find(o => !o.url) ?? orgs[0]!
  await page.goto(`${ADMIN}#/empresas/${noSite.id}`)
  await expect(h1(page)).toHaveText(noSite.name)
  await expect(page.locator('[data-field="city"]')).toContainText('El CV la usa como lugar de la experiencia')
  const site = page.getByLabel('Sitio', { exact: true })
  await site.fill('ejemplo-de-prueba.org')
  await site.blur()
  await expect(site).toHaveValue('https://ejemplo-de-prueba.org')
  await saveButton(page).click()
  await expect(footer(page).getByText(/^Guardado/).first()).toBeVisible()
  expect((await apiGet<Org>(request, `/orgs/${noSite.id}`)).url).toBe('https://ejemplo-de-prueba.org')
  await noSeriousAxe(page)
  await shot(page, info, 'empresa-ficha-1440')

  await page.goto(`${ADMIN}#/empresas?nueva=1`)
  const dialog = page.getByRole('dialog', { name: 'Nueva empresa' })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL(/#\/empresas$/)
  await dialog.getByLabel('Nombre', { exact: true }).fill(arg.name)
  await dialog.getByRole('button', { name: 'Crear y abrir' }).click()
  await expect(dialog.getByLabel('Nombre', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.locator('[data-initial]')).toContainText('Ya hay otra empresa con ese nombre')
  await dialog.getByLabel('Nombre', { exact: true }).fill('Estudio de Prueba Catálogo')
  await dialog.getByRole('button', { name: 'Crear y abrir' }).click()
  await expect(h1(page)).toHaveText('Estudio de Prueba Catálogo')
  await expect(page.locator('[data-slug-preview]')).toHaveText('/projects?org=estudio-de-prueba-catalogo')
})

test('borrar ARG Piscinas: el diálogo nombra sus obras y su experiencia y la reasignación las pasa a otra empresa', async ({ page, request }, info) => {
  const orgs = await apiGet<Org[]>(request, '/orgs')
  const arg = orgs.find(o => o.slug === 'arg-piscinas')!
  const other = orgs.find(o => o.slug === 'la-rucula-gastrobar')!
  const impact = await apiGet<Impact>(request, `/orgs/${arg.id}/impact`)
  expect(impact.projects.length).toBeGreaterThan(0)
  expect(impact.experiences.length).toBeGreaterThan(0)
  const before = await apiGet<Impact>(request, `/orgs/${other.id}/impact`)

  await signedIn(page, `#/empresas/${arg.id}`)
  await expect(h1(page)).toHaveText(arg.name)
  for (const item of [...impact.projects, ...impact.experiences]) {
    await expect(page.getByRole('region', { name: 'Dónde se usa' }).getByRole('link', { name: item.title })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Más acciones' }).click()
  await page.getByRole('menuitem', { name: 'Eliminar empresa…' }).click()
  const dialog = page.getByRole('dialog', { name: 'Eliminar esta empresa' })
  await expect(dialog).toContainText(`Lo usan ${impact.total} registros`)
  for (const item of [...impact.projects, ...impact.experiences]) await expect(dialog.getByRole('listitem').getByText(item.title, { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  const target = dialog.getByLabel('Qué pasa con lo que lo usa')
  await target.selectOption({ label: other.name })
  await noRawSelect(page)
  await noSeriousAxe(page)
  await shot(page, info, 'empresa-borrar-1440')

  const removed = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes(`/api/admin/orgs/${arg.id}?reassignTo=${other.id}`))
  await dialog.getByRole('button', { name: 'Eliminar esta empresa' }).click()
  expect((await removed).status()).toBe(200)
  await expect(page).toHaveURL(/#\/empresas$/)
  await expect(page.getByText(/^Empresa eliminada\./).first()).toBeVisible()
  await expect(page.getByRole('option').filter({ hasText: arg.name })).toHaveCount(0)

  const res = await request.get(`/api/admin/orgs/${arg.id}`, { headers: auth })
  expect(res.status()).toBe(404)
  const after = await apiGet<Impact>(request, `/orgs/${other.id}/impact`)
  const ids = (list: { id: number }[]) => list.map(i => i.id).sort((a, b) => a - b)
  expect(ids(after.projects)).toEqual(ids([...before.projects, ...impact.projects]))
  expect(ids(after.experiences)).toEqual(ids([...before.experiences, ...impact.experiences]))
})

test('a 390 px: las listas y las fichas de los dos catálogos entran sin scroll horizontal', async ({ page, request }, info) => {
  const [tech] = await apiGet<Tech[]>(request, '/techs')
  const [org] = await apiGet<Org[]>(request, '/orgs')
  await page.setViewportSize({ width: 390, height: 844 })
  await signedIn(page, '#/tecnologias')
  const screens = [['#/tecnologias', 'tecnologias'], [`#/tecnologias/${tech!.id}`, 'tecnologia'], ['#/empresas', 'empresas'], [`#/empresas/${org!.id}`, 'empresa']] as const
  for (const [hash, name] of screens) {
    await page.goto(`${ADMIN}${hash}`)
    await expect(h1(page)).toBeVisible()
    await settle(page)
    const overflow = await page.evaluate(() => {
      const main = document.getElementById('main')
      return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
    })
    expect(overflow, hash).toBeLessThanOrEqual(0)
    await shot(page, info, `${name}-390`)
  }
})
