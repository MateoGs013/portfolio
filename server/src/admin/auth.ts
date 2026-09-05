import { timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const token = process.env['ADMIN_TOKEN'] ?? ''

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN el admin queda apagado. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!token) {
    res.status(503).json({ error: 'admin deshabilitado: falta ADMIN_TOKEN' })
    return
  }
  const header = req.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(given)
  const b = Buffer.from(token)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
