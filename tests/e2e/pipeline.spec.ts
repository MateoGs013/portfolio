import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Cañería del front (F1): páginas mínimas que leen de la API, idioma y Hiperfoco resueltos por el SSR,
 * redirecciones 301 y sitemap. Q1 lo reemplaza por la suite completa.
 */
test.describe('páginas desde la API', () => {
  for (const path of ['/', '/projects', '/projects/la-rucula', '/about']) {
    test(`${path} responde 200 con un solo h1`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).not.toBeEmpty()
    })
  }

  test('una obra sin publicar da 404 con error.vue', async ({ page }) => {
    const res = await page.goto('/projects/null-net')
    expect(res?.status()).toBe(404)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
    // La marca de la cabecera también va a /: se busca el enlace de la página de error.
    await expect(page.locator('section:has(h1) a[href="/"]')).toBeVisible()
  })

  test('sin violaciones críticas de accesibilidad en el inicio', async ({ page }) => {
    await page.goto('/')
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.filter(v => v.impact === 'critical').map(v => v.id)).toEqual([])
  })
})

test.describe('estado del SSR en <html>', () => {
  test('?lang=en sale del SSR en inglés', async ({ request }) => {
    const [es, en] = await Promise.all([request.get('/projects/la-rucula'), request.get('/projects/la-rucula?lang=en')])
    const [htmlEs, htmlEn] = await Promise.all([es.text(), en.text()])
    expect(htmlEn).toMatch(/<html[^>]*\blang="en"/)
    expect(htmlEs).toMatch(/<html[^>]*\blang="es"/)
    // El resumen en inglés viene de la base (ProjectTranslation), no de un diccionario del front.
    const api = await (await request.get('/api/projects/la-rucula?lang=en')).json() as { data: { summary: string, untranslated: string[] } }
    expect(api.data.untranslated).not.toContain('summary')
    const head = api.data.summary.slice(0, 40)
    expect(htmlEn).toContain(head)
    expect(htmlEs).not.toContain(head)
  })

  test('la cookie pf-hyperfocus llega al SSR', async ({ request }) => {
    const html = await (await request.get('/', { headers: { cookie: 'pf-hyperfocus=true' } })).text()
    expect(html).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
  })

  test('?foco=1 entra en Hiperfoco y deja la cookie', async ({ request }) => {
    const res = await request.get('/?foco=1')
    expect(await res.text()).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
    expect(res.headers()['set-cookie']).toContain('pf-hyperfocus=true')
  })

  test('?vista=registro marca data-vista', async ({ request }) => {
    const html = await (await request.get('/projects?vista=registro')).text()
    expect(html).toMatch(/<html[^>]*\bdata-vista="registro"/)
  })
})

test.describe('direcciones canónicas', () => {
  const redirects: [string, string][] = [
    ['/experience', '/about#trayectoria'],
    ['/stack/gsap', '/projects?stack=gsap'],
    ['/cv', '/about?cv=ats'],
    ['/proyectos', '/projects'],
    ['/projects/arg-piscinas', '/projects/argpiscinas'],
    ['/orgs/la-rucula', '/projects?org=la-rucula'],
    ['/Projects/La-Rucula?lang=en', '/projects/la-rucula?lang=en'],
    ['/lab', '/'],
    ['/datos', '/'],
    ['/datos/projects', '/projects'],
    ['/cv/CV-ES-Mateo-Sonzogni.pdf', '/cv/CV-ES-Mateo-Sonzogni-ATS.pdf'],
  ]
  for (const [from, to] of redirects) {
    test(`${from} → 301 ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(301)
      expect(res.headers().location).toBe(to)
    })
  }
})

test('el sitemap lista 11 URL con su alternativa en inglés', async ({ request }) => {
  // /, /projects, /about, las 6 obras, /articles y el artículo del seed.
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml.match(/<url>/g)).toHaveLength(11)
  expect(xml.match(/hreflang="en"/g)).toHaveLength(11)
  expect(xml).not.toContain('null-net')
  expect(xml).not.toContain('lampone')
})
