/**
 * Trayectoria en el admin, con los campos que usa el CV: tipo de entrada, viñetas (hasta 3 de
 * 160 caracteres, la cota de una página A4), lugar, posición en el CV y las obras ligadas.
 * El inglés llega en `translations.en` y va a ExperienceTranslation con los mismos topes.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ExperienceKind, type Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE, paramId } from './common.js'
import { HttpError, date, enumOf, intList, optDate, optInt, optStr, slug, str } from './input.js'
import { EN, enBody, enTexts, isBlank, withTranslations } from './translations.js'

type Body = Record<string, unknown>

const EXPERIENCE_KIND = Object.values(ExperienceKind)
const HIGHLIGHTS_MAX = 3
const HIGHLIGHT_CHARS = 160

const experienceInclude = {
  ...withTranslations,
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
  projects: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.ExperienceInclude

/** Viñetas del CV con la cota de una página A4; `lang` nombra el idioma en el mensaje de error. */
function highlights(b: Body, lang = ''): string[] {
  const raw = b['highlights'] ?? []
  if (!Array.isArray(raw) || !raw.every(x => typeof x === 'string')) throw new HttpError(400, `campo "highlights"${lang}: se esperaba una lista de textos`)
  const items = raw.map(x => x.trim()).filter(Boolean)
  if (items.length > HIGHLIGHTS_MAX) throw new HttpError(400, `el CV admite hasta ${HIGHLIGHTS_MAX} viñetas por entrada${lang}`)
  const long = items.findIndex(x => x.length > HIGHLIGHT_CHARS)
  if (long !== -1) throw new HttpError(400, `la viñeta ${long + 1}${lang} supera los ${HIGHLIGHT_CHARS} caracteres`)
  return items
}

/** Fila ExperienceTranslation: vacío → null y viñetas con el mismo tope que en español. */
function englishData(en: Body) {
  return { ...enTexts(en, { role: 4000, summary: 4000, story: 4000, location: 120 }), highlights: highlights(en, ' (inglés)') }
}

/** Inglés anidado (create al crear, upsert al editar), o nada si el body no trae `translations.en`. */
function translations(b: Body, experienceId?: number) {
  const en = enBody(b)
  if (!en) return {}
  const data = englishData(en)
  if (isBlank(data)) return experienceId === undefined ? {} : { translations: { updateMany: { where: { locale: EN }, data } } }
  const create = { locale: EN, ...data }
  return experienceId === undefined
    ? { translations: { create } }
    : { translations: { upsert: { where: { experienceId_locale: { experienceId, locale: EN } }, create, update: data } } }
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
    data: { ...experienceData(req.body), ...relations(req.body, 'connect'), ...translations(req.body) },
    include: experienceInclude,
  }))
})
experienceRouter.put('/experience/:id', async (req, res) => {
  const eid = paramId(req)
  res.json(await db.experience.update({
    where: { id: eid },
    data: { ...experienceData(req.body), ...relations(req.body, 'set'), ...translations(req.body, eid) },
    include: experienceInclude,
  }))
})
experienceRouter.delete('/experience/:id', async (req, res) => {
  await db.experience.delete({ where: { id: paramId(req) } })
  res.status(204).end()
})
