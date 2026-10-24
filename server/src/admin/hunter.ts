import { Router, type Request, type Response } from 'express'
import { env } from '../env.js'
import { createCvTicket, isAdminAuthorized, validateCvTicket } from './auth.js'
import { forwardToEros, getParamId, getErosBaseUrl, isCircuitOpen, recordErosFailure } from './proxy.js'
import {
  fallbackHunterJobs,
  evaluateJobHeuristic,
  evaluateMultipleJobsHeuristic,
  computeHunterStats,
  generatePitchHeuristic,
  generateCvHeuristic,
  renderCvHtmlHeuristic,
} from './fallbackHunterData.js'

export const hunterRouter = Router()

/** POST /api/admin/hunter/cv/:id/ticket - Ticket de un solo uso para abrir CV HTML */
hunterRouter.post(['/cv/:id/ticket', '/jobs/:id/cv/ticket'], (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const ticket = createCvTicket(id)
  res.json({ ticket })
})

/** GET /api/admin/hunter/stats */
hunterRouter.get('/stats', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/stats')
  if (result.ok) {
    res.status(result.status).json(result.data)
  } else {
    res.setHeader('X-Eros-Source', 'fallback')
    res.json({
      ...computeHunterStats(),
      _source: 'fallback',
    })
  }
})

/** GET /api/admin/hunter/jobs */
hunterRouter.get('/jobs', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forwardToEros(`api/jobs${query ? `?${query}` : ''}`)
  if (result.ok) {
    const payload = result.data
    const jobsList = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray((payload as Record<string, unknown>)['data'])
        ? (payload as Record<string, unknown>)['data']
        : payload)
    res.status(result.status).json(jobsList)
    return
  }

  // Fallback si Eros está desconectado o no autorizado
  res.setHeader('X-Eros-Source', 'fallback')
  let jobs = fallbackHunterJobs.map(j => ({ ...j, _source: 'fallback' }))
  const statusFilter = req.query['status'] as string | undefined
  if (statusFilter && statusFilter !== 'all') {
    jobs = jobs.filter(j => j.status === statusFilter)
  }
  const minScore = req.query['min_score'] ? Number(req.query['min_score']) : undefined
  if (typeof minScore === 'number' && !isNaN(minScore)) {
    jobs = jobs.filter(j => (j.match_score ?? 0) >= minScore)
  }
  res.json(jobs)
})

/** POST /api/admin/hunter/scan */
hunterRouter.post('/scan', async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>)
  if (!params.has('evaluate')) {
    params.set('evaluate', 'false')
  }
  const query = params.toString()
  const result = await forwardToEros(`api/scan${query ? `?${query}` : ''}`, {
    method: 'POST',
    body: req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : undefined,
  }, 60000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    ok: true,
    _source: 'fallback',
    scanned_count: fallbackHunterJobs.length,
    new_jobs_count: fallbackHunterJobs.filter(j => j.status === 'new').length,
    message: 'Escaneo sincronizado con snapshot de vacantes activas (modo contingencia)',
  })
})

/** POST /api/admin/hunter/evaluate */
hunterRouter.post('/evaluate', async (req: Request, res: Response) => {
  const limit = req.query['limit'] || req.body?.limit || 15
  const result = await forwardToEros(`api/evaluate?limit=${encodeURIComponent(String(limit))}`, {
    method: 'POST',
    body: JSON.stringify(req.body || {}),
  }, 60000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const fallbackResult = evaluateMultipleJobsHeuristic(Number(limit) || 15)
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...fallbackResult, _source: 'fallback' })
})

/** POST /api/admin/hunter/jobs/:id/evaluate */
hunterRouter.post(['/evaluate/:id', '/jobs/:id/evaluate'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/evaluate`, { method: 'POST' }, 45000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  const evalResult = evaluateJobHeuristic(job)
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    ok: true,
    _source: 'fallback',
    job: { ...evalResult.job, _source: 'fallback' },
    match: evalResult.match,
  })
})

/** POST /api/admin/hunter/purge */
hunterRouter.post('/purge', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/purge', { method: 'POST' }, 30000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  res.status(503).json({
    ok: false,
    error: 'Eros Agent no disponible para purgar vacantes',
  })
})

/** POST /api/admin/hunter/search/semantic */
hunterRouter.post(['/search/semantic', '/semantic-search'], async (req: Request, res: Response) => {
  const result = await forwardToEros('api/jobs/semantic-search', {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 30000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const q = String(req.body?.query || '').toLowerCase()
  const matches = fallbackHunterJobs.filter(j =>
    j.title.toLowerCase().includes(q) ||
    j.company.toLowerCase().includes(q) ||
    j.tags.some(t => t.toLowerCase().includes(q))
  )
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    ok: true,
    _source: 'fallback',
    results: matches.map(j => ({
      ...j,
      _source: 'fallback',
      semantic_score: 0.85,
    })),
  })
})

/** POST /api/admin/hunter/vectorize */
hunterRouter.post('/vectorize', async (req: Request, res: Response) => {
  const result = await forwardToEros('api/vectorize', {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 45000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  res.status(503).json({
    ok: false,
    error: 'Eros Agent no disponible para vectorizar vacantes',
  })
})

/** POST /api/admin/hunter/pitch/:id */
hunterRouter.post(['/pitch/:id', '/jobs/:id/pitch'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/pitch/${encodeURIComponent(id)}`, { method: 'POST' }, 45000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...generatePitchHeuristic(job), _source: 'fallback' })
})

/** POST /api/admin/hunter/cv/:id */
hunterRouter.post(['/cv/:id', '/jobs/:id/cv'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/cv/${encodeURIComponent(id)}`, { method: 'POST' }, 45000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...generateCvHeuristic(job), _source: 'fallback' })
})

/** GET /api/admin/hunter/cv/:id/html */
hunterRouter.get(['/cv/:id/html', '/jobs/:id/cv/html'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).type('html').send('<h1>ID de vacante requerido</h1>')
    return
  }
  const ticketParam = req.query['ticket']
  const hasValidTicket = typeof ticketParam === 'string' && validateCvTicket(ticketParam, id)
  if (!hasValidTicket && !isAdminAuthorized(req)) {
    res.status(401).type('html').send('<h1>Acceso no autorizado al CV</h1><p>Se requiere sesión de administración o un ticket válido para esta vacante.</p>')
    return
  }
  const baseUrl = getErosBaseUrl()
  let html: string | null = null
  let isFallbackHtml = false

  if (baseUrl && !isCircuitOpen()) {
    try {
      const upstreamRes = await fetch(`${baseUrl}/api/cv/${encodeURIComponent(id)}/html`, {
        headers: {
          ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}`, 'X-Eros-Key': env.erosApiKey } : {}),
        },
        signal: AbortSignal.timeout(10000),
      })
      if (upstreamRes.ok) {
        html = await upstreamRes.text()
      } else {
        recordErosFailure()
      }
    } catch {
      recordErosFailure()
    }
  }

  if (!html) {
    const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
    if (job) {
      html = renderCvHtmlHeuristic(job)
      isFallbackHtml = true
    }
  }

  if (!html) {
    res.status(404).type('html').send('<h1>CV no disponible</h1><p>Vacante no encontrada en Eros ni en snapshot local.</p>')
    return
  }

  if (isFallbackHtml) {
    res.setHeader('X-Eros-Source', 'fallback')
  }

  if (req.query['auto_print'] === 'true') {
    html = html.replace('</body>', '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 350); });</script></body>')
  }
  if (req.query['download'] === 'true') {
    res.setHeader('Content-Disposition', 'attachment; filename="CV_Mateo_Sonzogni_Harvard_ATS.html"')
  }
  // Sandbox CSP: origen opaco, sin allow-same-origin para aislar de credenciales de admin
  res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: https:;")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.status(200).type('html').send(html)
})

/** GET /api/admin/hunter/cv/:id/pdf */
hunterRouter.get(['/cv/:id/pdf', '/jobs/:id/cv/pdf'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const ticketParam = req.query['ticket']
  const hasValidTicket = typeof ticketParam === 'string' && validateCvTicket(ticketParam, id)
  if (!hasValidTicket && !isAdminAuthorized(req)) {
    res.status(401).json({ error: 'Acceso no autorizado al CV PDF' })
    return
  }

  const baseUrl = getErosBaseUrl()
  if (baseUrl && !isCircuitOpen()) {
    try {
      const upstreamRes = await fetch(`${baseUrl}/api/cv/${encodeURIComponent(id)}/pdf`, {
        headers: {
          ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}`, 'X-Eros-Key': env.erosApiKey } : {}),
        },
        signal: AbortSignal.timeout(15000),
      })
      if (upstreamRes.ok) {
        const buffer = await upstreamRes.arrayBuffer()
        res.setHeader('Content-Type', 'application/pdf')
        const disposition = req.query['download'] === 'true' ? 'attachment' : 'inline'
        res.setHeader('Content-Disposition', `${disposition}; filename="CV_Mateo_Sonzogni.pdf"`)
        res.send(Buffer.from(buffer))
        return
      }
      recordErosFailure()
    } catch {
      recordErosFailure()
    }
  }

  res.status(503).json({ error: 'Generación nativa de PDF no disponible en modo offline o contingencia' })
})

/** PATCH /api/admin/hunter/jobs/:id/status */
hunterRouter.patch(['/jobs/:id/status', '/status/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (job && req.body?.status) {
    job.status = req.body.status
    res.json({ ok: true, job })
    return
  }
  res.status(result.status).json(result.data)
})

/** DELETE /api/admin/hunter/jobs - Eliminar todas las vacantes */
hunterRouter.delete('/jobs', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/jobs', { method: 'DELETE' }, 30000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  fallbackHunterJobs.length = 0
  res.json({ ok: true, deleted_count: 0 })
})

/** DELETE /api/admin/hunter/jobs/:id - Eliminar una vacante individual */
hunterRouter.delete(['/jobs/:id', '/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }, 15000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const idx = fallbackHunterJobs.findIndex(j => j.id === id || j.external_id === id)
  if (idx !== -1) {
    fallbackHunterJobs.splice(idx, 1)
  }
  res.json({ ok: true })
})

/** GET /api/admin/hunter/jobs/:id/apply-preview - Vista previa de correo de postulación */
hunterRouter.get(['/jobs/:id/apply-preview', '/apply-preview/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/apply-preview`, { method: 'GET' }, 20000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  const pitch = generatePitchHeuristic(job).data
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    ok: true,
    _source: 'fallback',
    to_email: job.contact_email || 'hr@company.com',
    subject: pitch.subject,
    body: `${pitch.elevator_pitch}\n\n${pitch.cover_letter}`,
    channel: 'email',
  })
})

/** POST /api/admin/hunter/jobs/:id/apply-email - Despacho de postulación por email / n8n */
hunterRouter.post(['/jobs/:id/apply-email', '/apply-email/:id'], async (req: Request, res: Response) => {
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
  res.status(503).json({
    ok: false,
    error: 'Eros Agent no disponible para despachar postulación',
  })
})

/** PATCH /api/admin/hunter/jobs/:id/contact-email - Actualizar correo de contacto de vacante */
hunterRouter.patch(['/jobs/:id/contact-email', '/contact-email/:id'], async (req: Request, res: Response) => {
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
  const job = fallbackHunterJobs.find(j => j.id === id || j.external_id === id)
  if (job && req.body?.contact_email !== undefined) {
    job.contact_email = req.body.contact_email
    res.json({ ok: true, job })
    return
  }
  res.status(result.status).json(result.data)
})
