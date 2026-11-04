/**
 * /api/admin/articles/generate y /api/admin/articles/runs: pedirle un artículo a Eros (que la API
 * publica sola, articleAuto.ts) y seguir los pedidos. Se monta antes que articles.ts, porque
 * /articles/runs chocaría con /articles/:id.
 *
 * Sin Eros, pedir responde como el resto de las escrituras de Eros: 503 { offline: true } diciendo
 * qué no pasó (el pedido queda anotado como fallido). Con EROS_DEMO=1 no hay artículo de muestra: una
 * tendencia de muestra responde 400 y el resto va a Eros, como las demás escrituras.
 */
import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { ARTICLE_TOPIC_MAX, type ArticleRunList, type ArticleRunReply, type ArticleRunView } from '../shared/articleRunContracts.js'
import { isSlug } from '../shared/slug.js'
import { findRun, listRuns, startArticleRun } from './articleAuto.js'
import { nextWeeklySlot, weeklyEnabled } from './articleSlots.js'
import { paramId, readOr503 } from './common.js'
import { demoRefusal, isDemoId } from './fallbackContentData.js'
import { HttpError } from './input.js'
import { isErosId, type ForwardResult } from './proxy.js'

export const articleRunsRouter = Router()

type Body = Record<string, unknown>

interface GenerateInput {
  topic: string | null
  projectSlug: string | null
  trendId: string | null
}

const isObj = (value: unknown): value is Body => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Un texto opcional: vacío o ausente es null; cualquier otra cosa que no sea texto, un problema. */
function optText(b: Body, key: string): string | null | undefined {
  const value = b[key]
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return undefined
  return value.replace(/\s+/g, ' ').trim() || null
}

/** El cuerpo de «Pedir un artículo», con todos sus problemas juntos (como el resto del admin). */
async function generateInput(body: unknown): Promise<GenerateInput | AdminErrorBody> {
  const b = isObj(body) ? body : {}
  const errors: AdminErrorBody['errors'] = []
  const topic = optText(b, 'topic')
  if (topic === undefined) errors.push({ path: 'topic', message: 'El tema tiene que ser un texto.' })
  else if (topic && topic.length > ARTICLE_TOPIC_MAX) errors.push({ path: 'topic', message: `El tema puede tener hasta ${ARTICLE_TOPIC_MAX} caracteres.` })

  const rawProject = optText(b, 'projectSlug')
  const projectSlug = rawProject ? rawProject.toLowerCase() : rawProject
  if (projectSlug === undefined || (projectSlug && !isSlug(projectSlug))) {
    errors.push({ path: 'projectSlug', message: 'Elegí una obra de la lista.' })
  }
  else if (projectSlug && !(await db.project.findUnique({ where: { slug: projectSlug }, select: { id: true } }))) {
    errors.push({ path: 'projectSlug', message: 'Esa obra no existe: puede que se haya borrado. Elegí otra.' })
  }

  const trendId = optText(b, 'trendId')
  if (trendId === undefined || (trendId && !isErosId(trendId))) {
    errors.push({ path: 'trendId', message: 'Esa tendencia no es válida: abrila de nuevo desde Tendencias.' })
  }

  if (errors.length) return { error: 'Revisá lo que le pedís a Eros.', code: 'invalid', errors }
  return { topic: topic ?? null, projectSlug: projectSlug ?? null, trendId: trendId ?? null }
}

/** Por qué Eros no tomó el pedido, con la forma de error del admin y el pedido fallido. */
function erosRefusal(res: Response, run: ArticleRunView, result: ForwardResult): void {
  const failure = result.failure
  const error = run.error ?? 'Eros no tomó el pedido. No se publicó nada.'
  if (failure?.reason === 'rejected') {
    const notSupported = failure.upstream === 404
    const body: AdminErrorBody = { error, code: notSupported ? 'eros_error' : 'invalid', errors: [] }
    res.status(notSupported ? 502 : 400).json({ ...body, run })
    return
  }
  const data = isObj(result.data) ? result.data : {}
  res.status(result.status >= 400 ? result.status : 502).json({ code: 'eros_error', errors: [], ...data, error, run })
}

/** POST /api/admin/articles/generate { topic?, projectSlug?, trendId? } → 202 ArticleRunReply. */
articleRunsRouter.post('/articles/generate', async (req: Request, res: Response) => {
  const input = await generateInput(req.body)
  if ('code' in input) {
    res.status(400).json(input)
    return
  }
  if (input.trendId && isDemoId(input.trendId)) {
    res.status(400).json(demoRefusal)
    return
  }
  const result = await startArticleRun({ trigger: input.trendId ? 'trend' : 'manual', ...input })
  if (result.kind === 'busy') {
    const body: AdminErrorBody = { error: 'Eros ya está escribiendo un artículo. Esperá a que lo publique y pedí otro.', code: 'conflict', errors: [] }
    res.status(409).json({ ...body, run: result.run })
    return
  }
  if (result.kind === 'eros') {
    erosRefusal(res, result.run, result.failure)
    return
  }
  res.status(202).json({ run: result.run } satisfies ArticleRunReply)
})

/** GET /api/admin/articles/runs?limit= → ArticleRunList: los últimos pedidos (10, hasta 50) y el próximo lunes. */
articleRunsRouter.get('/articles/runs', async (req: Request, res: Response) => {
  const asked = Number.parseInt(String(req.query['limit'] ?? ''), 10)
  const limit = Number.isInteger(asked) && asked > 0 ? Math.min(asked, 50) : 10
  const runs = await readOr503(res, () => listRuns(limit))
  if (!runs) return
  const weekly = weeklyEnabled()
  res.json({ runs, next: weekly ? nextWeeklySlot(new Date()).toISOString() : null, weekly } satisfies ArticleRunList)
})

/** GET /api/admin/articles/runs/:id → ArticleRunReply, con el artículo cuando se publicó. */
articleRunsRouter.get('/articles/runs/:id', async (req: Request, res: Response) => {
  const id = paramId(req)
  const run = await readOr503(res, () => findRun(id))
  if (run === undefined) return
  if (!run) throw new HttpError(404, 'No encontramos ese pedido a Eros. Recargá Artículos.')
  res.json({ run } satisfies ArticleRunReply)
})
