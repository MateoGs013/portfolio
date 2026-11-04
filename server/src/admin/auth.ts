import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const DEV_TOKEN = 'dev-token'

/**
 * El token del admin: ADMIN_TOKEN. Solo si no está definido y no se está en producción vale
 * `dev-token`; con ADMIN_TOKEN definido, `dev-token` es una clave más y da 401.
 */
function getAdminTokenConfig(): { token: string, hash: Buffer | null, valid: boolean, reason?: string } {
  const token = process.env['ADMIN_TOKEN'] ?? ''
  const isProd = process.env['NODE_ENV'] === 'production'

  if (!token) {
    if (!isProd) return { token: DEV_TOKEN, hash: createHash('sha256').update(DEV_TOKEN).digest(), valid: true }
    return { token: '', hash: null, valid: false, reason: 'ADMIN_TOKEN no configurado en variables de entorno' }
  }

  if (isProd && token.length < 12) {
    return { token: '', hash: null, valid: false, reason: 'ADMIN_TOKEN debe tener al menos 12 caracteres en producción' }
  }

  return { token, hash: createHash('sha256').update(token).digest(), valid: true }
}

// Verificación y log en producción si falta o es insuficiente
if (process.env['NODE_ENV'] === 'production') {
  const initialCheck = getAdminTokenConfig()
  if (!initialCheck.valid) {
    console.error(`[CRITICAL SECURITY] ${initialCheck.reason}`)
  }
}

/**
 * Qué abre un ticket: la hoja del CV de una vacante (`cv`) o la hoja del CV base (`cv-base`). El
 * alcance va dentro de la firma: un ticket de la vacante «base» no abre el CV base.
 */
export type TicketScope = 'cv' | 'cv-base'

const TICKET_TTL_MS = 3600_000

function getTicketSecret(): string {
  return getAdminTokenConfig().token || 'portfolio-secure-ticket-secret'
}

function sign(scope: TicketScope, id: string, expiresAt: number): string {
  return createHmac('sha256', getTicketSecret()).update(`${scope}:${id}:${expiresAt}`).digest('hex').slice(0, 32)
}

const normalized = (id: string) => String(id).trim().toLowerCase()

/** Ticket firmado, sin estado: vale 1 hora y solo para ese alcance y ese id (se puede recargar la hoja). */
export function createTicket(scope: TicketScope, id: string): string {
  const expiresAt = Date.now() + TICKET_TTL_MS
  return `${expiresAt}.${sign(scope, normalized(id), expiresAt)}`
}

export function validateTicket(ticket: unknown, scope: TicketScope, id: string): boolean {
  if (typeof ticket !== 'string') return false
  const [expStr, sig, ...rest] = ticket.split('.')
  const expiresAt = Number(expStr)
  if (rest.length || !sig || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  const expected = sign(scope, normalized(id), expiresAt)
  if (sig.length !== expected.length || !/^[0-9a-f]+$/.test(sig)) return false
  return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
}

export const createCvTicket = (id: string) => createTicket('cv', id)
export const validateCvTicket = (ticket: unknown, id: string) => validateTicket(ticket, 'cv', id)

/** Verifica si una petición cuenta con autorización Bearer válida */
export function isAdminAuthorized(req: Request): boolean {
  const cfg = getAdminTokenConfig()
  if (!cfg.valid || !cfg.hash) return false

  const header = req.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!given) return false

  const givenHash = createHash('sha256').update(given).digest()
  return timingSafeEqual(givenHash, cfg.hash)
}

/**
 * Las hojas que se abren en otra pestaña o en un iframe (sin el header Authorization): con ticket
 * pasan y su ruta valida el ticket para ese id.
 */
const TICKET_ROUTES = [/^\/hunter\/cv\/[^/]+\/(html|txt)$/, /^\/hunter\/cv-base\/html$/]

/** Bearer token fijo desde .env. Sin ADMIN_TOKEN válido el admin queda apagado.
 * No se acepta ADMIN_TOKEN por query string (?token=). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const cfg = getAdminTokenConfig()
  if (!cfg.valid) {
    console.error(`[AUTH] Admin deshabilitado: ${cfg.reason}`)
    res.status(503).json({ error: `admin deshabilitado: ${cfg.reason}` })
    return
  }

  if (typeof req.query['ticket'] === 'string' && TICKET_ROUTES.some(route => route.test(req.path))) {
    return next()
  }

  if (!isAdminAuthorized(req)) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  next()
}
