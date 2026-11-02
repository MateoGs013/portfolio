import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { ADMIN } from './admin-support'

/**
 * Vacantes (H1): la cola, «Pegar una vacante» y las cuatro etapas con el invariante 6 completo
 * (analizar, adaptar el CV, ver la hoja, imprimir una página A4 dentro de la cota dual y copiar el
 * texto plano igual al /txt), la recuperación del 409, el portapapeles denegado, el filtro que sigue
 * a la vacante, la paleta y un control de teclado por endpoint. Corre en los tres modos de Eros:
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-vacantes.spec.ts
 *   node scripts/admin-run.mjs --demo -- …            (la muestra ficticia de EROS_DEMO)
 *   node scripts/admin-run.mjs --eros-mock -- …       (Eros simulado: tests/admin/eros-mock.ts)
 *
 * admin-run: sin Eros
 * admin-run: --demo
 * admin-run: --eros-mock
 *
 * Sin flags es el caso más exigente: sin Eros ni muestra. Las
 * capturas (cola y etapas a 1440 y 390 px, y la secuencia de la fila al registro) quedan en
 * test-results/ de cada prueba.
 */
const token = process.env.PW_ADMIN_TOKEN!
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const auth = { Authorization: `Bearer ${token}` }
const erosUrl = process.env.HUNTER_API_URL ?? ''

type Mode = 'offline' | 'demo' | 'mock'

async function modeOf(request: APIRequestContext): Promise<Mode> {
  if (!/:9\/?$/.test(erosUrl)) return 'mock'
  const res = await request.get('/api/admin/hunter/jobs', { headers: auth })
  return res.ok() ? 'demo' : 'offline'
}

async function signedIn(page: Page, hash = '#/busqueda/vacantes'): Promise<void> {
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
  await page.screenshot({ path: info.outputPath(`${name}.png`) })
}

const PASTED = {
  title: 'Desarrollador Frontend Vue 3 y Nuxt (prueba)',
  company: 'Estudio de Prueba',
  description: 'Buscamos un desarrollador frontend con experiencia en Vue 3, Nuxt y TypeScript para un equipo remoto. Suma GSAP y Tailwind CSS. Trabajo remoto desde Argentina.',
  email: 'postulaciones@example.com',
}

/** Pega la vacante de prueba y devuelve su id (manual-…), ya en su etapa Análisis. */
async function pasteJob(page: Page): Promise<string> {
  await page.getByRole('button', { name: /^Pegar una vacante/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Pegar una vacante' })
  await expect(dialog.getByLabel('Puesto')).toBeFocused()
  await dialog.getByLabel('Puesto').fill(PASTED.title)
  await dialog.getByLabel('Empresa').fill(PASTED.company)
  await dialog.getByLabel('Descripción del aviso').fill(PASTED.description)
  await dialog.getByLabel('Correo de contacto').fill(PASTED.email)
  await dialog.getByRole('button', { name: 'Agregar a la cola' }).click()
  await expect(page).toHaveURL(/#\/busqueda\/vacantes\/manual-[a-z0-9]+\/analisis$/)
  await expect(page.locator('#main h1')).toHaveText(PASTED.title)
  return decodeURIComponent(page.url().match(/vacantes\/(manual-[a-z0-9]+)\//)![1]!)
}

const stage = (page: Page, name: string) => page.getByRole('navigation', { name: 'Etapas de la vacante' }).getByRole('link', { name })

async function analyze(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Analizar la vacante' }).click()
  await expect(page.getByText(/% de compatibilidad|Muy compatible|Compatible|Dudosa|Descartar/).first()).toBeVisible()
}

async function adaptCv(page: Page): Promise<void> {
  await stage(page, 'CV').click()
  await page.getByRole('button', { name: 'Adaptar CV' }).click()
  await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
}

test.describe('cola', () => {
  test('lista, resumen honesto según Eros, axe y capturas a 1440 y 390 px', async ({ page, request }, info) => {
    const mode = await modeOf(request)
    await signedIn(page)
    await expect(page.locator('#main h1')).toHaveText('Vacantes')
    if (mode === 'offline') {
      await expect(page.getByText('Eros no responde', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Buscar vacantes nuevas' })).toHaveAttribute('aria-disabled', 'true')
      await expect(page.getByRole('heading', { name: 'No hay vacantes en la cola' })).toBeVisible()
    }
    else {
      const rows = page.getByRole('listbox', { name: 'Vacantes de la cola' }).getByRole('option')
      await expect(rows.first()).toBeVisible()
      await expect(page.getByText(/\d+ vacantes? · \d+ compatibles?/)).toBeVisible()
      if (mode === 'demo') await expect(page.getByText(/Muestra de prueba/)).toBeVisible()
      else await expect(page.getByRole('option', { name: /Desarrollador Frontend \(Vue 3 y Nuxt\)/ })).toBeVisible()
    }
    await noSeriousAxe(page)
    await shot(page, info, 'cola-1440')
    await page.setViewportSize({ width: 390, height: 844 })
    await noHorizontalScroll(page)
    await shot(page, info, 'cola-390')
  })
})

test('si Eros se cae, la cola de la sesión queda en solo lectura; la muestra nunca se guarda', async ({ page, request }) => {
  const mode = await modeOf(request)
  await signedIn(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Vacantes' })).toBeVisible()
  const cached = () => page.evaluate(() => sessionStorage.getItem('adm-hunter-queue'))
  if (mode !== 'mock') {
    if (mode === 'demo') await expect(page.getByRole('option').first()).toBeVisible()
    expect(await cached()).toBeNull()
    return
  }
  await expect(page.getByRole('option', { name: /Desarrollador Frontend \(Vue 3 y Nuxt\)/ })).toBeVisible()
  expect(await cached()).toContain('eros-mock-frontend')
  await page.route('**/api/admin/hunter/jobs', route => route.fulfill({ status: 503, json: { error: 'Eros no responde.', code: 'offline', offline: true, errors: [] } }))
  await page.reload()
  await expect(page.getByText(/^Última sincronización \d{2}:\d{2}$/)).toBeVisible()
  await expect(page.getByRole('option', { name: /Desarrollador Frontend \(Vue 3 y Nuxt\)/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buscar vacantes nuevas' })).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('option', { name: /Desarrollador Frontend \(Vue 3 y Nuxt\)/ }).click()
  await expect(page.getByText('Sin Eros, o en la muestra de prueba, la vacante no se puede cambiar.')).toBeVisible()
})

test.describe('vacante pegada', () => {
  test('cubre el invariante 6 sin pedirle nada a Eros por ella', async ({ page, context, request }, info) => {
    const mode = await modeOf(request)
    if (mode === 'mock') await request.delete(`${erosUrl}/__requests`)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await signedIn(page)
    const id = await pasteJob(page)

    // Análisis: veredicto en palabras, armado desde la base.
    await analyze(page)
    await expect(page.getByText('Armado desde la base, sin Eros')).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'etapa-analisis-1440')

    // Mensaje.
    await stage(page, 'Mensaje').click()
    await page.getByRole('button', { name: 'Escribir el mensaje' }).click()
    await expect(page.getByRole('textbox', { name: 'Asunto' })).not.toHaveValue('')
    await noSeriousAxe(page)
    await shot(page, info, 'etapa-mensaje-1440')

    // CV: el foco en el encabezado de la etapa y la hoja con el nombre de /api/cv.
    await adaptCv(page)
    await expect(page.getByRole('heading', { name: 'CV adaptado', level: 2 })).toBeFocused()
    const cv = await (await request.get('/api/cv')).json() as { data: { header: { name: string } } }
    await expect(page.frameLocator('[data-cv-sheet]').locator('h1')).toContainText(cv.data.header.name)
    const measure = page.locator('[data-cv-measure]')
    await expect(measure).toHaveAttribute('data-pages', '1')
    const height = Number(await measure.getAttribute('data-height-mm'))
    expect(height, 'cota dual del CV').toBeGreaterThanOrEqual(248)
    expect(height, 'cota dual del CV').toBeLessThanOrEqual(265)
    await noSeriousAxe(page)
    await shot(page, info, 'etapa-cv-1440')

    // Texto plano: lo copiado es el /txt del servidor, sin marcado.
    await page.getByRole('button', { name: 'Copiar texto plano' }).click()
    await expect(page.getByRole('button', { name: 'Texto copiado' })).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    const txt = await (await request.get(`/api/admin/hunter/cv/${encodeURIComponent(id)}/txt`, { headers: auth })).text()
    // El portapapeles de Windows guarda los saltos como CRLF: se compara el texto, no el sistema.
    expect(copied.replace(/\r\n/g, '\n')).toBe(txt)
    expect(copied).toContain(cv.data.header.name)
    expect(copied).not.toMatch(/<[a-z/][^>]*>|\*\*|^#+\s/m)

    // Imprimir: la ventana se abre en el gesto y recibe la hoja; impresa, es exactamente una página.
    const popup = page.waitForEvent('popup')
    await page.getByRole('button', { name: 'Imprimir o guardar como PDF' }).click()
    const win = await popup
    await win.waitForURL(/\/hunter\/cv\/.+\/html\?.*auto_print=true/)
    await win.close()
    const src = await page.locator('[data-cv-sheet]').getAttribute('src')
    const sheet = await context.newPage()
    await sheet.goto(src!.replace('measure=1', 'vista=1'))
    const pdf = (await sheet.pdf({ preferCSSPageSize: true })).toString('latin1')
    expect(pdf.match(/\/Type\s*\/Page(?!s)/g)?.length).toBe(1)
    await sheet.close()

    // Postular: el destinatario pegado, sin envío por Eros para una pegada, y «Ya la envié».
    await stage(page, 'Postular').click()
    await expect(page.getByRole('textbox', { name: 'Destinatario' })).toHaveValue(PASTED.email)
    await expect(page.getByRole('button', { name: 'Enviar desde Eros' })).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByText('Eros no conoce las vacantes pegadas a mano')).toBeVisible()
    await expect(page.getByRole('link', { name: /Abrir en Gmail/ })).toHaveAttribute('href', /mail\.google\.com.*postulaciones%40example\.com/)
    await noSeriousAxe(page)
    await shot(page, info, 'etapa-postular-1440')
    await page.getByRole('button', { name: 'Ya la envié' }).click()
    await expect(page.locator('#main header').getByText('Postulada')).toBeVisible()

    // Las cuatro etapas a 390 px, sin scroll horizontal.
    await page.setViewportSize({ width: 390, height: 844 })
    for (const name of ['Análisis', 'Mensaje', 'CV', 'Postular']) {
      await stage(page, name).click()
      await noHorizontalScroll(page)
      await shot(page, info, `etapa-${name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()}-390`)
    }

    if (mode === 'mock') {
      const received = await (await request.get(`${erosUrl}/__requests`)).json() as { path: string }[]
      expect(received.filter(r => r.path.includes(id))).toEqual([])
    }
  })

  test('un 409 en la hoja se recupera solo con un segundo POST /cv', async ({ page }) => {
    await signedIn(page)
    const id = await pasteJob(page)
    let posts = 0
    page.on('request', (req) => {
      if (req.method() === 'POST' && new URL(req.url()).pathname === `/api/admin/hunter/cv/${encodeURIComponent(id)}`) posts++
    })
    let refused = false
    await page.route(/\/api\/admin\/hunter\/cv\/[^/]+\/html/, async (route) => {
      if (!refused && !route.request().url().includes('ticket=')) {
        refused = true
        await route.fulfill({ status: 409, json: { error: 'El CV ya no está en la caché.', code: 'cv_expired', errors: [] } })
        return
      }
      await route.continue()
    })
    await adaptCv(page)
    await expect(page.frameLocator('[data-cv-sheet]').locator('h1')).toBeVisible()
    expect(refused).toBe(true)
    expect(posts).toBe(2)
  })

  test('con el portapapeles denegado avisa y deja el texto seleccionado', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denegado', 'NotAllowedError')) } })
      document.execCommand = () => false
    })
    await signedIn(page)
    await pasteJob(page)
    await adaptCv(page)
    await page.getByRole('button', { name: 'Copiar texto plano' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo copiar al portapapeles' })).toBeVisible()
    const area = page.locator('textarea[data-cv-text]')
    await expect(area).toBeFocused()
    const selection = await area.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd, el.value.length])
    expect(selection[0]).toBe(0)
    expect(selection[1]).toBe(selection[2])
    expect(selection[2]).toBeGreaterThan(200)
  })

  test('con el filtro Compatibles la vacante abierta sigue marcada en la lista', async ({ page }, info) => {
    await signedIn(page)
    const id = await pasteJob(page)
    await analyze(page)
    await page.goto(`${ADMIN}#/busqueda/vacantes?filtro=compatibles`)
    const row = page.getByRole('option', { name: new RegExp(PASTED.title.replace(/[()]/g, '\\$&')) })
    await expect(row).toBeVisible()
    // La secuencia del título que viaja de la fila al encabezado.
    await row.click()
    for (const [index, wait] of [0, 120, 180, 400].entries()) {
      await page.waitForTimeout(wait)
      await page.screenshot({ path: info.outputPath(`secuencia-${index + 1}.png`) })
    }
    await expect(page).toHaveURL(new RegExp(`${id}/analisis$`))
    await page.locator('#main').getByRole('link', { name: 'Vacantes', exact: true }).click()
    await expect(page).toHaveURL(/filtro=compatibles/)
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('aria-selected', 'true')
  })

  test('la paleta encuentra la vacante y genera su CV', async ({ page }) => {
    await signedIn(page)
    await pasteJob(page)
    await page.goto(`${ADMIN}#/inicio`)
    // El cambio de hash lo procesa el router después: sin esperar a Inicio, la paleta puede navegar antes.
    await expect(page.locator('#main h1')).toHaveText('Inicio')
    await page.keyboard.press(`${mod}+k`)
    const palette = page.getByRole('dialog', { name: 'Ir a' })
    await palette.getByRole('combobox').fill('Estudio de Prueba')
    await expect(palette.getByRole('option', { name: /Vue 3 y Nuxt \(prueba\)/ })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/manual-[a-z0-9]+\/analisis$/)
    await page.keyboard.press(`${mod}+k`)
    await palette.getByRole('combobox').fill('Generar CV')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/manual-[a-z0-9]+\/cv$/)
    await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
  })
})

test.describe('con Eros', () => {
  test('«Buscar vacantes nuevas» cuenta lo que encontró, o dice por qué no se puede', async ({ page, request }) => {
    const mode = await modeOf(request)
    await signedIn(page)
    const scan = page.getByRole('button', { name: 'Buscar vacantes nuevas' })
    if (mode !== 'mock') {
      await expect(scan).toHaveAttribute('aria-disabled', 'true')
      await expect(page.locator('#cola-bloqueada')).toBeVisible()
      return
    }
    await scan.click()
    await expect(page.getByText('Eros revisó 42 avisos y sumó 2 vacantes nuevas. 2 quedaron listas para la búsqueda por afinidad.').first()).toBeVisible()
    await page.getByRole('switch', { name: /Buscar por afinidad/ }).click()
    await page.getByRole('searchbox', { name: 'Buscar en la cola' }).fill('frontend con Vue')
    await page.keyboard.press('Enter')
    await expect(page.getByText(/2 vacantes afines a «frontend con Vue»/)).toBeVisible()
    await expect(page.getByRole('option', { name: /afinidad 82 %/ }).first()).toBeVisible()
  })

  test('el resumen propuesto por Eros entra solo si se acepta', async ({ page, request }, info) => {
    const mode = await modeOf(request)
    await signedIn(page)
    if (mode !== 'mock') {
      await pasteJob(page)
      await adaptCv(page)
      await expect(page.getByText('Armado desde la base, sin Eros')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Usar este resumen' })).toHaveCount(0)
      return
    }
    await page.goto(`${ADMIN}#/busqueda/vacantes/eros-mock-frontend/cv`)
    await page.getByRole('button', { name: 'Adaptar CV' }).click()
    await expect(page.locator('[data-cv-measure][data-height-mm]')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Generado por Eros')).toBeVisible()
    const summary = page.getByRole('region', { name: 'Resumen del CV' })
    await expect(summary.getByText('En uso')).toHaveCount(1)
    await summary.getByRole('button', { name: 'Usar este resumen' }).click()
    await expect(page.getByText('El CV usa el resumen que propuso Eros.').first()).toBeVisible()
    await expect(summary.getByRole('button', { name: 'Volver al de la base' })).toBeVisible()
    await summary.scrollIntoViewIfNeeded()
    await shot(page, info, 'cv-propuesta-1440')
  })
})

/** Cada endpoint de H1 (plan §6) y el control de teclado que lo usa. */
const CONTROLS: { endpoint: string, where: 'cola' | 'analisis' | 'mensaje' | 'cv' | 'postular', role: 'button' | 'menuitem' | 'switch' | 'link', name: RegExp }[] = [
  { endpoint: 'GET /hunter/jobs y /stats', where: 'cola', role: 'link', name: /^Vacantes$/ },
  { endpoint: 'POST /hunter/scan (y /vectorize al terminar)', where: 'cola', role: 'button', name: /^Buscar vacantes nuevas$/ },
  { endpoint: 'POST /hunter/evaluate', where: 'cola', role: 'menuitem', name: /^Evaluar las pendientes$/ },
  { endpoint: 'POST /hunter/purge', where: 'cola', role: 'menuitem', name: /^Limpiar la cola$/ },
  { endpoint: 'POST /hunter/search/semantic', where: 'cola', role: 'switch', name: /^Buscar por afinidad/ },
  { endpoint: 'POST /hunter/jobs/:id/evaluate', where: 'analisis', role: 'button', name: /^(Analizar la vacante|Volver a analizar)$/ },
  { endpoint: 'PATCH /hunter/jobs/:id/status', where: 'analisis', role: 'menuitem', name: /^(Guardar para después|Descartar)$/ },
  { endpoint: 'DELETE /hunter/jobs/:id', where: 'analisis', role: 'menuitem', name: /^Eliminar la vacante$/ },
  { endpoint: 'POST /hunter/jobs/:id/pitch', where: 'mensaje', role: 'button', name: /^(Escribir el mensaje|Escribirlo de nuevo)$/ },
  { endpoint: 'POST /hunter/cv/:id, /ticket y /html', where: 'cv', role: 'button', name: /^Adaptar CV$/ },
  { endpoint: 'POST /hunter/jobs/:id/apply-preview', where: 'postular', role: 'link', name: /^Postular$/ },
  { endpoint: 'POST /hunter/jobs/:id/find-email', where: 'postular', role: 'button', name: /^Buscar correo$/ },
  { endpoint: 'POST /hunter/jobs/:id/apply-email', where: 'postular', role: 'button', name: /^Enviar desde Eros$/ },
  { endpoint: 'PATCH /hunter/jobs/:id/status (applied)', where: 'postular', role: 'button', name: /^Ya la envié$/ },
]

test('cada endpoint de Vacantes tiene un control alcanzable por teclado', async ({ page, request }) => {
  const mode = await modeOf(request)
  await signedIn(page)
  let job = 'eros-mock-frontend'
  if (mode !== 'mock') job = await pasteJob(page)
  for (const where of ['cola', 'analisis', 'mensaje', 'cv', 'postular'] as const) {
    await page.goto(`${ADMIN}#/busqueda/vacantes${where === 'cola' ? '' : `/${job}/${where}`}`)
    await expect(page.locator('#main h1')).toBeVisible()
    // El router lleva el foco al h1 después de la transición entre pantallas (200 ms): se espera.
    await page.waitForTimeout(500)
    for (const control of CONTROLS.filter(c => c.where === where)) {
      if (control.role === 'menuitem') {
        const trigger = page.locator('#main').getByRole('button', { name: 'Más acciones' })
        await expect(async () => {
          await trigger.focus()
          await expect(trigger).toBeFocused({ timeout: 300 })
        }).toPass({ timeout: 5000 })
        await page.keyboard.press('Enter')
        const item = page.getByRole('menuitem', { name: control.name }).first()
        await expect(item, control.endpoint).toBeVisible()
        // Con Eros arriba se llega con las flechas; sin Eros, la cola lo dice y lo deja apagado.
        if (mode === 'mock') await expect(item, control.endpoint).not.toHaveAttribute('aria-disabled', 'true')
        await page.keyboard.press('Escape')
        // Con todo apagado el foco se queda en el botón: Enter lo vuelve a cerrar.
        if (await trigger.getAttribute('aria-expanded') === 'true') await trigger.press('Enter')
        continue
      }
      const el = page.locator('#main').getByRole(control.role, { name: control.name }).first()
      await expect(el, control.endpoint).toBeVisible()
      if (mode !== 'mock' && await el.isDisabled()) {
        // Sin Eros el control está, apagado y con el motivo al lado.
        await expect(el, control.endpoint).toHaveAttribute('aria-describedby', /\S/)
        continue
      }
      // Al llegar, el router lleva el foco al h1: se insiste hasta que la navegación terminó.
      await expect(async () => {
        await el.focus()
        await expect(el, control.endpoint).toBeFocused({ timeout: 300 })
      }).toPass({ timeout: 5000 })
    }
  }
})
