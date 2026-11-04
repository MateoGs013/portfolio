import { Router, type Request, type Response } from 'express'
import type { AdminErrorBody, FieldIssue } from '../shared/adminContracts.js'
import type { ApplyEmailResult, ApplyPreview, FoundEmail, HunterJob, SentCv } from '../shared/hunterContracts.js'
import { normalizeApplyEmail, normalizeApplyPreview, normalizeFoundEmail } from './erosApplyContract.js'
import { isManualJob, jobFromBody, manualJobRefusal, missingJob, normalizeJobChange, unwrap } from './erosContract.js'
import { findDemoJob, jobFromInput } from './fallbackHunterData.js'
import { cvExpired, recallCv } from './hunterCvCache.js'
import { sheetTarget } from './hunterCvHtml.js'
import { CvPdfError, renderCvPdf, type CvPdf } from './hunterCvPdf.js'
import { renderCvText } from './hunterCvText.js'
import { generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { cvFileName, loadProfile } from './profile.js'
import { erosIdParam, forwardToEros, getParamId, sendErosFailure, useLocalFallback, type ForwardResult } from './proxy.js'

/**
 * Postulación: vista previa del correo, búsqueda del contacto, despacho y correo de la vacante. Solo
 * la vista previa tiene respaldo (el pitch desde la base); buscar un correo que la vacante no trae y
 * cambiar el contacto necesitan a Eros, y sin él responden que no se hizo.
 *
 * El despacho por Eros adjunta el CV de la etapa CV y ningún otro: la API imprime a PDF el CV del
 * caché (hunterCvPdf.ts, una página A4 dentro de la cota dual) y se lo manda a Eros con su texto plano
 * y su sha256; Eros lo adjunta tal cual. Se enciende con EROS_SEND_ENABLED=on en el entorno de la
 * API; apagado responde 409 `send_disabled` sin preguntarle nada a Eros.
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

/** «Enviar desde Eros» encendido: EROS_SEND_ENABLED=on (o 1, true) en el entorno de la API. */
export function erosSendEnabled(): boolean {
  return /^(?:on|1|true)$/i.test(process.env['EROS_SEND_ENABLED']?.trim() ?? '')
}

/** El 409 de «Enviar desde Eros» mientras está apagado (ver erosSendEnabled). */
const sendDisabled: AdminErrorBody = {
  error: 'Enviar desde Eros está apagado. Abrí la postulación en Gmail, adjuntá el PDF de la etapa CV y marcala con «Ya la envié».',
  code: 'send_disabled',
  errors: [],
}

const conflict = (error: string): { status: number, body: AdminErrorBody } => ({ status: 409, body: { error, code: 'conflict', errors: [] } })
const badRecipient = (error: string): { status: number, body: AdminErrorBody } => ({ status: 400, body: { error, code: 'invalid', errors: [{ path: 'to_email', message: error }] } })
const notSent = (error: string): { status: number, body: AdminErrorBody } => ({ status: 502, body: { error, code: 'eros_error', errors: [] } })
/** No se sabe si salió: 409 si fue un envío anterior, 502 si fue este. El admin ofrece «Ya salió» o reintentar. */
const unknownOutcome = (status: number, error: string): { status: number, body: AdminErrorBody } => ({ status, body: { error, code: 'send_outcome_unknown', errors: [] } })

/**
 * Los `error_code` de postular en el Eros de ahora, en español. Los que dicen que no se sabe si salió
 * piden revisar el correo enviado antes de reintentar: Eros no reintenta solo.
 */
const applyRefusals: Record<string, { status: number, body: AdminErrorBody }> = {
  already_applied: conflict('Eros ya la tiene como postulada: no se envía de nuevo.'),
  send_in_progress: conflict('Eros ya está enviando esta postulación: esperá y recargá la vacante.'),
  send_outcome_unknown: unknownOutcome(409, 'Un envío anterior se cortó y no se sabe si salió.'),
  missing_email: badRecipient('Falta el destinatario: escribí el correo de quien recibe las postulaciones.'),
  invalid_email: badRecipient('Ese correo no tiene un formato válido.'),
  unverified_email: badRecipient('Eros no sabe de dónde salió ese correo: escribilo a mano para confirmarlo.'),
  requires_confirmation: badRecipient('Eros pide confirmar el destinatario antes de enviar.'),
  invalid_channel: { status: 400, body: { error: 'Eros no envía por ese canal.', code: 'invalid', errors: [] } },
  no_provider: notSent('Eros no tiene cómo enviar correos (ni n8n ni SMTP). La postulación no se envió.'),
  provider_rejected: notSent('El proveedor de correo rechazó el envío. La postulación no se envió.'),
  cv_required: notSent('Eros no recibió el CV que le mandó el admin. La postulación no se envió.'),
  invalid_cv: notSent('Eros no aceptó el PDF del CV que le mandó el admin. La postulación no se envió.'),
}

const MAX_SUBJECT = 300
const MAX_BODY = 20_000
const CHANNELS = new Set(['auto', 'n8n', 'smtp'])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SendRequest {
  to_email: string
  subject: string
  body: string
  channel: string
  force_retry: boolean
}

/** Lo que manda el admin, validado: destinatario, asunto y mensaje; el canal y el reintento, opcionales. */
function sendRequest(raw: unknown): SendRequest | AdminErrorBody {
  const o = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const str = (key: string) => (typeof o[key] === 'string' ? o[key].trim() : '')
  const errors: FieldIssue[] = []
  const to = str('to_email')
  if (!EMAIL.test(to)) errors.push({ path: 'to_email', message: 'Escribí el correo de quien recibe las postulaciones.' })
  const subject = str('subject')
  if (!subject) errors.push({ path: 'subject', message: 'El correo necesita un asunto.' })
  else if (subject.length > MAX_SUBJECT) errors.push({ path: 'subject', message: `El asunto pasa los ${MAX_SUBJECT} caracteres.` })
  const body = str('body')
  if (!body) errors.push({ path: 'body', message: 'El correo necesita un mensaje.' })
  else if (body.length > MAX_BODY) errors.push({ path: 'body', message: `El mensaje pasa los ${MAX_BODY} caracteres.` })
  const channel = str('channel') || 'n8n'
  if (!CHANNELS.has(channel)) errors.push({ path: 'channel', message: 'Eros envía por n8n o por SMTP.' })
  if (errors.length) return { error: 'Revisá el correo antes de enviarlo.', code: 'invalid', errors }
  return { to_email: to, subject, body, channel, force_retry: o['force_retry'] === true }
}

/** Por qué no hubo PDF: sin Chromium (503) o fuera de la cota dual (422), en español y sin enviar nada. */
function pdfRefusal(err: CvPdfError): { status: number, body: AdminErrorBody } {
  if (err.reason === 'unavailable') return { status: 503, body: { error: err.message, code: 'pdf_unavailable', errors: [] } }
  return { status: 422, body: { error: err.message, code: 'cv_out_of_bounds', errors: [] } }
}

/**
 * POST /api/admin/hunter/jobs/:id/apply-email { to_email, subject, body, channel?, force_retry? } →
 * ApplyEmailResult. Despacho de la postulación por Eros con el CV de la etapa CV: sin ese CV en el
 * caché responde 409 cv_expired (el admin lo rearma y pide revisarlo antes de enviar), y si el PDF no
 * entra en una página A4 dentro de la cota, 422 cv_out_of_bounds. En los dos casos Eros no se entera.
 */
hunterApplyRouter.post('/jobs/:id/apply-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!erosSendEnabled()) {
    res.status(409).json(sendDisabled)
    return
  }
  if (isManualJob(id)) {
    res.status(400).json(manualJobRefusal)
    return
  }
  const mail = sendRequest(req.body)
  if ('code' in mail) {
    res.status(400).json(mail)
    return
  }
  const entry = recallCv(id)
  if (!entry) {
    res.status(409).json(cvExpired)
    return
  }

  // El PDF se imprime antes de pedirle nada a Eros: si no sale, Eros no toma la marca de envío.
  let printed: CvPdf
  try {
    printed = await renderCvPdf(entry.cv, sheetTarget(entry.job))
  }
  catch (err) {
    if (!(err instanceof CvPdfError)) throw err
    const refusal = pdfRefusal(err)
    res.status(refusal.status).json(refusal.body)
    return
  }
  const sent: SentCv = { filename: `${cvFileName(entry.cv.name, 'Harvard_ATS')}.pdf`, height_mm: printed.heightMm, sha256: printed.sha256 }
  const payload = {
    to_email: mail.to_email,
    subject: mail.subject,
    body: mail.body,
    channel: mail.channel,
    confirmed: true,
    force_retry: mail.force_retry,
    cv: {
      filename: sent.filename,
      pdf_base64: printed.pdf.toString('base64'),
      text: renderCvText(entry.cv),
      sha256: printed.sha256,
      lang: entry.cv.lang,
      height_mm: printed.heightMm,
    },
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-email`, { method: 'POST', body: JSON.stringify(payload) }, 35000)
  // Sin Eros no hay envío: el error llega al admin para que no marque la vacante como postulada.
  if (result.ok) {
    const done = normalizeApplyEmail(result.data)
    // Un Eros que no confirma este PDF (el de antes de nov-2026) puede haber adjuntado el suyo.
    const confirmed = unwrap(result.data)['cv_sha256'] === printed.sha256
    const warning = done.ok && !confirmed
      ? 'Eros envió el correo pero no confirmó que adjuntó este CV: revisalo en tu correo enviado.'
      : done.warning
    const body: ApplyEmailResult = { ...done, cv: done.ok ? sent : null, warning }
    res.json(body)
    return
  }
  const code = result.failure?.code ?? ''
  // Un 504 de Eros con send_outcome_unknown es este intento, que se cortó: puede haber salido.
  const refusal = code === 'send_outcome_unknown' && result.failure?.upstream === 504
    ? unknownOutcome(502, 'El envío se cortó a mitad de camino: puede que haya salido.')
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
