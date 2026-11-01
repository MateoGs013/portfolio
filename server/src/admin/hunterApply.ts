import { Router, type Request, type Response } from 'express'
import type { ApplyPreview, FoundEmail, HunterJob } from '../shared/hunterContracts.js'
import { isManualJob, jobFromBody, manualJobRefusal, missingJob, normalizeApplyEmail, normalizeApplyPreview, normalizeFoundEmail, normalizeJobChange } from './erosContract.js'
import { findDemoJob, jobFromInput } from './fallbackHunterData.js'
import { generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { loadProfile } from './profile.js'
import { forwardToEros, getParamId, sendErosFailure, useLocalFallback, type ForwardResult } from './proxy.js'

/**
 * Postulación: vista previa del correo, búsqueda del contacto, despacho y correo de la vacante. Solo
 * la vista previa tiene respaldo (el pitch desde la base); enviar, buscar un correo que la vacante no
 * trae y cambiar el contacto necesitan a Eros, y sin él responden que no se hizo.
 */
export const hunterApplyRouter = Router()

async function previewFrom(job: HunterJob): Promise<ApplyPreview> {
  const pitch = generatePitchHeuristic(job, await loadProfile(jobLang(job)))
  // Sin correo conocido va null: el admin pide el destinatario en lugar de inventar uno.
  return { to_email: job.contact_email, contact_email: job.contact_email, subject: pitch.subject, body: `${pitch.elevator_pitch}\n\n${pitch.cover_letter}`, channel: 'email' }
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
 * POST /api/admin/hunter/jobs/:id/find-email { job? } - Buscar el correo de contacto. Sin Eros no se
 * adivina una dirección: solo el contacto que la vacante ya trae.
 */
hunterApplyRouter.post('/jobs/:id/find-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = isManualJob(id) ? null : await forwardToEros(`api/jobs/${encodeURIComponent(id)}/find-email`, { method: 'POST' }, 25000)
  if (result?.ok) {
    res.json({ ...normalizeFoundEmail(result.data), _source: 'eros' })
    return
  }
  const known = jobFromBody(req.body)?.contact_email ?? findDemoJob(id)?.contact_email ?? null
  if (!known) {
    if (result) sendErosFailure(res, result, 'No se buscó el correo de contacto.')
    else res.status(404).json({ error: 'La vacante no trae un correo de contacto. Escribilo a mano.', code: 'not_found', errors: [] })
    return
  }
  const found: FoundEmail = { email: known, domain: known.split('@')[1] ?? null, confidence: null, sources: ['job_contact'] }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...found, _source: 'fallback' })
})

/** POST /api/admin/hunter/jobs/:id/apply-email - Despacho de la postulación por Eros. */
hunterApplyRouter.post('/jobs/:id/apply-email', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (isManualJob(id)) {
    res.status(400).json(manualJobRefusal)
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-email`, { method: 'POST', body: JSON.stringify(req.body) }, 35000)
  // Sin Eros no hay envío: el error llega al admin para que no marque la vacante como postulada.
  if (result.ok) res.json(normalizeApplyEmail(result.data))
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
