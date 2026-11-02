import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { ADMIN } from './admin-support'

/**
 * Obras (U1): la lista con filtros y búsqueda, el editor con Lo esencial y Relato, la dirección fija,
 * el rol obligatorio con su frase antes de mandar nada, los pasos ordenables, la publicación con su
 * checklist que lleva al campo, la obra nueva que queda última en el sitio y el orden del sitio con
 * PATCH solo de las filas que cambiaron. Corre sobre una copia de la base:
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-obras.spec.ts
 *
 * Las capturas (lista y editor a 1440 y 390 px) quedan en test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const auth = { Authorization: `Bearer ${token}` }

interface Step { id: number, title: string, order: number }
interface Project { id: number, slug: string, title: string, sortOrder: number, year: number, steps: Step[], links: unknown[], techs: unknown[], metrics: unknown[], media: unknown[] }

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

/** Sin el puntero encima: al apuntar una fila las hermanas se atenúan a propósito (como el sitio). */
async function noSeriousAxe(page: Page): Promise<void> {
  await page.mouse.move(0, 0)
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
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
}

async function projects(request: APIRequestContext): Promise<Project[]> {
  const res = await request.get('/api/admin/projects', { headers: auth })
  expect(res.ok()).toBe(true)
  return await res.json() as Project[]
}

async function bySlug(request: APIRequestContext, slug: string): Promise<Project> {
  const found = (await projects(request)).find(p => p.slug === slug)
  expect(found, slug).toBeTruthy()
  return found!
}

const tabs = (page: Page) => page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab')

test.describe('Obras', () => {
  test('lista con filtros, búsqueda y orden; axe y capturas a 1440 y 390 px', async ({ page, request }, info) => {
    const all = await projects(request)
    await signedIn(page, '#/obras')
    await expect(page.locator('#main h1')).toHaveText('Obras')
    const list = page.getByRole('listbox', { name: 'Obras' })
    await expect(list.getByRole('option')).toHaveCount(all.length)
    await expect(page.getByText(/obras? se ven? en el sitio, de \d+ cargadas/)).toBeVisible()

    const filters = page.getByRole('group', { name: 'Filtros' })
    for (const name of ['Todas', 'Publicadas', 'Ocultas', 'Programadas', 'Destacadas', 'Falta inglés']) {
      await expect(filters.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible()
    }
    await filters.getByRole('button', { name: /^Ocultas/ }).click()
    await expect(page).toHaveURL(/filtro=ocultas/)
    for (const option of await list.getByRole('option').all()) await expect(option).toContainText('Oculta')
    await filters.getByRole('button', { name: /^Todas/ }).click()

    await page.getByRole('searchbox', { name: 'Buscar obras' }).fill('rucula')
    await expect(list.getByRole('option')).toHaveCount(1)
    await expect(list.getByRole('option').first()).toContainText('La Rúcula')
    await page.getByRole('searchbox', { name: 'Buscar obras' }).fill('')

    await noSeriousAxe(page)
    await shot(page, info, 'lista-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(list.getByRole('option').first()).toBeVisible()
    await shot(page, info, 'lista-390')
    await noHorizontalScroll(page)
    await page.goto(`${ADMIN}#/obras?vista=orden`)
    await expect(page.locator('#main h1')).toHaveText('Orden del sitio')
    await noHorizontalScroll(page)
    await shot(page, info, 'orden-390')
  })

  test('editar el título de La Rúcula conserva el caso público y lo que no se toca', async ({ page, request }) => {
    const before = await bySlug(request, 'la-rucula')
    await signedIn(page, '#/obras')
    await page.getByRole('option', { name: /La Rúcula/ }).click()
    await expect(page).toHaveURL(new RegExp(`#/obras/${before.id}$`))
    await expect(page.locator('#main h1')).toHaveText(before.title)
    await expect(page.locator('[data-slug-preview]')).toHaveText('/projects/la-rucula')
    await expect(page.getByRole('textbox', { name: 'Dirección', exact: true })).toHaveAttribute('readonly', '')

    const title = page.getByLabel('Título', { exact: true })
    await title.fill(`${before.title} (editado)`)
    await expect(page.locator('#main h1')).toHaveText(`${before.title} (editado)`)
    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByText('Obra guardada').first()).toBeVisible()

    const after = await bySlug(request, 'la-rucula')
    expect(after.title).toBe(`${before.title} (editado)`)
    expect([after.steps.length, after.links.length, after.techs.length, after.metrics.length, after.media.length])
      .toEqual([before.steps.length, before.links.length, before.techs.length, before.metrics.length, before.media.length])
    expect(after.sortOrder).toBe(before.sortOrder)
    const site = await request.get('/api/projects/la-rucula')
    expect(site.status()).toBe(200)

    await title.fill(before.title)
    await page.getByRole('button', { name: /^Guardar/ }).click()
    await expect.poll(async () => (await bySlug(request, 'la-rucula')).title).toBe(before.title)
  })

  test('las cuatro pestañas entran a 1366 px y en 390 px la sección es una lista', async ({ page, request }, info) => {
    const project = await bySlug(request, 'la-rucula')
    await page.setViewportSize({ width: 1366, height: 900 })
    await signedIn(page, `#/obras/${project.id}`)
    await expect(tabs(page)).toHaveCount(4)
    await expect(tabs(page)).toHaveText([/^Lo esencial/, /^Relato/, /^Imágenes/, /^Datos/])
    const fits = await page.getByRole('tablist').evaluate(el => el.scrollWidth <= el.clientWidth)
    expect(fits).toBe(true)
    for (const tab of await tabs(page).all()) {
      const box = await tab.boundingBox()
      expect(box && box.x + box.width).toBeLessThanOrEqual(1366)
    }
    await tabs(page).nth(1).click()
    await expect(page).toHaveURL(new RegExp(`#/obras/${project.id}/relato`))
    await expect(page.getByLabel('Síntesis · Español')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Proceso' })).toBeVisible()
    await noSeriousAxe(page)
    await page.getByRole('heading', { name: 'Proceso' }).scrollIntoViewIfNeeded()
    await shot(page, info, 'relato-1366')

    await page.setViewportSize({ width: 1440, height: 900 })
    await tabs(page).first().click()
    await shot(page, info, 'editor-1440')
    await page.locator('[data-field="status"]').scrollIntoViewIfNeeded()
    await shot(page, info, 'esencial-situacion-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    const select = page.getByRole('combobox', { name: 'Sección' })
    await expect(select).toBeVisible()
    await expect(page.getByRole('tab')).toHaveCount(0)
    await select.selectOption({ label: 'Relato' })
    await expect(page).toHaveURL(/\/relato/)
    await shot(page, info, 'editor-390')
    await noHorizontalScroll(page)
    await noSeriousAxe(page)
  })

  test('obra nueva: rol obligatorio antes de mandar, pasos, publicación y última en el sitio', async ({ page, request }, info) => {
    const posts: string[] = []
    page.on('request', (req) => {
      if (req.method() === 'POST' && /\/api\/admin\/projects$/.test(req.url())) posts.push(req.url())
    })
    await signedIn(page, '#/obras')
    await page.locator('#main h1').click()
    await page.keyboard.press('n')
    await expect(page).toHaveURL(/#\/obras\/nueva/)
    await expect(page.locator('#main h1')).toHaveText('Nueva obra')
    const title = page.getByLabel('Título', { exact: true })
    await expect(title).toBeFocused()

    const name = `Obra de prueba ${Date.now()}`
    await title.fill(name)
    await expect(page.locator('[data-slug-preview]')).toHaveText(/\/projects\/obra-de-prueba-\d+/)
    await page.getByRole('button', { name: /^Guardar/ }).click()
    const role = page.getByLabel('Rol · Español')
    await expect(page.locator('[data-field="role"]').getByText('Falta el rol que tuviste en la obra')).toBeVisible()
    await expect(role).toHaveAttribute('aria-invalid', 'true')
    await expect(role).toBeFocused()
    expect(posts).toEqual([])

    await role.fill('Diseño y desarrollo')
    await page.locator('[data-field="status"] label', { hasText: 'En producción' }).click()
    await expect(page.getByRole('radio', { name: /En producción/ })).toBeChecked()
    await tabs(page).nth(1).click()
    await page.getByLabel('Síntesis · Español').fill('Una obra cargada por la prueba del admin.')
    await page.getByRole('button', { name: 'Agregar paso' }).click()
    await expect(page.getByLabel('Título del paso · Español')).toBeFocused()
    await page.getByLabel('Título del paso · Español').fill('Primero')
    await page.getByLabel('Qué hiciste · Español').fill('El primer paso.')
    await page.getByRole('button', { name: 'Agregar paso' }).click()
    await page.getByLabel('Título del paso · Español').nth(1).fill('Segundo')
    await page.getByLabel('Qué hiciste · Español').nth(1).fill('El segundo paso.')
    await page.getByRole('button', { name: 'Subir el paso 2' }).click()
    await expect(page.getByRole('button', { name: 'Bajar el paso 1' })).toBeFocused()
    await expect(page.getByLabel('Título del paso · Español').first()).toHaveValue('Segundo')
    await page.getByRole('heading', { name: 'Proceso' }).scrollIntoViewIfNeeded()
    await shot(page, info, 'obra-nueva-pasos-1440')

    await page.getByRole('button', { name: /^Oculta/ }).click()
    await page.getByRole('switch', { name: /Mostrar en el sitio/ }).click()
    const confirm = page.getByRole('dialog')
    await expect(confirm).toContainText(/Faltan? .* para publicar/)
    await confirm.getByRole('button', { name: 'Publicar igual' }).click()
    await expect(page.getByRole('switch', { name: /Mostrar en el sitio/ })).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('Escape')

    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByText('Obra creada').first()).toBeVisible()
    await expect(page).toHaveURL(/#\/obras\/\d+\/relato$/)
    expect(posts).toHaveLength(1)

    const created = (await projects(request)).find(p => p.title === name)!
    expect(created.steps.map(s => s.title)).toEqual(['Segundo', 'Primero'])
    const site = await (await request.get('/api/projects')).json() as { data: { slug: string }[] }
    expect(site.data.at(-1)?.slug).toBe(created.slug)

    // La checklist lleva al campo que falta: el reto, en Relato.
    await page.getByRole('button', { name: /^Publicada/ }).click()
    await page.getByRole('link', { name: /Completar\s*:\s*Cuenta el reto/ }).click()
    await expect(page).toHaveURL(/campo=brief/)
    await expect(page.getByLabel('Reto · Español')).toBeFocused()
    await noSeriousAxe(page)

    const removed = await request.delete(`/api/admin/projects/${created.id}`, { headers: auth })
    expect(removed.status()).toBe(204)
  })

  test('orden del sitio: Subir y Bajar con el foco, y PATCH solo de las filas que cambiaron', async ({ page, request }, info) => {
    const before = await projects(request)
    const sorted = [...before].sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year)
    const patches: string[] = []
    page.on('request', (req) => {
      if (req.method() === 'PATCH' && /\/api\/admin\/projects\/\d+$/.test(req.url())) patches.push(req.url())
    })
    await signedIn(page, '#/obras')
    await page.getByRole('link', { name: 'Ordenar el sitio' }).click()
    await expect(page).toHaveURL(/vista=orden/)
    await expect(page.locator('#main h1')).toHaveText('Orden del sitio')
    await expect(page.locator('#main h1')).toBeFocused()

    const second = sorted[1]!
    await page.getByRole('button', { name: `Subir ${second.title}` }).click()
    await expect(page.getByRole('button', { name: `Bajar ${second.title}` })).toBeFocused()
    await expect(page.getByText('Orden sin guardar')).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'orden-1440')
    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByText('Orden guardado').first()).toBeVisible()
    expect(patches).toHaveLength(2)

    const now = (await projects(request)).sort((a, b) => a.sortOrder - b.sortOrder || b.year - a.year)
    expect(now.slice(0, 2).map(p => p.id)).toEqual([second.id, sorted[0]!.id])
    const site = await (await request.get('/api/projects')).json() as { data: { slug: string }[] }
    const visible = site.data.map(p => p.slug)
    expect(visible).toEqual(now.map(p => p.slug).filter(slug => visible.includes(slug)))

    // Vuelve al orden de antes con el mismo camino.
    await page.getByRole('button', { name: `Bajar ${second.title}` }).click()
    await page.getByRole('button', { name: /^Guardar el orden/ }).click()
    await expect.poll(async () => (await projects(request)).map(p => [p.id, p.sortOrder]).sort()).toEqual(before.map(p => [p.id, p.sortOrder]).sort())
  })
})
