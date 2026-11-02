/**
 * Contrato con Eros para Publicaciones y Tendencias: cada respuesta pasa por su normalizador y sale
 * con la forma de server/src/shared/contentContracts.ts, abra o no un envoltorio `data`, `post` o
 * `trend`. Lo que no trae va en null o vacío: nunca un valor inventado. Acá también viven los
 * errores en español de estas rutas y la validación de lo que manda el admin.
 */
import type { Response } from 'express'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import {
  isPostPillar,
  isPostStatus,
  isTrendStatus,
  postPillarLabels,
  type CarouselSlide,
  type ContentPost,
  type GenerateRequest,
  type PostStatus,
  type Trend,
  type TrendScan,
} from '../shared/contentContracts.js'
import { count, list, text, unwrap } from './erosContract.js'
import { sendErosFailure, type ForwardResult } from './proxy.js'

export type * from '../shared/contentContracts.js'

type Obj = Record<string, unknown>

const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Un arreglo que puede llegar como tal o serializado en un texto JSON (así guarda Eros algunas columnas). */
function arrayOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim().startsWith('[')) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

/** Una lista de textos: arreglo, arreglo serializado o texto separado por comas. */
function strings(value: unknown): string[] {
  const items = arrayOf(value)
  return list(items.length ? items : value)
}

/** El objeto de una respuesta: suelto, en `data` o bajo su propio nombre (`post`, `trend`). */
function record(payload: unknown, key: string): Obj {
  if (isObj(payload) && isObj(payload[key])) return payload[key] as Obj
  return unwrap(payload)
}

/** La lista de una respuesta: el arreglo suelto o dentro de `data`, `items` o su propio nombre. */
function rows(payload: unknown, key: string): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!isObj(payload)) return []
  return [payload[key], payload['data'], payload['items'], payload['results']].find(Array.isArray) ?? []
}

// ─── Publicaciones ──────────────────────────────────────────────────────────

function normalizeSlide(raw: unknown, i: number): CarouselSlide | null {
  if (!isObj(raw)) return null
  const title = text(raw['title'])
  if (!title) return null
  return {
    index: count(raw['index']) ?? i + 1,
    title,
    subtitle: text(raw['subtitle']),
    bullets: strings(raw['bullets']),
    metric_badge: text(raw['metric_badge']),
    code_snippet: text(raw['code_snippet']),
    footer: text(raw['footer']),
  }
}

/** El hilo de X: un arreglo de tuits o un texto con los tuits separados por una línea en blanco. */
function thread(value: unknown): string[] {
  const items = arrayOf(value)
  if (items.length) return items.map(text).filter((t): t is string => t !== null)
  const flat = text(value)
  return flat ? flat.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean) : []
}

/** El estado de Eros sin importar mayúsculas («APPROVED» es approved); lo desconocido queda en borrador. */
function postStatusOf(value: unknown): PostStatus {
  const lowered = typeof value === 'string' ? value.trim().toLowerCase() : value
  return isPostStatus(lowered) ? lowered : 'draft'
}

export function normalizePost(raw: unknown): ContentPost | null {
  if (!isObj(raw)) return null
  const id = text(raw['id'])
  if (!id) return null
  const linkedin = text(raw['linkedin_text']) ?? text(raw['body']) ?? ''
  const markdown = text(raw['devto_markdown']) ?? ''
  const title = text(raw['title']) ?? text(raw['devto_title']) ?? text(raw['topic']) ?? ''
  return {
    id,
    title,
    topic: text(raw['topic']),
    pillar: isPostPillar(raw['pillar']) ? raw['pillar'] : null,
    project_slug: text(raw['project_slug']),
    hook: text(raw['hook']),
    linkedin_text: linkedin,
    first_comment: text(raw['first_comment']),
    twitter_thread: thread(raw['twitter_thread']),
    devto_title: text(raw['devto_title']),
    devto_tags: strings(raw['devto_tags']),
    devto_markdown: markdown,
    carousel_slides: arrayOf(raw['carousel_slides']).map(normalizeSlide).filter((s): s is CarouselSlide => s !== null),
    status: postStatusOf(raw['status']),
    dispatched_at: text(raw['n8n_published_at']) ?? text(raw['dispatched_at']),
    created_at: text(raw['created_at']),
    updated_at: text(raw['updated_at']),
    _source: 'eros',
  }
}

export const normalizePosts = (payload: unknown): ContentPost[] =>
  rows(payload, 'posts').map(normalizePost).filter((p): p is ContentPost => p !== null)

/** Una publicación sola: `{ post }`, `{ data }` o el objeto suelto. */
export const normalizeOnePost = (payload: unknown): ContentPost | null => normalizePost(record(payload, 'post'))

// ─── Tendencias ─────────────────────────────────────────────────────────────

/** La afinidad llega como fracción (0–1) o como porcentaje: sale siempre en 0–100. */
function percent(value: unknown): number | null {
  const n = count(value)
  if (n === null || n < 0) return null
  return Math.round(n <= 1 ? n * 100 : Math.min(n, 100))
}

/** Solo direcciones http(s): una URL rara no se muestra como enlace. */
function link(value: unknown): string | null {
  const url = text(value)
  return url && /^https?:\/\//i.test(url) ? url : null
}

export function normalizeTrend(raw: unknown): Trend | null {
  if (!isObj(raw)) return null
  const id = text(raw['id'])
  const title = text(raw['title'])
  if (!id || !title) return null
  return {
    id,
    title,
    source: (text(raw['source']) ?? 'OTRA').toUpperCase().replace(/[\s.-]+/g, '_'),
    url: link(raw['url']),
    summary: text(raw['summary']),
    detected_at: text(raw['detected_at']) ?? text(raw['created_at']),
    status: isTrendStatus(raw['status']) ? raw['status'] : 'DISCOVERED',
    relevance_score: percent(raw['relevance_score']),
    engineering_angle: text(raw['engineering_angle']),
    tags: strings(raw['tags']),
    post_id: text(raw['post_id']),
    _source: 'eros',
  }
}

export const normalizeTrends = (payload: unknown): Trend[] =>
  rows(payload, 'trends').map(normalizeTrend).filter((t): t is Trend => t !== null)

export const normalizeOneTrend = (payload: unknown): Trend | null => normalizeTrend(record(payload, 'trend'))

export function normalizeTrendScan(payload: unknown): TrendScan {
  const o = unwrap(payload)
  const trends = normalizeTrends(o['trends'])
  return {
    total_found: count(o['total_found']) ?? count(o['scanned']) ?? trends.length,
    new_trends: count(o['new_trends']) ?? count(o['new_trends_count']) ?? trends.length,
    trends,
  }
}

// ─── Lo que manda el admin ──────────────────────────────────────────────────

/** Un 400 con un problema por campo, en la forma de siempre del admin. */
export const invalid = (path: string, message: string, error = message): AdminErrorBody => ({ error, code: 'invalid', errors: [{ path, message }] })

const pillarHint = `Elegí un enfoque: ${Object.values(postPillarLabels).map(l => l.toLowerCase()).join(', ')}.`

/** El cuerpo de «Generar»: qué tratar (tema o ángulo) y, si llegan, el enfoque, la obra y los puntos. */
export function generateRequest(body: unknown): GenerateRequest | AdminErrorBody {
  const b = isObj(body) ? body : {}
  const topic = text(b['topic']) ?? text(b['custom_angle'])
  if (!topic) return invalid('topic', 'Escribí de qué trata la publicación.')
  const pillar = b['pillar'] === undefined || b['pillar'] === null || b['pillar'] === '' ? null : b['pillar']
  if (pillar !== null && !isPostPillar(pillar)) return invalid('pillar', pillarHint, 'Ese enfoque no existe.')
  return {
    topic,
    custom_angle: text(b['custom_angle']),
    pillar,
    project_slug: text(b['project_slug']),
    key_points: strings(b['key_points']).slice(0, 8),
  }
}

export const isErrorBody = (value: unknown): value is AdminErrorBody => isObj(value) && value['code'] === 'invalid'

// ─── Errores ────────────────────────────────────────────────────────────────

/** Qué es lo que Eros dijo que no tiene: la publicación o la tendencia. */
export type ContentThing = 'post' | 'trend'

const nouns: Record<ContentThing, { one: string, it: string }> = {
  post: { one: 'esa publicación', it: 'la publicación' },
  trend: { one: 'esa tendencia', it: 'la tendencia' },
}

/** Un 4xx de Eros en español, nombrando lo que se pidió (no una vacante). */
function rejection(upstream: number, thing: ContentThing): { status: number, body: AdminErrorBody } {
  const noun = nouns[thing]
  if (upstream === 404) return { status: 404, body: { error: `Eros no tiene ${noun.one}: puede que se haya borrado.`, code: 'not_found', errors: [] } }
  if (upstream === 409) return { status: 409, body: { error: `Eros no pudo hacerlo: ${noun.it} cambió mientras tanto. Recargá la lista.`, code: 'conflict', errors: [] } }
  return { status: 400, body: { error: 'Eros no aceptó el pedido. Revisá los datos y probá de nuevo.', code: 'invalid', errors: [] } }
}

/**
 * Responde un fallo de Eros: 503 { offline: true } si no respondió (con `consequence`, lo que no
 * pasó), su 4xx en español si dijo que no. Una escritura nunca parece hecha.
 */
export function sendContentFailure(res: Response, result: ForwardResult, thing: ContentThing, consequence?: string): void {
  if (result.failure?.reason !== 'rejected') {
    sendErosFailure(res, result, consequence)
    return
  }
  const { status, body } = rejection(result.failure.upstream, thing)
  res.status(status).json(consequence ? { ...body, error: `${body.error} ${consequence}` } : body)
}

/** Eros respondió 2xx pero sin lo que se pidió: no se puede mostrar como hecho. */
export function sendUnreadable(res: Response, consequence: string): void {
  res.status(502).json({ error: `Eros respondió algo que el admin no pudo leer. ${consequence}`, code: 'internal', errors: [] } satisfies AdminErrorBody)
}
