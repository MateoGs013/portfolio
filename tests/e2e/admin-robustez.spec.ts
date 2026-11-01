import { expect, test, type APIRequestContext, type Page, type Request } from '@playwright/test'
import { ADMIN, apiGet, auth, idOf, mod, saveState, signedIn, token, visit } from './admin-support'

/**
 * Robustez (auditoría: las formas de perder trabajo o de escribir en otro registro): un 503 al cargar
 * no habilita un guardado cruzado; un 401 al guardar conserva el borrador y, después de volver a
 * entrar, guarda lo escrito; un guardado lento no devuelve el editor al registro anterior; recargar y
 * Atrás con cambios preguntan y los conservan; la base caída al entrar no borra la sesión ni muestra
 * códigos crudos.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-robustez.spec.ts
 */
interface Org { id: number, slug: string, name: string }

const DB_DOWN = { status: 503, json: { error: 'La base de datos no responde.', code: 'db_unavailable', errors: [] } }
const writes = (page: Page) => {
  const seen: string[] = []
  page.on('request', (req: Request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method()) && new URL(req.url()).pathname.startsWith('/api/admin/')) {
      seen.push(`${req.method()} ${new URL(req.url()).pathname}`)
    }
  })
  return seen
}
const nameField = (page: Page) => page.getByLabel('Nombre', { exact: true })

async function org(request: APIRequestContext, id: number): Promise<Org> {
  return apiGet<Org>(request, `/orgs/${id}`)
}

/** Vuelve a dejar el nombre como estaba en la copia, para la prueba siguiente. */
async function restoreName(request: APIRequestContext, original: Org): Promise<void> {
  const now = await org(request, original.id)
  if (now.name === original.name) return
  const res = await request.put(`/api/admin/orgs/${original.id}`, { headers: auth, data: { ...now, name: original.name } })
  expect(res.ok(), `restaurar ${original.slug}`).toBe(true)
}

test('un 503 al cargar otra obra no deja guardar lo de antes en ella', async ({ page, request }) => {
  const project = await idOf(request, '/projects', 'la-rucula')
  const entry = await idOf(request, '/experience', 'la-rucula')
  const sent = writes(page)
  await signedIn(page, `#/trayectoria/${entry}`)
  await expect(page.getByLabel('Cargo · Español', { exact: true })).not.toHaveValue('')

  await page.route(`**/api/admin/projects/${project}`, route => route.request().method() === 'GET' ? route.fulfill(DB_DOWN) : route.continue())
  await visit(page, `#/obras/${project}`)
  await expect(page.locator('#main').getByText('La base de datos no responde.')).toBeVisible()
  await expect(page.locator('#main form')).toHaveCount(0)
  await page.keyboard.press(`${mod}+s`)
  await page.locator('#main h1').press(`${mod}+s`)
  await page.waitForTimeout(400)
  expect(sent, 'ningún PUT con el formulario de la experiencia').toEqual([])

  await page.unroute(`**/api/admin/projects/${project}`)
  await page.locator('#main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.locator('#main h1')).toHaveText('La Rúcula Gastrobar')
  await expect(page.getByLabel('Título', { exact: true })).toHaveValue('La Rúcula Gastrobar')
  expect(sent).toEqual([])
})

test('un 401 al guardar conserva el borrador y, al volver a entrar, guarda lo escrito', async ({ page, request }) => {
  const original = await org(request, await idOf(request, '/orgs', 'la-rucula-gastrobar'))
  const typed = `${original.name} (sesión)`
  try {
    await signedIn(page, `#/empresas/${original.id}`)
    await nameField(page).fill(typed)
    let refused = false
    await page.route(`**/api/admin/orgs/${original.id}`, async (route) => {
      if (route.request().method() === 'PUT' && !refused) {
        refused = true
        return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
      }
      return route.continue()
    })
    await page.keyboard.press(`${mod}+s`)
    const dialog = page.getByRole('dialog', { name: 'La sesión venció' })
    await expect(dialog).toBeVisible()
    // Mientras tanto lo escrito vive en el borrador de la pestaña y en el campo.
    const draft = await page.evaluate(key => sessionStorage.getItem(key), `adm-draft:empresas:${original.id}`)
    expect(draft).toContain(typed)
    await dialog.getByLabel('Clave de acceso').fill(token)
    await dialog.getByLabel('Clave de acceso').press('Enter')
    await expect(dialog).toBeHidden()
    await expect(saveState(page)).toContainText('Guardado')
    await expect(nameField(page)).toHaveValue(typed)
    expect(refused).toBe(true)
    expect((await org(request, original.id)).name).toBe(typed)
    expect(await page.evaluate(key => sessionStorage.getItem(key), `adm-draft:empresas:${original.id}`)).toBeNull()
  }
  finally {
    await restoreName(request, original)
  }
})

test('un guardado lento termina sin devolver el editor al registro anterior', async ({ page, request }) => {
  const first = await org(request, await idOf(request, '/orgs', 'la-rucula-gastrobar'))
  const second = await org(request, await idOf(request, '/orgs', 'arg-piscinas'))
  const typed = `${first.name} (lento)`
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  try {
    await signedIn(page, `#/empresas/${first.id}`)
    await nameField(page).fill(typed)
    await page.route(`**/api/admin/orgs/${first.id}`, async (route) => {
      if (route.request().method() === 'PUT') await gate
      await route.continue()
    })
    await page.keyboard.press(`${mod}+s`)
    await expect(saveState(page)).toContainText('Guardando')
    await expect(nameField(page)).toHaveAttribute('readonly', '')
    // Un segundo Ctrl/⌘S mientras guarda no manda otro PUT.
    await page.keyboard.press(`${mod}+s`)

    await page.locator('#main').getByRole('link', { name: 'Empresas', exact: true }).click()
    await expect(page.locator('#main h1')).toHaveText('Empresas')
    await page.getByRole('option', { name: new RegExp(`^${second.name}`) }).click()
    await expect(page.locator('#main h1')).toHaveText(second.name)
    release()

    // El aviso nombra el registro que se guardó, porque ya no es el que está a la vista.
    await expect(page.getByRole('region', { name: 'Avisos' })).toContainText(typed)
    await expect.poll(async () => (await org(request, first.id)).name).toBe(typed)
    await expect(page).toHaveURL(new RegExp(`#/empresas/${second.id}$`))
    await expect(page.locator('#main h1')).toHaveText(second.name)
    await expect(nameField(page)).toHaveValue(second.name)
  }
  finally {
    release()
    await restoreName(request, first)
  }
})

test('recargar con cambios pregunta y, al volver, ofrece recuperarlos', async ({ page, request }) => {
  const original = await org(request, await idOf(request, '/orgs', 'arg-piscinas'))
  await signedIn(page, `#/empresas/${original.id}`)
  const typed = `${original.name} (recargar)`
  await nameField(page).fill(typed)
  await expect(saveState(page)).toContainText('Cambios sin guardar')
  // El borrador se escribe 500 ms después de la última tecla (useDraft).
  await expect.poll(() => page.evaluate(key => sessionStorage.getItem(key), `adm-draft:empresas:${original.id}`)).toContain(typed)
  const asked: string[] = []
  page.on('dialog', (dialog) => {
    asked.push(dialog.type())
    void dialog.accept()
  })
  await page.reload()
  expect(asked).toEqual(['beforeunload'])

  await expect(page.locator('#main h1')).toHaveText(original.name)
  await expect(nameField(page)).toHaveValue(original.name)
  await page.getByRole('button', { name: /^Recuperar cambios del / }).click()
  await expect(nameField(page)).toHaveValue(typed)
  await expect(saveState(page)).toContainText('Cambios sin guardar')
  await page.locator('#main').getByRole('button', { name: 'Descartar' }).click()
  await expect(nameField(page)).toHaveValue(original.name)
  expect((await org(request, original.id)).name).toBe(original.name)
})

test('Atrás con cambios pregunta: «Seguir editando» los conserva y «Salir sin guardar» los descarta', async ({ page, request }) => {
  const original = await org(request, await idOf(request, '/orgs', 'arg-piscinas'))
  await signedIn(page, '#/empresas')
  await page.getByRole('option', { name: new RegExp(`^${original.name}`) }).click()
  await expect(page.locator('#main h1')).toHaveText(original.name)
  const typed = `${original.name} (atrás)`
  await nameField(page).fill(typed)

  await page.goBack()
  const leave = page.getByRole('dialog', { name: 'Tenés cambios sin guardar' })
  await expect(leave).toBeVisible()
  await leave.getByRole('button', { name: 'Seguir editando' }).click()
  await expect(leave).toBeHidden()
  await expect(page).toHaveURL(new RegExp(`#/empresas/${original.id}$`))
  await expect(nameField(page)).toHaveValue(typed)

  await page.goBack()
  await expect(leave).toBeVisible()
  await leave.getByRole('button', { name: 'Salir sin guardar' }).click()
  await expect(page).toHaveURL(/#\/empresas$/)
  await expect(page.locator('#main h1')).toHaveText('Empresas')
  await page.getByRole('option', { name: new RegExp(`^${original.name}`) }).click()
  await expect(nameField(page)).toHaveValue(original.name)
  await expect(page.getByRole('button', { name: /^Recuperar cambios del / })).toHaveCount(0)
  expect((await org(request, original.id)).name).toBe(original.name)
})

test('con la base caída al entrar se queda adentro, dice qué pasa y se recupera con Reintentar', async ({ page }) => {
  let down = true
  await page.route('**/api/admin/status', route => route.fulfill({ status: 200, json: { db: { ok: !down, checkedAt: new Date().toISOString() }, eros: { state: 'down', retryInSec: 30 } } }))
  await page.route(/\/api\/admin\/(meta|orgs|pending)(\?.*)?$/, route => down ? route.fulfill(DB_DOWN) : route.continue())
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}#/empresas`)
  await expect(page.locator('#main h1')).toHaveText('Empresas')
  await expect(page).toHaveURL(/#\/empresas$/)
  await expect(page.locator('[data-status-notice]').first()).toContainText('La base de datos no responde')
  await expect(page.locator('#main').getByText('La base de datos no responde.')).toBeVisible()
  await expect(page.locator('body')).not.toContainText('db_unavailable')
  expect(await page.evaluate(() => sessionStorage.getItem('adm-token'))).toBe(token)

  down = false
  await page.locator('#main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('listbox', { name: 'Empresas' }).getByRole('option').first()).toBeVisible()
})
