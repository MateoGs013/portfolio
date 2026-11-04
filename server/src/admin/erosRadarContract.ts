/**
 * Contrato con Eros para Tendencias: cada respuesta pasa por su normalizador y sale con la forma de
 * server/src/shared/radarContracts.ts, abra o no un envoltorio `data` o `trend`. Lo que no trae va en
 * null o vacío: nunca un valor inventado. Acá también viven los errores en español de estas rutas.
 */
import type { Response } from 'express'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { isTrendStatus, type Trend, type TrendScan } from '../shared/radarContracts.js'
import { count, list, text, unwrap } from './erosContract.js'
import { refusedText, sendErosFailure, type ErosFailure, type ForwardResult } from './proxy.js'

export type * from '../shared/radarContracts.js'

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

/** El objeto de una respuesta: suelto, en `data` o bajo su propio nombre (`trend`). */
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

// ─── Errores ────────────────────────────────────────────────────────────────

/** Un 400 con un problema por campo, en la forma de siempre del admin. */
export const invalid = (path: string, message: string, error = message): AdminErrorBody => ({ error, code: 'invalid', errors: [{ path, message }] })

/** Un 4xx de Eros en español, nombrando la tendencia (no una vacante). */
function rejection(failure: ErosFailure): { status: number, body: AdminErrorBody } {
  const upstream = failure.upstream
  if (upstream === 404) return { status: 404, body: { error: 'Eros no tiene esa tendencia: puede que se haya borrado.', code: 'not_found', errors: [] } }
  if (upstream === 409) return { status: 409, body: { error: 'Eros no pudo hacerlo: la tendencia cambió mientras tanto. Recargá la lista.', code: 'conflict', errors: [] } }
  const error = failure.detail ? refusedText('Eros no aceptó el pedido.', failure.detail) : 'Eros no aceptó el pedido. Revisá los datos y probá de nuevo.'
  return { status: 400, body: { error, code: 'invalid', errors: [] } }
}

/**
 * Responde un fallo de Eros: 503 { offline: true } si no respondió (con `consequence`, lo que no
 * pasó), su 4xx en español si dijo que no. Una escritura nunca parece hecha.
 */
export function sendRadarFailure(res: Response, result: ForwardResult, consequence?: string): void {
  if (result.failure?.reason !== 'rejected') {
    sendErosFailure(res, result, consequence)
    return
  }
  const { status, body } = rejection(result.failure)
  res.status(status).json(consequence ? { ...body, error: `${body.error} ${consequence}` } : body)
}

/** Eros respondió 2xx pero sin lo que se pidió: no se puede mostrar como hecho. */
export function sendUnreadable(res: Response, consequence: string): void {
  res.status(502).json({ error: `Eros respondió algo que el admin no pudo leer. ${consequence}`, code: 'internal', errors: [] } satisfies AdminErrorBody)
}
