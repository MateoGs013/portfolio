import type { Request } from 'express'
import { env } from '../env.js'

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
  return typeof val === 'string' ? val : ''
}

export function getErosBaseUrl(): string {
  return (process.env['HUNTER_API_URL'] || env.hunterApiUrl || 'https://eros.mateogs.tech').replace(/\/+$/, '')
}

export interface ForwardResult<T = unknown> {
  ok: boolean
  status: number
  data: T
}

export async function forwardToEros<T = unknown>(
  urlPath: string,
  init?: RequestInit,
  timeoutMs = 60000
): Promise<ForwardResult<T>> {
  const baseUrl = getErosBaseUrl()
  if (!baseUrl) {
    return {
      ok: false,
      status: 503,
      data: { error: 'Eros Agent no configurado: falta HUNTER_API_URL en el entorno' } as T,
    }
  }

  const fullUrl = `${baseUrl}/${urlPath.replace(/^\//, '')}`

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}` } : {}),
      ...((init?.headers as Record<string, string>) || {}),
    }

    const res = await fetch(fullUrl, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    })

    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = (isJson ? await res.json().catch(() => null) : await res.text()) as T

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 502,
        data: { error: 'Fallo de autenticacion con Eros Agent (verificar EROS_API_KEY en variables de entorno)' } as T,
      }
    }

    return { ok: res.ok, status: res.status, data }
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message.toLowerCase().includes('timeout'))

    if (isTimeout) {
      return {
        ok: false,
        status: 504,
        data: { error: `Tiempo de espera agotado al conectar con Eros Agent (${timeoutMs}ms)` } as T,
      }
    }

    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 502,
      data: { error: `Eros Agent no responde (${baseUrl}): ${msg}` } as T,
    }
  }
}
