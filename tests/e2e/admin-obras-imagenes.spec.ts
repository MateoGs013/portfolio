import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { deflateSync } from 'node:zlib'

/**
 * Obras (U7): Imágenes y Datos con un solo Guardar. Una obra nueva con lo esencial, el relato, tres
 * tecnologías y tres imágenes soltadas antes de existir se crea y sube todo en un guardado; reemplazar
 * la portada de La Rúcula conserva su fila, su inglés y el paso que la muestra; el selector de
 * métricas solo ofrece claves con rótulo y una cifra nueva pide su rótulo en los dos idiomas, que el
 * sitio en inglés muestra; los enlaces completan https:// y «Importar desde el repositorio» suma lo
 * que reconoce (GitHub simulado). Ningún aviso tapa la barra de acciones; axe y capturas a 1440 y 390.
 *
 *   pnpm build:admin
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-obras-imagenes.spec.ts
 *
 * admin-run copia la base. Los archivos sí van al disco (public/media/projects): la obra de prueba se
 * borra con los suyos y el archivo de La Rúcula se restaura al terminar.
 */
const token = process.env.PW_ADMIN_TOKEN!
const ADMIN = '/admin-next/'
const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
const auth = { Authorization: `Bearer ${token}` }
const PUBLIC = path.resolve('public')

interface En { locale: string, alt?: string | null, label?: string | null }
interface Media { id: number, kind: string, role: string, src: string, alt: string, order: number, translations: En[] }
interface Metric { key: string, label: string | null, translations: En[] }
interface Project {
  id: number, slug: string, title: string, url: string | null, repo: string | null, techs: { id: number, name: string }[]
  links: { id: number, label: string, url: string, translations: En[] }[], steps: { id: number, mediaId: number | null }[]
  media: Media[], metrics: Metric[]
}

/* ── Archivos de prueba: PNG reales, hechos acá ───────── */

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf: Buffer): number {
  let c = 0xFFFFFFFF
  for (const byte of buf) c = CRC[(c ^ byte) & 0xFF]! ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
/** Un PNG de color liso de `w`×`h`. */
function png(w: number, h: number, [r, g, b]: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const files = [
  { name: 'portada.png', mimeType: 'image/png', buffer: png(64, 40, [200, 90, 40]) },
  { name: 'galeria.png', mimeType: 'image/png', buffer: png(64, 40, [40, 120, 200]) },
  { name: 'celular.png', mimeType: 'image/png', buffer: png(30, 60, [60, 170, 90]) },
]

/* ── Ayudas ──────────────────────────────────────────── */

async function signedIn(page: Page, hash: string): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(a => a.effect?.getComputedTiming().endTime !== Infinity)
    .map(a => a.finished.catch(() => null))))
}

async function noSeriousAxe(page: Page): Promise<void> {
  await page.mouse.move(0, 0)
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
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
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true })
}

/** Ningún aviso visible se cruza con la barra de acciones del editor. */
async function toastsClearOfBar(page: Page): Promise<void> {
  const footer = await bar(page).boundingBox()
  expect(footer).toBeTruthy()
  for (const toast of await page.getByRole('region', { name: /avisos/i }).getByRole('listitem').all()) {
    const box = await toast.boundingBox()
    if (box) expect(box.y + box.height, 'un aviso tapa la barra').toBeLessThanOrEqual(footer!.y)
  }
}

async function project(request: APIRequestContext, id: number): Promise<Project> {
  const res = await request.get(`/api/admin/projects/${id}`, { headers: auth })
  expect(res.ok()).toBe(true)
  return await res.json() as Project
}

async function bySlug(request: APIRequestContext, slug: string): Promise<Project> {
  const res = await request.get('/api/admin/projects', { headers: auth })
  const found = (await res.json() as Project[]).find(p => p.slug === slug)
  expect(found, slug).toBeTruthy()
  return found!
}

/** Suelta archivos sobre la zona de subida, como un arrastre desde el escritorio. */
async function dropFiles(page: Page, list: typeof files): Promise<void> {
  const transfer = await page.evaluateHandle((items) => {
    const dt = new DataTransfer()
    for (const f of items) dt.items.add(new File([Uint8Array.from(atob(f.b64), c => c.charCodeAt(0))], f.name, { type: f.mimeType }))
    return dt
  }, list.map(f => ({ name: f.name, mimeType: f.mimeType, b64: f.buffer.toString('base64') })))
  const zone = page.locator('[data-field="media"]')
  for (const type of ['dragenter', 'dragover', 'drop']) await zone.dispatchEvent(type, { dataTransfer: transfer })
}

const bar = (page: Page) => page.locator('#main footer:not([data-dialog-footer])')
const tab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab', { name })
const save = (page: Page) => page.getByRole('button', { name: /^Guardar/ })

test.describe('Obras: imágenes y datos', () => {
  test('Imágenes y Datos: axe sin serias ni críticas y capturas a 1440 y 390 px', async ({ page, request }, info) => {
    const rucula = await bySlug(request, 'la-rucula')
    await signedIn(page, `#/obras/${rucula.id}/imagenes`)
    await expect(page.locator('[data-media-key]')).toHaveCount(rucula.media.length)
    await noSeriousAxe(page)
    await shot(page, info, 'imagenes-1440')
    await page.locator('[data-media-key]').nth(1).scrollIntoViewIfNeeded()
    await shot(page, info, 'imagenes-tarjeta-1440')
    await page.goto(`${ADMIN}#/obras/${rucula.id}/datos`)
    await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
    await noSeriousAxe(page)
    await shot(page, info, 'datos-1440')
    await page.locator('[data-metric-key]').first().scrollIntoViewIfNeeded()
    await shot(page, info, 'datos-metrica-1440')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${ADMIN}#/obras/${rucula.id}/imagenes`)
    await expect(page.locator('[data-media-key]').first()).toBeVisible()
    await noHorizontalScroll(page)
    await noSeriousAxe(page)
    await shot(page, info, 'imagenes-390')
    await page.goto(`${ADMIN}#/obras/${rucula.id}/datos`)
    await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
    await noHorizontalScroll(page)
    await shot(page, info, 'datos-390')
  })

  test('obra nueva completa en un solo Guardar: relato, tres tecnologías y tres imágenes soltadas antes de crearla', async ({ page, request }, info) => {
    const posts = { projects: 0, media: 0 }
    page.on('request', (req) => {
      if (req.method() !== 'POST') return
      if (/\/api\/admin\/projects$/.test(req.url())) posts.projects++
      if (/\/api\/admin\/media$/.test(req.url())) posts.media++
    })
    await signedIn(page, '#/obras/nueva')
    const name = `Obra con imágenes ${Date.now()}`
    await page.getByLabel('Título', { exact: true }).fill(name)
    await page.getByLabel('Rol · Español').fill('Diseño y desarrollo')

    await tab(page, /^Relato/).click()
    await page.getByLabel('Síntesis · Español').fill('Un sitio para una casa de comidas, de la carta a las reservas.')
    await page.getByLabel('Reto · Español').fill('La carta vivía en un PDF y las reservas por teléfono.')
    await page.getByLabel('Resultado · Español').fill('La carta se actualiza sola y las reservas llegan ordenadas.')
    await page.getByRole('button', { name: 'Agregar paso' }).click()
    await page.getByLabel('Título del paso · Español').fill('La carta primero')
    await page.getByLabel('Qué hiciste · Español').fill('Se armó la carta como datos, no como imagen.')

    await tab(page, /^Datos/).click()
    const techs = page.getByRole('combobox', { name: 'Tecnologías de la obra' })
    for (const tech of ['Vue', 'GSAP', 'Vite']) {
      await techs.fill(tech)
      await page.keyboard.press('Enter')
    }
    await expect(page.getByRole('list', { name: 'Tecnologías de la obra' }).getByRole('listitem')).toHaveCount(3)

    await tab(page, /^Imágenes/).click()
    await dropFiles(page, files)
    const cards = page.locator('[data-media-key]')
    await expect(cards).toHaveCount(3)
    await expect(page.getByLabel('Texto alternativo · Español').first()).toBeFocused()
    await expect(cards.first().getByRole('radio', { name: 'Portada' })).toBeChecked()
    await expect(cards.nth(1).getByRole('radio', { name: 'Galería' })).toBeChecked()
    await expect(cards.nth(2).getByRole('radio', { name: 'Celular' })).toBeChecked()
    await expect(bar(page)).toContainText('3 imágenes por subir')

    // Sin texto alternativo no se manda nada: el error cae en su campo.
    await save(page).click()
    await expect(page.getByLabel('Texto alternativo · Español').first()).toHaveAttribute('aria-invalid', 'true')
    expect(posts).toEqual({ projects: 0, media: 0 })

    const alts = ['Inicio del sitio con la carta del día', 'Galería de platos sobre fondo claro', 'La carta en el celular']
    for (const [i, alt] of alts.entries()) await page.getByLabel('Texto alternativo · Español').nth(i).fill(alt)
    await page.getByLabel('Texto alternativo · Inglés').first().fill('Home page with the menu of the day')
    await shot(page, info, 'obra-nueva-imagenes-1440')
    const find = async () => ((await (await request.get('/api/admin/projects', { headers: auth })).json()) as Project[]).find(p => p.title === name)
    try {
      await page.keyboard.press(`${mod}+s`)
      await expect(page.getByText('Obra creada').first()).toBeVisible()
      await toastsClearOfBar(page)
      await expect.poll(async () => (await find())?.media.length ?? 0, { timeout: 15000 }).toBe(3)
      const created = (await find())!
      expect(posts).toEqual({ projects: 1, media: 3 })
      expect(created.media.filter(m => m.role === 'COVER')).toHaveLength(1)
      expect(created.media.find(m => m.role === 'COVER')?.translations[0]?.alt).toBe('Home page with the menu of the day')
      expect(created.techs.map(t => t.name).sort()).toEqual(['GSAP', 'Vite', 'Vue 3'])
      // Sigue en Imágenes, ya con la obra creada y sus piezas guardadas.
      await expect(page).toHaveURL(new RegExp(`#/obras/${created.id}/imagenes$`))
      await expect(bar(page)).toContainText('Guardado')
      await expect(bar(page)).not.toContainText('por subir')
      await expect(page.locator('[data-media-key]')).toHaveCount(3)
      await expect(page.locator('[data-media-key]').first()).not.toContainText('Nueva: se sube al guardar')
      await shot(page, info, 'obra-nueva-guardada-1440')
    }
    finally {
      const created = await find()
      if (created) expect((await request.delete(`/api/admin/projects/${created.id}`, { headers: auth })).status()).toBe(204)
    }
  })

  test('reemplazar la portada de La Rúcula conserva su id, su inglés y el paso que la muestra', async ({ page, request }) => {
    const before = await bySlug(request, 'la-rucula')
    const cover = before.media.find(m => m.role === 'COVER' && m.kind === 'IMAGE')!
    const step = before.steps[0]!
    const original = path.join(PUBLIC, cover.src)
    const bytes = await readFile(original)
    // El paso 1 muestra la portada: así se ve que el reemplazo no lo suelta.
    const raw = await project(request, before.id) as Project & Record<string, unknown>
    expect((await request.put(`/api/admin/projects/${before.id}`, { headers: auth, data: putBody(raw, { stepMedia: cover.id }) })).ok()).toBe(true)

    let replaced = ''
    try {
      await signedIn(page, `#/obras/${before.id}/imagenes`)
      const card = page.locator(`[data-media-key="m${cover.id}"]`)
      await expect(card).toBeVisible()
      const chooser = page.waitForEvent('filechooser')
      await card.getByRole('button', { name: 'Reemplazar archivo' }).click()
      await (await chooser).setFiles(files[0]!)
      await expect(card).toContainText('Archivo nuevo: portada.png')
      await expect(bar(page)).toContainText('1 imagen por subir')
      await save(page).click()
      await expect(page.getByText('Obra guardada').first()).toBeVisible()

      await expect.poll(async () => (await project(request, before.id)).media.find(m => m.id === cover.id)?.src ?? '').not.toBe(cover.src)
      const after = await project(request, before.id)
      const piece = after.media.find(m => m.id === cover.id)!
      replaced = piece.src
      expect(piece.role).toBe('COVER')
      expect(piece.alt).toBe(cover.alt)
      expect(piece.translations[0]?.alt).toBe(cover.translations[0]?.alt)
      expect(after.steps.find(s => s.id === step.id)?.mediaId).toBe(cover.id)
      expect(after.media).toHaveLength(before.media.length)
      await toastsClearOfBar(page)
    }
    finally {
      await writeFile(original, bytes)
      if (replaced && replaced !== cover.src) await unlink(path.join(PUBLIC, replaced)).catch(() => undefined)
    }
  })

  test('métricas: solo claves con rótulo; una cifra nueva pide rótulo en los dos idiomas y el sitio en inglés lo muestra', async ({ page, request }, info) => {
    const before = await bySlug(request, 'la-rucula')
    await signedIn(page, `#/obras/${before.id}/datos`)
    const first = page.locator('[data-field="metrics[0].key"] select')
    const labels = await first.locator('option').allTextContents()
    expect(labels.length).toBeGreaterThan(10)
    for (const label of labels.filter(l => l.trim() && !/^Elegí/.test(l))) {
      expect(label, 'una clave sin rótulo').not.toMatch(/^\s*[a-z]+[A-Z]\w*\s*$/)
      if (!/^Otra cifra/.test(label)) expect(label).toMatch(/^\S.* \(\w+\)$/)
    }
    expect(labels.some(l => /^Bundle · Peso del JavaScript inicial.*\(bundleSizeKb\)$/.test(l))).toBe(true)

    await page.getByRole('button', { name: 'Agregar métrica' }).click()
    const n = before.metrics.length
    await page.locator(`[data-metric-key]`).nth(n).locator('select').first().selectOption({ label: 'Otra cifra, con rótulo propio' })
    await page.locator(`[data-field="metrics[${n}].key"] input`).fill('tiempoDeReserva')
    await page.locator(`[data-field="metrics[${n}].value"] input`).fill('45')
    await page.locator(`[data-field="metrics[${n}].unit"] select`).selectOption({ label: 'Segundos' })
    await page.locator(`[data-field="metrics[${n}].source"] input`).fill('Registro de reservas')
    await save(page).click()
    await expect(page.locator(`[data-field="metrics[${n}].label"] input`)).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator(`[data-field="metrics[${n}].translations.en.label"] input`)).toHaveAttribute('aria-invalid', 'true')

    await page.locator(`[data-field="metrics[${n}].label"] input`).fill('Tiempo de reserva')
    await page.locator(`[data-field="metrics[${n}].translations.en.label"] input`).fill('Booking time')
    await page.getByText('Ver JSON').click()
    await expect(page.locator('pre')).toContainText('"key": "tiempoDeReserva"')
    await save(page).click()
    await expect(page.getByText('Obra guardada').first()).toBeVisible()
    await toastsClearOfBar(page)
    await shot(page, info, 'datos-metricas-1440')

    const site = async (lang: string) => (await (await request.get(`/api/projects/la-rucula?lang=${lang}`)).json() as { data: { metrics: Metric[] } }).data.metrics
    await expect.poll(async () => (await site('en')).find(m => m.key === 'tiempoDeReserva')?.label).toBe('Booking time')
    expect((await site('es')).find(m => m.key === 'tiempoDeReserva')?.label).toBe('Tiempo de reserva')
    const after = await project(request, before.id)
    expect(after.metrics.map(m => m.key).slice(0, n)).toEqual(before.metrics.map(m => m.key))
  })

  test('enlaces con https:// completado e importación del repositorio, en el mismo Guardar', async ({ page, request }) => {
    const before = await bySlug(request, 'argpiscinas')
    await page.route('https://api.github.com/repos/**', async (route) => {
      const url = route.request().url()
      const body = url.endsWith('/languages') ? { TypeScript: 9000, Vue: 4000, Shell: 20 } : { description: 'Repositorio de prueba', homepage: null, topics: ['gsap', 'nuxt'] }
      await route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } })
    })
    await signedIn(page, `#/obras/${before.id}/datos`)
    await page.getByRole('button', { name: 'Importar desde el repositorio' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: /No están en el catálogo: Shell y nuxt/ })).toBeVisible()
    const chips = page.getByRole('list', { name: 'Tecnologías de la obra' })
    for (const tech of ['TypeScript', 'GSAP']) await expect(chips).toContainText(tech)

    await page.getByRole('button', { name: 'Agregar enlace' }).click()
    const i = before.links.length
    await page.locator(`[data-field="links[${i}].label"] input`).fill('Documentación')
    await page.locator(`[data-field="links[${i}].translations.en.label"] input`).fill('Documentation')
    const url = page.locator(`[data-field="links[${i}].url"] input`)
    await url.fill('ejemplo.com/docs')
    await url.blur()
    await expect(url).toHaveValue('https://ejemplo.com/docs')
    await page.keyboard.press(`${mod}+s`)
    await expect(page.getByText('Obra guardada').first()).toBeVisible()

    const after = await project(request, before.id)
    expect(after.techs.map(t => t.name)).toEqual(expect.arrayContaining(['TypeScript', 'GSAP']))
    const link = after.links.find(l => l.label === 'Documentación')!
    expect(link.url).toBe('https://ejemplo.com/docs')
    expect(link.translations[0]?.label).toBe('Documentation')
  })

})

/** El PUT que arma el editor con lo que devuelve GET, con el primer paso mostrando `stepMedia`. */
function putBody(p: Project & Record<string, unknown>, { stepMedia }: { stepMedia: number }) {
  type Tr = Record<string, string | null>
  const en = (list: unknown) => ((list as Tr[] | undefined)?.find(t => t['locale'] === 'en') ?? {}) as Tr
  const pick = (list: unknown, keys: string[]) => Object.fromEntries(keys.map(k => [k, en(list)[k] ?? '']))
  const steps = p['steps'] as { id: number, title: string, body: string, mediaId: number | null, translations: unknown }[]
  return {
    title: p.title, year: p['year'], role: p['role'], status: p['status'], featured: p['featured'], summary: p['summary'], brief: p['brief'], outcome: p['outcome'],
    url: p.url, repo: p.repo, publishedAt: p['publishedAt'], orgId: p['orgId'], techIds: p.techs.map(t => t.id),
    links: p.links.map(l => ({ id: l.id, label: l.label, url: l.url, translations: { en: pick(l.translations, ['label']) } })),
    steps: steps.map((s, i) => ({ id: s.id, title: s.title, body: s.body, mediaId: i === 0 ? stepMedia : s.mediaId, translations: { en: pick(s.translations, ['title', 'body']) } })),
    translations: { en: pick(p['translations'], ['title', 'role', 'summary', 'brief', 'outcome']) },
  }
}
