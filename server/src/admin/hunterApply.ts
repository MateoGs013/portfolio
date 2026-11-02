import { Router, type Request, type Response } from 'express'
import type { AdminErrorBody } from '../shared/adminContracts.js'
import { EROS_SEND_ENABLED, type ApplyPreview, type FoundEmail, type HunterJob } from '../shared/hunterContracts.js'
import { normalizeApplyEmail, normalizeApplyPreview, normalizeFoundEmail } from './erosApplyContract.js'
import { isManualJob, jobFromBody, manualJobRefusal, missingJob, normalizeJobChange } from './erosContract.js'
import { findDemoJob, jobFromInput } from './fallbackHunterData.js'
import { generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { loadProfile } from './profile.js'
import { erosIdParam, forwardToEros, getParamId, sendErosFailure, useLocalFallback, type ForwardResult } from './proxy.js'

/**
 * Postulación: vista previa del correo, búsqueda del contacto, despacho y correo de la vacante. Solo
 * la vista previa tiene respaldo (el pitch desde la base); buscar un correo que la vacante no trae y
 * cambiar el contacto necesitan a Eros, y sin él responden que no se hizo. El despacho por Eros está
 * apagado (EROS_SEND_ENABLED en shared/hunterContracts.ts): responde 409 `send_disabled` sin
 * preguntarle nada a Eros.
 */
export const hunterApplyRouter = Router()

/** Un id que no es de Eros (`%2F`, `..`) responde 400 y nunca se reenvía. */
hunterApplyRouter.param('id', erosIdParam)

/**
 * 'posting' si el correo figura en el aviso; si no, no se sabe de dónde salió. null sin correo o en una
 * vacante pegada a mano, donde el correo lo escribió quien la pegó.
 */
function originIn(job: Pick<HunterJob, 'contact_email' | 'description'>, manual: boolean): FoundEmail['origin'] {
  const email = job.contact_email?.toLowerCase()
  if (!email || manual) return null
  return job.description.toLowerCase().includes(email) ? 'posting' : 'unknown'
}

async function previewFrom(job: HunterJob): Promise<ApplyPreview> {
  const pitch = generatePitchHeuristic(job, await loadProfile(jobLang(job)))
  // Sin correo conocido va null: el admin pide el destinatario en lugar de inventar uno.
  return {
    to_email: job.contact_email,
    contact_email: job.contact_email,
    subject: pitch.subject,
    body: `${pitch.elevator_pitch}\n\n${pitch.cover_letter}`,
    channel: 'email',
    email_origin: originIn(job, isManualJob(job.id)),
  }
}

/** La vista previa de Eros o, si no responde o no conoce la vacante, la que se arma desde la base. */
async function sendPreview(res: Response, result: ForwardResult | null, job: HunterJob | null): Promise<void> {
  const preview = result?.ok ? normalizeApplyPreview(result.data) : null
  if (preview) {
    res.json({ ...preview, _source: 'eros' })
    return
  }
  if (!job) {
    if (result && !result.ok) sendErosFailure(res, result, 'Para armar la vista previa sin Eros, mandá la vacante.')
    else res.status(400).json(missingJob)
    return
  }
  if (result && !useLocalFallback(result)) {
    sendErosFailure(res, result)
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...(await previewFrom(job)), _source: 'fallback' })
}

const previewPath = (id: string) => `api/jobs/${encodeURIComponent(id)}/apply-preview`

/** POST /api/admin/hunter/jobs/:id/apply-preview { job } - Vista previa del correo, con la vacante en el cuerpo. */
hunterApplyRouter.post('/jobs/:id/apply-preview', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const input = jobFromBody(req.body)
  const result = isManualJob(id) ? null : await forwardToEros(previewPath(id), { method: 'GET' }, 20000)
  await sendPreview(res, result, findDemoJob(id) ?? (input ? jobFromInput(id, input) : null))
})

/**
 * POST /api/admin/hunter/jobs/:id/find-email { job? } → FoundEmail, con de dónde salió el correo.
 * Sin Eros no se adivina una dirección: solo el contacto que la vacante ya trae.
 */
hunterApplyRouter.post('/jobs/:id/find-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = isManualJob(id) ? null : await forwardToEros(`api/jobs/${encodeURIComponent(id)}/find-email`, { method: 'POST' }, 25000)
  if (result?.ok) {
    res.json({ ...normalizeFoundEmail(result.data), _source: 'eros' })
    return
  }
  const input = jobFromBody(req.body)
  const local = findDemoJob(id) ?? (input ? { contact_email: input.contact_email, description: input.description } : null)
  if (!local?.contact_email) {
    if (result) sendErosFailure(res, result, 'No se buscó el correo de contacto.')
    else res.status(404).json({ error: 'La vacante no trae un correo de contacto. Escribilo a mano.', code: 'not_found', errors: [] })
    return
  }
  const found: FoundEmail = { email: local.contact_email, found: false, origin: originIn(local, isManualJob(id)), source: null }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...found, _source: 'fallback' })
})

/** El 409 de «Enviar desde Eros» mientras está apagado (ver EROS_SEND_ENABLED). */
const sendDisabled = {
  error: 'Enviar desde Eros está apagado: Eros adjuntaría su propio CV, no el armado desde la base. Abrí la postulación en Gmail, adjuntá el PDF de la etapa CV y marcala con «Ya la envié».',
  code: 'send_disabled',
  errors: [],
}

const conflict = (error: string): { status: number, body: AdminErrorBody } => ({ status: 409, body: { error, code: 'conflict', errors: [] } })
const badRecipient = (error: string): { status: number, body: AdminErrorBody } => ({ status: 400, body: { error, code: 'invalid', errors: [{ path: 'to_email', message: error }] } })
const notSent = (error: string): { status: number, body: AdminErrorBody } => ({ status: 502, body: { error, code: 'eros_error', errors: [] } })

/**
 * Los `error_code` de postular en el Eros de ahora, en español. Los que dicen que no se sabe si salió
 * piden revisar el correo enviado antes de reintentar: Eros no reintenta solo.
 */
const applyRefusals: Record<string, { status: number, body: AdminErrorBody }> = {
  already_applied: conflict('Eros ya la tiene como postulada: no se envía de nuevo.'),
  send_in_progress: conflict('Eros ya está enviando esta postulación: esperá y recargá la vacante.'),
  send_outcome_unknown: conflict('Un envío anterior se cortó y no se sabe si salió. Revisá en tu correo enviado antes de reintentar.'),
  missing_email: badRecipient('Falta el destinatario: escribí el correo de quien recibe las postulaciones.'),
  invalid_email: badRecipient('Ese correo no tiene un formato válido.'),
  unverified_email: badRecipient('Eros no sabe de dónde salió ese correo: escribilo a mano para confirmarlo.'),
  requires_confirmation: badRecipient('Eros pide confirmar el destinatario antes de enviar.'),
  invalid_channel: { status: 400, body: { error: 'Eros no envía por ese canal.', code: 'invalid', errors: [] } },
  no_provider: notSent('Eros no tiene cómo enviar correos (ni n8n ni SMTP). La postulación no se envió.'),
  provider_rejected: notSent('El proveedor de correo rechazó el envío. La postulación no se envió.'),
}

/** POST /api/admin/hunter/jobs/:id/apply-email - Despacho de la postulación por Eros (apagado). */
hunterApplyRouter.post('/jobs/:id/apply-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!EROS_SEND_ENABLED) {
    res.status(409).json(sendDisabled)
    return
  }
  if (isManualJob(id)) {
    res.status(400).json(manualJobRefusal)
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-email`, { method: 'POST', body: JSON.stringify(req.body) }, 35000)
  // Sin Eros no hay envío: el error llega al admin para que no marque la vacante como postulada.
  if (result.ok) {
    res.json(normalizeApplyEmail(result.data))
    return
  }
  const code = result.failure?.code ?? ''
  // Un 504 de Eros con send_outcome_unknown es este intento, que se cortó: puede haber salido.
  const refusal = code === 'send_outcome_unknown' && result.failure?.upstream === 504
    ? notSent('El envío se cortó a mitad de camino: puede que haya salido. Revisá en tu correo enviado antes de reintentar.')
    : applyRefusals[code]
  if (refusal) res.status(refusal.status).json(refusal.body)
  else sendErosFailure(res, result, 'La postulación no se envió.')
})

/** PATCH /api/admin/hunter/jobs/:id/contact-email { contact_email } - Cambiar el correo de contacto. */
hunterApplyRouter.patch('/jobs/:id/contact-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (isManualJob(id)) {
    res.status(400).json(manualJobRefusal)
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/contact-email`, {
    method: 'PATCH',
    body: JSON.stringify({ contact_email: req.body?.contact_email ?? null }),
  }, 15000)
  if (result.ok) res.json(normalizeJobChange(result.data))
  else sendErosFailure(res, result, 'El correo de contacto no cambió.')
})
