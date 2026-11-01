import { expect, test, type APIRequestContext, type Locator, type Page, type TestInfo } from '@playwright/test'
import { auth, bar, sectionTab, signedIn, solidPng } from './admin-support'

/**
 * Los 5 minutos (invariante 4 de .claude/rules/admin.md): cargar una obra completa sin saber
 * programar. Recorre el alcance literal (lo esencial, síntesis, reto, resultado, un paso, tres
 * tecnologías, tres imágenes con su texto alternativo, en español, publicada) contando clics, campos
 * y guardados, y estima el tiempo con las constantes de la auditoría: 2 s por clic y 12 s por campo.
 * Tope: 16 clics, 15 campos, 2 guardados y 300 s. La obra bilingüe completa se mide e informa aparte.
 *
 *   node scripts/admin-run.mjs -- pnpm exec playwright test -c playwright.admin.config.ts tests/e2e/admin-flujo-obra.spec.ts
 *
 * Elegir tres archivos en el diálogo del sistema cuenta como 5 clics (abrir, tres elecciones y Abrir):
 * Playwright entrega los archivos sin dibujar ese diálogo. El Enter que elige una tecnología después de
 * escribirla es parte de ese campo, como en la auditoría (docs/rediseno/admin-sesion-5-minutos.md), y se
 * informa aparte. La sesión con una persona sigue siendo el gate humano.
 */
const SECONDS = { click: 2, field: 12 }
const LIMIT = { clicks: 16, fields: 15, saves: 2, seconds: 300 }
/**
 * La cuenta estricta (cada Enter que elige una tecnología como un clic más) hoy da 17: se fija ese
 * techo para que un cambio que sume pasos no pase sin que se note.
 */
const STRICT_CLICKS = 17
const SYSTEM_DIALOG_CLICKS = 4

const files = [
  solidPng('inicio.png', 64, 40, [200, 90, 40]),
  solidPng('carta.png', 64, 40, [40, 120, 200]),
  solidPng('celular.png', 30, 60, [60, 170, 90]),
]

/** Cuenta lo que hace una persona: cada clic, cada campo que escribe y cada guardado. */
class Tally {
  clicks = 0
  fields = 0
  keys = 0
  saves = 0
  constructor(private page: Page) {}
  async click(target: Locator): Promise<void> {
    this.clicks++
    await target.click()
  }

  async fill(target: Locator, text: string): Promise<void> {
    this.fields++
    await target.fill(text)
  }

  /** Escribe una tecnología y la elige con Enter: un campo. */
  async pick(target: Locator, text: string): Promise<void> {
    this.fields++
    this.keys++
    await target.fill(text)
    await this.page.keyboard.press('Enter')
  }

  async save(target: Locator): Promise<void> {
    this.saves++
    await this.click(target)
  }

  get seconds(): number {
    return this.clicks * SECONDS.click + this.fields * SECONDS.field
  }

  report(name: string): string {
    const m = Math.floor(this.seconds / 60)
    const s = this.seconds % 60
    const strict = this.seconds + this.keys * SECONDS.click
    return `${name}: ${this.clicks} clics, ${this.fields} campos, ${this.saves} guardados → ${this.clicks} × ${SECONDS.click} s + ${this.fields} × ${SECONDS.field} s = ${this.seconds} s (${m} min ${s} s). Contando cada Enter que elige una tecnología como clic: ${this.clicks + this.keys} clics y ${strict} s.`
  }
}

interface Project { id: number, slug: string, title: string, publishedAt: string | null, techs: { name: string }[], steps: unknown[], media: { role: string, alt: string, translations: { alt: string | null }[] }[] }

const CASE = {
  title: 'Casa Nómade',
  role: 'Diseño y desarrollo',
  summary: 'Un sitio para una casa de comidas, de la carta a las reservas.',
  brief: 'La carta vivía en un PDF que nadie actualizaba y las reservas llegaban por teléfono a cualquier hora.',
  outcome: 'La carta se actualiza desde un panel y las reservas llegan ordenadas, con la confirmación por correo.',
  step: { title: 'La carta primero', body: 'Se armó la carta como datos y no como imagen, para que se pueda leer en el celular y traducir.' },
  techs: ['Vue', 'GSAP', 'Vite'],
  alts: ['Inicio del sitio con la carta del día', 'La carta abierta en la categoría de platos', 'La carta en un teléfono'],
}

const ENGLISH = {
  title: 'Nomad House',
  role: 'Design and development',
  summary: 'A site for a restaurant, from the menu to the bookings.',
  brief: 'The menu lived in a PDF nobody updated and bookings came by phone at any hour.',
  outcome: 'The menu is updated from a panel and bookings arrive in order, confirmed by email.',
  step: { title: 'The menu first', body: 'The menu was built as data instead of an image, so it reads on a phone and can be translated.' },
  alts: ['Home page with the menu of the day', 'The menu open on the dishes category', 'The menu on a phone'],
}

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true })

async function loadProject(page: Page, tally: Tally, bilingual: boolean, title: string): Promise<void> {
  await tally.click(page.locator('#main').getByRole('button', { name: 'Nueva obra' }))
  await expect(page.locator('#main h1')).toHaveText('Nueva obra')

  await tally.fill(field(page, 'Título'), title)
  if (bilingual) await tally.fill(field(page, 'Título en inglés'), `${ENGLISH.title} ${title.slice(CASE.title.length)}`.trim())
  await tally.fill(field(page, 'Rol · Español'), CASE.role)
  if (bilingual) await tally.fill(field(page, 'Rol · Inglés'), ENGLISH.role)

  await tally.click(sectionTab(page, /^Relato/))
  for (const name of ['summary', 'brief', 'outcome'] as const) {
    const label = { summary: 'Síntesis', brief: 'Reto', outcome: 'Resultado' }[name]
    await tally.fill(field(page, `${label} · Español`), CASE[name])
    if (bilingual) await tally.fill(field(page, `${label} · Inglés`), ENGLISH[name])
  }
  await tally.click(page.getByRole('button', { name: 'Agregar paso' }))
  await tally.fill(field(page, 'Título del paso · Español'), CASE.step.title)
  if (bilingual) await tally.fill(field(page, 'Título del paso · Inglés'), ENGLISH.step.title)
  await tally.fill(field(page, 'Qué hiciste · Español'), CASE.step.body)
  if (bilingual) await tally.fill(field(page, 'Qué hiciste · Inglés'), ENGLISH.step.body)

  await tally.click(sectionTab(page, /^Datos/))
  const techs = page.getByRole('combobox', { name: 'Tecnologías de la obra' })
  for (const tech of CASE.techs) await tally.pick(techs, tech)
  await expect(page.getByRole('list', { name: 'Tecnologías de la obra' }).getByRole('listitem')).toHaveCount(3)

  await tally.click(sectionTab(page, /^Imágenes/))
  const chooser = page.waitForEvent('filechooser')
  await tally.click(page.getByRole('button', { name: 'Elegir archivos' }))
  await (await chooser).setFiles(files)
  tally.clicks += SYSTEM_DIALOG_CLICKS
  await expect(page.locator('[data-media-key]')).toHaveCount(3)
  // El foco va solo al texto alternativo de la primera, que queda como portada.
  await expect(field(page, 'Texto alternativo · Español').first()).toBeFocused()
  for (const [i, alt] of CASE.alts.entries()) {
    await tally.fill(field(page, 'Texto alternativo · Español').nth(i), alt)
    if (bilingual) await tally.fill(field(page, 'Texto alternativo · Inglés').nth(i), ENGLISH.alts[i]!)
  }

  // Publicar: el panel, «Mostrar en el sitio» y, si falta el inglés, «Publicar igual».
  await tally.click(page.locator('#main').getByRole('button', { name: /^Oculta/ }))
  await tally.click(page.getByRole('switch', { name: /Mostrar en el sitio/ }))
  const confirm = page.getByRole('dialog', { name: /para publicar$/ })
  if (bilingual) await expect(confirm).toHaveCount(0)
  else await tally.click(confirm.getByRole('button', { name: 'Publicar igual' }))
  await expect(page.getByRole('switch', { name: /Mostrar en el sitio/ })).toBeChecked()

  await tally.save(page.locator('#main').getByRole('button', { name: /^Guardar/ }))
  await expect(page.getByText('Obra creada').first()).toBeVisible()
  await expect(bar(page)).toContainText('Guardado', { timeout: 20000 })
  await expect(bar(page)).not.toContainText('por subir')
}

async function created(request: APIRequestContext, title: string): Promise<Project | undefined> {
  const rows = await (await request.get('/api/admin/projects', { headers: auth })).json() as Project[]
  return rows.find(p => p.title === title)
}

async function remove(request: APIRequestContext, title: string): Promise<void> {
  const found = await created(request, title)
  if (found) expect((await request.delete(`/api/admin/projects/${found.id}`, { headers: auth })).status()).toBe(204)
}

async function measured(page: Page, request: APIRequestContext, info: TestInfo, bilingual: boolean): Promise<Tally> {
  const title = `${CASE.title} ${bilingual ? 'bilingüe' : 'en español'} ${Date.now().toString(36)}`
  const posts: string[] = []
  page.on('request', (req) => {
    if (['POST', 'PUT'].includes(req.method()) && /\/api\/admin\/(projects|media)(\/\d+)?$/.test(new URL(req.url()).pathname)) posts.push(`${req.method()} ${new URL(req.url()).pathname}`)
  })
  await signedIn(page, '#/obras')
  const tally = new Tally(page)
  try {
    await loadProject(page, tally, bilingual, title)
    await expect.poll(async () => (await created(request, title))?.media.length ?? 0, { timeout: 15000 }).toBe(3)
    const project = (await created(request, title))!
    expect(posts.filter(p => p.startsWith('POST /api/admin/projects')), 'un solo alta de la obra').toHaveLength(1)
    expect(posts.filter(p => p === 'POST /api/admin/media'), 'las tres imágenes').toHaveLength(3)
    expect(project.publishedAt, 'publicada').not.toBeNull()
    expect(project.techs.map(t => t.name).sort()).toEqual(['GSAP', 'Vite', 'Vue 3'])
    expect(project.steps).toHaveLength(1)
    expect(project.media.filter(m => m.role === 'COVER')).toHaveLength(1)
    expect(project.media.map(m => m.alt).sort()).toEqual([...CASE.alts].sort())
    if (bilingual) expect(project.media.map(m => m.translations[0]?.alt).sort()).toEqual([...ENGLISH.alts].sort())
    // Se ve en el sitio: la API pública la sirve por su dirección.
    expect((await request.get(`/api/projects/${project.slug}`)).status()).toBe(200)
    await page.screenshot({ path: info.outputPath(`obra-${bilingual ? 'bilingue' : 'espanol'}-guardada.png`) })
    return tally
  }
  finally {
    await remove(request, title)
  }
}

test.describe('cargar una obra completa', () => {
  test(`en español y publicada: ≤ ${LIMIT.clicks} clics, ≤ ${LIMIT.fields} campos, ≤ ${LIMIT.saves} guardados y ≤ ${LIMIT.seconds} s`, async ({ page, request }, info) => {
    const tally = await measured(page, request, info, false)
    const line = tally.report('Obra en español')
    console.log(line)
    await info.attach('estimacion.txt', { body: line, contentType: 'text/plain' })
    expect(tally.clicks, 'clics').toBeLessThanOrEqual(LIMIT.clicks)
    expect(tally.clicks + tally.keys, 'clics contando cada Enter de tecnología').toBeLessThanOrEqual(STRICT_CLICKS)
    expect(tally.fields, 'campos').toBeLessThanOrEqual(LIMIT.fields)
    expect(tally.saves, 'guardados').toBeLessThanOrEqual(LIMIT.saves)
    expect(tally.seconds, 'estimación en segundos').toBeLessThanOrEqual(LIMIT.seconds)
  })

  test('bilingüe completa (para informar, sin tope)', async ({ page, request }, info) => {
    const tally = await measured(page, request, info, true)
    const line = tally.report('Obra bilingüe')
    console.log(line)
    await info.attach('estimacion-bilingue.txt', { body: line, contentType: 'text/plain' })
    expect(tally.saves, 'guardados').toBeLessThanOrEqual(LIMIT.saves)
  })
})
