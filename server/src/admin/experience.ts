/**
 * Trayectoria en el admin, con los campos que usa el CV: tipo de entrada, viñetas (hasta 3 de
 * 160 caracteres, la cota de una página A4), lugar, posición en el CV y las obras ligadas.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ExperienceKind, type Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE, paramId } from './common.js'
import { HttpError, date, enumOf, intList, optDate, optInt, optStr, slug, str } from './input.js'

type Body = Record<string, unknown>

const EXPERIENCE_KIND = Object.values(ExperienceKind)
const HIGHLIGHTS_MAX = 3
const HIGHLIGHT_CHARS = 160

const experienceInclude = {
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
  projects: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.ExperienceInclude

function highlights(b: Body): string[] {
  const raw = b['highlights'] ?? []
  if (!Array.isArray(raw) || !raw.every(x => typeof x === 'string')) throw new HttpError(400, 'campo "highlights": se esperaba una lista de textos')
  const items = raw.map(x => x.trim()).filter(Boolean)
  if (items.length > HIGHLIGHTS_MAX) throw new HttpError(400, `el CV admite hasta ${HIGHLIGHTS_MAX} viñetas por entrada`)
  const long = items.findIndex(x => x.length > HIGHLIGHT_CHARS)
  if (long !== -1) throw new HttpError(400, `la viñeta ${long + 1} supera los ${HIGHLIGHT_CHARS} caracteres`)
  return items
}

function experienceData(b: Body) {
  return {
    slug: slug(b, 'slug'),
    kind: b['kind'] ? enumOf(b, 'kind', EXPERIENCE_KIND) : ExperienceKind.FREELANCE,
    role: str(b, 'role'),
    startedAt: date(b, 'startedAt'),
    endedAt: optDate(b, 'endedAt'),
    summary: str(b, 'summary'),
    story: optStr(b, 'story'),
    highlights: highlights(b),
    location: optStr(b, 'location', 120),
    cvOrder: optInt(b, 'cvOrder', 1, 99),
    orgId: optInt(b, 'orgId'),
  }
}

/** Tecnologías y obras ligadas: `connect` al crear, `set` al editar. */
function relations(b: Body, mode: 'connect' | 'set') {
  const techs = intList(b, 'techIds').map(id => ({ id }))
  const projects = intList(b, 'projectIds').map(id => ({ id }))
  return mode === 'set'
    ? { techs: { set: techs }, projects: { set: projects } }
    : { techs: { connect: techs }, projects: { connect: projects } }
}

export const experienceRouter = Router()

experienceRouter.get('/experience', async (_req, res) => {
  try {
    res.json(await db.experience.findMany({ orderBy: { startedAt: 'desc' }, include: experienceInclude }))
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
experienceRouter.post('/experience', async (req, res) => {
  res.status(201).json(await db.experience.create({
    data: { ...experienceData(req.body), ...relations(req.body, 'connect') },
    include: experienceInclude,
  }))
})
experienceRouter.put('/experience/:id', async (req, res) => {
  res.json(await db.experience.update({
    where: { id: paramId(req) },
    data: { ...experienceData(req.body), ...relations(req.body, 'set') },
    include: experienceInclude,
  }))
})
experienceRouter.delete('/experience/:id', async (req, res) => {
  await db.experience.delete({ where: { id: paramId(req) } })
  res.status(204).end()
})
