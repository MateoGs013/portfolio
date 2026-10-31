import { expect, test } from '@playwright/test'
import shell from '../../app/lib/dict/shell'
import { HIDDEN_WORKS, WORKS } from './support'

/**
 * La ruta es el estado (docs/diseno.md §8): las canónicas responden 200 desde el SSR, solo las seis
 * obras publicadas existen, todo lo demás redirige con 301 conservando la query y el sitemap lista lo
 * mismo que se puede visitar. Se lee el HTML tal como llega, sin JS.
 */
const CANONICAL = [
  '/', '/projects', '/about', '/about?cv=ats', '/articles',
  '/projects?status=live', '/projects?stack=vue', '/?lang=en', '/projects?lang=en', '/about?cv=ats&lang=en',
  '/projects/la-rucula?vista=registro', '/about?foco=1',
]

const article = async (request: import('@playwright/test').APIRequestContext) =>
  ((await (await request.get('/api/articles')).json()) as { data: { slug: string }[] }).data[0]!.slug

test.describe('canónicas', () => {
  for (const path of CANONICAL) {
    test(`${path} responde 200 con un solo h1`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(200)
      const html = await res.text()
      expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
      expect(html).not.toMatch(/name="robots" content="noindex/)
    })
  }

  test('el artículo publicado responde 200 en los dos idiomas', async ({ request }) => {
    const slug = await article(request)
    for (const path of [`/articles/${slug}`, `/articles/${slug}?lang=en`]) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200)
    }
  })
})

test.describe('obras', () => {
  for (const slug of WORKS) {
    test(`/projects/${slug} existe en castellano y en inglés`, async ({ request }) => {
      for (const path of [`/projects/${slug}`, `/projects/${slug}?lang=en`]) {
        const res = await request.get(path, { maxRedirects: 0 })
        expect(res.status(), path).toBe(200)
        expect(await res.text()).toContain('data-vt="title"')
      }
    })
  }

  test('la lista de la API son exactamente las seis obras', async ({ request }) => {
    const { data } = await (await request.get('/api/projects')).json() as { data: { slug: string }[] }
    expect(data.map(p => p.slug).sort()).toEqual([...WORKS].sort())
  })

  for (const slug of [...HIDDEN_WORKS, 'no-existe']) {
    test(`/projects/${slug} da 404 con error.vue y noindex`, async ({ page, request }) => {
      expect((await request.get(`/api/projects/${slug}`)).status()).toBe(404)
      const res = await page.goto(`/projects/${slug}`)
      expect(res?.status()).toBe(404)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
      await expect(page.locator('h1')).toHaveText(shell['error.404.title'].es)
      // La marca de la cabecera también va a /: se busca el enlace de la página de error.
      await expect(page.locator('section:has(h1) a[href="/"]')).toBeVisible()
    })
  }
})

test.describe('alias con 301', () => {
  const redirects: [string, string][] = [
    ['/experience', '/about#trayectoria'],
    ['/experiencia?lang=en', '/about?lang=en#trayectoria'],
    ['/stack/gsap', '/projects?stack=gsap'],
    ['/cv', '/about?cv=ats'],
    ['/curriculum?lang=en', '/about?lang=en&cv=ats'],
    ['/contacto', '/#contacto'],
    ['/proyectos', '/projects'],
    ['/obra/ynara', '/projects/ynara'],
    ['/sobre-mi', '/about'],
    ['/blog', '/articles'],
    ['/projects/arg-piscinas', '/projects/argpiscinas'],
    ['/orgs/la-rucula', '/projects?org=la-rucula'],
    ['/Projects/La-Rucula?lang=en', '/projects/la-rucula?lang=en'],
    ['/lab', '/'],
    ['/datos', '/'],
    ['/datos/projects', '/projects'],
    ['/cv/CV-ES-Mateo-Sonzogni.pdf', '/cv/CV-ES-Mateo-Sonzogni-ATS.pdf'],
    ['/cv/CV-EN-Mateo-Sonzogni.pdf', '/cv/CV-EN-Mateo-Sonzogni-ATS.pdf'],
  ]
  for (const [from, to] of redirects) {
    test(`${from} → ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(301)
      const location = new URL(res.headers().location!, 'http://x')
      const expected = new URL(to, 'http://x')
      expect(location.pathname).toBe(expected.pathname)
      expect(location.hash).toBe(expected.hash)
      expect(Object.fromEntries(location.searchParams)).toEqual(Object.fromEntries(expected.searchParams))
    })
  }

  test('los PDF del CV existen, uno por idioma', async ({ request }) => {
    for (const lang of ['ES', 'EN']) {
      const res = await request.get(`/cv/CV-${lang}-Mateo-Sonzogni-ATS.pdf`)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('application/pdf')
    }
  })
})

test.describe('estado del SSR en <html>', () => {
  test('la cookie pf-hyperfocus y ?foco=1 llegan al SSR', async ({ request }) => {
    const cookie = await (await request.get('/', { headers: { cookie: 'pf-hyperfocus=true' } })).text()
    expect(cookie).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
    const res = await request.get('/?foco=1')
    expect(await res.text()).toMatch(/<html[^>]*\bdata-hyperfocus="true"/)
    expect(res.headers()['set-cookie']).toContain('pf-hyperfocus=true')
  })

  test('?vista=registro y la cookie pf-theme marcan <html>', async ({ request }) => {
    const html = await (await request.get('/projects?vista=registro', { headers: { cookie: 'pf-theme=light' } })).text()
    expect(html).toMatch(/<html[^>]*\bdata-vista="registro"/)
    expect(html).toMatch(/<html[^>]*\bdata-theme="light"/)
  })
})

test('el sitemap lista 11 páginas en castellano y en inglés, cada una con sus alternativas', async ({ request }) => {
  // /, /projects, /about, las 6 obras, /articles y el artículo del seed; cada una como ES y como EN.
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml.match(/<url>/g)).toHaveLength(22)
  expect(xml.match(/<loc>[^<]+\?lang=en<\/loc>/g)).toHaveLength(11)
  expect(xml.match(/hreflang="en"/g)).toHaveLength(22)
  for (const slug of WORKS) expect(xml).toContain(`/projects/${slug}</loc>`)
  for (const slug of HIDDEN_WORKS) expect(xml).not.toContain(slug)
})
