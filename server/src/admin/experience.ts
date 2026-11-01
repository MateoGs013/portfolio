/**
 * Trayectoria en el admin, con los campos que usa el CV: tipo de entrada, viñetas (hasta 3 de
 * 160 caracteres, la cota de una página A4), lugar, posición en el CV y las obras ligadas.
 *
 * El inglés llega en `translations.en` y va a ExperienceTranslation. Sus viñetas quedan alineadas
 * con las del español, posición por posición: `['', 'only second']` guarda la segunda traducida y la
 * primera pendiente (la API pública sirve esa en español y la lista como `highlights[0]`).
 * La dirección solo cambia con PATCH /experience/:id/slug y el orden del CV con PATCH /experience/order.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ExperienceKind, type Prisma } from '../../generated/prisma/client.js'
import { paramId, readOr503 } from './common.js'
import { HttpError, date, enumOf, fail, guardSlugChange, intList, newSlug, optDate, optInt, optStr, slug, str, validate } from './input.js'
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

/** Lista de textos recortados, o null si no llegó una lista de textos. */
function texts(b: Body, english: boolean): string[] | null {
  const raw = b['highlights'] ?? []
  if (Array.isArray(raw) && raw.every(x => typeof x === 'string')) return raw.map(x => x.trim())
  const which = english ? 'Las viñetas en inglés tienen' : 'Las viñetas del CV tienen'
  return fail(b, 'highlights', `${which} que ser una lista de textos.`, null)
}

function checkLength(b: Body, items: readonly string[], english: boolean): void {
  items.forEach((item, i) => {
    if (item.length > HIGHLIGHT_CHARS) {
      const which = english ? `La viñeta ${i + 1} en inglés` : `La viñeta ${i + 1}`
      fail(b, `highlights[${i}]`, `${which} pasa los ${HIGHLIGHT_CHARS} caracteres (tiene ${item.length}): el CV tiene que entrar en una página.`, null)
    }
  })
}

/** Viñetas en español: las vacías se descartan; `kept` dice qué posiciones quedaron. */
function highlights(b: Body): { items: string[], kept: number[] } {
  const all = texts(b, false) ?? []
  const kept = all.flatMap((item, i) => (item ? [i] : []))
  const items = kept.map(i => all[i] as string)
  if (items.length > HIGHLIGHTS_MAX) fail(b, 'highlights', `El CV admite hasta ${HIGHLIGHTS_MAX} viñetas por entrada (hay ${items.length}).`, null)
  checkLength(b, items, false)
  return { items, kept }
}

/**
 * Viñetas en inglés en las mismas posiciones que las del español: se descartan las mismas que en
 * español, se completan con '' hasta el mismo largo y una viñeta de más con texto es un error.
 */
function englishHighlights(en: Body, kept: readonly number[]): string[] {
  const all = texts(en, true) ?? []
  if (all.some((item, i) => item && !kept.includes(i))) fail(en, 'highlights', 'Hay viñetas en inglés sin su par en español: cargá primero la viñeta en español.', null)
  const aligned = kept.map(i => all[i] ?? '')
  checkLength(en, aligned, true)
  return aligned
}

/** Fila ExperienceTranslation: vacío → null; las viñetas solo cambian si llegan. */
function englishData(en: Body, kept: readonly number[]) {
  const values = enTexts(en, { role: 120, summary: 600, story: 4000, location: 120 })
  return 'highlights' in en ? { ...values, highlights: englishHighlights(en, kept) } : values
}

function experienceData(b: Body) {
  const { items, kept } = highlights(b)
  const en = enBody(b)
  return {
    data: {
      kind: b['kind'] ? enumOf(b, 'kind', EXPERIENCE_KIND) : ExperienceKind.FREELANCE,
      role: str(b, 'role'),
      startedAt: date(b, 'startedAt'),
      endedAt: optDate(b, 'endedAt'),
      summary: str(b, 'summary'),
      story: optStr(b, 'story'),
      highlights: items,
      location: optStr(b, 'location'),
      cvOrder: optInt(b, 'cvOrder', 1, 99),
      orgId: optInt(b, 'orgId'),
    },
    english: en ? englishData(en, kept) : null,
    techIds: intList(b, 'techIds'),
    projectIds: intList(b, 'projectIds'),
  }
}

type EnglishRow = ReturnType<typeof englishData>

/** Inglés anidado: create al crear, upsert al editar; todo vacío no crea fila nueva. */
function translations(english: EnglishRow | null, experienceId?: number) {
  if (!english) return {}
  if (isBlank(english)) return experienceId === undefined ? {} : { translations: { updateMany: { where: { locale: EN }, data: english } } }
  const create = { locale: EN, ...english }
  return experienceId === undefined
    ? { translations: { create } }
    : { translations: { upsert: { where: { experienceId_locale: { experienceId, locale: EN } }, create, update: english } } }
}

async function currentExperience(id: number) {
  const row = await db.experience.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!row) throw new HttpError(404, 'No encontramos esa experiencia: puede que se haya borrado. Recargá la lista.')
  return row
}

export const experienceRouter = Router()

experienceRouter.get('/experience', async (_req, res) => {
  const rows = await readOr503(res, () => db.experience.findMany({ orderBy: { startedAt: 'desc' }, include: experienceInclude }))
  if (rows) res.json(rows)
})

experienceRouter.post('/experience', async (req, res) => {
  const b = req.body as Body
  const { data, english, techIds, projectIds, address } = validate('Experience', b, () => {
    const fields = experienceData(b)
    // Como en las otras colecciones: sin dirección, sale del cargo (después queda fija).
    return { ...fields, address: newSlug(b, 'slug', fields.data.role) }
  })
  res.status(201).json(await db.experience.create({
    data: {
      ...data,
      slug: address,
      techs: { connect: techIds.map(id => ({ id })) },
      projects: { connect: projectIds.map(id => ({ id })) },
      ...translations(english),
    },
    include: experienceInclude,
  }))
})

/**
 * Orden de la experiencia del CV: las entradas de `ids` quedan 1..n en ese orden y el resto sale del
 * CV (cvOrder NULL). Va antes de /experience/:id para que «order» no se lea como un id.
 */
experienceRouter.patch('/experience/order', async (req, res) => {
  const b = req.body as Body
  const ids = b['ids']
  if (!Array.isArray(ids) || !ids.every(id => Number.isInteger(id))) throw new HttpError(400, 'El orden del CV llegó incompleto. Recargá y ordená de nuevo.')
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Una entrada quedó dos veces en el orden del CV. Recargá y ordená de nuevo.')
  if (ids.length > 99) throw new HttpError(400, 'El CV admite hasta 99 entradas de experiencia.')
  const found = await db.experience.count({ where: { id: { in: ids } } })
  if (found !== ids.length) throw new HttpError(400, 'Una de las entradas del orden ya no existe. Recargá y ordená de nuevo.')
  const rows = await db.$transaction(async (tx) => {
    await tx.experience.updateMany({ where: { id: { notIn: ids } }, data: { cvOrder: null } })
    for (const [i, id] of ids.entries()) await tx.experience.update({ where: { id }, data: { cvOrder: i + 1 } })
    return tx.experience.findMany({ orderBy: { startedAt: 'desc' }, include: experienceInclude })
  })
  res.json(rows)
})

experienceRouter.put('/experience/:id', async (req, res) => {
  const b = req.body as Body
  const current = await currentExperience(paramId(req))
  const { data, english, techIds, projectIds } = validate('Experience', b, () => {
    guardSlugChange(current.slug, b['slug'])
    return experienceData(b)
  })
  res.json(await db.experience.update({
    where: { id: current.id },
    data: {
      ...data,
      techs: { set: techIds.map(id => ({ id })) },
      projects: { set: projectIds.map(id => ({ id })) },
      ...translations(english, current.id),
    },
    include: experienceInclude,
  }))
})

/** «Cambiar dirección»: /api/experience/<vieja> deja de responder. */
experienceRouter.patch('/experience/:id/slug', async (req, res) => {
  const b = req.body as Body
  const current = await currentExperience(paramId(req))
  const next = validate('Experience', b, () => slug(b, 'slug'))
  res.json(await db.experience.update({ where: { id: current.id }, data: { slug: next }, include: experienceInclude }))
})

experienceRouter.delete('/experience/:id', async (req, res) => {
  const { id } = await currentExperience(paramId(req))
  await db.experience.delete({ where: { id } })
  res.status(204).end()
})
