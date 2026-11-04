/**
 * Contrato con Eros para Postular: la vista previa del correo, la búsqueda del contacto (con de dónde
 * salió) y el despacho. Lo que no trae va en null; un correo adivinado o de origen desconocido nunca se
 * presenta como verificado. Acepta las respuestas del Eros de antes y las del de ahora.
 */
import type { ApplyEmailResult, ApplyPreview, EmailOrigin, FoundEmail } from '../shared/hunterContracts.js'
import { text, unwrap } from './erosContract.js'

/**
 * El texto de una vista previa de Eros, o null si vino vacía (entonces se arma el respaldo). Eros
 * manda `contact_email` ('' sin correo) y `contact_email_source` (el de antes, solo
 * `is_email_extracted`); `contact_email_verified` no se lee (ver ApplyPreview).
 */
export function normalizeApplyPreview(payload: unknown): ApplyPreview | null {
  const o = unwrap(payload)
  const subject = text(o['subject'])
  const body = text(o['body'])
  if (!subject && !body) return null
  const contact = text(o['contact_email'])
  const source = text(o['contact_email_source'])
  const origin = source ? emailOriginOf(source) : o['is_email_extracted'] === true ? 'posting' : 'unknown'
  return {
    to_email: text(o['to_email']),
    contact_email: contact,
    subject: subject ?? '',
    body: body ?? '',
    channel: text(o['channel']) ?? 'email',
    email_origin: contact || text(o['to_email']) ? origin : null,
  }
}

/**
 * El origen de un correo según el código de Eros: el de ahora (posting, company_site, hunter, manual)
 * o el de antes (description, hunter_io, domain_guessing, mx_inference). Lo que no se reconoce, 'unknown'.
 */
export function emailOriginOf(source: string | null): EmailOrigin {
  switch (source) {
    case 'posting':
    case 'description':
      return 'posting'
    case 'company_site':
      return 'company_site'
    case 'hunter':
    case 'hunter_io':
      return 'hunter'
    case 'manual':
      return 'manual'
    case 'domain_guessing':
    case 'mx_inference':
      return 'guessed'
    default:
      return 'unknown'
  }
}

/**
 * POST /api/jobs/:id/find-email de Eros: `{ ok, job_id, contact_email, contact_email_source, source,
 * found }`. Sin uno nuevo (`found: false`) vuelve el que ya tenía la vacante, con el origen guardado en
 * `contact_email_source` (el Eros de antes no lo manda: 'unknown').
 */
export function normalizeFoundEmail(payload: unknown): FoundEmail {
  const o = unwrap(payload)
  const email = text(o['contact_email']) ?? text(o['email'])
  const source = text(o['source'])
  const stored = text(o['contact_email_source'])
  const found = o['found'] === true && !!email
  const origin = found ? emailOriginOf(stored ?? source) : emailOriginOf(stored)
  return { email, found, origin: email ? origin : null, source: stored ?? source }
}

export function normalizeApplyEmail(payload: unknown): ApplyEmailResult {
  const o = unwrap(payload)
  return {
    ok: o['ok'] !== false,
    dispatched_to: text(o['dispatched_to']),
    provider: text(o['provider']),
    applied_at: text(o['applied_at']),
    cv: null,
    warning: text(o['warning']),
  }
}
