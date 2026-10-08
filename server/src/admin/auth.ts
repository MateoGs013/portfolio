import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const token = process.env['ADMIN_TOKEN'] ?? ''
const tokenHash = token ? createHash('sha256').update(token).digest() : null

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN el admin queda apagado. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!token || !tokenHash) {
    res.status(503).json({ error: 'admin deshabilitado: falta ADMIN_TOKEN' })
    return
  }
  const header = req.get('authorization') ?? ''
  let given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!given && typeof req.query['token'] === 'string') {
    given = req.query['token']
  }
  const givenHash = createHash('sha256').update(given).digest()
  if (!timingSafeEqual(givenHash, tokenHash)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
