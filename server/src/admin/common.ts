/** Piezas que comparten los routers del admin. */
import type { Request } from 'express'
import { HttpError } from './input.js'

/**
 * Sin base no hay edición: las colecciones responden 503 en vez de servir datos de respaldo
 * con ids inventados (guardar sobre ellos fallaría o pisaría otro registro).
 */
export const DB_UNAVAILABLE = { error: 'db_unavailable' } as const

/** `:id` numérico de la ruta, o 400. */
export function paramId(req: Request): number {
  const n = Number(req.params['id'])
  if (!Number.isInteger(n)) throw new HttpError(400, 'id inválido')
  return n
}

/** Hex de 6 dígitos en minúsculas (`#b97e46`), o null si viene vacío. */
export function optHex(b: Record<string, unknown>, k: string): string | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.trim())) {
    throw new HttpError(400, `campo "${k}": se esperaba un color hex (#rrggbb)`)
  }
  return v.trim().toLowerCase()
}
