/**
 * /api/admin/content/*: las publicaciones de Eros (LinkedIn, hilo de X, Dev.to y carrusel) con el
 * contrato de erosContentContract.ts. Sin Eros, las lecturas responden 503 { offline: true } y las
 * escrituras fallan diciendo qué no pasó: no hay borradores en memoria ni ejemplos que parezcan
 * reales. Con EROS_DEMO=1 la lista sale de la muestra (un post por artículo publicado), que nunca se
 * modifica. «Publicar en el blog» es lo único que escribe en la base: un artículo en borrador.
 */
import { Router, type Request, type Response } from 'express'
import { ArticleStatus } from '../../generated/prisma/client.js'
import { db } from '../db.js'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { adminSchema } from '../shared/adminSchema.js'
import {
  isPostStatus,
  isPublishChannel,
  postStatusLabels,
  publishChannelLabels,
  type BlogDraft,
  type ContentPost,
  type DispatchResult,
  type PostResult,
} from '../shared/contentContracts.js'
import { freeArticleSlug } from './articleRelations.js'
import { contentCarouselRouter } from './contentCarousel.js'
import {
  erosGenerateBody,
  generateRequest,
  invalid,
  isErrorBody,
  normalizeOnePost,
  normalizePosts,
  sendContentFailure,
  sendUnreadable,
} from './erosContentContract.js'
import { text } from './erosContract.js'
import { demoPosts, erosDemo, findDemoPost, isDemoId, refuseDemo, sendDemo } from './fallbackContentData.js'
import { erosIdParam, forwardToEros, getParamId } from './proxy.js'

export const contentRouter = Router()

/** Un id que no es de Eros (`%2F`, `..`) responde 400 y nunca se reenvía. */
contentRouter.param('id', erosIdParam)

contentRouter.use(contentCarouselRouter)

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body ?? {}) })
const postPath = (id: string, rest = '') => `api/content/posts/${encodeURIComponent(id)}${rest}`

const statusHint = `Elegí un estado: ${Object.values(postStatusLabels).map(l => l.toLowerCase()).join(', ')}.`

/** GET /api/admin/content/posts[?status=] - Las publicaciones, de la más nueva a la más vieja. */
contentRouter.get('/posts', async (req: Request, res: Response) => {
  const status = isPostStatus(req.query['status']) ? req.query['status'] : null
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  const limit = Number(req.query['limit'])
  if (Number.isInteger(limit) && limit > 0) query.set('limit', String(Math.min(limit, 200)))
  const result = await forwardToEros(`api/content/posts${query.size ? `?${query}` : ''}`)
  if (result.ok) {
    res.json(normalizePosts(result.data).filter(p => !status || p.status === status))
    return
  }
  if (!erosDemo()) {
    sendContentFailure(res, result, 'post')
    return
  }
  sendDemo(res, (await demoPosts()).filter(p => !status || p.status === status))
})

/** GET /api/admin/content/posts/:id → ContentPost. */
contentRouter.get('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (isDemoId(id)) {
    const post = erosDemo() ? await findDemoPost(id) : null
    if (post) sendDemo(res, post)
    else res.status(404).json({ error: 'Esa publicación de muestra no existe.', code: 'not_found', errors: [] })
    return
  }
  const result = await forwardToEros(postPath(id))
  const post = result.ok ? normalizeOnePost(result.data) : null
  if (post) res.json(post)
  else if (result.ok) sendUnreadable(res, 'Recargá la lista.')
  else sendContentFailure(res, result, 'post')
})

/** POST /api/admin/content/generate { topic, custom_angle?, pillar?, project_slug?, key_points? } → PostResult (solo Eros). */
contentRouter.post('/generate', async (req: Request, res: Response) => {
  const request = generateRequest(req.body)
  if (isErrorBody(request)) {
    res.status(400).json(request)
    return
  }
  const result = await forwardToEros('api/content/generate', json('POST', erosGenerateBody(request)), 60000)
  if (!result.ok) {
    sendContentFailure(res, result, 'post', 'No se generó la publicación.')
    return
  }
  const post = normalizeOnePost(result.data)
  if (post) res.json({ ok: true, post } satisfies PostResult)
  else sendUnreadable(res, 'Recargá la lista: puede que la publicación se haya creado igual.')
})

/** Los `error_code` de publicar en Eros, en español: qué pasó y qué hacer. */
const publishRefusals: Record<string, { status: number, body: AdminErrorBody }> = {
  already_published: { status: 409, body: { error: 'Ya está publicada por ese canal: no se vuelve a publicar.', code: 'conflict', errors: [] } },
  rejected: { status: 409, body: { error: 'Está rechazada: no se publica. Pasala a borrador o aprobada si querés publicarla.', code: 'conflict', errors: [] } },
  already_dispatched: { status: 409, body: { error: 'Ya se despachó por ese canal y n8n todavía no confirmó: no se manda dos veces. Revisá en la red antes de reintentar.', code: 'conflict', errors: [] } },
  invalid_channel: { status: 400, body: { error: 'Eros no publica por ese canal.', code: 'invalid', errors: [{ path: 'channel', message: 'Elegí LinkedIn, X o los dos.' }] } },
  dispatch_failed: { status: 502, body: { error: 'n8n no aceptó la publicación: no salió.', code: 'eros_error', errors: [] } },
  dispatch_unknown: { status: 502, body: { error: 'n8n no respondió a tiempo: puede que haya salido. Revisá en la red antes de reintentar.', code: 'eros_error', errors: [] } },
}

/**
 * POST /api/admin/content/posts/:id/publish { channel } → DispatchResult (solo Eros). Lo que pasó lo
 * dice el `status` de Eros: 'dispatched' si n8n la recibió (el Eros de antes decía 'published'),
 * 'approved_local' si Eros no tiene n8n y solo la aprobó. Un rechazo con `error_code` sale con su texto.
 */
contentRouter.post('/posts/:id/publish', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const raw: unknown = req.body?.channel ?? 'all'
  if (!isPublishChannel(raw)) {
    const options = Object.values(publishChannelLabels).join(', ')
    res.status(400).json(invalid('channel', `Elegí por dónde sale: ${options}.`, 'Ese canal no existe.'))
    return
  }
  if (refuseDemo(res, id)) return
  const result = await forwardToEros(postPath(id, '/publish'), json('POST', { channel: raw }), 45000)
  if (!result.ok) {
    const refusal = publishRefusals[result.failure?.code ?? '']
    if (refusal) res.status(refusal.status).json(refusal.body)
    else sendContentFailure(res, result, 'post', 'La publicación no salió.')
    return
  }
  // Un 200 de Eros que no dice «dispatched» (o «published») ni «approved_local» no es un despacho.
  const body = (result.data ?? {}) as Record<string, unknown>
  const said = text(body['status'])
  const status = said === 'dispatched' || said === 'published' ? 'dispatched' : said === 'approved_local' ? said : null
  if (body['ok'] === false || !status) {
    res.status(502).json({ error: 'Eros no confirmó la publicación. La publicación no salió.', code: 'eros_error', errors: [] })
    return
  }
  const dispatched = status === 'dispatched'
    ? text(body['dispatched_at']) ?? normalizeOnePost(result.data)?.dispatched_at ?? text(body['n8n_published_at'])
    : null
  const channels = Array.isArray(body['dispatched_channels']) ? body['dispatched_channels'].map(text).filter((c): c is string => c !== null) : []
  res.json({ ok: true, channel: raw, channels, status, dispatched_at: dispatched } satisfies DispatchResult)
})

/** PATCH /api/admin/content/posts/:id/status { status } → PostResult (solo Eros). */
contentRouter.patch('/posts/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const status: unknown = req.body?.status
  if (!isPostStatus(status)) {
    res.status(400).json(invalid('status', statusHint, 'Ese estado no existe.'))
    return
  }
  if (refuseDemo(res, id)) return
  const result = await forwardToEros(postPath(id, '/status'), json('PATCH', { status }))
  if (result.ok) res.json({ ok: true, post: normalizeOnePost(result.data) } satisfies PostResult)
  else sendContentFailure(res, result, 'post', 'El estado no cambió.')
})

/** DELETE /api/admin/content/posts/:id (solo Eros). */
contentRouter.delete('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (refuseDemo(res, id)) return
  const result = await forwardToEros(postPath(id), { method: 'DELETE' }, 15000)
  if (result.ok) res.json({ ok: true })
  else sendContentFailure(res, result, 'post', 'La publicación no se borró.')
})

// ─── Publicar en el blog ────────────────────────────────────────────────────

/** Los topes del artículo en el admin (adminSchema), para que el borrador se pueda guardar tal cual. */
const ARTICLE_MAX = {
  title: adminSchema.Article.title.max ?? 160,
  summary: adminSchema.Article.summary.max ?? 400,
  content: adminSchema.Article.content.max ?? 60000,
}

/** Corta en el último espacio antes del tope y marca el corte con «…». */
function clip(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** La primera oración del texto, sin marcado: la bajada si Eros no mandó gancho. */
function lead(markdown: string): string {
  const flat = markdown.replace(/^#.*$/gm, '').replace(/```[\s\S]*?```/g, '').replace(/[*_`#>]+/g, '').replace(/\s+/g, ' ').trim()
  const end = flat.search(/[.!?](\s|$)/)
  return end === -1 ? flat : flat.slice(0, end + 1)
}

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** La obra y las tecnologías de la base que nombra la publicación; lo que no existe, no se suma. */
async function relations(post: ContentPost): Promise<{ projectId: number | null, techIds: number[] }> {
  const [project, techs] = await Promise.all([
    post.project_slug ? db.project.findUnique({ where: { slug: post.project_slug }, select: { id: true } }) : null,
    post.devto_tags.length ? db.tech.findMany({ select: { id: true, slug: true } }) : [],
  ])
  const tags = new Set(post.devto_tags.map(compact))
  return { projectId: project?.id ?? null, techIds: techs.filter(t => tags.has(compact(t.slug))).map(t => t.id) }
}

/**
 * POST /api/admin/content/posts/:id/publish-to-blog → 201 BlogDraft. Arma un artículo en borrador
 * (sin fecha, fuera del sitio) con el texto de Dev.to de la publicación de Eros, para revisarlo en
 * Artículos. Un borrador no cambia la API pública: no hace falta olvidar sus respaldos.
 */
contentRouter.post('/posts/:id/publish-to-blog', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (refuseDemo(res, id)) return
  const result = await forwardToEros(postPath(id))
  if (!result.ok) {
    sendContentFailure(res, result, 'post', 'Sin la publicación de Eros no se creó el artículo.')
    return
  }
  const post = normalizeOnePost(result.data)
  if (!post) {
    sendUnreadable(res, 'No se creó el artículo.')
    return
  }
  const content = (post.devto_markdown || post.linkedin_text).trim()
  if (!content) {
    res.status(400).json(invalid('devto_markdown', 'La publicación no tiene texto para armar el artículo.'))
    return
  }
  if (content.length > ARTICLE_MAX.content) {
    res.status(400).json(invalid('devto_markdown', 'La publicación es más larga de lo que admite un artículo: acortala en Eros y probá de nuevo.'))
    return
  }
  const title = clip(post.devto_title || post.title || post.topic || '', ARTICLE_MAX.title) || clip(lead(content), ARTICLE_MAX.title)
  const summary = clip(post.hook ?? lead(content), ARTICLE_MAX.summary) || title
  const words = content.split(/\s+/).filter(Boolean).length
  const [slug, { projectId, techIds }] = await Promise.all([freeArticleSlug(title), relations(post)])

  const article = await db.article.create({
    data: {
      slug,
      title,
      summary,
      content,
      readingTimeMin: Math.min(240, Math.max(1, Math.ceil(words / 200))),
      status: ArticleStatus.DRAFT,
      publishedAt: null,
      projectId,
      techs: { connect: techIds.map(n => ({ id: n })) },
    },
    select: { id: true, slug: true },
  })
  res.status(201).json({ article } satisfies BlogDraft)
})
