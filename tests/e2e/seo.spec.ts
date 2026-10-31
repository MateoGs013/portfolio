import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

/**
 * SEO, CSP y red (X3), contra `pnpm build && pnpm start`: metadatos desde la base, canonical sin
 * parámetros de vista, hreflang recíproco, og:image medida, JSON-LD que se parsea, `<html lang>`, las
 * 301, robots y sitemap, una CSP sin violaciones (también al reproducir un video) y una home que no le
 * pide nada a terceros.
 */

interface Head {
  lang: string | null
  title: string
  description: string | null
  canonical: string | null
  alternates: Record<string, string>
  og: Record<string, string>
  ld: unknown[]
}

/** El `<head>` del SSR, leído del HTML tal como llega (sin JS). */
async function headOf(request: APIRequestContext, path: string): Promise<Head> {
  const res = await request.get(path)
  expect(res.status(), path).toBe(200)
  const html = await res.text()
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null
  const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  const tags = (re: RegExp) => [...html.matchAll(re)].map(m => m[0])
  const og: Record<string, string> = {}
  for (const tag of tags(/<meta property="og:[^"]+"[^>]*>/g)) og[attr(tag, 'property')!] = decode(attr(tag, 'content') ?? '')
  const alternates: Record<string, string> = {}
  for (const tag of tags(/<link rel="alternate" hreflang="[^"]+"[^>]*>/g)) alternates[attr(tag, 'hreflang')!] = decode(attr(tag, 'href')!)
  const description = tags(/<meta name="description"[^>]*>/g)[0]
  const canonical = tags(/<link rel="canonical"[^>]*>/g)[0]
  return {
    lang: html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? null,
    title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ''),
    description: description ? decode(attr(description, 'content') ?? '') : null,
    canonical: canonical ? decode(attr(canonical, 'href')!) : null,
    alternates,
    og,
    ld: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g)].map(m => JSON.parse(m[1]!)),
  }
}

/** Una URL absoluta del sitio llevada a la ruta relativa, para pedirla al servidor de la prueba. */
const local = (url: string) => {
  const u = new URL(url)
  return `${u.pathname}${u.search}`
}

/** Medidas de un PNG (cabecera IHDR) o de un WebP (VP8X, VP8L o VP8). */
function imageSize(buf: Buffer): { width: number, height: number } | null {
  if (buf.subarray(1, 4).toString('latin1') === 'PNG') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  if (buf.subarray(0, 4).toString('latin1') !== 'RIFF' || buf.subarray(8, 12).toString('latin1') !== 'WEBP') return null
  const chunk = buf.subarray(12, 16).toString('latin1')
  if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21)
    return { width: 1 + (bits & 0x3FFF), height: 1 + ((bits >> 14) & 0x3FFF) }
  }
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF }
  return null
}

const typed = (ld: unknown[], type: string) => ld.find(item => (item as { '@type'?: string })['@type'] === type) as Record<string, unknown> | undefined

const article = async (request: APIRequestContext) =>
  ((await (await request.get('/api/articles')).json()) as { data: { slug: string }[] }).data[0]!.slug

test.describe('metadatos desde la base', () => {
  const pages = ['/', '/projects', '/projects/la-rucula', '/projects/ynara-web', '/about', '/articles']

  for (const path of pages) {
    test(`${path}: título, descripción, canonical y hreflang recíproco`, async ({ request }) => {
      const es = await headOf(request, `${path}${path.includes('?') ? '&' : '?'}vista=registro&foco=1&utm_source=x`)
      expect(es.lang).toBe('es')
      expect(es.title.length).toBeGreaterThan(3)
      expect(es.description?.length).toBeGreaterThan(10)
      // El canonical no lleva vista, foco ni basura: solo la ruta.
      expect(new URL(es.canonical!).pathname).toBe(path)
      expect(new URL(es.canonical!).search).toBe('')
      expect(es.alternates.es).toBe(es.canonical)
      expect(es.alternates['x-default']).toBe(es.canonical)
      expect(es.og['og:url']).toBe(es.canonical)
      expect(es.og['og:locale']).toBe('es_AR')

      // El otro idioma devuelve el par: su canonical es el `en` de este y su `es` es este canonical.
      const en = await headOf(request, local(es.alternates.en!))
      expect(en.lang).toBe('en')
      expect(en.canonical).toBe(es.alternates.en)
      expect(en.alternates.es).toBe(es.canonical)
      expect(en.alternates.en).toBe(en.canonical)
      expect(en.og['og:locale']).toBe('en_US')
      expect(new URL(en.canonical!).searchParams.get('lang')).toBe('en')
    })
  }

  test('las facetas de /projects quedan en el canonical; cv no', async ({ request }) => {
    const work = await headOf(request, '/projects?status=LIVE&vista=registro')
    expect(local(work.canonical!)).toBe('/projects?status=live')
    const cv = await headOf(request, '/about?cv=ats&lang=en')
    expect(local(cv.canonical!)).toBe('/about?lang=en')
  })

  test('un artículo tiene su canonical y su BlogPosting', async ({ request }) => {
    const slug = await article(request)
    const head = await headOf(request, `/articles/${slug}`)
    expect(local(head.canonical!)).toBe(`/articles/${slug}`)
    expect(typed(head.ld, 'BlogPosting')?.headline).toBeTruthy()
  })
})

test.describe('og:image', () => {
  async function checkImage(request: APIRequestContext, head: Head) {
    const url = head.og['og:image']!
    const width = Number(head.og['og:image:width'])
    const height = Number(head.og['og:image:height'])
    expect(head.og['og:image:alt']?.length).toBeGreaterThan(3)
    const res = await request.get(local(url))
    expect(res.status(), url).toBe(200)
    // La imagen mide lo que declara.
    expect(imageSize(await res.body())).toEqual({ width, height })
    return { url, width, height }
  }

  test('sin portada: la imagen por defecto de 1200x630', async ({ request }) => {
    for (const path of ['/', '/about', '/projects', '/projects/ynara-web']) {
      const image = await checkImage(request, await headOf(request, path))
      expect(new URL(image.url).pathname).toBe('/og/default.png')
      expect([image.width, image.height]).toEqual([1200, 630])
    }
  })

  test('una obra usa su COVER con sus medidas', async ({ request }) => {
    const api = await (await request.get('/api/projects/la-rucula')).json() as { data: { media: { role: string, kind: string, src: string, width: number, height: number }[] } }
    const cover = api.data.media.find(m => m.role === 'COVER' && m.kind === 'IMAGE')!
    const image = await checkImage(request, await headOf(request, '/projects/la-rucula'))
    expect(new URL(image.url).pathname).toBe(cover.src)
    expect([image.width, image.height]).toEqual([cover.width, cover.height])
  })
})

test.describe('JSON-LD', () => {
  test('Person y WebSite desde about y contact', async ({ request }) => {
    const [head, about, contact] = await Promise.all([
      headOf(request, '/'),
      request.get('/api/docs/about').then(r => r.json()),
      request.get('/api/docs/contact').then(r => r.json()),
    ])
    const field = (doc: { data: { fields: { name: string, value: unknown }[] } }, name: string) => doc.data.fields.find(f => f.name === name)?.value
    const person = typed(head.ld, 'Person')!
    expect(person.name).toBe(field(about, 'name'))
    expect(person.jobTitle).toBe(field(about, 'role'))
    expect(person.sameAs).toEqual([field(contact, 'github'), field(contact, 'linkedin')])
    expect(new URL((person.image as { url: string }).url).pathname).toBe(field(about, 'portrait'))
    const site = typed(head.ld, 'WebSite')!
    expect(site.name).toBe(field(about, 'display_name'))
    expect((site.publisher as { '@id': string })['@id']).toBe(person['@id'])
    // El inicio no lleva migas.
    expect(typed(head.ld, 'BreadcrumbList')).toBeUndefined()
  })

  test('BreadcrumbList por ruta y CreativeWork por obra', async ({ request }) => {
    const head = await headOf(request, '/projects/la-rucula?lang=en')
    const crumbs = typed(head.ld, 'BreadcrumbList')!.itemListElement as { position: number, name: string, item: string }[]
    expect(crumbs.map(c => local(c.item))).toEqual(['/?lang=en', '/projects?lang=en', '/projects/la-rucula?lang=en'])
    expect(crumbs.map(c => c.position)).toEqual([1, 2, 3])
    const work = typed(head.ld, 'CreativeWork')!
    expect(work.inLanguage).toBe('en')
    expect(local(work.url as string)).toBe('/projects/la-rucula?lang=en')
  })
})

test.describe('direcciones', () => {
  const redirects: [string, string][] = [
    ['/lab', '/'],
    ['/lab/', '/'],
    ['/Lab/Specimens?lang=en', '/?lang=en'],
    ['/showcase/x', '/'],
    ['/datos/lab', '/'],
    ['/projects/', '/projects'],
    ['/PROJECTS/LA-RUCULA/?lang=en&vista=registro', '/projects/la-rucula?lang=en&vista=registro'],
    ['/stack/vue-3?lang=en', '/projects?lang=en&stack=vue-3'],
    ['/about/', '/about'],
  ]
  for (const [from, to] of redirects) {
    test(`${from} → 301 ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(301)
      const location = new URL(res.headers().location!, 'http://x')
      const expected = new URL(to, 'http://x')
      expect(location.pathname).toBe(expected.pathname)
      expect(Object.fromEntries(location.searchParams)).toEqual(Object.fromEntries(expected.searchParams))
    })
  }

  test('robots.txt apunta al sitemap del mismo origen que el canonical', async ({ request }) => {
    const [robots, head] = await Promise.all([request.get('/robots.txt').then(r => r.text()), headOf(request, '/')])
    const sitemap = robots.match(/^Sitemap: (.+)$/m)?.[1]
    expect(sitemap).toBe(new URL('/sitemap.xml', head.canonical!).toString())
    expect(robots).toMatch(/^Disallow: \/admin$/m)
    const xml = await (await request.get(local(sitemap!))).text()
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!)
    expect(locs.length).toBeGreaterThan(0)
    expect(xml.match(/hreflang="en"/g)).toHaveLength(locs.length)
    expect(locs.every(loc => !loc.includes('lab'))).toBe(true)
  })
})

/** Junta las violaciones de CSP de la página desde antes de que corra cualquier script. */
async function watchCsp(page: Page) {
  const refused: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to/i.test(msg.text())) refused.push(msg.text())
  })
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`Refused to load ${e.blockedURI} (${e.violatedDirective})`)
    })
  })
  return refused
}

test.describe('CSP y red', () => {
  test('la CSP no nombra orígenes externos ni la API', async ({ request }) => {
    const csp = (await request.get('/')).headers()['content-security-policy']!
    expect(csp).toContain("default-src 'self'")
    expect(csp).not.toMatch(/https?:\/\/(?!localhost)/)
    expect(csp).not.toMatch(/fonts\.googleapis|fontshare|gstatic/)
  })

  test('sin violaciones de CSP en las cuatro páginas', async ({ page }) => {
    const refused = await watchCsp(page)
    for (const path of ['/', '/projects', '/projects/la-rucula', '/about', '/about?cv=ats']) {
      await page.goto(path, { waitUntil: 'networkidle' })
    }
    expect(refused).toEqual([])
  })

  test('sin violaciones de CSP al reproducir un video', async ({ page }) => {
    const refused = await watchCsp(page)
    await page.goto('/projects/la-rucula', { waitUntil: 'networkidle' })
    const video = page.locator('video').first()
    await video.scrollIntoViewIfNeeded()
    await video.evaluate(async (v: HTMLVideoElement) => {
      v.muted = true
      await v.play()
    })
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0)
    expect(refused).toEqual([])
  })

  test('la home no le pide nada a terceros', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin
    const outside: string[] = []
    page.on('request', (req) => {
      const url = req.url()
      if (!url.startsWith('data:') && !url.startsWith('blob:') && new URL(url).origin !== origin) outside.push(url)
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.mouse.wheel(0, 4000)
    await page.waitForLoadState('networkidle')
    expect(outside).toEqual([])
  })
})
