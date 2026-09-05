import type { Request } from 'express'

/**
 * Lee de la query solo los filtros declarados, como strings.
 * Lo que se devuelve en `meta.filters` es exactamente lo que se aplicó:
 * el contrato de URL es uno a uno con la URL pública.
 */
export function readFilters<K extends string>(req: Request, keys: readonly K[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {}
  for (const key of keys) {
    const raw = req.query[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value === 'string' && value !== '') out[key] = value
  }
  return out
}

export function asInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  const n = Number(value)
  return Number.isInteger(n) ? n : undefined
}

export function asBool(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
