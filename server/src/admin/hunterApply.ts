import { Router, type Request, type Response } from 'express'
import { findJob, jobFromQuery } from './fallbackHunterData.js'
import { generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { loadProfile } from './profile.js'
import { forwardToEros, getParamId } from './proxy.js'

/** Postulación: vista previa del correo, búsqueda del contacto, despacho y correo de la vacante. */
export const hunterApplyRouter = Router()

/** GET /api/admin/hunter/jobs/:id/apply-preview - Vista previa de correo de postulación */
hunterApplyRouter.get(['/jobs/:id/apply-preview', '/apply-preview/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-preview`, { method: 'GET' }, 20000)
  if (result.ok && result.data && typeof result.data === 'object' && ((result.data as Record<string, unknown>)['subject'] || (result.data as Record<string, unknown>)['body'])) {
    res.status(result.status).json(result.data)
    return
  }
  const job = jobFromQuery(id, req.query)
  const pitch = generatePitchHeuristic(job, await loadProfile(jobLang(job))).data
  res.setHeader('X-Eros-Source', 'fallback')
  // Sin correo conocido va null: el admin pide el destinatario en lugar de inventar uno.
  res.json({
    ok: true,
    _source: 'fallback',
    to_email: job.contact_email,
    contact_email: job.contact_email,
    subject: pitch.subject,
    body: `${pitch.elevator_pitch}\n\n${pitch.cover_letter}`,
    channel: 'email',
  })
})

/** POST /api/admin/hunter/jobs/:id/find-email - Búsqueda y resolución automática de email con Hunter.io / guessing */
hunterApplyRouter.post(['/jobs/:id/find-email', '/find-email/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/find-email`, { method: 'POST' }, 25000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  // Sin Eros no se adivina una dirección: solo el contacto que la vacante ya trae, o null.
  const email = findJob(id)?.contact_email || null
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    ok: true,
    email,
    domain: email ? email.split('@')[1] ?? null : null,
    confidence: email ? 90 : 0,
    sources: email ? ['job_contact'] : [],
    _source: 'fallback',
  })
})

/** POST /api/admin/hunter/jobs/:id/apply-email - Despacho de postulación por email / n8n */
hunterApplyRouter.post(['/jobs/:id/apply-email', '/apply-email/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-email`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 35000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  // Sin Eros no hay envío: se responde el error para que el admin no marque la vacante como postulada.
  const data = result.data as { error?: unknown } | null
  const error = typeof data?.error === 'string' && data.error ? data.error : 'Eros no está disponible: la postulación no se envió'
  res.status(result.status >= 400 ? result.status : 502).json({ error })
})

/** PATCH /api/admin/hunter/jobs/:id/contact-email - Actualizar correo de contacto de vacante */
hunterApplyRouter.patch(['/jobs/:id/contact-email', '/contact-email/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/contact-email`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  }, 15000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = findJob(id)
  if (job && req.body?.contact_email !== undefined) {
    job.contact_email = req.body.contact_email
    res.json({ ok: true, job })
    return
  }
  res.status(result.status).json(result.data)
})
