/**
 * Parche de traducciones (2-nov-2026): lleva el inglés de seed/en.ts a una base ya cargada sin recargarla
 * (el seed borra todo y pisaría lo editado desde el admin).
 *
 * Requiere la migración 20261101000000_rediseno_movimiento y el parche 2026-11-01-rediseno-datos.ts.
 * Cubre ProjectTranslation, ProcessStepTranslation, LinkTranslation, ExperienceTranslation,
 * TechTranslation, ArticleTranslation y el `en` de los campos de los docs about y contact.
 * Media (alt y pie) no: es de seed/media.ts.
 *
 * Conservador: solo completa los campos en inglés que faltan (NULL, texto vacío o lista vacía).
 * Si el español de un campo ya no es el del seed (se editó desde el admin), no lo traduce: lo avisa
 * para que se traduzca en el admin, porque el inglés del seed traduce otro texto.
 * Idempotente: corrido otra vez después de aplicar, dice "sin cambios".
 *
 * Uso, después de un pg_dump:
 *   pnpm tsx server/src/patches/2026-11-02-traducciones-en.ts --dry     (imprime el diff, no escribe)
 *   pnpm tsx server/src/patches/2026-11-02-traducciones-en.ts           (aplica todo en una transacción)
 *   pnpm tsx server/src/patches/2026-11-02-traducciones-en.ts --dry     (tiene que decir "sin cambios")
 * Con --force también reemplaza el inglés ya cargado por el del seed (combinable con --dry).
 */
import { db } from '../db.js'
import { dropLastGoodFile } from '../content/snapshot.js'
import { Locale } from '../../generated/prisma/client.js'
import type { DocField, DocFieldValue } from '../../../app/lib/fieldMeta.js'
import { applyEnglish, withEnglish } from '../seed/apply.js'
import { articles } from '../seed/articles.js'
import { docs } from '../seed/docs.js'
import { EN, type EnProject, type EnSeed } from '../seed/en.js'
import { experience } from '../seed/experience.js'
import { publicProjects } from '../seed/projects.js'
import { techNotes, type TechSlug } from '../seed/stack.js'
import { show } from './rediseno/change.js'

const dry = process.argv.includes('--dry')
const force = process.argv.includes('--force')

/** Lo que el parche va a escribir, una línea por campo y los campos que salteó por un español editado. */
interface Plan {
  what: string[]
  warnings: string[]
}

type Values<T> = Partial<Record<keyof T, unknown>>

const en = { where: { locale: Locale.en } }

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return typeof value !== 'string' || value.trim() !== ''
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/**
 * Elige los campos de `next` (inglés del seed) que hay que escribir: los que faltan en `current`
 * (o todos con --force) y cuyo español en la base (`es`) sigue siendo el del seed (`seedEs`).
 */
function fill<T extends object>(label: string, next: T, current: Values<T>, es: Values<T>, seedEs: Values<T>, plan: Plan): Partial<T> {
  const out: Partial<T> = {}
  for (const key of Object.keys(next) as (keyof T & string)[]) {
    const value = next[key]
    if (value === undefined || same(current[key], value)) continue
    if (filled(current[key]) && !force) continue
    if (!same(es[key], seedEs[key])) {
      plan.warnings.push(`${label}.${key}: el español no es el del seed, se traduce en el admin`)
      continue
    }
    plan.what.push(`${label}.${key} en: ${show(current[key])} → ${show(value)}`)
    out[key] = value
  }
  return out
}

const nonEmpty = (o: object) => Object.keys(o).length > 0

async function projectsPlan(plan: Plan): Promise<EnSeed['projects']> {
  const out: EnSeed['projects'] = {}
  for (const [slug, { steps = {}, links = {}, ...fields }] of Object.entries(EN.projects)) {
    const seed = publicProjects.find(p => p.slug === slug)
    const row = await db.project.findUnique({
      where: { slug },
      include: {
        translations: en,
        steps: { include: { translations: en } },
        links: { include: { translations: en } },
      },
    })
    if (!seed || !row) {
      plan.warnings.push(`obra ${slug}: no está en la base, se saltea`)
      continue
    }
    const label = `obra ${slug}`
    const picked: EnProject = fill(label, fields, row.translations[0] ?? {}, row, seed, plan)

    const pickedSteps: NonNullable<EnProject['steps']> = {}
    for (const [order, step] of Object.entries(steps)) {
      const current = row.steps.find(s => s.order === Number(order))
      const seedStep = seed.steps[Number(order) - 1]
      if (!current || !seedStep) {
        plan.warnings.push(`${label} paso ${order}: no está en la base o en el seed, se saltea`)
        continue
      }
      const out = fill(`${label} paso ${order}`, step, current.translations[0] ?? {}, current, seedStep, plan)
      if (nonEmpty(out)) pickedSteps[Number(order)] = out
    }
    if (nonEmpty(pickedSteps)) picked.steps = pickedSteps

    const pickedLinks: Record<string, string> = {}
    for (const [url, label_] of Object.entries(links)) {
      const current = row.links.find(l => l.url === url)
      const seedLink = seed.links.find(l => l.url === url)
      if (!current || !seedLink) {
        plan.warnings.push(`${label} enlace ${url}: no está en la base o en el seed, se saltea`)
        continue
      }
      const out = fill(`${label} enlace ${url}`, { label: label_ }, current.translations[0] ?? {}, current, seedLink, plan)
      if (out.label) pickedLinks[url] = out.label
    }
    if (nonEmpty(pickedLinks)) picked.links = pickedLinks

    if (nonEmpty(picked)) out[slug] = picked
  }
  return out
}

async function experiencePlan(plan: Plan): Promise<EnSeed['experience']> {
  const out: EnSeed['experience'] = {}
  for (const [slug, fields] of Object.entries(EN.experience)) {
    const seed = experience.find(e => e.slug === slug)
    const row = await db.experience.findUnique({ where: { slug }, include: { translations: en } })
    if (!seed || !row) {
      plan.warnings.push(`experiencia ${slug}: no está en la base, se saltea`)
      continue
    }
    const picked = fill(`experiencia ${slug}`, fields, row.translations[0] ?? {}, row, seed, plan)
    if (nonEmpty(picked)) out[slug] = picked
  }
  return out
}

async function techsPlan(plan: Plan): Promise<EnSeed['techs']> {
  const out: EnSeed['techs'] = {}
  for (const [slug, note] of Object.entries(EN.techs) as [TechSlug, string][]) {
    const row = await db.tech.findUnique({ where: { slug }, include: { translations: en } })
    if (!row) {
      plan.warnings.push(`tecnología ${slug}: no está en la base, se saltea`)
      continue
    }
    const picked = fill(`tecnología ${slug}`, { note }, row.translations[0] ?? {}, row, { note: techNotes[slug] }, plan)
    if (picked.note) out[slug] = picked.note
  }
  return out
}

async function articlesPlan(plan: Plan): Promise<EnSeed['articles']> {
  const out: EnSeed['articles'] = {}
  for (const [slug, fields] of Object.entries(EN.articles)) {
    const seed = articles.find(a => a.slug === slug)
    const row = await db.article.findUnique({ where: { slug }, include: { translations: en } })
    if (!seed || !row) {
      plan.warnings.push(`artículo ${slug}: no está en la base, se saltea`)
      continue
    }
    const picked = fill(`artículo ${slug}`, fields, row.translations[0] ?? {}, row, seed, plan)
    if (nonEmpty(picked)) out[slug] = picked
  }
  return out
}

/** Docs con el `en` completado. Solo los campos que existen en la base; los propios del admin no se tocan. */
async function docsPlan(plan: Plan): Promise<{ key: string, fields: DocField[] }[]> {
  const out: { key: string, fields: DocField[] }[] = []
  for (const d of docs) {
    const row = await db.doc.findUnique({ where: { key: d.key } })
    if (!row) {
      plan.warnings.push(`doc ${d.key}: no está en la base, correr antes 2026-11-01-rediseno-datos.ts`)
      continue
    }
    const fields = Array.isArray(row.fields) ? (row.fields as unknown as DocField[]) : []
    const picked: Record<string, DocFieldValue> = {}
    for (const [name, value] of Object.entries(EN.docs[d.key])) {
      const current = fields.find(f => f.name === name)
      const seed = d.fields.find(f => f.name === name)
      if (!current || !seed) {
        plan.warnings.push(`doc ${d.key}.${name}: no está en la base o en el seed, se saltea`)
        continue
      }
      const out = fill(`doc ${d.key}`, { [name]: value }, { [name]: current.en }, { [name]: current.value }, { [name]: seed.value }, plan)
      if (out[name] !== undefined) picked[name] = out[name]
    }
    if (nonEmpty(picked)) out.push({ key: d.key, fields: withEnglish(fields, picked) })
  }
  return out
}

async function main() {
  if (force) console.log('--force: se reemplaza también el inglés ya cargado')
  const plan: Plan = { what: [], warnings: [] }
  const seed: EnSeed = {
    projects: await projectsPlan(plan),
    experience: await experiencePlan(plan),
    techs: await techsPlan(plan),
    docs: { about: {}, contact: {} },
    articles: await articlesPlan(plan),
  }
  const docUpdates = await docsPlan(plan)

  for (const warning of plan.warnings) console.warn(`aviso: ${warning}`)

  if (!plan.what.length) {
    console.log(plan.warnings.length
      ? `sin cambios aplicables; ${plan.warnings.length} avisos quedan para resolver en el admin`
      : 'sin cambios: el inglés de la base ya está al día con el seed')
    return
  }

  console.log(`${dry ? 'cambios pendientes' : 'aplicando'} (${plan.what.length}):`)
  for (const line of plan.what) console.log(`  ${line}`)
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    await applyEnglish(tx, seed)
    for (const d of docUpdates) await tx.doc.update({ where: { key: d.key }, data: { fields: d.fields } })
  }, { timeout: 60000 })
  console.log('listo')
  // La API guarda la última respuesta buena de cada consulta: sin esto, una obra recién ocultada
  // podría volver desde esa copia si la base cae. La memoria del proceso se vacía reiniciándola.
  if (dropLastGoodFile()) console.log('se borró la última respuesta buena guardada en disco')
  console.log('reiniciá la API para que olvide también las respuestas que tiene en memoria')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
