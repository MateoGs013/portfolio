import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

function getAdminTokenConfig(): { token: string; hash: Buffer | null; valid: boolean; reason?: string } {
  const token = process.env['ADMIN_TOKEN'] ?? ''
  const isProd = process.env['NODE_ENV'] === 'production'

  if (!token) {
    if (!isProd) {
      const devToken = 'dev-token'
      return {
        token: devToken,
        hash: createHash('sha256').update(devToken).digest(),
        valid: true,
      }
    }
    return { token: '', hash: null, valid: false, reason: 'ADMIN_TOKEN no configurado en variables de entorno' }
  }

  if (isProd && token.length < 12) {
    return { token: '', hash: null, valid: false, reason: 'ADMIN_TOKEN debe tener al menos 12 caracteres en producción' }
  }

  return {
    token,
    hash: createHash('sha256').update(token).digest(),
    valid: true,
  }
}

// Verificación y log en producción si falta o es insuficiente
if (process.env['NODE_ENV'] === 'production') {
  const initialCheck = getAdminTokenConfig()
  if (!initialCheck.valid) {
    console.error(`[CRITICAL SECURITY] ${initialCheck.reason}`)
  }
}

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
  if (entry.expiresAt < Date.now() || entry.id !== targetId) return false
  // Ventana de 5s para tolerar prefetching o recarga inmediata sin exponer reuso arbitrario
  entry.expiresAt = Math.min(entry.expiresAt, Date.now() + 5_000)
  return true
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
  if (entry.expiresAt < Date.now() || entry.id !== targetId) return false
  // Ventana de 5s para tolerar prefetching o recarga inmediata sin exponer reuso arbitrario
  entry.expiresAt = Math.min(entry.expiresAt, Date.now() + 5_000)
  return true
}

/** Verifica si una petición cuenta con autorización Bearer válida */
export function isAdminAuthorized(req: Request): boolean {
  const cfg = getAdminTokenConfig()
  if (!cfg.valid || !cfg.hash) return false

  const header = req.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!given) return false

  const isProd = process.env['NODE_ENV'] === 'production'
  if (!isProd && given === 'dev-token') {
    return true
  }

  const givenHash = createHash('sha256').update(given).digest()
  return timingSafeEqual(givenHash, cfg.hash)
}

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN válido el admin queda apagado.
 * No se acepta ADMIN_TOKEN por query string (?token=). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cfg = getAdminTokenConfig()
  if (!cfg.valid) {
    console.error(`[AUTH] Admin deshabilitado: ${cfg.reason}`)
    res.status(503).json({ error: `admin deshabilitado: ${cfg.reason}` })
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
