/**
 * Artículos que escribe Eros y publica la API sola, en español y en inglés: el de los lunes
 * (articleSchedule.ts), uno pedido desde Artículos o uno desde una tendencia.
 *
 * `startArticleRun` anota el pedido (ArticleRun), se lo pasa a Eros (POST /api/articles/generate, que
 * responde 202 con una tarea en el acto) y devuelve el pedido sin esperar el artículo: la tarea se
 * sigue en segundo plano (`finishRun`) hasta que Eros termina, falla o pasan ocho minutos. Solo hay
 * uno a la vez. Lo que vuelve se valida en erosArticleContract.ts y se publica en una transacción
 * (artículo, inglés y pedido hecho); después se olvidan los respaldos de la API pública.
 *
 * Nada de esto tira errores hacia afuera: un fallo queda en el pedido (`error`, `errorCode`) y en el log.
 */
import { ArticleStatus, type ArticleRun, type Prisma } from '../../generated/prisma/client.js'
import { forgetLastGood } from '../content/snapshot.js'
import { db } from '../db.js'
import type { ArticleRunTrigger, ArticleRunView } from '../shared/articleRunContracts.js'
import { readingMinutes } from '../shared/markdown.js'
import { freeArticleSlug, projectIdBySlug, techIdsByTags } from './articleRelations.js'
import { saveArticleEn } from './articles.js'
import { normalizeErosArticle, type ErosArticle } from './erosArticleContract.js'
import { awaitErosTask } from './erosTask.js'
import { forwardToEros, type ForwardResult } from './proxy.js'

/** Un pedido que lleva más de esto escribiendo se dio por cortado. */
export const RUN_STALE_MS = 20 * 60_000
/** Lo que se espera a Eros desde el pedido hasta el artículo. */
const RUN_BUDGET_MS = 8 * 60_000
/** El 202 de Eros llega en el acto: si tarda más que esto, Eros no está. */
const KICKOFF_MS = 20_000
const AVOID_MAX = 300
const AVOID_TITLE_MAX = 200

export interface ArticleRunInput {
  trigger: ArticleRunTrigger
  topic?: string | null
  projectSlug?: string | null
  trendId?: string | null
  angle?: string | null
}

export type StartResult =
  | { kind: 'started', run: ArticleRunView }
  /** Ya hay uno escribiendo: no se pide otro. */
  | { kind: 'busy', run: ArticleRunView }
  /** Eros no tomó el pedido (no responde, falló o no sabe escribir artículos): el pedido quedó fallido. */
  | { kind: 'eros', run: ArticleRunView, failure: ForwardResult }

const runInclude = { article: { select: { id: true, slug: true, title: true } } } satisfies Prisma.ArticleRunInclude
type RunRow = Prisma.ArticleRunGetPayload<{ include: typeof runInclude }>

export function viewOf(row: RunRow): ArticleRunView {
  return {
    id: row.id,
    trigger: row.trigger as ArticleRunView['trigger'],
    status: row.status as ArticleRunView['status'],
    topic: row.topic,
    projectSlug: row.projectSlug,
    trendId: row.trendId,
    error: row.error,
    errorCode: row.errorCode,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    article: row.article,
  }
}

/** Los pedidos que sigue este proceso: uno «escribiendo» que no está acá quedó de un arranque anterior. */
const active = new Set<number>()

const log = (message: string) => console.warn(`[articulos] ${message}`)

/** Da por cortados los pedidos que nadie sigue: de otro arranque de la API o con más de 20 minutos. */
export async function expireStaleRuns(now = Date.now()): Promise<void> {
  await db.articleRun.updateMany({
    where: {
      status: 'running',
      OR: [{ startedAt: { lt: new Date(now - RUN_STALE_MS) } }, { id: { notIn: [...active] } }],
    },
    data: {
      status: 'failed',
      error: 'Se cortó: Eros no terminó a tiempo o la API se reinició mientras escribía. No se publicó nada.',
      errorCode: 'cut',
      finishedAt: new Date(now),
    },
  })
}

async function fail(id: number, error: string, errorCode: string | null): Promise<RunRow> {
  log(`el pedido ${id} falló: ${error}`)
  return db.articleRun.update({
    where: { id },
    data: { status: 'failed', error, errorCode, finishedAt: new Date() },
    include: runInclude,
  })
}

/** Los títulos publicados o guardados, para que Eros no repita un tema (los más nuevos primero). */
async function avoidTitles(): Promise<string[]> {
  const rows = await db.article.findMany({ select: { title: true }, orderBy: { createdAt: 'desc' }, take: AVOID_MAX })
  return rows.map(r => r.title.trim().slice(0, AVOID_TITLE_MAX)).filter(Boolean)
}

/** El cuerpo de POST /api/articles/generate de Eros: lo que hay, más los títulos a evitar. */
async function erosBody(input: ArticleRunInput): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = { avoid_titles: await avoidTitles() }
  if (input.topic) body['topic'] = input.topic
  if (input.projectSlug) body['project_slug'] = input.projectSlug
  if (input.trendId) body['trend_id'] = input.trendId
  if (input.angle) body['angle'] = input.angle
  return body
}

/** El motivo del fallo de Eros para el pedido, en español, y su código. */
function erosFailure(result: ForwardResult): { error: string, code: string } {
  const failure = result.failure
  const data = (result.data ?? {}) as { error?: unknown, code?: unknown }
  if (failure?.reason === 'rejected' && failure.upstream === 404) {
    return { error: 'Este Eros todavía no escribe artículos: falta actualizarlo. No se publicó nada.', code: 'not_supported' }
  }
  if (failure?.reason === 'rejected') {
    const said = failure.detail ? ` Eros dijo: «${failure.detail.replace(/[.\s]+$/, '')}».` : ''
    return { error: `Eros no aceptó el pedido.${said} No se publicó nada.`, code: failure.code ?? 'invalid' }
  }
  if (failure?.upstream === 404) return { error: 'Eros se reinició y perdió el pedido. No se publicó nada.', code: 'cut' }
  const message = typeof data.error === 'string' ? data.error : failure?.message ?? 'Eros no respondió.'
  const code = failure?.code ?? (typeof data.code === 'string' ? data.code : 'eros_error')
  return { error: `${message.replace(/\s+$/, '')} No se publicó nada.`, code }
}

/** Publica el artículo de Eros en una transacción: el artículo, su inglés y el pedido hecho. */
async function publish(run: ArticleRun, article: ErosArticle): Promise<RunRow> {
  const [slug, techIds, projectId] = await Promise.all([
    freeArticleSlug(article.es.title),
    techIdsByTags(article.tags),
    projectIdBySlug(article.projectSlug ?? run.projectSlug),
  ])
  const now = new Date()
  const row = await db.$transaction(async (tx) => {
    const { id } = await tx.article.create({
      data: {
        slug,
        title: article.es.title,
        summary: article.es.summary,
        content: article.es.markdown,
        readingTimeMin: readingMinutes(article.es.markdown),
        status: ArticleStatus.PUBLISHED,
        publishedAt: now,
        featured: false,
        projectId,
        techs: { connect: techIds.map(n => ({ id: n })) },
      },
      select: { id: true },
    })
    await saveArticleEn(tx, id, { title: article.en.title, summary: article.en.summary, content: article.en.markdown })
    return tx.articleRun.update({
      where: { id: run.id },
      data: { status: 'done', articleId: id, finishedAt: now, error: null, errorCode: null, topic: run.topic ?? article.topic },
      include: runInclude,
    })
  })
  forgetLastGood()
  console.log(`[articulos] el pedido ${run.id} publicó /articles/${slug}${article.model ? ` (${article.model})` : ''}`)
  return row
}

/** Sigue la tarea de Eros hasta el final y publica, o deja el pedido fallido. Nunca tira. */
async function finishRun(run: ArticleRun, reply: ForwardResult, started: number): Promise<void> {
  try {
    const result = await awaitErosTask(reply, started, RUN_BUDGET_MS)
    if (!result.ok) {
      const { error, code } = erosFailure(result)
      await fail(run.id, error, code)
      return
    }
    const parsed = normalizeErosArticle(result.data)
    if (!parsed.ok) {
      await fail(run.id, `${parsed.error} No se publicó nada.`, 'invalid_output')
      return
    }
    await publish(run, parsed.article)
  }
  catch (err) {
    console.error('[articulos] no se pudo terminar el pedido', run.id, err)
    await fail(run.id, 'No se pudo guardar el artículo en la base. No se publicó nada.', 'db').catch(() => undefined)
  }
  finally {
    active.delete(run.id)
  }
}

/**
 * Pide un artículo a Eros. Devuelve enseguida (después del 202 de Eros) con el pedido: `busy` si ya
 * hay uno escribiendo, `eros` si Eros no lo tomó (el pedido queda fallido con el motivo) y `started`
 * si Eros está escribiendo, que se sigue en segundo plano.
 */
export async function startArticleRun(input: ArticleRunInput): Promise<StartResult> {
  await expireStaleRuns()
  const running = await db.articleRun.findFirst({ where: { status: 'running' }, include: runInclude, orderBy: { startedAt: 'desc' } })
  if (running) return { kind: 'busy', run: viewOf(running) }

  const run = await db.articleRun.create({
    data: {
      trigger: input.trigger,
      status: 'running',
      topic: input.topic ?? null,
      projectSlug: input.projectSlug ?? null,
      trendId: input.trendId ?? null,
    },
  })
  active.add(run.id)
  const started = Date.now()
  let reply: ForwardResult
  try {
    reply = await forwardToEros('api/articles/generate', { method: 'POST', body: JSON.stringify(await erosBody(input)) }, KICKOFF_MS)
  }
  catch (err) {
    active.delete(run.id)
    console.error('[articulos] no se pudo pedir el artículo', err)
    const failed = await fail(run.id, 'No se pudo pedir el artículo a Eros. No se publicó nada.', 'internal')
    return { kind: 'eros', run: viewOf(failed), failure: { ok: false, status: 500, data: { error: failed.error, code: 'internal', errors: [] }, failure: null } }
  }
  if (!reply.ok) {
    active.delete(run.id)
    const { error, code } = erosFailure(reply)
    return { kind: 'eros', run: viewOf(await fail(run.id, error, code)), failure: reply }
  }
  void finishRun(run, reply, started)
  const row = await db.articleRun.findUniqueOrThrow({ where: { id: run.id }, include: runInclude })
  return { kind: 'started', run: viewOf(row) }
}

export async function findRun(id: number): Promise<ArticleRunView | null> {
  await expireStaleRuns()
  const row = await db.articleRun.findUnique({ where: { id }, include: runInclude })
  return row ? viewOf(row) : null
}

export async function listRuns(limit: number): Promise<ArticleRunView[]> {
  await expireStaleRuns()
  const rows = await db.articleRun.findMany({ orderBy: { startedAt: 'desc' }, take: limit, include: runInclude })
  return rows.map(viewOf)
}

/** El último pedido de los lunes desde `since`, si lo hay (lo usa el horario). */
export function weeklyRunSince(since: Date) {
  return db.articleRun.findFirst({ where: { trigger: 'weekly', startedAt: { gte: since } }, select: { id: true } })
}
