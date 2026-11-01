/**
 * Piezas comunes de las specs del admin nuevo que corren con playwright.admin.config.ts. Las lanza
 * scripts/admin-run.mjs, que deja en el entorno ADMIN_API_URL (el origen de la API, sin /api),
 * PW_ADMIN_TOKEN (la clave de la corrida, que nunca se imprime) y, con --web, ADMIN_WEB_URL.
 */
import { deflateSync } from 'node:zlib'
import AxeBuilder from '@axe-core/playwright'
import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'

export const token = process.env.PW_ADMIN_TOKEN!
export const ADMIN = '/admin/'
export const auth = { Authorization: `Bearer ${token}` }
export const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
export const erosUrl = process.env.HUNTER_API_URL ?? ''
/** Con --eros-mock HUNTER_API_URL apunta al simulado; sin él, a 127.0.0.1:9 (cerrado). */
export const withErosMock = !!erosUrl && !/:9\/?$/.test(erosUrl)

/** Entra sin pasar por el formulario: la clave en sessionStorage, como la deja el ingreso. */
export async function signedIn(page: Page, hash = '#/inicio'): Promise<void> {
  await page.addInitScript(key => sessionStorage.setItem('adm-token', key), token)
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
}

/** Va a otra pantalla con la sesión ya abierta y espera su h1 (el router procesa el hash después). */
export async function visit(page: Page, hash: string, heading?: string | RegExp): Promise<void> {
  await page.goto(`${ADMIN}${hash}`)
  const h1 = page.locator('#main h1')
  if (heading) await expect(h1).toHaveText(heading)
  else await expect(h1).toBeVisible()
}

/**
 * Abre la pantalla en una carga nueva y espera a que esté entera (red quieta y entradas terminadas).
 * Cambiar solo el hash deja un rato la pantalla anterior a la vista (el router y la View Transition
 * corren después): para revisar o fotografiar cada pantalla sin mezclarlas, se carga de cero.
 */
export async function openFresh(page: Page, hash: string): Promise<void> {
  await page.goto('about:blank')
  await page.goto(`${ADMIN}${hash}`)
  await expect(page.locator('#main h1')).toBeVisible()
  await page.waitForLoadState('networkidle')
  await settle(page)
}

/** Espera a que terminen las entradas: a mitad de un fundido el contraste medido es menor que el real. */
export async function settle(page: Page): Promise<void> {
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

/** axe sin violaciones serias ni críticas, con el puntero fuera de las filas (atenúa a las hermanas). */
export async function noSeriousAxe(page: Page, where = ''): Promise<void> {
  await page.mouse.move(0, 0)
  await holdToasts(page, true)
  await settle(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  await holdToasts(page, false)
  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`), where).toEqual([])
}

/** Ni la página ni la columna principal se desbordan a lo ancho. */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.documentElement
    const main = document.getElementById('main')
    return Math.max(root.scrollWidth - root.clientWidth, main ? main.scrollWidth - main.clientWidth : 0)
  })
}

export async function shot(page: Page, info: TestInfo, name: string, fullPage = false): Promise<void> {
  await settle(page)
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage })
}

/**
 * Las violaciones de CSP de la página, desde el arranque: el evento del documento y los avisos de la
 * consola («Refused to …»). Se instala antes del primer goto.
 */
export async function watchCsp(page: Page): Promise<() => Promise<string[]>> {
  const logged: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to (load|apply|execute|connect|frame)/i.test(msg.text())) logged.push(msg.text())
  })
  await page.addInitScript(() => {
    const seen: string[] = []
    Object.defineProperty(window, '__cspViolations', { value: seen })
    document.addEventListener('securitypolicyviolation', e => seen.push(`${e.violatedDirective} ${e.blockedURI}`))
  })
  return async () => {
    const fromPage = await page.evaluate(() => (window as unknown as { __cspViolations?: string[] }).__cspViolations ?? [])
    return [...logged, ...fromPage]
  }
}

/* ── API del admin ───────────────────────────────────── */

export async function apiGet<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(`/api/admin${path}`, { headers: auth })
  expect(res.ok(), `GET ${path} → ${res.status()}`).toBe(true)
  return await res.json() as T
}

export interface Named { id: number, slug: string, title?: string, name?: string, role?: string }

/** El id de un registro de la copia por su slug: la copia trae el contenido real del sitio. */
export async function idOf(request: APIRequestContext, path: string, slug: string): Promise<number> {
  const rows = await apiGet<Named[]>(request, path)
  const found = rows.find(r => r.slug === slug)
  expect(found, `${path} trae ${slug}`).toBeTruthy()
  return found!.id
}

/** Lo que cambia solo con guardar (fechas de la fila): se saca antes de comparar dos GET. */
export function withoutStamps(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutStamps)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'updatedAt')
    .map(([key, inner]) => [key, withoutStamps(inner)]))
}

/* ── Todas las pantallas ─────────────────────────────── */

export interface View { name: string, hash: string }

/**
 * Cada lista, cada editor (con sus secciones) y cada etapa, con registros reales de la copia. Las de
 * Búsqueda laboral necesitan --demo (o el Eros simulado) para tener filas y registros que abrir.
 */
export async function allViews(request: APIRequestContext): Promise<View[]> {
  const project = await idOf(request, '/projects', 'la-rucula')
  const entry = await idOf(request, '/experience', 'la-rucula')
  const article = (await apiGet<{ id: number }[]>(request, '/articles'))[0]!.id
  const tech = await idOf(request, '/techs', 'gsap')
  const org = await idOf(request, '/orgs', 'la-rucula-gastrobar')
  const views: View[] = [
    { name: 'Inicio', hash: '#/inicio' },
    { name: 'Obras', hash: '#/obras' },
    { name: 'Orden del sitio', hash: '#/obras?vista=orden' },
    { name: 'Nueva obra', hash: '#/obras/nueva' },
    ...['esencial', 'relato', 'imagenes', 'datos'].map(s => ({ name: `Obra · ${s}`, hash: `#/obras/${project}/${s}` })),
    { name: 'Trayectoria', hash: '#/trayectoria' },
    { name: 'Vista CV', hash: '#/trayectoria/cv' },
    { name: 'Nueva experiencia', hash: '#/trayectoria/nueva' },
    ...['esencial', 'relato', 'cv'].map(s => ({ name: `Experiencia · ${s}`, hash: `#/trayectoria/${entry}${s === 'esencial' ? '' : `?seccion=${s}`}` })),
    { name: 'Artículos', hash: '#/articulos' },
    { name: 'Nuevo artículo', hash: '#/articulos/nuevo' },
    ...['esencial', 'texto'].map(s => ({ name: `Artículo · ${s}`, hash: `#/articulos/${article}${s === 'esencial' ? '' : `?seccion=${s}`}` })),
    { name: 'Sobre mí', hash: '#/perfil/sobre-mi' },
    { name: 'Contacto', hash: '#/perfil/contacto' },
    { name: 'Tecnologías', hash: '#/tecnologias' },
    { name: 'Tecnología', hash: `#/tecnologias/${tech}` },
    { name: 'Empresas', hash: '#/empresas' },
    { name: 'Empresa', hash: `#/empresas/${org}` },
    { name: 'Vacantes', hash: '#/busqueda/vacantes' },
    { name: 'Publicaciones', hash: '#/busqueda/publicaciones' },
    { name: 'Tendencias', hash: '#/busqueda/tendencias' },
    { name: 'Pantalla que no existe', hash: '#/no-hay-nada-aca' },
  ]
  const jobs = await request.get('/api/admin/hunter/jobs', { headers: auth })
  if (jobs.ok()) {
    const job = (await jobs.json() as { id: string }[])[0]!.id
    views.push(...['analisis', 'mensaje', 'cv', 'postular'].map(s => ({ name: `Vacante · ${s}`, hash: `#/busqueda/vacantes/${job}/${s}` })))
  }
  const posts = await request.get('/api/admin/content/posts', { headers: auth })
  if (posts.ok()) views.push({ name: 'Publicación', hash: `#/busqueda/publicaciones/${(await posts.json() as { id: string }[])[0]!.id}` })
  const trends = await request.get('/api/admin/radar/trends', { headers: auth })
  if (trends.ok()) views.push({ name: 'Tendencia', hash: `#/busqueda/tendencias/${(await trends.json() as { id: string }[])[0]!.id}` })
  return views
}

/* ── Imágenes de prueba: PNG reales, hechos acá ───────── */

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

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** Un PNG de color liso de `w`×`h`, listo para setInputFiles. */
export function solidPng(name: string, w: number, h: number, [r, g, b]: [number, number, number]): { name: string, mimeType: string, buffer: Buffer } {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  const buffer = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))])
  return { name, mimeType: 'image/png', buffer }
}

/* ── Editor ──────────────────────────────────────────── */

/** La barra de acciones del editor (no el pie de un diálogo). */
export const bar = (page: Page) => page.locator('#main footer:not([data-dialog-footer])')
export const sectionTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Secciones del registro' }).getByRole('tab', { name })
export const saveButton = (page: Page) => page.locator('#main').getByRole('button', { name: /^Guardar/ })
export const saveState = (page: Page) => bar(page).getByRole('status').first()
export const palette = (page: Page) => page.getByRole('dialog', { name: 'Ir a' })

/* ── Vacantes ────────────────────────────────────────── */

export interface PastedJob { title: string, company: string, description: string, email: string }

export const PASTED_ES: PastedJob = {
  title: 'Desarrollador Frontend Vue 3 (auditoría)',
  company: 'Estudio de Prueba',
  description: 'Buscamos una persona para el equipo de producto que construya interfaces con Vue 3, Nuxt y TypeScript. Suma experiencia con GSAP, Tailwind CSS y PostgreSQL. Trabajo remoto desde Argentina, contratación directa.',
  email: 'postulaciones@example.com',
}

export const PASTED_EN: PastedJob = {
  title: 'Frontend Engineer, Vue and Nuxt (audit)',
  company: 'Example Studio',
  description: 'We are looking for a frontend engineer to build product interfaces with Vue 3, Nuxt and TypeScript. Experience with GSAP, Tailwind CSS and PostgreSQL is a plus. Fully remote position for the Americas, full time contract.',
  email: 'jobs@example.com',
}

/** Pega una vacante desde la cola y devuelve su id (manual-…), ya en su etapa Análisis. */
export async function pasteJob(page: Page, job: PastedJob): Promise<string> {
  await page.getByRole('button', { name: /^Pegar una vacante/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Pegar una vacante' })
  await expect(dialog.getByLabel('Puesto')).toBeFocused()
  await dialog.getByLabel('Puesto').fill(job.title)
  await dialog.getByLabel('Empresa').fill(job.company)
  await dialog.getByLabel('Descripción del aviso').fill(job.description)
  await dialog.getByLabel('Correo de contacto').fill(job.email)
  await dialog.getByRole('button', { name: 'Agregar a la cola' }).click()
  await expect(page).toHaveURL(/#\/busqueda\/vacantes\/manual-[a-z0-9]+\/analisis$/)
  await expect(page.locator('#main h1')).toHaveText(job.title)
  return decodeURIComponent(page.url().match(/vacantes\/(manual-[a-z0-9]+)\//)![1]!)
}

export const jobStage = (page: Page, name: string) => page.getByRole('navigation', { name: 'Etapas de la vacante' }).getByRole('link', { name })
