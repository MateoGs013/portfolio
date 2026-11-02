/**
 * Pedidos a Eros. La dirección sale de HUNTER_API_URL (sin valor por defecto: sin ella, Eros queda
 * «no configurado»). Un corte cuenta solo los fallos de Eros (red, tiempo agotado y 5xx): después de
 * tres seguidos se deja de preguntar 30 s. Un 4xx es una respuesta de Eros y no lo castiga.
 */
import type { Request, Response } from 'express'
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

/** La dirección de Eros, o '' si no está configurada. Se lee en cada pedido. */
export function getErosBaseUrl(): string {
  return (process.env['HUNTER_API_URL'] ?? '').trim().replace(/\/+$/, '')
}

const erosKey = () => process.env['EROS_API_KEY'] ?? ''

/** Por qué un pedido no salió bien. `rejected` es un 4xx de Eros: respondió, pero dijo que no. */
export type ErosFailureReason = 'unconfigured' | 'paused' | 'network' | 'timeout' | 'server' | 'auth' | 'rejected'

export interface ErosFailure {
  reason: ErosFailureReason
  /** El código de Eros en un 4xx o 5xx; 0 si no hubo respuesta. */
  upstream: number
  message: string
}

export interface ForwardResult<T = unknown> {
  ok: boolean
  status: number
  /** La respuesta de Eros; en un fallo sin respuesta, el cuerpo de error del admin. */
  data: T
  failure: ErosFailure | null
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

function recordSuccess(): void {
  circuit.failures = 0
  circuit.open = false
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

const isTimeout = (err: unknown) => err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')

async function request(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<globalThis.Response> {
  const key = erosKey()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}`, 'X-Eros-Key': key } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  }
  return fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) })
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

export async function forwardToEros<T = unknown>(urlPath: string, init?: RequestInit, timeoutMs = 60000): Promise<ForwardResult<T>> {
  if (!getErosBaseUrl()) return failed('unconfigured', 'Eros no está configurado: falta HUNTER_API_URL en el entorno de la API.')
  if (paused()) return failed('paused', notResponding())

  let res: globalThis.Response
  try {
    res = await reach(urlPath, init, timeoutMs)
  }
  catch (err) {
    recordFailure()
    if (isTimeout(err)) return failed('timeout', `Eros tardó más de ${Math.round(timeoutMs / 1000)} s en responder.`)
    return failed('network', notResponding())
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = (isJson ? await res.json().catch(() => null) : await res.text().catch(() => '')) as T

  if (res.status >= 500) {
    recordFailure()
    return failed('server', `Eros respondió con un error (${res.status}).`, res.status)
  }
  if (res.status === 401 || res.status === 403) {
    // Eros respondió (no es una caída para el corte), pero no es «no responde»: es la clave.
    circuit.failures = 0
    circuit.open = false
    authRejected = true
    const body: AdminErrorBody & { offline: false } = { error: 'Eros rechazó la clave de la API. Revisá EROS_API_KEY en el entorno de la API.', code: 'eros_auth', errors: [], offline: false }
    return { ok: false, status: 502, data: body as T, failure: { reason: 'auth', upstream: res.status, message: body.error } }
  }
  recordSuccess()
  if (!res.ok) {
    return { ok: false, status: res.status, data, failure: { reason: 'rejected', upstream: res.status, message: `Eros respondió ${res.status}.` } }
  }
  return { ok: true, status: res.status, data, failure: null }
}

/**
 * Si un pedido que tiene respaldo desde la base (analizar, mensaje, CV) va al respaldo: sí cuando
 * Eros no respondió, respondió algo que no se pudo leer o no conoce la vacante (404); no cuando la
 * rechazó por otro motivo, que se informa tal cual.
 */
export function useLocalFallback(result: ForwardResult): boolean {
  return result.failure?.reason !== 'rejected' || result.failure.upstream === 404
}

/** Un 4xx de Eros en español claro. */
function rejection(upstream: number): { status: number, body: AdminErrorBody } {
  if (upstream === 404) return { status: 404, body: { error: 'Eros no tiene esa vacante: puede que se haya borrado.', code: 'not_found', errors: [] } }
  if (upstream === 409) return { status: 409, body: { error: 'Eros no pudo hacerlo: la vacante cambió mientras tanto. Recargá la lista.', code: 'conflict', errors: [] } }
  return { status: 400, body: { error: 'Eros no aceptó el pedido. Revisá los datos de la vacante.', code: 'invalid', errors: [] } }
}

/**
 * Responde un fallo de Eros con la forma de error del admin (503 { offline: true } si no respondió).
 * `consequence` dice qué no pasó, para que una escritura nunca parezca hecha: «El estado no cambió.»
 */
export function sendErosFailure(res: Response, result: ForwardResult, consequence?: string): void {
  if (result.failure?.reason === 'rejected') {
    const { status, body } = rejection(result.failure.upstream)
    res.status(status).json(consequence ? { ...body, error: `${body.error} ${consequence}` } : body)
    return
  }
  const data = result.data as AdminErrorBody
  res.status(result.status).json(consequence ? { ...data, error: `${data.error} ${consequence}` } : data)
}
