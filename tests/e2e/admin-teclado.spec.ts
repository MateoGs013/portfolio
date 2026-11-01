import { expect, test, type Page } from '@playwright/test'
import { apiGet, idOf, mod, palette, saveState, sectionTab, signedIn, visit } from './admin-support'

/**
 * Todo el admin con el teclado (invariante 4 del proyecto): el explorador (/, flechas, j/k, Enter y
 * N), las pestañas del editor, Ctrl/⌘S, el borrado que abre con el foco en Cancelar, Esc que cierra
 * una capa por vez, la paleta que encuentra registros y vacantes, j/k en la cola y las teclas de un
 * carácter apagadas. Con la muestra de vacantes de EROS_DEMO para que la cola tenga filas:
 *
 * admin-run: --demo
 *
 *   node scripts/admin-run.mjs --demo -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-teclado.spec.ts
 */
const h1 = (page: Page) => page.locator('#main h1')
const focusedText = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')

/** Saca el foco de cualquier campo o control: las teclas de un carácter van al documento. */
async function rest(page: Page): Promise<void> {
  // El router lleva el foco al h1 después de la transición entre pantallas: se espera a que termine.
  await page.waitForTimeout(300)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true)
}

const bodyFocused = (page: Page) => page.evaluate(() => document.activeElement === document.body)

test('explorador: / busca, j entra a la lista, las flechas recorren, Enter abre y N crea', async ({ page }) => {
  await signedIn(page, '#/obras')
  await rest(page)
  await page.keyboard.press('/')
  const search = page.getByRole('searchbox', { name: 'Buscar obras' })
  await expect(search).toBeFocused()
  await page.keyboard.type('ynara')
  const list = page.getByRole('listbox', { name: 'Obras' })
  await expect(list.getByRole('option')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(search).not.toBeFocused()

  await page.keyboard.press('j')
  const first = list.getByRole('option').first()
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(list.getByRole('option').nth(1)).toBeFocused()
  await expect(list.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.keyboard.press('End')
  const title = (await focusedText(page)).split(/Publicada|Oculta|Programada/)[0]!.trim()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/obras\/\d+$/)
  await expect(h1(page)).toHaveText(title)
  await expect(h1(page)).toBeFocused()

  await page.goBack()
  await expect(h1(page)).toHaveText('Obras')
  await rest(page)
  await page.keyboard.press('n')
  await expect(page).toHaveURL(/#\/obras\/nueva$/)
  await expect(h1(page)).toHaveText('Nueva obra')
})

test('pestañas: flechas mueven el foco, Enter abre la sección y la URL la guarda', async ({ page, request }) => {
  const id = await idOf(request, '/projects', 'la-rucula')
  await signedIn(page, `#/obras/${id}`)
  const essentials = sectionTab(page, /^Lo esencial/)
  await essentials.focus()
  await page.keyboard.press('ArrowRight')
  await expect(sectionTab(page, /^Relato/)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(sectionTab(page, /^Relato/)).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(new RegExp(`#/obras/${id}/relato$`))
  await page.keyboard.press('End')
  await expect(sectionTab(page, /^Datos/)).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(new RegExp(`#/obras/${id}/datos$`))
  await page.keyboard.press('ArrowRight')
  await expect(essentials).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`#/obras/${id}$`))
  await expect(page.getByRole('tabpanel', { name: 'Lo esencial' })).toBeVisible()
})

test('Ctrl/⌘S guarda desde el campo y vuelve a «Guardado»', async ({ page, request }) => {
  const id = await idOf(request, '/orgs', 'cet-30')
  const original = (await apiGet<{ city: string }>(request, `/orgs/${id}`)).city
  await signedIn(page, `#/empresas/${id}`)
  const city = page.getByLabel('Ciudad', { exact: true })
  // La ida y la vuelta: el segundo guardado deja la copia como estaba.
  for (const value of [`${original} (teclado)`, original]) {
    await city.fill(value)
    await expect(saveState(page)).toContainText('Cambios sin guardar')
    await page.keyboard.press(`${mod}+s`)
    await expect(saveState(page)).toContainText('Guardado')
    await expect(city).toBeFocused()
    expect((await apiGet<{ city: string }>(request, `/orgs/${id}`)).city).toBe(value)
  }
})

test('borrar: el diálogo abre con el foco en Cancelar y Esc lo cierra sin borrar', async ({ page, request }) => {
  const id = await idOf(request, '/orgs', 'cet-30')
  const deletes: string[] = []
  page.on('request', req => req.method() === 'DELETE' && deletes.push(req.url()))
  await signedIn(page, `#/empresas/${id}`)
  const more = page.locator('#main').getByRole('button', { name: 'Más acciones' })
  await more.focus()
  await page.keyboard.press('Enter')
  const remove = page.getByRole('menuitem', { name: /^Eliminar empresa/ })
  await expect(remove).toBeVisible()
  await page.keyboard.press('End')
  await expect(remove).toBeFocused()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: /^Eliminar esta empresa/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  // Enter sobre Cancelar tampoco borra.
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(more).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(more).toBeFocused()
  await expect(page).toHaveURL(new RegExp(`#/empresas/${id}$`))
  expect(deletes).toEqual([])
})

test('Esc cierra una capa por vez: panel de publicación, menú, paleta y campo, sin salir del editor', async ({ page, request }) => {
  const id = await idOf(request, '/projects', 'la-rucula')
  await signedIn(page, `#/obras/${id}`)
  const url = page.url()

  const publish = page.locator('#main').getByRole('button', { name: /^Publicada/ })
  await publish.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('region', { name: 'Publicación' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('switch', { name: /Mostrar en el sitio/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(publish).toBeFocused()

  const more = page.locator('#main').getByRole('button', { name: 'Más acciones' })
  await more.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(more).toBeFocused()

  await page.keyboard.press(`${mod}+k`)
  await expect(palette(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette(page)).toBeHidden()
  await expect(more).toBeFocused()

  const title = page.getByLabel('Título', { exact: true })
  await title.focus()
  await page.keyboard.press('Escape')
  await expect(title).not.toBeFocused()
  await page.keyboard.press('Escape')
  expect(page.url()).toBe(url)
  await expect(h1(page)).toHaveText('La Rúcula Gastrobar')
})

test('la paleta encuentra obras, trayectoria, catálogos y vacantes, y Enter las abre', async ({ page, request }) => {
  const jobs = await apiGet<{ id: string, title: string, company: string }[]>(request, '/hunter/jobs')
  const job = jobs[0]!
  await signedIn(page, '#/busqueda/vacantes')
  await expect(page.getByRole('listbox', { name: 'Vacantes de la cola' }).getByRole('option').first()).toBeVisible()
  await visit(page, '#/inicio', 'Inicio')

  const combobox = palette(page).getByRole('combobox')
  const cases: [string, string, RegExp][] = [
    ['rucula', 'Obras', /La Rúcula Gastrobar/],
    ['tesis', 'Trayectoria', /Tesis en equipo/],
    ['gsap', 'Tecnologías', /GSAP/],
    [job.company, 'Vacantes', new RegExp(job.title.replace(/[()]/g, '\\$&'))],
  ]
  for (const [query, group, name] of cases) {
    await page.keyboard.press(`${mod}+k`)
    await combobox.fill(query)
    await expect(palette(page).getByRole('group', { name: group }).getByRole('option', { name }).first(), `${query} en ${group}`).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(palette(page)).toBeHidden()
  }
  // Esc y Ctrl/⌘K en el mismo instante: la paleta que estaba saliendo se vuelve a abrir.
  await page.keyboard.press(`${mod}+k`)
  await expect(palette(page)).toBeVisible()
  await page.evaluate((meta) => {
    const key = (init: KeyboardEventInit) => (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
    key({ key: 'Escape' })
    key({ key: 'k', code: 'KeyK', ctrlKey: !meta, metaKey: meta })
  }, mod === 'Meta')
  await expect(palette(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette(page)).toBeHidden()
  await page.keyboard.press(`${mod}+k`)
  await combobox.fill(job.company)
  const option = palette(page).getByRole('group', { name: 'Vacantes' }).getByRole('option', { name: new RegExp(job.title.replace(/[()]/g, '\\$&')) })
  await expect(option).toBeVisible()
  // Enter abre la opción activa: la vacante, ya elegida por la búsqueda nueva.
  await expect(combobox).toHaveAttribute('aria-activedescendant', (await option.getAttribute('id'))!)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(new RegExp(`#/busqueda/vacantes/${job.id}/analisis$`))
  await expect(h1(page)).toHaveText(job.title)
})

test('j y k recorren la cola de vacantes', async ({ page }) => {
  await signedIn(page, '#/busqueda/vacantes?filtro=todas')
  const rows = page.getByRole('listbox', { name: 'Vacantes de la cola' }).getByRole('option')
  await expect(rows.nth(2)).toBeVisible()
  await rest(page)
  await page.keyboard.press('j')
  await expect(rows.first()).toBeFocused()
  await page.keyboard.press('j')
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press('j')
  await expect(rows.nth(2)).toBeFocused()
  await page.keyboard.press('k')
  await expect(rows.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/busqueda\/vacantes\/demo-[a-z-]+\/analisis/)
})

test('con las teclas de un carácter apagadas, N, / y j no hacen nada; Ctrl/⌘K sigue', async ({ page }) => {
  await signedIn(page, '#/obras')
  await page.keyboard.press(`${mod}+k`)
  await palette(page).getByRole('combobox').fill('atajos')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Avisos' })).toContainText('Atajos de una tecla apagados')
  try {
    await rest(page)
    for (const key of ['n', '/', 'j']) await page.keyboard.press(key)
    await page.waitForTimeout(300)
    await expect(page).toHaveURL(/#\/obras$/)
    expect(await bodyFocused(page), 'ni la búsqueda ni la lista tomaron el foco').toBe(true)
    await expect(palette(page)).toBeHidden()
    await page.keyboard.press(`${mod}+k`)
    await expect(palette(page)).toBeVisible()
    await palette(page).getByRole('combobox').fill('atajos')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('region', { name: 'Avisos' })).toContainText('Atajos de una tecla encendidos')
    await rest(page)
    await page.keyboard.press('n')
    await expect(page).toHaveURL(/#\/obras\/nueva$/)
  }
  finally {
    await page.evaluate(() => localStorage.removeItem('adm-single-keys'))
  }
})
