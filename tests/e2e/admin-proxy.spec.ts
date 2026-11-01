import { expect, test, type Page, type Response } from '@playwright/test'
import { ADMIN, auth, idOf, sectionTab, token, watchCsp } from './admin-support'

/**
 * El admin nuevo por el proxy de Nuxt, que es el camino de producción (plan §4 y §9): /admin-next sin
 * barra responde 301 y /admin-next/ carga, los assets no dan 404, el navegador recibe una sola CSP (la
 * del admin, sin la del sitio) y recargar una pantalla profunda conserva la vista.
 *
 * admin-run: --web
 *
 *   node scripts/admin-run.mjs --web -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-proxy.spec.ts
 *
 * --web compila Nuxt contra la API de la corrida y deja .output con esos puertos: después, pnpm build
 * otra vez antes de pnpm start.
 */
const web = process.env.ADMIN_WEB_URL ?? ''

test.beforeAll(() => {
  expect(web, 'correr con admin-run --web: falta ADMIN_WEB_URL').toMatch(/^http/)
})

/** Las respuestas de la carga: el documento y lo que pide el admin a su base o a la API. */
function track(page: Page): Response[] {
  const seen: Response[] = []
  page.on('response', (res) => {
    const path = new URL(res.url()).pathname
    if (path.startsWith(ADMIN) || path.startsWith('/api/admin')) seen.push(res)
  })
  return seen
}

async function cspHeaders(res: Response): Promise<string[]> {
  return (await res.headersArray()).filter(h => h.name.toLowerCase() === 'content-security-policy').map(h => h.value)
}

test('/admin-next sin barra responde 301 a /admin-next/, con la consulta', async ({ request }) => {
  const res = await request.get(`${web}/admin-next?x=1`, { maxRedirects: 0 })
  expect(res.status()).toBe(301)
  expect(res.headers()['location']).toBe('/admin-next/?x=1')
})

for (const entry of ['/admin-next', '/admin-next/']) {
  test(`${entry} carga por Nuxt: assets sin 404 y una sola CSP, la del admin`, async ({ page }) => {
    const violations = await watchCsp(page)
    const seen = track(page)
    const doc = await page.goto(`${web}${entry}`)
    await expect(page).toHaveURL(`${web}${ADMIN}#/ingresar`)
    await expect(page.locator('#main h1')).toBeVisible()
    await expect(page.getByRole('main').getByLabel('Clave de acceso')).toBeFocused()

    // El documento que llegó al final de la redirección.
    const index = doc!.request().redirectedTo() ? await doc!.request().redirectedTo()!.response() : doc
    expect(index!.status()).toBe(200)
    const csp = await cspHeaders(index!)
    expect(csp, 'una sola cabecera CSP').toHaveLength(1)
    expect(csp[0]).toContain('script-src \'self\'')
    expect(csp[0]).toContain('style-src \'self\'')
    expect(csp[0]).toContain('frame-ancestors \'none\'')
    expect(csp[0]).not.toContain('unsafe-inline')
    expect(csp[0]).not.toContain('unsafe-eval')

    const assets = seen.filter(res => new URL(res.url()).pathname.startsWith(`${ADMIN}assets/`))
    expect(assets.length, 'el admin pidió sus assets').toBeGreaterThan(0)
    expect(assets.filter(res => res.status() >= 400).map(res => `${res.status()} ${res.url()}`)).toEqual([])
    for (const res of assets) expect(await res.headerValue('cache-control'), res.url()).toContain('immutable')
    expect(await violations()).toEqual([])
  })
}

test('con sesión por el proxy: recargar #/obras/<id>/imagenes conserva la vista, sin violaciones de CSP', async ({ page, request }) => {
  const id = await idOf(request, '/projects', 'la-rucula')
  // La API de la corrida y la del proxy son la misma: la clave entra igual por los dos lados.
  expect((await request.get(`${web}/api/admin/meta`, { headers: auth })).status()).toBe(200)
  const violations = await watchCsp(page)
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${web}${ADMIN}#/obras/${id}/imagenes`)
  await expect(page.locator('#main h1')).toHaveText('La Rúcula Gastrobar')
  await expect(sectionTab(page, /^Imágenes/)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-media-key]').first()).toBeVisible()
  // Las imágenes de la obra llegan por el proxy de /media.
  await expect.poll(() => page.locator('[data-media-key] img').first().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)

  await page.reload()
  await expect(page).toHaveURL(`${web}${ADMIN}#/obras/${id}/imagenes`)
  await expect(page.locator('#main h1')).toHaveText('La Rúcula Gastrobar')
  await expect(sectionTab(page, /^Imágenes/)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-media-key]').first()).toBeVisible()
  expect(await violations()).toEqual([])
})
