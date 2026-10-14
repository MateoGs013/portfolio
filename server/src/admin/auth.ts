import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const token = process.env['ADMIN_TOKEN'] ?? ''
const tokenHash = token ? createHash('sha256').update(token).digest() : null

interface TicketEntry {
  id: string
  expiresAt: number
}

const cvTickets = new Map<string, TicketEntry>()
const carouselTickets = new Map<string, TicketEntry>()

/** Limpieza periódica de tickets expirados */
setInterval(() => {
  const now = Date.now()
  for (const [t, data] of cvTickets.entries()) {
    if (data.expiresAt < now) cvTickets.delete(t)
  }
  for (const [t, data] of carouselTickets.entries()) {
    if (data.expiresAt < now) carouselTickets.delete(t)
  }
}, 30_000).unref()

/** Genera un ticket de un solo uso para CV con vida útil de 60 segundos */
export function createCvTicket(id: string): string {
  const ticket = randomBytes(24).toString('hex')
  cvTickets.set(ticket, {
    id,
    expiresAt: Date.now() + 60_000,
  })
  return ticket
}

/** Consume y valida un ticket de CV para un targetId específico */
export function validateCvTicket(ticket: string, targetId: string): boolean {
  const entry = cvTickets.get(ticket)
  if (!entry) return false
  cvTickets.delete(ticket)
  return entry.expiresAt >= Date.now() && entry.id === targetId
}

/** Genera un ticket de un solo uso para Carrusel con vida útil de 60 segundos */
export function createCarouselTicket(id: string): string {
  const ticket = randomBytes(24).toString('hex')
  carouselTickets.set(ticket, {
    id,
    expiresAt: Date.now() + 60_000,
  })
  return ticket
}

/** Consume y valida un ticket de Carrusel para un targetId específico */
export function validateCarouselTicket(ticket: string, targetId: string): boolean {
  const entry = carouselTickets.get(ticket)
  if (!entry) return false
  carouselTickets.delete(ticket)
  return entry.expiresAt >= Date.now() && entry.id === targetId
}

/** Verifica si una petición cuenta con autorización Bearer válida */
export function isAdminAuthorized(req: Request): boolean {
  if (!token || !tokenHash) return false
  const header = req.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const givenHash = createHash('sha256').update(given).digest()
  return timingSafeEqual(givenHash, tokenHash)
}

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN el admin queda apagado.
 * No se acepta ADMIN_TOKEN por query string (?token=). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!token || !tokenHash) {
    res.status(503).json({ error: 'admin deshabilitado: falta ADMIN_TOKEN' })
    return
  }

  // Si la petición es exclusivamente a rutas de vista previa HTML (CV o Carrusel) con ticket,
  // permitimos que continúe para que el handler específico valide la autenticidad del ticket para ese ID
  const isCvHtmlRoute = req.path.includes('/cv/') && req.path.endsWith('/html')
  const isCarouselHtmlRoute = req.path.includes('/carousel/') && req.path.endsWith('/html')
  if ((isCvHtmlRoute || isCarouselHtmlRoute) && typeof req.query['ticket'] === 'string') {
    return next()
  }

  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
