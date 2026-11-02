/**
 * Inglés en el admin. Cada registro trae sus filas *Translation y las guarda por upsert sobre la
 * clave compuesta (id, locale): editar el español nunca las toca y un campo vacío queda en NULL,
 * así la API pública cae al español y lo lista en `untranslated`.
 *
 * Forma del body: `translations: { en: { campo: texto | null } }` en el registro y en cada paso
 * o enlace. Sin la clave `translations` (o sin `en`) no se toca nada, y dentro de `en` solo cambian las
 * claves que llegan. Un inglés todo vacío no crea
 * una fila nueva: solo vacía la que ya existía.
 *
 * Al final, la regla de «sin traducir» del admin (untranslatedRecords).
 */
import { db } from '../db.js'
import { docFieldsOf, untranslatedFields } from '../content/docFields.js'
import { Locale, type Prisma, type PrismaClient } from '../../generated/prisma/client.js'
import type { UntranslatedRecord } from '../shared/adminContracts.js'
import { docKeys, docSchemas, isDocKey } from '../shared/docSchema.js'
import { describe, type ModelName } from '../shared/adminSchema.js'
import { isMetricKey } from '../shared/metricKeys.js'
import { HttpError, optStr } from './input.js'

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient
type Client = PrismaClient | Tx

/** El único idioma que se edita como traducción: el español vive en el registro. */
export const EN = Locale.en

/** Include de Prisma para leer el inglés junto al registro. */
export const withTranslations = { translations: { where: { locale: EN } } } as const

/** `translations.en` del body, o null si no llegó (se conserva lo guardado). */
export function enBody(b: Body): Body | null {
  const translations = b['translations']
  if (translations === undefined || translations === null) return null
  if (typeof translations !== 'object' || Array.isArray(translations)) {
    throw new HttpError(400, 'campo "translations": se esperaba { en: { … } }')
  }
  const en = (translations as Body)['en']
  if (en === undefined || en === null) return null
  if (typeof en !== 'object' || Array.isArray(en)) throw new HttpError(400, 'campo "translations.en": se esperaba un objeto')
  return en as Body
}

/**
 * Textos en inglés con el mismo tope que su par en español; vacío → null. Solo las claves que llegan:
 * una clave ausente conserva lo guardado (un `translations.en` parcial no borra el resto).
 */
export function enTexts<K extends string>(en: Body, limits: Record<K, number>): Partial<Record<K, string | null>> {
  const out: Partial<Record<K, string | null>> = {}
  for (const [k, max] of Object.entries(limits) as [K, number][]) {
    if (!(k in en)) continue
    try {
      out[k] = optStr(en, k, max)
    }
    catch (err) {
      if (err instanceof HttpError) throw new HttpError(err.status, `${err.message} (inglés)`)
      throw err
    }
  }
  return out
}

/** Sin ningún texto ni viñeta: no vale la pena crear una fila para eso. */
export function isBlank(data: Record<string, string | string[] | null | undefined>): boolean {
  return Object.values(data).every(v => v === null || (Array.isArray(v) && v.length === 0))
}

/**
 * Los topes del inglés salen del descriptor de la tabla *Translation (adminSchema), que copia el del
 * español: nada de números escritos acá que se desfasen del contrato.
 */
function limitsOf<K extends string>(model: ModelName, keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => {
    const max = describe(model, k)?.max
    if (max === undefined) throw new Error(`${model}.${k} no tiene tope en adminSchema`)
    return [k, max]
  })) as Record<K, number>
}

const PROJECT_LIMITS = limitsOf('ProjectTranslation', ['title', 'role', 'summary', 'brief', 'outcome'])
const STEP_LIMITS = limitsOf('ProcessStepTranslation', ['title', 'body'])
const LINK_LIMITS = limitsOf('LinkTranslation', ['label'])
const MEDIA_LIMITS = limitsOf('MediaTranslation', ['alt', 'caption'])
const METRIC_LIMITS = limitsOf('MetricTranslation', ['label'])
const TECH_LIMITS = limitsOf('TechTranslation', ['note'])

export async function saveProjectEn(tx: Tx, projectId: number, en: Body): Promise<void> {
  const data = enTexts(en, PROJECT_LIMITS)
  if (isBlank(data)) {
    await tx.projectTranslation.updateMany({ where: { projectId, locale: EN }, data })
    return
  }
  await tx.projectTranslation.upsert({
    where: { projectId_locale: { projectId, locale: EN } },
    create: { projectId, locale: EN, ...data },
    update: data,
  })
}

export async function saveStepEn(tx: Tx, stepId: number, en: Body): Promise<void> {
  const data = enTexts(en, STEP_LIMITS)
  if (isBlank(data)) {
    await tx.processStepTranslation.updateMany({ where: { stepId, locale: EN }, data })
    return
  }
  await tx.processStepTranslation.upsert({
    where: { stepId_locale: { stepId, locale: EN } },
    create: { stepId, locale: EN, ...data },
    update: data,
  })
}

export async function saveLinkEn(tx: Tx, linkId: number, en: Body): Promise<void> {
  const data = enTexts(en, LINK_LIMITS)
  if (isBlank(data)) {
    await tx.linkTranslation.updateMany({ where: { linkId, locale: EN }, data })
    return
  }
  await tx.linkTranslation.upsert({
    where: { linkId_locale: { linkId, locale: EN } },
    create: { linkId, locale: EN, ...data },
    update: data,
  })
}

export async function saveMetricEn(tx: Tx, metricId: number, en: Body): Promise<void> {
  const data = enTexts(en, METRIC_LIMITS)
  if (isBlank(data)) {
    await tx.metricTranslation.updateMany({ where: { metricId, locale: EN }, data })
    return
  }
  await tx.metricTranslation.upsert({
    where: { metricId_locale: { metricId, locale: EN } },
    create: { metricId, locale: EN, ...data },
    update: data,
  })
}

/** Media se edita por PATCH: solo las claves que llegan (alt o caption) cambian. */
export async function saveMediaEn(tx: Tx, mediaId: number, en: Body): Promise<void> {
  const keys = (Object.keys(MEDIA_LIMITS) as (keyof typeof MEDIA_LIMITS)[]).filter(k => k in en)
  if (keys.length === 0) return
  const all = enTexts(en, MEDIA_LIMITS)
  const data = Object.fromEntries(keys.map(k => [k, all[k] ?? null]))
  if (isBlank(data)) {
    await tx.mediaTranslation.updateMany({ where: { mediaId, locale: EN }, data })
    return
  }
  await tx.mediaTranslation.upsert({
    where: { mediaId_locale: { mediaId, locale: EN } },
    create: { mediaId, locale: EN, ...data },
    update: data,
  })
}

export async function saveTechEn(tx: Tx, techId: number, en: Body): Promise<void> {
  const data = enTexts(en, TECH_LIMITS)
  if (isBlank(data)) {
    await tx.techTranslation.updateMany({ where: { techId, locale: EN }, data })
    return
  }
  await tx.techTranslation.upsert({
    where: { techId_locale: { techId, locale: EN } },
    create: { techId, locale: EN, ...data },
    update: data,
  })
}

// ─── Sin traducir ───────────────────────────────────────────────────────────

type Texts = Record<string, unknown>

const filled = (v: unknown): boolean => (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) && v.length > 0)

/**
 * Rutas del body (`translations.en.campo`, con `prefix` para lo anidado) de los textos que tienen
 * español y no inglés: la misma regla con la que la API pública arma `untranslated`.
 */
function pendingTexts(es: Texts, en: Texts | undefined, fields: readonly string[], prefix = ''): string[] {
  return fields.filter(f => filled(es[f]) && !filled(en?.[f])).map(f => `${prefix}translations.en.${f}`)
}

/** Las viñetas se traducen una por una: `translations.en.highlights[i]` por cada una sin inglés. */
function pendingItems(field: string, es: readonly string[], en: readonly string[] | undefined): string[] {
  return es.flatMap((item, i) => (filled(item) && !filled(en?.[i]) ? [`translations.en.${field}[${i}]`] : []))
}

const english = { where: { locale: EN } } as const

async function projectsPending(client: Client): Promise<UntranslatedRecord[]> {
  const rows = await client.project.findMany({
    orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    select: {
      id: true, title: true, role: true, summary: true, brief: true, outcome: true, translations: english,
      steps: { orderBy: { order: 'asc' }, select: { title: true, body: true, translations: english } },
      links: { orderBy: { id: 'asc' }, select: { label: true, translations: english } },
      metrics: { orderBy: { order: 'asc' }, select: { key: true, label: true, translations: english } },
      media: { orderBy: [{ role: 'asc' }, { order: 'asc' }], select: { alt: true, caption: true, translations: english } },
    },
  })
  return rows.map(p => ({
    collection: 'projects' as const,
    id: p.id,
    title: p.title,
    // El título de una obra es un nombre propio: nunca queda pendiente (como en la API pública).
    fields: [
      ...pendingTexts(p, p.translations[0], ['role', 'summary', 'brief', 'outcome']),
      ...p.steps.flatMap((s, i) => pendingTexts(s, s.translations[0], ['title', 'body'], `steps[${i}].`)),
      ...p.links.flatMap((l, i) => pendingTexts(l, l.translations[0], ['label'], `links[${i}].`)),
      // Con una clave del catálogo el sitio usa el rótulo del catálogo: el propio no se lee.
      ...p.metrics.flatMap((m, i) => (isMetricKey(m.key) ? [] : pendingTexts(m, m.translations[0], ['label'], `metrics[${i}].`))),
      // La media se edita por PATCH /media/:id con `en: { alt, caption }`; la ruta es la del formulario del admin.
      ...p.media.flatMap((m, i) => ['alt', 'caption'].filter(f => filled(m[f as 'alt']) && !filled(m.translations[0]?.[f as 'alt'])).map(f => `media[${i}].translations.en.${f}`)),
    ],
  }))
}

async function experiencePending(client: Client): Promise<UntranslatedRecord[]> {
  const rows = await client.experience.findMany({
    orderBy: { startedAt: 'desc' },
    select: { id: true, role: true, summary: true, story: true, location: true, highlights: true, translations: english },
  })
  return rows.map(e => ({
    collection: 'experience' as const,
    id: e.id,
    title: e.role,
    fields: [
      ...pendingTexts(e, e.translations[0], ['role', 'summary', 'story', 'location']),
      ...pendingItems('highlights', e.highlights, e.translations[0]?.highlights),
    ],
  }))
}

async function catalogPending(client: Client): Promise<UntranslatedRecord[]> {
  const [techs, articles] = await Promise.all([
    client.tech.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, note: true, translations: english } }),
    client.article.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], select: { id: true, title: true, summary: true, content: true, translations: english } }),
  ])
  return [
    ...techs.map(t => ({ collection: 'techs' as const, id: t.id, title: t.name, fields: pendingTexts(t, t.translations[0], ['note']) })),
    ...articles.map(a => ({ collection: 'articles' as const, id: a.id, title: a.title, fields: pendingTexts(a, a.translations[0], ['title', 'summary', 'content']) })),
  ]
}

/** Los bloques de prosa de about y contact: `fields.<bloque>.en`. */
async function docsPending(client: Client): Promise<UntranslatedRecord[]> {
  const docs = await client.doc.findMany({ where: { key: { in: docKeys } }, orderBy: { key: 'asc' } })
  return docs.flatMap((d) => {
    const key = d.key
    if (!isDocKey(key)) return []
    const fields = docFieldsOf(d.fields, key)
    const names = untranslatedFields(fields, fields.map(f => f.name), EN)
    return [{ collection: 'docs' as const, id: key, title: docSchemas[key].label, fields: names.map(n => `fields.${n}.en`) }]
  })
}

/**
 * Cada registro con algo en español y sin inglés, campo por campo y viñeta por viñeta (solo los que
 * tienen algo pendiente). Lo usan GET /api/admin/meta (`untranslated`) y la bandeja del Inicio.
 */
export async function untranslatedRecords(client: Client = db): Promise<UntranslatedRecord[]> {
  const groups = await Promise.all([projectsPending(client), experiencePending(client), catalogPending(client), docsPending(client)])
  return groups.flat().filter(r => r.fields.length > 0)
}
