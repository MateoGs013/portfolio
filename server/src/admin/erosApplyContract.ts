/**
 * Contrato con Eros para Postular: la vista previa del correo, la búsqueda del contacto (con de dónde
 * salió) y el despacho. Lo que no trae va en null; un correo que Eros no sacó del aviso ni de la web de
 * la empresa es adivinado, y nunca se presenta como verificado.
 */
import type { ApplyEmailResult, ApplyPreview, EmailOrigin, FoundEmail } from '../shared/hunterContracts.js'
import { text, unwrap } from './erosContract.js'

/**
 * El texto de una vista previa de Eros, o null si vino vacía (entonces se arma el respaldo). Eros
 * manda `contact_email` ('' sin correo) e `is_email_extracted`; `contact_email_verified` no se lee
 * (ver ApplyPreview).
 */
export function normalizeApplyPreview(payload: unknown): ApplyPreview | null {
  const o = unwrap(payload)
  const subject = text(o['subject'])
  const body = text(o['body'])
  if (!subject && !body) return null
  const contact = text(o['contact_email'])
  return {
    to_email: text(o['to_email']),
    contact_email: contact,
    subject: subject ?? '',
    body: body ?? '',
    channel: text(o['channel']) ?? 'email',
    email_origin: contact || text(o['to_email']) ? (o['is_email_extracted'] === true ? 'posting' : 'unknown') : null,
  }
}

/** El origen de un correo según el código de Eros: lo que no es del aviso ni de Hunter.io, adivinado. */
export function emailOriginOf(source: string | null): EmailOrigin {
  if (source === 'description') return 'posting'
  if (source === 'hunter_io') return 'company_site'
  if (source === 'domain_guessing' || source === 'mx_inference') return 'guessed'
  return 'unknown'
}

/** POST /api/jobs/:id/find-email de Eros: `{ ok, job_id, contact_email, source, found }`. */
export function normalizeFoundEmail(payload: unknown): FoundEmail {
  const o = unwrap(payload)
  const email = text(o['contact_email']) ?? text(o['email'])
  const source = text(o['source'])
  const found = o['found'] === true && !!email
  return { email, found, origin: email ? (found ? emailOriginOf(source) : 'unknown') : null, source }
}

export function normalizeApplyEmail(payload: unknown): ApplyEmailResult {
  const o = unwrap(payload)
  return {
    ok: o['ok'] !== false,
    dispatched_to: text(o['dispatched_to']),
    provider: text(o['provider']),
    applied_at: text(o['applied_at']),
  }
}
