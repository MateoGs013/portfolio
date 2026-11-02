/**
 * GET /api/admin/meta: lo que el admin necesita para armar formularios y contar. Los conteos de
 * `summary` usan las mismas reglas de visibilidad que la API pública (content/visibility.ts): las
 * obras visibles de acá son las que lista GET /api/projects. Se vuelve a pedir después de cada escritura.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { docFieldsOf } from '../content/docFields.js'
import { visibleArticle, visibleProject } from '../content/visibility.js'
import { adminSchema, modelNames } from '../shared/adminSchema.js'
import type { AdminMeta, AdminOptions, AdminSummary, EnumOption, MetricKeyOption, UnlistedMetricKey } from '../shared/adminContracts.js'
import { enumLabels, type EnumName } from '../shared/labels.js'
import { isMetricKey, metricKeys as catalog } from '../shared/metricKeys.js'
import { readOr503 } from './common.js'
import { untranslatedRecords } from './translations.js'

/** Cada enum con su valor y su rótulo en español, en el orden en que se declaró. */
function enumOptions(): Record<EnumName, EnumOption[]> {
  return Object.fromEntries((Object.keys(enumLabels) as EnumName[]).map((name) => {
    const labels: Readonly<Record<string, { es: string }>> = enumLabels[name]
    return [name, Object.entries(labels).map(([value, label]) => ({ value, label: label.es }))]
  })) as Record<EnumName, EnumOption[]>
}

async function summary(): Promise<AdminSummary> {
  const now = new Date()
  const [visible, scheduled, hidden, published, draft, experience, cv, stack, orgs] = await Promise.all([
    db.project.count({ where: visibleProject() }),
    db.project.count({ where: { publishedAt: { gt: now } } }),
    db.project.count({ where: { publishedAt: null } }),
    db.article.count({ where: visibleArticle() }),
    db.article.count({ where: { status: 'DRAFT' } }),
    db.experience.count(),
    db.experience.count({ where: { cvOrder: { not: null } } }),
    db.tech.count(),
    db.org.count(),
  ])
  return {
    projects: { visible, hidden, scheduled },
    articles: { published, draft },
    experience: { total: experience, cv },
    stack,
    orgs,
  }
}

async function options(): Promise<AdminOptions> {
  const now = Date.now()
  const [orgs, techs, projects, experiences, articles] = await Promise.all([
    db.org.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
    db.tech.findMany({ select: { id: true, name: true, slug: true, category: true }, orderBy: { name: 'asc' } }),
    db.project.findMany({ select: { id: true, title: true, slug: true, status: true, publishedAt: true }, orderBy: { title: 'asc' } }),
    db.experience.findMany({ select: { id: true, role: true, slug: true, kind: true, cvOrder: true }, orderBy: { startedAt: 'desc' } }),
    db.article.findMany({ select: { id: true, title: true, slug: true, status: true }, orderBy: { title: 'asc' } }),
  ])
  return {
    orgs,
    techs,
    projects: projects.map(({ publishedAt, ...p }) => ({ ...p, visible: publishedAt !== null && publishedAt.getTime() <= now })),
    experiences: experiences.map(({ role, ...e }) => ({ ...e, title: role })),
    articles,
  }
}

/**
 * El catálogo de claves con cuántas veces se usa cada una, y las claves que usan las obras sin estar
 * en el catálogo (con el primer rótulo propio que se les cargó): las sugerencias salen de la base.
 */
async function metricKeys(): Promise<AdminMeta['metricKeys']> {
  const rows = await db.metric.findMany({ select: { key: true, label: true }, orderBy: [{ projectId: 'asc' }, { order: 'asc' }] })
  const uses = new Map<string, number>()
  const labels = new Map<string, string | null>()
  for (const { key, label } of rows) {
    uses.set(key, (uses.get(key) ?? 0) + 1)
    if (!labels.get(key)) labels.set(key, label)
  }
  const listed: MetricKeyOption[] = Object.entries(catalog).map(([key, text]) => ({ key, label: text.label, desc: text.desc, uses: uses.get(key) ?? 0 }))
  const unlisted: UnlistedMetricKey[] = [...uses.keys()]
    .filter(key => !isMetricKey(key))
    .sort()
    .map(key => ({ key, label: labels.get(key) ?? null, uses: uses.get(key) ?? 0 }))
  return { catalog: listed, unlisted }
}

/** El nombre visible de Sobre mí, para la cabecera del admin: nada escrito a mano en la UI. */
async function owner(): Promise<string | null> {
  const about = await db.doc.findUnique({ where: { key: 'about' }, select: { fields: true } })
  const fields = docFieldsOf(about?.fields, 'about')
  const value = fields.find(f => f.name === 'display_name')?.value ?? fields.find(f => f.name === 'name')?.value
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export const metaRouter = Router()

metaRouter.get('/meta', async (_req, res) => {
  const loaded = await readOr503(res, () => Promise.all([summary(), options(), metricKeys(), untranslatedRecords(), owner()]))
  if (!loaded) return
  const [counts, choices, keys, untranslated, name] = loaded
  const meta: AdminMeta = {
    owner: name,
    summary: counts,
    enumOptions: enumOptions(),
    schema: adminSchema,
    models: modelNames,
    options: choices,
    metricKeys: keys,
    untranslated,
  }
  res.json(meta)
})
