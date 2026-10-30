import type { Response } from 'express'
import type { Lang } from './content/lang.js'

/** De dónde salió la respuesta: la base o una copia generada desde ella (snapshot). */
export type ContentSource = 'db' | 'snapshot'

export interface EnvelopeMeta {
  count?: number
  /** Solo los filtros que se aplicaron, en su forma pública (minúscula). */
  filters?: Record<string, string>
  lang?: Lang
  source?: ContentSource
}

/** Envoltura de toda respuesta: `{ data, meta: { count, filters, lang?, source? } }`. */
export function envelope<T>(data: T, meta: EnvelopeMeta = {}) {
  const count = meta.count ?? (Array.isArray(data) ? data.length : 1)
  return {
    data,
    meta: {
      count,
      filters: meta.filters ?? {},
      ...(meta.lang ? { lang: meta.lang } : {}),
      ...(meta.source ? { source: meta.source } : {}),
    },
  }
}

/** Responde una consulta resuelta: 404 si no hay registro (o no es visible); si no, la envoltura. */
export function sendResolved<T>(
  res: Response,
  resolved: { data: T | null, source: ContentSource },
  meta: Omit<EnvelopeMeta, 'source'> = {},
): void {
  if (resolved.data === null) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(envelope(resolved.data, { ...meta, source: resolved.source }))
}
