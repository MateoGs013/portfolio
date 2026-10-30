/**
 * Stack en el admin. La nota (criterio de elección) es el único texto traducible de una
 * tecnología: su inglés llega en `translations.en.note` y va a TechTranslation.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { TechCategory, type Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE, paramId } from './common.js'
import { enumOf, int, optStr, slug, str } from './input.js'
import { enBody, saveTechEn, withTranslations } from './translations.js'

type Body = Record<string, unknown>

const TECH_CATEGORY = Object.values(TechCategory)

const techInclude = {
  ...withTranslations,
  _count: { select: { projects: true, experiences: true } },
} satisfies Prisma.TechInclude

function techData(b: Body) {
  return {
    slug: slug(b, 'slug'),
    name: str(b, 'name'),
    category: enumOf(b, 'category', TECH_CATEGORY),
    since: int(b, 'since'),
    note: optStr(b, 'note'),
    color: optStr(b, 'color'),
  }
}

/** Crea o actualiza la tecnología y su inglés en una sola transacción. */
async function saveTech(b: Body, id?: number) {
  const data = techData(b)
  const en = enBody(b)
  return db.$transaction(async (tx) => {
    const row = id === undefined ? await tx.tech.create({ data }) : await tx.tech.update({ where: { id }, data })
    if (en) await saveTechEn(tx, row.id, en)
    return tx.tech.findUniqueOrThrow({ where: { id: row.id }, include: techInclude })
  })
}

export const techsRouter = Router()

techsRouter.get('/techs', async (_req, res) => {
  try {
    res.json(await db.tech.findMany({ orderBy: [{ since: 'asc' }, { name: 'asc' }], include: techInclude }))
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
techsRouter.post('/techs', async (req, res) => {
  res.status(201).json(await saveTech(req.body))
})
techsRouter.put('/techs/:id', async (req, res) => {
  res.json(await saveTech(req.body, paramId(req)))
})
techsRouter.delete('/techs/:id', async (req, res) => {
  await db.tech.delete({ where: { id: paramId(req) } })
  res.status(204).end()
})
