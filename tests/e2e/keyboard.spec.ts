import { expect, test, type Page } from '@playwright/test'
import shell from '../../app/lib/dict/shell'
import { api, open, skipIntro } from './support'

/**
 * Teclado (docs/diseno.md §7): Tab con foco visible desde el salto al contenido, la paleta «Ir a», las
 * páginas con 1–5, j/k entre filas y tarjetas, Enter, Esc, Backspace, R y H, y los atajos apagables. Un
 * solo useHotkeys: ninguna tecla de una letra se dispara con el foco en un campo.
 */
test.beforeEach(({ page }) => skipIntro(page))

/** Lo que tiene el foco: su ruta corta, si se ve y si dibuja el contorno de :focus-visible. */
const focused = (page: Page) => page.evaluate(() => {
  const el = document.activeElement as HTMLElement | null
  if (!el || el === document.body) return null
  const style = getComputedStyle(el)
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id,
    inContent: !!el.closest('#contenido'),
    visible: el.checkVisibility() && el.getBoundingClientRect().width > 0,
    outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 1,
  }
})

/**
 * Una tecla con la página en reposo, como la aprieta una persona: sin una view transition en curso,
 * sin el morph de R y con la paleta quieta (ni abriendo ni cerrando).
 */
async function press(page: Page, key: string) {
  await page.waitForFunction(() => {
    const html = document.documentElement
    let transitioning = false
    try {
      transitioning = html.matches(':active-view-transition')
    }
    catch {
      // Sin el selector no hay view transitions.
    }
    // GSAP anima la paleta en línea: a medio camino su opacidad no es ni '' ni '1'.
    const opacity = document.querySelector('dialog')?.style.opacity ?? ''
    return !transitioning && !html.hasAttribute('data-morphing') && (opacity === '' || opacity === '1')
  }, undefined, { timeout: 5000 })
  await page.keyboard.press(key)
  await page.waitForTimeout(150)
}

/** Elige una entrada de la paleta abierta escribiendo su rótulo: queda resaltada y Enter la corre. */
async function choose(page: Page, label: string) {
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await dialog.locator('input[role="combobox"]').fill(label)
  await expect(dialog.locator('[role="option"][aria-selected="true"]')).toContainText(label)
  await press(page, 'Enter')
  await expect(dialog).toHaveCount(0)
}

const SHORTCUTS = shell['shell.shortcuts'].es.split(':')[0]!

test('Tab: el salto al contenido es lo primero y cada parada tiene foco visible', async ({ page }) => {
  await open(page, '/projects/la-rucula')
  await press(page, 'Tab')
  const skip = page.locator('a[href="#contenido"]')
  await expect(skip).toBeFocused()
  await expect(skip).toHaveText(shell['shell.skip'].es)
  await expect(skip).toBeInViewport()
  await press(page, 'Enter')
  await expect(page.locator('#contenido')).toBeFocused()

  // Desde el contenido, las paradas siguientes son del contenido, se ven y dibujan su contorno.
  for (let i = 0; i < 12; i++) {
    await press(page, 'Tab')
    const stop = await focused(page)
    expect(stop, `parada ${i + 1}`).not.toBeNull()
    expect(stop!.visible, `parada ${i + 1}: ${stop!.tag}`).toBe(true)
    expect(stop!.outline, `parada ${i + 1}: ${stop!.tag}`).toBe(true)
  }
})

test('la paleta: / abre, filtra, Enter navega y Ctrl+K y Esc cierran devolviendo el foco', async ({ page, request }) => {
  const works = await api<{ slug: string, title: string }[]>(request, '/projects')
  const target = works.at(-1)!
  await open(page, '/about')
  const dialog = page.locator('dialog[open]')
  const input = dialog.locator('input[role="combobox"]')

  await press(page, '/')
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  // Con el foco en el campo, las teclas de una letra se escriben, no navegan.
  await input.pressSequentially('2')
  await expect(page).toHaveURL(/\/about$/)
  await choose(page, target.title)
  await expect(page).toHaveURL(new RegExp(`/projects/${target.slug}$`))

  await page.locator('a[href="#contenido"]').focus()
  await press(page, 'Control+k')
  await expect(dialog).toBeVisible()
  await press(page, 'Control+k')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('a[href="#contenido"]')).toBeFocused()
  await press(page, '/')
  await expect(dialog).toBeVisible()
  await press(page, 'Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('a[href="#contenido"]')).toBeFocused()
})

test('las teclas andan durante la salida de la paleta, sin esperar a que termine', async ({ page }) => {
  await open(page, '/about')
  const dialog = page.locator('dialog[open]')
  await press(page, '/')
  await expect(dialog).toBeVisible()
  // Ctrl+K cierra y '/' llega en plena animación de salida: la paleta vuelve, no se pierde la tecla.
  await page.keyboard.press('Control+k')
  await page.keyboard.press('/')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('input[role="combobox"]')).toBeFocused()
  // Esc cierra y '2' llega durante la salida: navega a Obra.
  await page.keyboard.press('Escape')
  await page.keyboard.press('2')
  await expect(page).toHaveURL(/\/projects$/)
})

test('1–5 llevan a inicio, obra, sobre mí, contacto y CV', async ({ page }) => {
  await open(page, '/articles')
  await press(page, '1')
  await expect(page).toHaveURL(/\/$/)
  await press(page, '2')
  await expect(page).toHaveURL(/\/projects$/)
  await press(page, '3')
  await expect(page).toHaveURL(/\/about$/)
  await press(page, '5')
  await expect(page).toHaveURL(/\/about\?cv=ats$/)
  await expect(page.locator('.cv-harvard')).toBeVisible()
  await press(page, '4')
  await expect(page).toHaveURL(/#contacto$/)
  await expect(page.locator('#contacto')).toBeFocused()
})

for (const [path, anchor] of [['/', '[data-row]'], ['/projects', '[data-card]']] as const) {
  test(`j/k recorren ${anchor} en ${path} y Enter abre el caso`, async ({ page }) => {
    await open(page, path)
    const items = page.locator(`#contenido ${anchor}`)
    expect(await items.count()).toBeGreaterThan(1)
    await press(page, 'j')
    await expect(items.nth(0)).toBeFocused()
    await press(page, 'j')
    await expect(items.nth(1)).toBeFocused()
    await press(page, 'k')
    await expect(items.nth(0)).toBeFocused()
    // Mover el foco no navega.
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/' : '/projects'}$`))
    const href = await items.nth(0).getAttribute('href')
    await press(page, 'Enter')
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })
}

test('Backspace sube un nivel: caso, artículo y CV', async ({ page, request }) => {
  const slug = (await api<{ slug: string }[]>(request, '/articles'))[0]!.slug
  for (const [from, to] of [['/projects/ynara', /\/projects$/], [`/articles/${slug}`, /\/articles$/], ['/about?cv=ats', /\/about$/]] as const) {
    await open(page, from)
    await press(page, 'Backspace')
    await expect(page, from).toHaveURL(to)
  }
  // En una página de primer nivel no hace nada.
  await press(page, 'Backspace')
  await expect(page).toHaveURL(/\/about$/)
})

test('Esc cierra la hoja del CV y después sale del Hiperfoco', async ({ page }) => {
  await open(page, '/about?cv=ats')
  await press(page, 'h')
  await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
  await press(page, 'Escape')
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
  await press(page, 'Escape')
  await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)
})

test('R alterna ?vista=registro y H el Hiperfoco, sin perder la página', async ({ page }) => {
  await open(page, '/about')
  await press(page, 'r')
  await expect(page).toHaveURL(/\/about\?vista=registro$/)
  await expect(page.locator('html')).toHaveAttribute('data-vista', 'registro')
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-morphing'), undefined, { timeout: 5000 })
  await press(page, 'r')
  await expect(page).toHaveURL(/\/about$/)
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-morphing'), undefined, { timeout: 5000 })
  await press(page, 'h')
  await expect(page.locator('html')).toHaveAttribute('data-hyperfocus', 'true')
  await press(page, 'h')
  await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)
  await expect(page).toHaveURL(/\/about$/)
})

test('los atajos de una tecla se apagan desde la paleta y Ctrl+K sigue andando', async ({ page, context }) => {
  await open(page, '/about')
  const keysCookie = async () => (await context.cookies()).find(c => c.name === 'pf-keys')?.value
  await press(page, '/')
  await choose(page, SHORTCUTS)
  await expect.poll(keysCookie).toBe('off')

  await press(page, '2')
  await press(page, 'h')
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-hyperfocus', /.*/)

  await press(page, 'Control+k')
  await choose(page, SHORTCUTS)
  await expect.poll(keysCookie).toBeUndefined()
  await press(page, '2')
  await expect(page).toHaveURL(/\/projects$/)
})
