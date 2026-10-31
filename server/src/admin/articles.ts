/**
 * Artículos en el admin. Nacen en borrador y sin fecha: se publican después, con su estado. La
 * dirección sale del título al crear (shared/slug.ts) y solo cambia con PATCH /articles/:id/slug.
 * El inglés (título, bajada y texto) llega en `translations.en` y va a ArticleTranslation por upsert:
 * una clave ausente conserva lo guardado y un texto vacío queda en NULL (la API cae al español).
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ArticleStatus, type Prisma } from '../../generated/prisma/client.js'
import { paramId, readOr503 } from './common.js'
import { HttpError, bool, enumOf, guardSlugChange, intList, newSlug, optDate, optInt, optStr, optUrl, slug, str, validate } from './input.js'
import { EN, isBlank, withTranslations } from './translations.js'

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient

const ARTICLE_STATUS = Object.values(ArticleStatus)
const EN_FIELDS = ['title', 'summary', 'content'] as const

type EnglishData = Partial<Record<typeof EN_FIELDS[number], string | null>>

const articleInclude = {
  ...withTranslations,
  techs: { select: { id: true, name: true, slug: true } },
  project: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.ArticleInclude

function articleData(b: Body) {
  return {
    title: str(b, 'title'),
    summary: str(b, 'summary'),
    content: str(b, 'content'),
    readingTimeMin: optInt(b, 'readingTimeMin', 1, 240) ?? 5,
    featured: bool(b, 'featured'),
    coverImage: optStr(b, 'coverImage'),
    canonicalUrl: optUrl(b, 'canonicalUrl'),
    sortOrder: optInt(b, 'sortOrder') ?? 0,
    projectId: optInt(b, 'projectId'),
  }
}

/** `translations.en` validado con los topes del español; null si no llegó. */
function englishData(b: Body): EnglishData | null {
  const translations = b['translations']
  if (translations === undefined || translations === null) return null
  const en = typeof translations === 'object' && !Array.isArray(translations) ? (translations as Body)['en'] : undefined
  if (en === undefined || en === null) return null
  if (typeof en !== 'object' || Array.isArray(en)) throw new HttpError(400, 'El inglés del artículo llegó con un formato que no esperábamos. Recargá y volvé a guardar.')
  const out: EnglishData = {}
  for (const k of EN_FIELDS) {
    if (k in en) out[k] = optStr(en as Body, k)
  }
  return out
}

export async function saveArticleEn(tx: Tx, articleId: number, data: EnglishData): Promise<void> {
  if (isBlank(data)) {
    await tx.articleTranslation.updateMany({ where: { articleId, locale: EN }, data })
    return
  }
  await tx.articleTranslation.upsert({
    where: { articleId_locale: { articleId, locale: EN } },
    create: { articleId, locale: EN, ...data },
    update: data,
  })
}

async function currentArticle(id: number) {
  const row = await db.article.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!row) throw new HttpError(404, 'No encontramos ese artículo: puede que se haya borrado. Recargá la lista.')
  return row
}

export const articlesRouter = Router()

articlesRouter.get('/articles', async (_req, res) => {
  const rows = await readOr503(res, () => db.article.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], include: articleInclude }))
  if (rows) res.json(rows)
})

articlesRouter.get('/articles/:id', async (req, res) => {
  const id = paramId(req)
  const row = await readOr503(res, () => db.article.findUnique({ where: { id }, include: articleInclude }))
  if (row === undefined) return
  if (!row) throw new HttpError(404, 'No encontramos ese artículo: puede que se haya borrado. Recargá la lista.')
  res.json(row)
})

/** Un artículo nuevo es un borrador sin fecha, diga lo que diga el body. */
articlesRouter.post('/articles', async (req, res) => {
  const b = req.body as Body
  const { data, techIds, en } = validate('Article', b, () => {
    const fields = articleData(b)
    return { data: { ...fields, slug: newSlug(b, 'slug', fields.title) }, techIds: intList(b, 'techIds'), en: englishData(b) }
  })
  const row = await db.$transaction(async (tx) => {
    const { id } = await tx.article.create({
      data: { ...data, status: ArticleStatus.DRAFT, publishedAt: null, techs: { connect: techIds.map(n => ({ id: n })) } },
      select: { id: true },
    })
    if (en) await saveArticleEn(tx, id, en)
    return tx.article.findUniqueOrThrow({ where: { id }, include: articleInclude })
  })
  res.status(201).json(row)
})

articlesRouter.put('/articles/:id', async (req, res) => {
  const b = req.body as Body
  const current = await currentArticle(paramId(req))
  const { data, techIds, en } = validate('Article', b, () => {
    guardSlugChange(current.slug, b['slug'])
    const fields = { ...articleData(b), status: enumOf(b, 'status', ARTICLE_STATUS), publishedAt: optDate(b, 'publishedAt') }
    return { data: fields, techIds: intList(b, 'techIds'), en: englishData(b) }
  })
  const row = await db.$transaction(async (tx) => {
    await tx.article.update({ where: { id: current.id }, data: { ...data, techs: { set: techIds.map(n => ({ id: n })) } } })
    if (en) await saveArticleEn(tx, current.id, en)
    return tx.article.findUniqueOrThrow({ where: { id: current.id }, include: articleInclude })
  })
  res.json(row)
})

/** «Cambiar dirección»: /articles/<vieja> deja de andar. */
articlesRouter.patch('/articles/:id/slug', async (req, res) => {
  const b = req.body as Body
  const current = await currentArticle(paramId(req))
  const next = validate('Article', b, () => slug(b, 'slug'))
  res.json(await db.article.update({ where: { id: current.id }, data: { slug: next }, include: articleInclude }))
})

articlesRouter.delete('/articles/:id', async (req, res) => {
  const { id } = await currentArticle(paramId(req))
  await db.article.delete({ where: { id } })
  res.status(204).end()
})
