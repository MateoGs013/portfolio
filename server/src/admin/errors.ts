/**
 * Errores del admin en español claro, siempre con la forma de AdminErrorBody: validación por campo,
 * subidas, restricciones de la base (P2002, P2003, P2025) y la base caída.
 */
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { isModelName, modelNames } from '../shared/adminSchema.js'
import type { AdminErrorBody, AdminErrorCode, FieldIssue } from '../shared/adminContracts.js'
import { DB_UNAVAILABLE } from './common.js'
import { HttpError, ValidationError } from './input.js'

function send(res: Response, status: number, code: AdminErrorCode, error: string, errors: FieldIssue[] = []): void {
  const body: AdminErrorBody = { error, code, errors }
  res.status(status).json(body)
}

const CODES: Record<number, AdminErrorCode> = { 400: 'invalid', 401: 'unauthorized', 404: 'not_found', 409: 'conflict', 413: 'too_large', 503: 'offline' }

/** Mensajes en inglés que todavía lanzan algunos módulos. */
const LEGACY: Record<string, string> = {
  'not found': 'No encontramos ese registro: puede que se haya borrado. Recargá la lista.',
}

function uploadMessage(err: multer.MulterError): string {
  if (err.code === 'LIMIT_FILE_SIZE') return 'El archivo pesa más de 20 MB.'
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'Se suben hasta tres archivos: el principal, su versión WebM y el póster.'
  }
  return 'No pudimos recibir el archivo. Probá subirlo de nuevo.'
}

/** Prisma guarda el modelo y los campos de la restricción en lugares distintos según la versión. */
function constraint(meta: unknown): { model: string | null, fields: string[] } {
  const found = { model: null as string | null, fields: [] as string[] }
  const walk = (value: unknown): void => {
    if (!value || typeof value !== 'object') return
    for (const [key, nested] of Object.entries(value)) {
      if (key === 'modelName' && typeof nested === 'string') found.model = nested
      else if ((key === 'fields' || key === 'target') && Array.isArray(nested)) found.fields.push(...nested.filter((f): f is string => typeof f === 'string'))
      else if (key === 'target' && typeof nested === 'string') found.fields.push(nested)
      else walk(nested)
    }
  }
  walk(meta)
  return found
}

function another(model: string | null): string {
  if (model && isModelName(model) && model in modelNames) return modelNames[model as keyof typeof modelNames].another
  return 'otro registro'
}

function unique(meta: unknown): FieldIssue {
  const { model, fields } = constraint(meta)
  const text = JSON.stringify(meta ?? {})
  if (model === 'ProcessStep' || text.includes('ProcessStep')) return { path: 'steps', message: 'Dos pasos quedaron con el mismo número de orden. Recargá la obra y volvé a guardar.' }
  if (model === 'Metric' || text.includes('Metric')) return { path: 'metrics', message: 'Hay dos métricas con la misma clave en esta obra.' }
  if (fields.includes('slug') || !fields.length) return { path: 'slug', message: `Ya hay ${another(model)} con esa dirección. Elegí otra.` }
  return { path: fields[0] ?? '', message: `Ya hay ${another(model)} con ese valor.` }
}

/** La base no responde: conexión rechazada, sin red o el motor apagado. */
export function isDbDown(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err ? String(err.name) : ''
  const code = 'code' in err ? String(err.code) : ''
  if (name === 'PrismaClientInitializationError' || /^P10\d\d$/.test(code)) return true
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '57P03'].includes(code)) return true
  const message = 'message' in err ? String(err.message) : ''
  return /ECONNREFUSED|DatabaseNotReachable|Can't reach database|connect ETIMEDOUT|Connection terminated/i.test(message)
}

export function adminErrors(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    send(res, err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, err.code === 'LIMIT_FILE_SIZE' ? 'too_large' : 'invalid', uploadMessage(err))
    return
  }
  if (err instanceof ValidationError) {
    send(res, 400, 'invalid', err.message, err.issues)
    return
  }
  if (err instanceof HttpError) {
    send(res, err.status, CODES[err.status] ?? 'invalid', LEGACY[err.message] ?? err.message)
    return
  }
  if (isDbDown(err)) {
    send(res, 503, 'db_unavailable', DB_UNAVAILABLE.error)
    return
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const meta = 'meta' in err ? err.meta : undefined
    if (err.code === 'P2002') {
      const found = unique(meta)
      send(res, 409, 'conflict', found.message, [found])
      return
    }
    if (err.code === 'P2003') {
      send(res, 409, 'in_use', 'Uno de los registros elegidos ya no existe, o este todavía está en uso. Recargá y probá de nuevo.')
      return
    }
    if (err.code === 'P2025') {
      send(res, 404, 'not_found', LEGACY['not found'] as string)
      return
    }
  }
  console.error(err)
  send(res, 500, 'internal', 'Algo falló de nuestro lado. Recargá y probá de nuevo en un momento.')
}
