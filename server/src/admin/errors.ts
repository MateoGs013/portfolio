/** Errores del admin en español claro: validación, subidas y restricciones de la base. */
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { HttpError } from './input.js'

/** Qué tabla chocó con una restricción única, para explicarlo sin tecnicismos. */
function uniqueMessage(meta: unknown): string {
  const where = JSON.stringify(meta ?? {})
  if (where.includes('ProcessStep')) return 'dos pasos quedaron con el mismo número de orden. Recargá la obra y volvé a guardar'
  if (where.includes('Metric')) return 'hay dos métricas con la misma clave en esta obra'
  return 'ya existe un registro con ese slug o clave'
}

function uploadMessage(err: multer.MulterError): string {
  if (err.code === 'LIMIT_FILE_SIZE') return 'el archivo supera el límite de 20MB'
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'se suben hasta 3 archivos: el principal, su versión WebM y el póster'
  }
  return `error en la subida del archivo: ${err.message}`
}

export function adminErrors(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: uploadMessage(err) })
    return
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  if (err && typeof err === 'object' && 'code' in err) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: uniqueMessage('meta' in err ? err.meta : undefined) })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'violación de integridad referencial (clave foránea inválida o en uso)' })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'not found' })
      return
    }
  }
  next(err)
}
