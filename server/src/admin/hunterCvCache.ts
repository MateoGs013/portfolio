/**
 * El último CV adaptado de cada vacante, en memoria y por 1 hora. La hoja (/cv/:id/html), el texto
 * plano (/cv/:id/txt) y la impresión salen de acá: los tres son el mismo AdminCv. Después de un
 * reinicio de la API o de más de una hora no hay CV y esas rutas responden 409 (cv_expired); el
 * admin lo vuelve a generar con la vacante en el cuerpo y repite el pedido.
 */
import type { AdminCv } from '../shared/hunterContracts.js'
import type { CvHints } from './hunterCv.js'
import type { JobText } from './hunterMatch.js'

export const CV_TTL_MS = 3600_000
const MAX_ENTRIES = 200

export interface CachedCv {
  cv: AdminCv
  job: JobText
  /** Las pistas de Eros ya llevadas a la base: aceptar la propuesta de resumen no vuelve a pedirle a Eros. */
  hints: CvHints | null
  expiresAt: number
}

const cache = new Map<string, CachedCv>()
const key = (id: string) => id.trim().toLowerCase()

export function rememberCv(id: string, entry: Omit<CachedCv, 'expiresAt'>): void {
  const k = key(id)
  cache.delete(k)
  cache.set(k, { ...entry, expiresAt: Date.now() + CV_TTL_MS })
  // El Map conserva el orden de inserción: el primero es el más viejo.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

export function recallCv(id: string): CachedCv | null {
  const k = key(id)
  const entry = cache.get(k)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cache.delete(k)
    return null
  }
  return entry
}

/** El cuerpo del 409 cuando la vacante ya no tiene CV en memoria. */
export const cvExpired = { error: 'Generá el CV de nuevo: la API ya no tiene el de esta vacante.', code: 'cv_expired', errors: [] } as const
