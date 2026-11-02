/**
 * GET /api/admin/pending: la bandeja del Inicio, calculada desde la base con las reglas de la API
 * pública. Cada fila dice qué falta y lleva al campo exacto (`?campo=` con la ruta del body):
 * - obras ocultas o programadas y, de las visibles, sin portada, imágenes sin inglés, campos sin
 *   inglés (translations.ts, viñeta por viñeta) y métricas sin fuente o sin fecha;
 * - artículos en borrador, programados o publicados sin fecha, y el inglés de los visibles;
 * - experiencias del CV sin viñetas o con el inglés incompleto, y el resto del inglés de la trayectoria;
 * - bloques requeridos de about y contact vacíos o faltantes;
 * - el PDF del CV del sitio cuando ya no coincide con la base (cvStamp.ts);
 * - media y retrato que apuntan a un archivo que ya no está en el servidor (sin volumen persistente,
 *   lo subido desde el admin se pierde en cada deploy: DEPLOY.md, paso 6).
 * Lo que el sitio no muestra (una obra oculta, un borrador) solo pide publicarse: su inglés no se lista.
 */
import { access } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import { db } from '../db.js'
import { hasDocValue, docFieldsOf } from '../content/docFields.js'
import { isVisible, isVisibleArticle } from '../content/visibility.js'
import type { PendingItem, PendingKind, UntranslatedRecord } from '../shared/adminContracts.js'
import { docKeys, docSchemas, type DocKey } from '../shared/docSchema.js'
import { readOr503 } from './common.js'
import { cvDrift } from './cvStamp.js'
import { capitalize, describeFields, joinEs, longDay, plural } from './pendingText.js'
import { untranslatedRecords } from './translations.js'

const ORDER: readonly PendingKind[] = ['cv_pdf', 'media_missing', 'hidden', 'scheduled', 'draft', 'no_cover', 'media_english', 'english', 'metrics', 'cv_bullets', 'cv_english', 'profile']

const SHOWN_IN_ENGLISH = 'el sitio en inglés muestra el español en su lugar.'
/** La ruta con ?campo=; los corchetes de las rutas del body quedan legibles (`metrics[0].source`). */
const campo = (route: string, field: string) => `${route}?campo=${encodeURIComponent(field).replace(/%5B/g, '[').replace(/%5D/g, ']')}`

/** La sección de la obra donde se edita cada campo (projectModel.sections del admin). */
function projectSection(path: string): string {
  const root = path.replace(/^translations\.en\./, '').split(/[.[]/)[0] ?? ''
  if (['summary', 'brief', 'outcome', 'steps'].includes(root)) return 'relato'
  if (root === 'media') return 'imagenes'
  if (['techIds', 'links', 'metrics'].includes(root)) return 'datos'
  return 'esencial'
}

const projectRoute = (id: number, field: string) => campo(`/obras/${id}/${projectSection(field)}`, field)
const DOC_ROUTE: Record<DocKey, string> = { about: '/perfil/sobre-mi', contact: '/perfil/contacto' }

type Untranslated = Map<string, string[]>
const keyOf = (collection: UntranslatedRecord['collection'], id: number | string) => `${collection}:${id}`

/** «Ninguna de sus 7 métricas tiene fuente ni fecha», «De 4 métricas, 1 sin fuente». */
function metricGaps(total: number, noSource: number, noDate: number): string {
  if (noSource === total && noDate === total) return total === 1 ? 'Su única métrica no tiene fuente ni fecha' : `Ninguna de sus ${total} métricas tiene fuente ni fecha`
  const parts = [noSource && `${noSource} sin fuente`, noDate && `${noDate} sin fecha`].filter(Boolean) as string[]
  return `De ${plural(total, 'métrica', 'métricas')}, ${joinEs(parts)}`
}

// ─── Archivos ───────────────────────────────────────────────────────────────

const PUBLIC_DIR = path.resolve('public')
const MEDIA_ROOT = path.join(PUBLIC_DIR, 'media')

/**
 * Si una ruta del sitio (`/media/projects/…`) tiene su archivo en el disco. Lo que no es una ruta
 * local de /media (una dirección externa, un valor vacío) no se revisa.
 */
async function fileMissing(src: string | null | undefined): Promise<boolean> {
  if (!src || !src.startsWith('/media/')) return false
  let file: string
  try {
    file = path.resolve(PUBLIC_DIR, `.${decodeURI(src.split(/[?#]/)[0]!)}`)
  }
  catch {
    return false
  }
  if (!file.startsWith(`${MEDIA_ROOT}${path.sep}`)) return false
  try {
    await access(file)
    return false
  }
  catch {
    return true
  }
}

// ─── Obras ──────────────────────────────────────────────────────────────────

/** Los índices (en el orden del formulario) de las piezas con algún archivo que falta. */
async function missingMedia(media: readonly { src: string, srcWebm: string | null, poster: string | null }[]): Promise<number[]> {
  const flags = await Promise.all(media.map(async m => (await Promise.all([m.src, m.srcWebm, m.poster].map(fileMissing))).some(Boolean)))
  return flags.flatMap((lost, i) => (lost ? [i] : []))
}

async function projectItems(untranslated: Untranslated): Promise<PendingItem[]> {
  const rows = await db.project.findMany({
    orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    select: {
      id: true, title: true, publishedAt: true,
      media: { orderBy: [{ role: 'asc' }, { order: 'asc' }], select: { role: true, src: true, srcWebm: true, poster: true } },
      metrics: { orderBy: { order: 'asc' }, select: { source: true, measuredAt: true } },
    },
  })
  // El índice es el del formulario del admin (portadas primero, después por orden), como en translations.ts.
  const missing = new Map(await Promise.all(rows.map(async p => [p.id, await missingMedia(p.media)] as const)))
  return rows.flatMap((p): PendingItem[] => {
    const record = { collection: 'projects' as const, id: p.id, title: p.title }
    if (!p.publishedAt) {
      return [{ kind: 'hidden', record, field: 'publishedAt', headline: `${p.title} está oculta`, message: 'No se ve en el sitio, en Obras ni en las relaciones hasta que tenga fecha de publicación.', route: projectRoute(p.id, 'publishedAt') }]
    }
    if (!isVisible(p)) {
      return [{ kind: 'scheduled', record, field: 'publishedAt', headline: `${p.title} está programada`, message: `Se publica sola el ${longDay(p.publishedAt)}; hasta entonces no se ve en el sitio.`, route: projectRoute(p.id, 'publishedAt') }]
    }
    const items: PendingItem[] = []
    const lost = missing.get(p.id) ?? []
    if (lost.length) {
      const field = `media[${lost[0]}]`
      items.push({
        kind: 'media_missing', record, field,
        headline: `${lost.length === 1 ? 'Una imagen' : `${lost.length} imágenes`} de ${p.title} ya no ${lost.length === 1 ? 'está' : 'están'} en el servidor`,
        message: 'El sitio muestra la imagen rota. Volvé a subir el archivo: hoy el servidor pierde lo subido cada vez que se publica una versión nueva del sitio.',
        route: projectRoute(p.id, field),
      })
    }
    if (!p.media.some(m => m.role === 'COVER')) {
      items.push({ kind: 'no_cover', record, field: 'media', headline: `${p.title} no tiene portada`, message: 'La tarjeta y el caso muestran el título sobre una placa lisa.', route: projectRoute(p.id, 'media') })
    }
    const fields = untranslated.get(keyOf('projects', p.id)) ?? []
    const media = fields.filter(f => f.startsWith('media['))
    if (media.length) {
      const alt = new Set(media.filter(f => f.endsWith('.alt')).map(f => f.split(']')[0]))
      const caption = new Set(media.filter(f => f.endsWith('.caption')).map(f => f.split(']')[0]))
      const parts = [alt.size && plural(alt.size, 'texto alternativo', 'textos alternativos'), caption.size && plural(caption.size, 'pie de foto', 'pies de foto')].filter(Boolean) as string[]
      const field = media.find(f => f.endsWith('.alt')) ?? media[0]!
      items.push({ kind: 'media_english', record, field, headline: `Imágenes de ${p.title} sin inglés`, message: `${capitalize(joinEs(parts))} sin inglés: en el caso en inglés se lee el español.`, route: projectRoute(p.id, field) })
    }
    const texts = fields.filter(f => !f.startsWith('media['))
    if (texts.length) {
      items.push({ kind: 'english', record, field: texts[0]!, headline: `Falta el inglés en ${p.title}`, message: `${describeFields({ model: 'Project' }, texts)}: ${SHOWN_IN_ENGLISH}`, route: projectRoute(p.id, texts[0]!) })
    }
    const noSource = p.metrics.filter(m => !m.source?.trim()).length
    const noDate = p.metrics.filter(m => !m.measuredAt).length
    if (noSource || noDate) {
      const at = p.metrics.findIndex(m => !m.source?.trim())
      const field = at >= 0 ? `metrics[${at}].source` : `metrics[${p.metrics.findIndex(m => !m.measuredAt)}].measuredAt`
      items.push({
        kind: 'metrics', record, field,
        headline: `Métricas de ${p.title} ${noSource ? 'sin fuente' : 'sin fecha'}`,
        message: `${metricGaps(p.metrics.length, noSource, noDate)}. Una cifra sin respaldo no se sostiene en una entrevista.`,
        route: projectRoute(p.id, field),
      })
    }
    return items
  })
}

// ─── Artículos ──────────────────────────────────────────────────────────────

async function articleItems(untranslated: Untranslated): Promise<PendingItem[]> {
  const rows = await db.article.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], select: { id: true, title: true, status: true, publishedAt: true } })
  return rows.flatMap((a): PendingItem[] => {
    const record = { collection: 'articles' as const, id: a.id, title: a.title }
    const route = (field: string) => campo(`/articulos/${a.id}`, field)
    // Archivar es deliberado: un artículo archivado no queda pendiente.
    if (a.status === 'ARCHIVED') return []
    if (a.status === 'DRAFT') {
      return [{ kind: 'draft', record, field: 'publishedAt', headline: `${a.title} es un borrador`, message: 'No se lista en Artículos hasta que lo publiques.', route: route('publishedAt') }]
    }
    if (!a.publishedAt) {
      return [{ kind: 'hidden', record, field: 'publishedAt', headline: `${a.title} no tiene fecha de publicación`, message: 'Figura como publicado, pero sin fecha el sitio no lo lista.', route: route('publishedAt') }]
    }
    if (!isVisibleArticle(a)) {
      return [{ kind: 'scheduled', record, field: 'publishedAt', headline: `${a.title} está programado`, message: `Se publica solo el ${longDay(a.publishedAt)}; hasta entonces no se lista.`, route: route('publishedAt') }]
    }
    const fields = untranslated.get(keyOf('articles', a.id)) ?? []
    if (!fields.length) return []
    return [{ kind: 'english', record, field: fields[0]!, headline: `Falta el inglés en ${a.title}`, message: `${describeFields({ model: 'Article' }, fields)}: ${SHOWN_IN_ENGLISH}`, route: route(fields[0]!) }]
  })
}

// ─── Trayectoria y tecnologías ──────────────────────────────────────────────

/** Lo que el CV muestra de cada entrada (content/cv.ts): solo esto deja el CV en inglés a medias. */
const CV_FIELD = /^translations\.en\.(role|location|highlights\[\d+\])$/

async function experienceItems(untranslated: Untranslated): Promise<PendingItem[]> {
  const rows = await db.experience.findMany({
    orderBy: [{ cvOrder: { sort: 'asc', nulls: 'last' } }, { startedAt: 'desc' }],
    select: { id: true, role: true, kind: true, cvOrder: true, highlights: true, org: { select: { name: true } }, projects: { orderBy: { id: 'asc' }, take: 1, select: { title: true } } },
  })
  return rows.flatMap((e) => {
    // El mismo título que el CV y la lista del admin: la empresa, si no la obra, si no el rol.
    const title = e.org?.name ?? e.projects[0]?.title ?? e.role
    const record = { collection: 'experience' as const, id: e.id, title }
    const route = (field: string) => campo(`/trayectoria/${e.id}`, field)
    const inCv = e.kind === 'EDUCATION' || e.cvOrder !== null
    const fields = untranslated.get(keyOf('experience', e.id)) ?? []
    const cvFields = inCv ? fields.filter(f => CV_FIELD.test(f)) : []
    const others = fields.filter(f => !cvFields.includes(f))
    const items: PendingItem[] = []
    if (e.kind !== 'EDUCATION' && e.cvOrder !== null && !e.highlights.some(h => h.trim())) {
      items.push({ kind: 'cv_bullets', record, field: 'highlights', headline: `${title} entra al CV sin viñetas`, message: 'En la hoja quedan solo el rol y las fechas: sumale hasta tres viñetas.', route: route('highlights') })
    }
    if (cvFields.length) {
      items.push({ kind: 'cv_english', record, field: cvFields[0]!, headline: `El CV en inglés de ${title} está incompleto`, message: `${describeFields({ model: 'Experience' }, cvFields)} sin inglés: el CV en inglés muestra el español en su lugar.`, route: route(cvFields[0]!) })
    }
    if (others.length) {
      items.push({ kind: 'english', record, field: others[0]!, headline: `Falta el inglés en ${title}`, message: `${describeFields({ model: 'Experience' }, others)}: ${SHOWN_IN_ENGLISH}`, route: route(others[0]!) })
    }
    return items
  })
}

function techItems(records: readonly UntranslatedRecord[]): PendingItem[] {
  return records.filter(r => r.collection === 'techs').map(r => ({
    kind: 'english' as const,
    record: { collection: 'techs' as const, id: r.id, title: r.title },
    field: r.fields[0]!,
    headline: `Falta el inglés en ${r.title}`,
    message: `${describeFields({ model: 'Tech' }, r.fields)}: ${SHOWN_IN_ENGLISH}`,
    route: campo(`/tecnologias/${r.id}`, r.fields[0]!),
  }))
}

// ─── Perfil ─────────────────────────────────────────────────────────────────

async function profileItems(records: readonly UntranslatedRecord[]): Promise<PendingItem[]> {
  const rows = await db.doc.findMany({ where: { key: { in: docKeys } } })
  const images = docKeys.flatMap(key => docSchemas[key].blocks.filter(b => b.type === 'image').map(b => docFieldsOf(rows.find(r => r.key === key)?.fields, key).find(f => f.name === b.name)?.value))
  const missingFiles = new Set<string>()
  for (const value of images) if (typeof value === 'string' && await fileMissing(value)) missingFiles.add(value)
  return docKeys.flatMap((key) => {
    const schema = docSchemas[key]
    const stored = docFieldsOf(rows.find(r => r.key === key)?.fields, key)
    const record = { collection: 'docs' as const, id: key, title: schema.label }
    const blocks = schema.blocks.flatMap((block): PendingItem[] => {
      const field = stored.find(f => f.name === block.name)
      const empty = !field || !hasDocValue(field.value)
      const noEnglish = !empty && block.type === 'localizedPath' && !hasDocValue(field.en)
      if (!empty && !noEnglish) return []
      const path = empty ? `fields.${block.name}` : `fields.${block.name}.en`
      return [{ kind: 'profile', record, field: path, headline: `Falta «${block.label}»${noEnglish ? ' en inglés' : ''} en ${schema.label}`, message: block.help, route: campo(DOC_ROUTE[key], path) }]
    })
    for (const block of schema.blocks.filter(b => b.type === 'image')) {
      const value = stored.find(f => f.name === block.name)?.value
      if (typeof value !== 'string' || !missingFiles.has(value)) continue
      const path = `fields.${block.name}`
      blocks.unshift({ kind: 'media_missing', record, field: path, headline: `«${block.label}» de ${schema.label} ya no está en el servidor`, message: 'El sitio muestra la imagen rota. Volvé a subirla: hoy el servidor pierde lo subido cada vez que se publica una versión nueva del sitio.', route: campo(DOC_ROUTE[key], path) })
    }
    const english = records.find(r => r.collection === 'docs' && r.id === key)?.fields ?? []
    if (english.length) {
      blocks.push({ kind: 'english', record, field: english[0]!, headline: `Falta el inglés en ${schema.label}`, message: `${describeFields({ doc: key }, english)}: ${SHOWN_IN_ENGLISH}`, route: campo(DOC_ROUTE[key], english[0]!) })
    }
    return blocks
  })
}

// ─── PDF del CV ─────────────────────────────────────────────────────────────

async function cvPdfItems(): Promise<PendingItem[]> {
  const { stamp, changed } = await cvDrift()
  if (!changed.length) return []
  const which = changed.length === 2 ? 'en español y en inglés' : changed[0] === 'es' ? 'en español' : 'en inglés'
  const since = stamp ? `Cambió el CV ${which} desde que se generaron, el ${longDay(stamp.at)}.` : 'No hay sello de la última vez que se generaron.'
  return [{
    kind: 'cv_pdf',
    record: { collection: 'cv', id: 'pdf', title: 'PDF del CV' },
    headline: 'El PDF del CV no coincide con la base',
    message: `${since} Regenerá los PDF con pnpm cv:pdf y commitealos.`,
    route: changed.length === 1 && changed[0] === 'en' ? '/trayectoria/cv?idioma=en' : '/trayectoria/cv',
  }]
}

export async function pendingItems(): Promise<PendingItem[]> {
  const records = await untranslatedRecords()
  const untranslated: Untranslated = new Map(records.map(r => [keyOf(r.collection, r.id), r.fields]))
  const groups = await Promise.all([
    cvPdfItems(), projectItems(untranslated), articleItems(untranslated), experienceItems(untranslated), profileItems(records),
  ])
  const items = [...groups.flat(), ...techItems(records)]
  return items.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
}

export const pendingRouter = Router()

pendingRouter.get('/pending', async (_req, res) => {
  const items = await readOr503(res, pendingItems)
  if (items) res.set('Cache-Control', 'no-store').json(items)
})
