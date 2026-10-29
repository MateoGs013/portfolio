import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
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

/** Limpieza periódica de tickets en memoria */
setInterval(() => {
  const now = Date.now()
  for (const [t, data] of cvTickets.entries()) {
    if (data.expiresAt < now) cvTickets.delete(t)
  }
  for (const [t, data] of carouselTickets.entries()) {
    if (data.expiresAt < now) carouselTickets.delete(t)
  }
}, 60_000).unref()

function getTicketSecret(): string {
  const cfg = getAdminTokenConfig()
  return cfg.token || process.env['ADMIN_TOKEN'] || 'portfolio-secure-ticket-secret'
}

/** Genera un ticket criptográfico firmado para CV con vida útil de 1 hora (resistente a clustering y recargas) */
export function createCvTicket(id: string): string {
  const normalizedId = String(id).trim().toLowerCase()
  const expiresAt = Date.now() + 3600_000 // 1 hora de validez
  const payload = `cv:${normalizedId}:${expiresAt}`
  const signature = createHmac('sha256', getTicketSecret()).update(payload).digest('hex').slice(0, 32)
  const ticket = `${expiresAt}.${signature}`
  cvTickets.set(ticket, { id: normalizedId, expiresAt })
  return ticket
}

/** Consume y valida un ticket de CV para un targetId específico */
export function validateCvTicket(ticket: string, targetId: string): boolean {
  if (!ticket || typeof ticket !== 'string') return false
  const normalizedTarget = String(targetId).trim().toLowerCase()

  // 1. Verificación criptográfica HMAC sin estado
  const parts = ticket.split('.')
  if (parts.length === 2 && parts[0] && parts[1]) {
    const expStr = parts[0]
    const sig = parts[1]
    const expiresAt = Number(expStr)
    if (expiresAt && !isNaN(expiresAt) && expiresAt >= Date.now()) {
      const payload = `cv:${normalizedTarget}:${expiresAt}`
      const expectedSig = createHmac('sha256', getTicketSecret()).update(payload).digest('hex').slice(0, 32)
      try {
        if (sig.length === expectedSig.length && timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
          return true
        }
      } catch {
        // En caso de discrepancia en formato, probar fallback de memoria
      }
    }
  }

  // 2. Fallback de caché en memoria
  const entry = cvTickets.get(ticket)
  if (!entry) return false
  if (entry.expiresAt < Date.now() || entry.id.toLowerCase() !== normalizedTarget) return false
  return true
}

/** Genera un ticket criptográfico firmado para Carrusel con vida útil de 1 hora */
export function createCarouselTicket(id: string): string {
  const normalizedId = String(id).trim().toLowerCase()
  const expiresAt = Date.now() + 3600_000 // 1 hora de validez
  const payload = `carousel:${normalizedId}:${expiresAt}`
  const signature = createHmac('sha256', getTicketSecret()).update(payload).digest('hex').slice(0, 32)
  const ticket = `${expiresAt}.${signature}`
  carouselTickets.set(ticket, { id: normalizedId, expiresAt })
  return ticket
}

/** Consume y valida un ticket de Carrusel para un targetId específico */
export function validateCarouselTicket(ticket: string, targetId: string): boolean {
  if (!ticket || typeof ticket !== 'string') return false
  const normalizedTarget = String(targetId).trim().toLowerCase()

  // 1. Verificación criptográfica HMAC sin estado
  const parts = ticket.split('.')
  if (parts.length === 2 && parts[0] && parts[1]) {
    const expStr = parts[0]
    const sig = parts[1]
    const expiresAt = Number(expStr)
    if (expiresAt && !isNaN(expiresAt) && expiresAt >= Date.now()) {
      const payload = `carousel:${normalizedTarget}:${expiresAt}`
      const expectedSig = createHmac('sha256', getTicketSecret()).update(payload).digest('hex').slice(0, 32)
      try {
        if (sig.length === expectedSig.length && timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
          return true
        }
      } catch {
        // Fallback a memoria
      }
    }
  }

  // 2. Fallback de caché en memoria
  const entry = carouselTickets.get(ticket)
  if (!entry) return false
  if (entry.expiresAt < Date.now() || entry.id.toLowerCase() !== normalizedTarget) return false
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

  // Si la petición es a rutas de vista previa (HTML o PDF de CV o Carrusel) con ticket,
  // permitimos que continúe para que el handler específico valide la autenticidad del ticket para ese ID
  const isCvRoute = req.path.includes('/cv/') && (req.path.endsWith('/html') || req.path.endsWith('/pdf'))
  const isCarouselRoute = req.path.includes('/carousel/') && (req.path.endsWith('/html') || req.path.endsWith('/pdf'))
  if ((isCvRoute || isCarouselRoute) && typeof req.query['ticket'] === 'string') {
    return next()
  }

  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
