import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Shell del admin nuevo (A1): rutas por hash, ingreso y reautenticación, estado real, paleta Ctrl/⌘K,
 * atajos, «Saltar al editor», accesibilidad y anchos. Corre con scripts/admin-run.mjs sobre una copia
 * de la base, con Eros apagado; el token es el de la corrida y nunca se imprime.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-shell.spec.ts
 *
 * Las capturas (shell y paleta a 1440 y 390 px) quedan en test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const ADMIN = '/admin-next/'
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'

interface Meta { options: { projects: { id: number, title: string }[] } }

/** Entra sin pasar por el formulario: la clave en sessionStorage, como la deja el ingreso. */
async function signedIn(page: Page, hash = '#/inicio'): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

const palette = (page: Page) => page.getByRole('dialog', { name: 'Ir a' })
const combobox = (page: Page) => palette(page).getByRole('combobox')

async function noSeriousAxe(page: Page): Promise<void> {
  // Con las entradas terminadas: a mitad de un fundido el contraste medido es menor que el real.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
  const { violations } = await new AxeBuilder({ page }).analyze()
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([])
}

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    const main = document.getElementById('main')
    return Math.max(root.scrollWidth - root.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('ingreso', () => {
  test('pide la clave, marca el error en el lugar y vuelve a donde se quería ir', async ({ page }) => {
    await page.goto(`${ADMIN}#/obras`)
    await expect(page).toHaveURL(/#\/ingresar\?volver=\/obras$/)
    const key = page.getByRole('main').getByLabel('Clave de acceso')
    await expect(key).toBeFocused()
    await expect(page).toHaveTitle('Ingresar · Admin')

    await key.fill('no-es-la-clave')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('La clave no es correcta')).toBeVisible()
    await expect(key).toHaveAttribute('aria-invalid', 'true')
    expect(await page.evaluate(() => sessionStorage.getItem('adm-token'))).toBeNull()

    const show = page.getByRole('button', { name: 'Mostrar clave' })
    await expect(show).toHaveAttribute('aria-pressed', 'false')
    await show.click()
    await expect(show).toHaveAttribute('aria-pressed', 'true')
    await expect(key).toHaveAttribute('type', 'text')

    await key.fill(token)
    await key.press('Enter')
    await expect(page).toHaveURL(/#\/obras$/)
    await expect(page.locator('#main h1')).toHaveText('Obras')
    await expect(page).toHaveTitle('Obras · Admin')
  })

  test('un 503 al entrar no borra la clave guardada', async ({ page }) => {
    await page.route('**/api/admin/status', route => route.fulfill({ status: 503, json: { error: 'admin deshabilitado' } }))
    await signedIn(page)
    await expect(page.getByRole('status', { name: 'Estado del servidor' }).first()).toContainText('El panel está apagado')
    expect(await page.evaluate(() => sessionStorage.getItem('adm-token'))).toBe(token)
  })
})

test.describe('rutas', () => {
  test('en #/obras recargar conserva la URL y Atrás vuelve a #/inicio', async ({ page }) => {
    await signedIn(page)
    const nav = page.getByRole('navigation', { name: 'Secciones' })
    await expect(nav.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: /^Obras/ }).click()
    await expect(page).toHaveURL(/#\/obras$/)
    await expect(nav.getByRole('link', { name: /^Obras/ })).toHaveAttribute('aria-current', 'page')
    // El foco va al h1 de la vista nueva.
    await expect(page.locator('#main h1')).toBeFocused()

    await page.reload()
    await expect(page).toHaveURL(/#\/obras$/)
    await expect(page.locator('#main h1')).toHaveText('Obras')

    await page.goBack()
    await expect(page).toHaveURL(/#\/inicio$/)
    await expect(page.locator('#main h1')).toHaveText('Inicio')
  })

  test('Catálogos se abre al entrar y una dirección que no existe lo dice', async ({ page }) => {
    await signedIn(page, '#/empresas')
    const toggle = page.getByRole('button', { name: 'Catálogos' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('link', { name: 'Empresas' })).toHaveAttribute('aria-current', 'page')
    await page.goto(`${ADMIN}#/no-hay-nada-aca`)
    await expect(page.locator('#main h1')).toHaveText('Esa pantalla no existe')
  })
})

test.describe('paleta', () => {
  test('busca sin acentos, recorre con flechas y Enter abre la obra', async ({ page, request }) => {
    const meta = await (await request.get('/api/admin/meta', { headers: { Authorization: `Bearer ${token}` } })).json() as Meta
    const rucula = meta.options.projects.find(p => p.title === 'La Rúcula Gastrobar')
    expect(rucula, 'la copia de la base trae La Rúcula').toBeTruthy()

    await signedIn(page)
    await page.keyboard.press(`${mod}+k`)
    await expect(palette(page)).toBeVisible()
    await expect(combobox(page)).toBeFocused()
    await expect(combobox(page)).toHaveAttribute('aria-expanded', 'true')

    await combobox(page).fill('rucula')
    const results = palette(page).getByRole('listbox')
    const obras = results.getByRole('group', { name: 'Obras' })
    await expect(obras.getByRole('option', { name: /La Rúcula Gastrobar/ })).toBeVisible()

    const first = await combobox(page).getAttribute('aria-activedescendant')
    expect(first).toBeTruthy()
    await page.keyboard.press('ArrowDown')
    const second = await combobox(page).getAttribute('aria-activedescendant')
    expect(second).not.toBe(first)
    await page.keyboard.press('ArrowUp')
    await expect(combobox(page)).toHaveAttribute('aria-activedescendant', first!)
    await expect(page.locator(`#${first}`)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator(`#${first}`)).toContainText('La Rúcula Gastrobar')

    await page.keyboard.press('Enter')
    await expect(palette(page)).toBeHidden()
    await expect(page).toHaveURL(new RegExp(`#/obras/${rucula!.id}$`))
    await expect(page.locator('#main h1')).toHaveText('La Rúcula Gastrobar')
    await expect(page).toHaveTitle('La Rúcula Gastrobar · Obras · Admin')
    await expect(page.locator('#main h1')).toBeFocused()
  })

  test('Esc cierra y devuelve el foco; los atajos de una tecla se apagan desde la paleta', async ({ page }) => {
    await signedIn(page)
    const trigger = page.getByRole('button', { name: 'Ir a…' })
    await expect(trigger).toHaveAttribute('aria-keyshortcuts', `${mod}+K`)
    await trigger.click()
    await expect(palette(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(palette(page)).toBeHidden()
    await expect(trigger).toBeFocused()

    // «/» sin búsqueda propia abre la paleta; desde un campo no hace nada.
    await page.locator('#main h1').click()
    await page.keyboard.press('/')
    await expect(palette(page)).toBeVisible()
    await combobox(page).fill('atajos')
    await page.keyboard.press('Enter')
    await expect(palette(page)).toBeHidden()
    await expect(page.getByRole('region', { name: 'Avisos' })).toContainText('Atajos de una tecla apagados')
    await page.locator('#main h1').click()
    await page.keyboard.press('/')
    await expect(palette(page)).toBeHidden()
    expect(await page.evaluate(() => localStorage.getItem('adm-single-keys'))).toBe('off')

    // Ctrl/⌘S nunca abre el «Guardar página» del navegador, aunque ninguna vista guarde.
    const prevented = await page.evaluate((mac) => {
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: !mac, metaKey: mac, bubbles: true, cancelable: true })
      document.body.dispatchEvent(event)
      return event.defaultPrevented
    }, mod === 'Meta')
    expect(prevented).toBe(true)

    // Ctrl/⌘K sigue andando aunque estén apagadas.
    await page.keyboard.press(`${mod}+k`)
    await expect(palette(page)).toBeVisible()
    await page.keyboard.press(`${mod}+k`)
    await expect(palette(page)).toBeHidden()
  })
})

test.describe('sesión y estado', () => {
  test('un 401 tras el ingreso abre la reautenticación y el pedido se reintenta sin desmontar', async ({ page }) => {
    await signedIn(page, '#/obras')
    await page.locator('#main h1').evaluate((el) => {
      el.dataset['montada'] = 'sí'
    })
    let rejected = false
    let retried = 0
    await page.route('**/api/admin/status', async (route) => {
      if (!rejected) {
        rejected = true
        return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
      }
      retried++
      return route.continue()
    })
    await page.evaluate(() => dispatchEvent(new Event('focus')))

    const dialog = page.getByRole('dialog', { name: 'La sesión venció' })
    await expect(dialog).toBeVisible()
    const key = dialog.getByLabel('Clave de acceso')
    await expect(key).toBeFocused()
    await key.fill('otra-clave')
    await dialog.getByRole('button', { name: 'Volver a entrar' }).click()
    await expect(dialog.getByText('La clave no es correcta')).toBeVisible()

    await key.fill(token)
    await key.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('region', { name: 'Avisos' })).toContainText('Sesión recuperada')
    // La verificación de la clave mala, la de la buena y el pedido original repetido.
    await expect.poll(() => retried).toBeGreaterThanOrEqual(3)
    await expect(page).toHaveURL(/#\/obras$/)
    await expect(page.locator('#main h1')).toHaveAttribute('data-montada', 'sí')
  })

  test('/status con la base caída avisa en la cabecera en menos de 31 s, sin borrar la sesión', async ({ page }) => {
    // Eros queda «sin responder» si otra prueba ya lo llamó: acá se fija todo en orden y después cae la base.
    let dbOk = true
    await page.route('**/api/admin/status', route => route.fulfill({
      status: 200,
      json: { db: { ok: dbOk, checkedAt: new Date().toISOString() }, eros: { state: 'ok', retryInSec: 0 } },
    }))
    await signedIn(page)
    // A 1440 px la de la columna (la primera); la de la barra del celular está oculta.
    const notice = page.locator('[data-status-notice]').first()
    await expect(notice).toBeEmpty()
    dbOk = false
    await expect(notice).toContainText('La base de datos no responde', { timeout: 31_000 })
    expect(await page.evaluate(() => sessionStorage.getItem('adm-token'))).toBe(token)
    await expect(page).toHaveURL(/#\/inicio$/)

    dbOk = true
    await notice.getByRole('button', { name: 'Reintentar' }).click()
    await expect(notice).toBeEmpty()
  })
})

test.describe('accesibilidad y anchos', () => {
  for (const width of [1440, 1024, 768, 390]) {
    test(`a ${width} px: primer Tab «Saltar al editor» y axe sin serias ni críticas`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await signedIn(page, '#/obras')
      await page.keyboard.press('Tab')
      const skip = page.getByRole('link', { name: 'Saltar al editor' })
      await expect(skip).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('#main h1')).toBeFocused()
      await noSeriousAxe(page)

      await page.keyboard.press(`${mod}+k`)
      await expect(palette(page)).toBeVisible()
      await noSeriousAxe(page)
    })
  }

  for (const width of [390, 768, 1024, 1280, 1440, 1920]) {
    test(`sin scroll horizontal a ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const hash of ['#/inicio', '#/obras', '#/busqueda/vacantes']) {
        await signedIn(page, hash)
        await noHorizontalScroll(page)
      }
    })
  }

  test('el menú del celular trae la misma navegación', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await signedIn(page)
    await page.getByRole('button', { name: 'Menú' }).click()
    const menu = page.getByRole('dialog', { name: 'Secciones del panel' })
    await expect(menu.getByRole('link', { name: 'Inicio' })).toBeFocused()
    await menu.getByRole('link', { name: /^Trayectoria/ }).click()
    await expect(menu).toBeHidden()
    await expect(page).toHaveURL(/#\/trayectoria$/)
  })
})

test.describe('capturas', () => {
  for (const width of [1440, 390]) {
    test(`shell y paleta a ${width} px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: width > 400 ? 900 : 844 })
      await signedIn(page, '#/obras')
      await page.waitForTimeout(900)
      await page.screenshot({ path: info.outputPath(`shell-${width}.png`) })
      await page.keyboard.press(`${mod}+k`)
      await combobox(page).fill('ru')
      await page.waitForTimeout(400)
      await page.screenshot({ path: info.outputPath(`paleta-${width}.png`) })
    })
  }
})
