/**
 * Cliente de /api/admin: Bearer desde sessionStorage, tiempo de espera, un reintento en las
 * lecturas, errores clasificados (api/errors.ts) y el evento 'write' después de cada escritura que
 * sale bien, para que las listas y el resumen se vuelvan a pedir.
 */
import { getCurrentScope, onScopeDispose } from 'vue'
import { fromResponse, NetworkError } from './errors'

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** De dónde salió una respuesta de Eros: del agente o del respaldo armado desde la base. */
export type ErosSource = 'eros' | 'fallback'

export type WithSource<T> = T & { _source?: ErosSource }

export interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  /** La señal de la vista (useRequestScope): al salir de la vista se cancela lo pendiente. */
  signal?: AbortSignal
  /** Por defecto 15 s, y 60 s en las rutas que pasan por Eros. */
  timeoutMs?: number
}

export interface WriteEventDetail {
  method: Exclude<Method, 'GET'>
  path: string
}

const BASE = '/api/admin'
const TOKEN_KEY = 'adm-token'
const TIMEOUT_MS = 15_000
const EROS_TIMEOUT_MS = 60_000
const RETRY_DELAY_MS = 400
/** Rutas que esperan a Eros: el agente puede tardar en recorrer portales o redactar. */
const EROS_PREFIXES = ['/hunter', '/content', '/radar']

/** Escuchá 'write' para invalidar lo que dependa de los datos (CustomEvent<WriteEventDetail>). */
export const apiEvents = new EventTarget()

export function onWrite(listener: (detail: WriteEventDetail) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<WriteEventDetail>).detail)
  apiEvents.addEventListener('write', handler)
  return () => apiEvents.removeEventListener('write', handler)
}

/* ── Clave ─────────────────────────────────────────────── */

/** Respaldo en memoria si el navegador no deja usar sessionStorage. */
let memoryToken: string | null = null

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? memoryToken
  }
  catch {
    return memoryToken
  }
}

export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
  catch {
    // Sin sessionStorage (modo privado estricto) la clave dura lo que dure la pestaña en memoria.
    memoryToken = token
  }
}

export function clearToken(): void {
  memoryToken = null
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  }
  catch {
    // Nada guardado que borrar.
  }
}


/* ── Pedidos ───────────────────────────────────────────── */

function isEros(path: string): boolean {
  return EROS_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

function urlFor(path: string, query: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE}${path}${qs ? `?${qs}` : ''}`
}

async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  const type = res.headers.get('content-type') ?? ''
  if (!type.includes('json')) return text
  try {
    return JSON.parse(text) as unknown
  }
  catch {
    return text
  }
}

async function once(method: Method, path: string, options: RequestOptions): Promise<Response> {
  const eros = isEros(path)
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), options.timeoutMs ?? (eros ? EROS_TIMEOUT_MS : TIMEOUT_MS))
  const signal = options.signal ? AbortSignal.any([options.signal, timeout.signal]) : timeout.signal
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const isForm = options.body instanceof FormData
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  try {
    return await fetch(urlFor(path, options.query), {
      method,
      headers,
      signal,
      body: options.body === undefined ? undefined : isForm ? options.body as FormData : JSON.stringify(options.body),
    })
  }
  catch (err) {
    // La vista se cerró: el AbortError sigue de largo y nadie lo muestra.
    if (options.signal?.aborted) throw err
    throw new NetworkError(timeout.signal.aborted)
  }
  finally {
    clearTimeout(timer)
  }
}

const wait = () => new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))

/** Una lectura se reintenta una vez si no hubo conexión o el proxy respondió 502–504. */
async function withRetry(method: Method, path: string, options: RequestOptions): Promise<Response> {
  if (method !== 'GET') return once(method, path, options)
  try {
    const res = await once(method, path, options)
    if (res.status < 502 || res.status > 504) return res
  }
  catch (err) {
    if (!(err instanceof NetworkError) || err.timedOut) throw err
  }
  await wait()
  return once(method, path, options)
}

/** Un pedido a /api/admin<path>. Devuelve el cuerpo ya leído o lanza un ApiError. */
export async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<WithSource<T>> {
  const res = await withRetry(method, path, options)
  const body = await readBody(res)
  if (!res.ok) throw fromResponse(res.status, body, isEros(path))

  if (method !== 'GET') {
    apiEvents.dispatchEvent(new CustomEvent<WriteEventDetail>('write', { detail: { method, path } }))
  }
  const source = res.headers.get('X-Eros-Source')
  if ((source === 'eros' || source === 'fallback') && body && typeof body === 'object' && !Array.isArray(body)) {
    return Object.assign(body, { _source: source }) as WithSource<T>
  }
  return body as WithSource<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

/**
 * Una señal por vista: se cancela al desmontar el componente (o el effect scope) que la pidió, así
 * una respuesta lenta nunca pisa la vista siguiente. `renew()` corta lo pendiente y da una nueva.
 */
export function useRequestScope(): { readonly signal: AbortSignal, renew: () => AbortSignal } {
  let controller = new AbortController()
  if (getCurrentScope()) onScopeDispose(() => controller.abort())
  return {
    get signal() {
      return controller.signal
    },
    renew() {
      controller.abort()
      controller = new AbortController()
      return controller.signal
    },
  }
}
