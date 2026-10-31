import { expect, test, type APIRequestContext } from '@playwright/test'
import shell from '../../app/lib/dict/shell'
import { api, docValue, head, WORKS } from './support'

/**
 * Castellano e inglés (decisión 4): el contenido en inglés sale de la base (las tablas *Translation),
 * la interfaz del diccionario de app/lib/dict. Con el seed actual no queda nada sin traducir: cada
 * `untranslated` de la API en inglés está vacío y la página no marca ningún bloque con lang="es".
 */

/** Todos los `untranslated` no vacíos de una respuesta, con su camino. */
function pending(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => pending(item, `${path}[${i}]`))
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => {
    if (key === 'untranslated') return Array.isArray(child) && child.length ? [`${path}: ${child.join(', ')}`] : []
    return pending(child, `${path}.${key}`)
  })
}

async function untranslated(request: APIRequestContext, path: string) {
  const res = await request.get(`/api${path}${path.includes('?') ? '&' : '?'}lang=en`)
  expect(res.status(), path).toBe(200)
  const body = await res.json() as { data: unknown, meta?: { lang?: string } }
  expect(body.meta?.lang ?? 'en', path).toBe('en')
  return pending(body.data, path)
}

/** El HTML del SSR con las entidades de Vue resueltas, para buscar el texto tal como lo da la API. */
const htmlOf = async (request: APIRequestContext, path: string) => (await (await request.get(path)).text())
  .replace(/&#39;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

test.describe('la API en inglés', () => {
  test('ninguna colección deja campos sin traducir', async ({ request }) => {
    const slug = (await api<{ slug: string }[]>(request, '/articles'))[0]!.slug
    const paths = ['/projects', '/experience', '/stack', '/orgs', '/docs/about', '/docs/contact', '/cv', '/articles', `/articles/${slug}`, ...WORKS.map(w => `/projects/${w}`)]
    const missing = (await Promise.all(paths.map(path => untranslated(request, path)))).flat()
    expect(missing).toEqual([])
  })
})

test.describe('el SSR en inglés', () => {
  test('el inicio: <html lang>, titular de la base y navegación del diccionario', async ({ request }) => {
    const [es, en] = await Promise.all([htmlOf(request, '/'), htmlOf(request, '/?lang=en')])
    expect(en).toMatch(/<html[^>]*\blang="en"/)
    expect(es).toMatch(/<html[^>]*\blang="es"/)
    const headline = { es: await docValue(request, 'about', 'headline', 'es') as string, en: await docValue(request, 'about', 'headline', 'en') as string }
    expect(headline.en).not.toBe(headline.es)
    expect(en).toContain(head(headline.en))
    expect(es).not.toContain(head(headline.en))
    expect(en).toContain(`>${shell['nav.work'].en}<`)
    expect(en).toContain(shell['shell.skip'].en)
  })

  for (const slug of WORKS) {
    test(`/projects/${slug}: el resumen y el brief en inglés vienen de la base`, async ({ request }) => {
      const [enApi, esApi] = await Promise.all([
        api<{ summary: string, brief: string | null }>(request, `/projects/${slug}?lang=en`),
        api<{ summary: string }>(request, `/projects/${slug}`),
      ])
      expect(enApi.summary).not.toBe(esApi.summary)
      const [htmlEn, htmlEs] = await Promise.all([htmlOf(request, `/projects/${slug}?lang=en`), htmlOf(request, `/projects/${slug}`)])
      expect(htmlEn).toContain(head(enApi.summary))
      if (enApi.brief) expect(htmlEn).toContain(head(enApi.brief))
      expect(htmlEs).not.toContain(head(enApi.summary))
    })
  }

  test('el CV en inglés: resumen y viñetas de /api/cv', async ({ request }) => {
    const cv = await api<{ summary: string, experience: { highlights: string[] }[] }>(request, '/cv?lang=en')
    const html = await htmlOf(request, '/about?cv=ats&lang=en')
    expect(html).toContain(head(cv.summary))
    expect(html).toContain(head(cv.experience[0]!.highlights[0]!))
  })

  test('el artículo en inglés: título de ArticleTranslation', async ({ request }) => {
    const slug = (await api<{ slug: string }[]>(request, '/articles'))[0]!.slug
    const [en, es] = await Promise.all([
      api<{ title: string }>(request, `/articles/${slug}?lang=en`),
      api<{ title: string }>(request, `/articles/${slug}`),
    ])
    expect(en.title).not.toBe(es.title)
    expect(await htmlOf(request, `/articles/${slug}?lang=en`)).toContain(head(en.title, 24))
  })
})

test.describe('en el navegador', () => {
  for (const path of ['/?lang=en', '/projects?lang=en', '/projects/la-rucula?lang=en', '/about?lang=en', '/about?cv=ats&lang=en']) {
    test(`${path} no marca contenido en castellano`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      // lang="es" solo aparece en un campo sin traducir (con el seed completo no hay ninguno) o en un
      // enlace al otro idioma, que lo declara con hreflang (el PDF del CV en castellano).
      const marked = await page.locator('#contenido [lang="es"], footer [lang="es"]').evaluateAll(els => els
        .filter(el => !el.closest('[hreflang="es"]')).map(el => el.outerHTML.slice(0, 120)))
      expect(marked).toEqual([])
    })
  }

  test('el selector de idioma conserva la ruta y los enlaces siguen en inglés', async ({ page }) => {
    await page.goto('/projects/ynara', { waitUntil: 'networkidle' })
    await page.locator('header[data-chrome] a[hreflang="en"]').first().evaluate((a: HTMLAnchorElement) => a.click())
    await expect(page).toHaveURL(/\/projects\/ynara\?lang=en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    for (const href of await page.locator('header[data-chrome] nav a').evaluateAll(as => as.map(a => a.getAttribute('href')!))) {
      if (!href.startsWith('#')) expect(href).toContain('lang=en')
    }
    await page.locator('header[data-chrome] a[hreflang="es"]').first().evaluate((a: HTMLAnchorElement) => a.click())
    await expect(page).toHaveURL(/\/projects\/ynara$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })
})
