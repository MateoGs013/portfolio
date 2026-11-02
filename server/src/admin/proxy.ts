/**
 * Pedidos a Eros. La dirección sale de HUNTER_API_URL (sin valor por defecto: sin ella, Eros queda
 * «no configurado»). El corte cuenta solo lo que dice que Eros no está: la red y el tiempo agotado.
 * Después de tres seguidos se deja de preguntar 30 s. Un 5xx, una redirección o un 4xx son respuestas
 * de Eros y no lo castigan; tampoco el corte de una tarea larga (escanear, evaluar en lote), que en
 * Eros puede seguir corriendo. Las redirecciones nunca se siguen: la clave no viaja a otra dirección.
 */
import type { NextFunction, Request, Response } from 'express'
import type { AdminErrorBody, AdminStatus } from '../shared/adminContracts.js'

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getParamId(req: Request, paramName = 'id'): string {
  const val = req.params[paramName]
  if (Array.isArray(val)) return val[0] || ''
  return typeof val === 'string' ? val.trim() : ''
}

/** Lo único que puede ser un id que el admin reenvía a Eros (vacante, publicación, tendencia, carrusel). */
const EROS_ID = /^[A-Za-z0-9_-]+$/

export const isErosId = (value: unknown): value is string => typeof value === 'string' && EROS_ID.test(value)

const badId: AdminErrorBody = {
  error: 'Ese identificador no es válido: solo puede tener letras, números, guiones y guiones bajos.',
  code: 'invalid',
  errors: [{ path: 'id', message: 'Solo letras, números, guiones y guiones bajos.' }],
}

/**
 * `router.param('id', erosIdParam)`: un id raro (`%2F`, `..`, espacios) responde 400 y nunca llega a
 * Eros, donde podía caer en otra ruta (`DELETE /api/jobs` borra la cola entera).
 */
export function erosIdParam(_req: Request, res: Response, next: NextFunction, value: unknown): void {
  if (isErosId(typeof value === 'string' ? value.trim() : value)) next()
  else res.status(400).json(badId)
}

/** La dirección de Eros, o '' si no está configurada. Se lee en cada pedido. */
export function getErosBaseUrl(): string {
  return (process.env['HUNTER_API_URL'] ?? '').trim().replace(/\/+$/, '')
}

const erosKey = () => process.env['EROS_API_KEY'] ?? ''

/**
 * Por qué un pedido no salió bien. `rejected` es un 4xx de Eros: respondió, pero dijo que no.
 * `server` es un 5xx o una redirección: respondió con un error. `busy` es el corte de una tarea larga
 * que puede seguir en Eros.
 */
export type ErosFailureReason = 'unconfigured' | 'paused' | 'network' | 'timeout' | 'busy' | 'server' | 'auth' | 'rejected'

export interface ErosFailure {
  reason: ErosFailureReason
  /** El código de Eros en un 3xx, 4xx o 5xx; 0 si no hubo respuesta. */
  upstream: number
  message: string
  /** El `detail` de Eros en un 4xx o un 5xx, ya saneado; null si no mandó uno legible. */
  detail?: string | null
  /** El `error_code` de Eros (`send_outcome_unknown`, `already_dispatched`…); null si no mandó uno. */
  code?: string | null
}

export interface ForwardResult<T = unknown> {
  ok: boolean
  status: number
  /** La respuesta de Eros; en un fallo sin respuesta, el cuerpo de error del admin. */
  data: T
  failure: ErosFailure | null
}

export interface ForwardOptions {
  /** Una tarea que en Eros puede tardar minutos: su corte no cuenta como caída y responde `eros_busy`. */
  longTask?: boolean
}

// ─── Corte por fallos seguidos ──────────────────────────────────────────────

const FAILURE_THRESHOLD = 3
const PAUSE_MS = 30_000
const circuit = { failures: 0, open: false, retryAt: 0 }
/** El último pedido que llegó a Eros volvió con 401/403: anda, pero no con esta clave. */
let authRejected = false

function paused(): boolean {
  if (!circuit.open) return false
  if (Date.now() >= circuit.retryAt) {
    // Se deja pasar un pedido de prueba: si falla, vuelve a cortar.
    circuit.open = false
    circuit.failures = FAILURE_THRESHOLD - 1
    return false
  }
  return true
}

const retryInSec = () => (circuit.open ? Math.max(1, Math.ceil((circuit.retryAt - Date.now()) / 1000)) : 0)

/** Eros respondió, aunque sea con un error: está, así que el corte vuelve a cero. */
function recordAnswer(): void {
  circuit.failures = 0
  circuit.open = false
}

function recordSuccess(): void {
  recordAnswer()
  authRejected = false
}

function recordFailure(): void {
  circuit.failures += 1
  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.open = true
    circuit.retryAt = Date.now() + PAUSE_MS
  }
}

/** El estado de Eros para /status, sin contactarlo: lo arman los pedidos que ya se hicieron. */
export function erosState(): AdminStatus['eros'] {
  if (!getErosBaseUrl()) return { state: 'unconfigured', retryInSec: 0 }
  if (circuit.open && Date.now() < circuit.retryAt) return { state: 'cooldown', retryInSec: retryInSec() }
  if (circuit.failures > 0) return { state: 'down', retryInSec: 0 }
  return { state: authRejected ? 'auth' : 'ok', retryInSec: 0 }
}

// ─── Pedido ─────────────────────────────────────────────────────────────────

function notResponding(): string {
  return circuit.open ? `Eros no responde. Reintento en ${retryInSec()} s.` : 'Eros no responde.'
}

function failed<T>(reason: ErosFailureReason, message: string, upstream = 0): ForwardResult<T> {
  const status = reason === 'timeout' ? 504 : 503
  const body: AdminErrorBody & { offline: true, retryInSec: number } = { error: message, code: 'offline', errors: [], offline: true, retryInSec: retryInSec() }
  return { ok: false, status, data: body as T, failure: { reason, upstream, message } }
}

/**
 * Eros respondió con un error (5xx o una redirección): no es una caída y no se muestra como tal. Si
 * Eros dijo por qué («IA no disponible»), el mensaje lo repite.
 */
function answeredWithError<T>(upstream: number, data: unknown = null): ForwardResult<T> {
  recordAnswer()
  const detail = upstream < 400 ? null : erosDetail(data)
  const message = upstream < 400
    ? 'Eros respondió con una redirección, y el admin no la sigue.'
    : refusedText(`Eros respondió con un error (${upstream}).`, detail)
  const body: AdminErrorBody & { offline: false } = { error: message, code: 'eros_error', errors: [], offline: false }
  return { ok: false, status: 502, data: body as T, failure: { reason: 'server', upstream, message, detail, code: erosCode(data) } }
}

/** El corte de una tarea larga: Eros puede seguir con ella, así que no cuenta para el corte. */
function stillWorking<T>(timeoutMs: number): ForwardResult<T> {
  const message = `Eros sigue trabajando: no terminó en ${Math.round(timeoutMs / 1000)} s.`
  const body: AdminErrorBody & { offline: false } = { error: message, code: 'eros_busy', errors: [], offline: false }
  return { ok: false, status: 504, data: body as T, failure: { reason: 'busy', upstream: 0, message } }
}

const isTimeout = (err: unknown) => err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')

async function request(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<globalThis.Response> {
  const key = erosKey()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}`, 'X-Eros-Key': key } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  }
  // Una redirección no se sigue: la clave iría a otra dirección, y una ruta rara podría caer en otra.
  return fetch(url, { ...init, headers, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) })
}

/**
 * Reenvía a Eros. Con HUNTER_LOCAL_FALLBACK=1 y fuera de producción, si la dirección configurada no
 * responde, prueba con un Eros levantado en 127.0.0.1:8000.
 */
async function reach(urlPath: string, init: RequestInit | undefined, timeoutMs: number): Promise<globalThis.Response> {
  const path = urlPath.replace(/^\//, '')
  try {
    return await request(`${getErosBaseUrl()}/${path}`, init, timeoutMs)
  }
  catch (err) {
    const local = process.env['HUNTER_LOCAL_FALLBACK'] === '1' && process.env['NODE_ENV'] !== 'production'
    if (!local || isTimeout(err)) throw err
    return request(`http://127.0.0.1:8000/${path}`, init, Math.min(timeoutMs, 4000))
  }
}

export async function forwardToEros<T = unknown>(urlPath: string, init?: RequestInit, timeoutMs = 60000, options: ForwardOptions = {}): Promise<ForwardResult<T>> {
  if (!getErosBaseUrl()) return failed('unconfigured', 'Eros no está configurado: falta HUNTER_API_URL en el entorno de la API.')
  if (paused()) return failed('paused', notResponding())

  let res: globalThis.Response
  try {
    res = await reach(urlPath, init, timeoutMs)
  }
  catch (err) {
    if (isTimeout(err) && options.longTask) return stillWorking(timeoutMs)
    recordFailure()
    if (isTimeout(err)) return failed('timeout', `Eros tardó más de ${Math.round(timeoutMs / 1000)} s en responder.`)
    return failed('network', notResponding())
  }

  if (res.status >= 300 && res.status < 400) return answeredWithError(res.status)
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = (isJson ? await res.json().catch(() => null) : await res.text().catch(() => '')) as T

  if (res.status >= 500) return answeredWithError(res.status, data)
  if (res.status === 401 || res.status === 403) {
    // Eros respondió (no es una caída para el corte), pero no es «no responde»: es la clave.
    recordAnswer()
    authRejected = true
    const body: AdminErrorBody & { offline: false } = { error: 'Eros rechazó la clave de la API. Revisá EROS_API_KEY en el entorno de la API.', code: 'eros_auth', errors: [], offline: false }
    return { ok: false, status: 502, data: body as T, failure: { reason: 'auth', upstream: res.status, message: body.error } }
  }
  recordSuccess()
  if (!res.ok) {
    return { ok: false, status: res.status, data, failure: { reason: 'rejected', upstream: res.status, message: `Eros respondió ${res.status}.`, detail: erosDetail(data), code: erosCode(data) } }
  }
  return { ok: true, status: res.status, data, failure: null }
}

/**
 * Si un pedido que tiene respaldo desde la base (analizar, mensaje, CV) va al respaldo: sí cuando
 * Eros no respondió, respondió con un error, algo que no se pudo leer o no conoce la vacante (404);
 * no cuando la rechazó por otro motivo, que se informa tal cual.
 */
export function useLocalFallback(result: ForwardResult): boolean {
  return result.failure?.reason !== 'rejected' || result.failure.upstream === 404
}

/**
 * El `detail` de un 4xx de Eros, para mostrarlo: un texto (o el primer mensaje de un 422) sin
 * direcciones, etiquetas ni caracteres de control, de hasta 200 caracteres. null si no hay nada legible.
 */
export function erosDetail(data: unknown): string | null {
  const raw = data && typeof data === 'object' ? (data as Record<string, unknown>)['detail'] : null
  const first: unknown = Array.isArray(raw) ? raw[0] : raw
  const msg = first && typeof first === 'object' ? (first as Record<string, unknown>)['msg'] : first
  if (typeof msg !== 'string') return null
  const clean = msg
    .replace(/<[^>]*>/g, ' ')
    .replace(/\bhttps?:\/\/\S+/gi, '(dirección omitida)')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return null
  return clean.length > 200 ? `${clean.slice(0, 199).trimEnd()}…` : clean
}

/** El `error_code` que Eros manda junto al `detail` (postular, publicar); null si no hay uno. */
export function erosCode(data: unknown): string | null {
  const raw = data && typeof data === 'object' ? (data as Record<string, unknown>)['error_code'] : null
  return typeof raw === 'string' && /^[a-z_]{1,40}$/.test(raw) ? raw : null
}

/** «Eros no aceptó el pedido. Eros dijo: «…».», con lo que dijo Eros si lo mandó. */
export function refusedText(lead: string, detail: string | null | undefined): string {
  return detail ? `${lead} Eros dijo: «${detail.replace(/[.\s]+$/, '')}».` : lead
}

/** Un 4xx de Eros en español claro. */
function rejection(failure: ErosFailure): { status: number, body: AdminErrorBody } {
  if (failure.upstream === 404) return { status: 404, body: { error: 'Eros no tiene esa vacante: puede que se haya borrado.', code: 'not_found', errors: [] } }
  if (failure.upstream === 409) return { status: 409, body: { error: 'Eros no pudo hacerlo: la vacante cambió mientras tanto. Recargá la lista.', code: 'conflict', errors: [] } }
  const error = failure.detail ? refusedText('Eros no aceptó el pedido.', failure.detail) : 'Eros no aceptó el pedido. Revisá los datos de la vacante.'
  return { status: 400, body: { error, code: 'invalid', errors: [] } }
}

/**
 * Responde un fallo de Eros con la forma de error del admin (503 { offline: true } si no respondió).
 * `consequence` dice qué no pasó, para que una escritura nunca parezca hecha: «El estado no cambió.»
 */
export function sendErosFailure(res: Response, result: ForwardResult, consequence?: string): void {
  if (result.failure?.reason === 'rejected') {
    const { status, body } = rejection(result.failure)
    res.status(status).json(consequence ? { ...body, error: `${body.error} ${consequence}` } : body)
    return
  }
  const data = result.data as AdminErrorBody
  res.status(result.status).json(consequence ? { ...data, error: `${data.error} ${consequence}` } : data)
}
