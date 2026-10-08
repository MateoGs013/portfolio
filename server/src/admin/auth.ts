import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const token = process.env['ADMIN_TOKEN'] ?? ''
const tokenHash = token ? createHash('sha256').update(token).digest() : null

interface CvTicket {
  id: string
  expiresAt: number
}

const cvTickets = new Map<string, CvTicket>()

/** Limpieza periódica de tickets expirados */
setInterval(() => {
  const now = Date.now()
  for (const [t, data] of cvTickets.entries()) {
    if (data.expiresAt < now) cvTickets.delete(t)
  }
}, 30_000).unref()

/** Genera un ticket de un solo uso con vida útil de 60 segundos */
export function createCvTicket(id: string): string {
  const ticket = randomBytes(24).toString('hex')
  cvTickets.set(ticket, {
    id,
    expiresAt: Date.now() + 60_000,
  })
  return ticket
}

/** Consume y valida un ticket de un solo uso */
export function consumeCvTicket(ticket: string): string | null {
  const entry = cvTickets.get(ticket)
  if (!entry) return null
  cvTickets.delete(ticket)
  if (entry.expiresAt < Date.now()) return null
  return entry.id
}

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN el admin queda apagado.
 * No se acepta ADMIN_TOKEN por query string (?token=). */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!token || !tokenHash) {
    res.status(503).json({ error: 'admin deshabilitado: falta ADMIN_TOKEN' })
    return
  }

  // Soporte para tickets temporales de un solo uso para visualización de CV HTML
  if (typeof req.query['ticket'] === 'string') {
    const ticketId = consumeCvTicket(req.query['ticket'])
    if (ticketId !== null) {
      ;(req as unknown as { verifiedTicketId?: string }).verifiedTicketId = ticketId
      return next()
    }
  }

  const header = req.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const givenHash = createHash('sha256').update(given).digest()
  if (!timingSafeEqual(givenHash, tokenHash)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
