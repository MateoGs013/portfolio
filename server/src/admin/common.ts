/** Piezas que comparten los routers del admin. */
import type { NextFunction, Request, Response } from 'express'
import { forgetLastGood } from '../content/snapshot.js'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { HttpError, fail, labelFor } from './input.js'

/**
 * Sin base no hay edición: las colecciones responden 503 en vez de servir datos de respaldo
 * con ids inventados (guardar sobre ellos fallaría o pisaría otro registro).
 */
export const DB_UNAVAILABLE: Readonly<AdminErrorBody> = {
  error: 'No hay conexión con la base de datos. Probá de nuevo en unos segundos.',
  code: 'db_unavailable',
  errors: [],
}

/** `:id` numérico de la ruta, o 400. */
export function paramId(req: Request, name = 'id'): number {
  const n = Number(req.params[name])
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'La dirección pide un registro que no existe. Volvé a la lista y abrilo de nuevo.')
  return n
}

/** Hex de 6 dígitos en minúsculas (`#b97e46`), o null si viene vacío. */
export function optHex(b: Record<string, unknown>, k: string): string | null {
  const v = b[k]
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.trim())) {
    return fail(b, k, `${labelFor(b, k)} tiene que ser un color de seis cifras, como #b97e46.`, null)
  }
  return v.trim().toLowerCase()
}

/**
 * Cada escritura que sale bien invalida las últimas respuestas buenas de la API pública. Va solo en
 * los routers que escriben en la base: los de Eros no tocan el contenido del sitio.
 */
export function forgetsLastGood(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.on('finish', () => {
      if (res.statusCode < 400) forgetLastGood()
    })
  }
  next()
}

/** Lectura de una colección: si la base no responde, 503 con el mensaje de siempre. */
export async function readOr503<T>(res: Response, read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read()
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
    return undefined
  }
}
