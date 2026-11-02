/**
 * Stack en el admin. La nota (criterio de elección) es el único texto traducible de una
 * tecnología: su inglés llega en `translations.en.note` y va a TechTranslation. Antes de borrar,
 * GET /techs/:id/impact dice qué obras, experiencias y artículos la usan; DELETE con ?reassignTo=
 * les pone otra en su lugar. La dirección solo cambia con PATCH /techs/:id/slug.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { TechCategory, type Prisma } from '../../generated/prisma/client.js'
import type { AdminImpact, DeleteResult } from '../shared/adminContracts.js'
import { optHex, paramId, readOr503 } from './common.js'
import { HttpError, enumOf, guardSlugChange, int, newSlug, optStr, slug, str, validate } from './input.js'
import { reassignTarget } from './orgs.js'
import { enBody, saveTechEn, withTranslations } from './translations.js'

type Body = Record<string, unknown>

const TECH_CATEGORY = Object.values(TechCategory)
const FIRST_YEAR = 1990

const techInclude = {
  ...withTranslations,
  _count: { select: { projects: true, experiences: true, articles: true } },
} satisfies Prisma.TechInclude

function techData(b: Body) {
  return {
    name: str(b, 'name'),
    category: enumOf(b, 'category', TECH_CATEGORY),
    since: int(b, 'since', FIRST_YEAR, new Date().getFullYear()),
    note: optStr(b, 'note'),
    color: optHex(b, 'color'),
  }
}

async function currentTech(id: number) {
  const row = await db.tech.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!row) throw new HttpError(404, 'No encontramos esa tecnología: puede que se haya borrado. Recargá la lista.')
  return row
}

/** Crea o actualiza la tecnología y su inglés en una sola transacción. */
async function saveTech(data: Prisma.TechCreateInput | Prisma.TechUpdateInput, en: Body | null, id?: number) {
  return db.$transaction(async (tx) => {
    const row = id === undefined
      ? await tx.tech.create({ data: data as Prisma.TechCreateInput })
      : await tx.tech.update({ where: { id }, data })
    if (en) await saveTechEn(tx, row.id, en)
    return tx.tech.findUniqueOrThrow({ where: { id: row.id }, include: techInclude })
  })
}

export const techsRouter = Router()

techsRouter.get('/techs', async (_req, res) => {
  const rows = await readOr503(res, () => db.tech.findMany({ orderBy: [{ since: 'asc' }, { name: 'asc' }], include: techInclude }))
  if (rows) res.json(rows)
})

techsRouter.post('/techs', async (req, res) => {
  const b = req.body as Body
  const { data, en } = validate('Tech', b, () => {
    const fields = techData(b)
    return { data: { ...fields, slug: newSlug(b, 'slug', fields.name) }, en: enBody(b) }
  })
  res.status(201).json(await saveTech(data, en))
})

techsRouter.put('/techs/:id', async (req, res) => {
  const b = req.body as Body
  const current = await currentTech(paramId(req))
  const { data, en } = validate('Tech', b, () => {
    guardSlugChange(current.slug, b['slug'])
    return { data: techData(b), en: enBody(b) }
  })
  res.json(await saveTech(data, en, current.id))
})

/** «Cambiar dirección»: los enlaces viejos (?stack=…) dejan de filtrar. */
techsRouter.patch('/techs/:id/slug', async (req, res) => {
  const b = req.body as Body
  const current = await currentTech(paramId(req))
  const next = validate('Tech', b, () => slug(b, 'slug'))
  res.json(await db.tech.update({ where: { id: current.id }, data: { slug: next }, include: techInclude }))
})

techsRouter.get('/techs/:id/impact', async (req, res) => {
  const id = paramId(req)
  const row = await readOr503(res, () => db.tech.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      projects: { select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } },
      experiences: { select: { id: true, role: true, slug: true }, orderBy: { startedAt: 'desc' } },
      articles: { select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } },
    },
  }))
  if (row === undefined) return
  if (!row) throw new HttpError(404, 'No encontramos esa tecnología: puede que se haya borrado. Recargá la lista.')
  const experiences = row.experiences.map(e => ({ id: e.id, title: e.role, slug: e.slug }))
  const impact: AdminImpact = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    projects: row.projects,
    experiences,
    articles: row.articles,
    total: row.projects.length + experiences.length + row.articles.length,
  }
  res.json(impact)
})

/** Con ?reassignTo= cada obra, experiencia y artículo que la usaba pasa a usar la otra. */
techsRouter.delete('/techs/:id', async (req, res) => {
  const { id } = await currentTech(paramId(req))
  const target = await reassignTarget(req, id, async other => (await db.tech.count({ where: { id: other } })) > 0)
  const moved = await db.$transaction(async (tx) => {
    const using = { techs: { some: { id } } }
    // Una transacción usa una sola conexión: las consultas van de a una.
    const projects = await tx.project.findMany({ where: using, select: { id: true } })
    const experiences = await tx.experience.findMany({ where: using, select: { id: true } })
    const articles = await tx.article.findMany({ where: using, select: { id: true } })
    if (target !== null) {
      const connect = { techs: { connect: { id: target } } }
      for (const p of projects) await tx.project.update({ where: { id: p.id }, data: connect })
      for (const e of experiences) await tx.experience.update({ where: { id: e.id }, data: connect })
      for (const a of articles) await tx.article.update({ where: { id: a.id }, data: connect })
    }
    await tx.tech.delete({ where: { id } })
    return projects.length + experiences.length + articles.length
  })
  const result: DeleteResult = { deleted: id, reassignedTo: target, moved }
  res.json(result)
})
