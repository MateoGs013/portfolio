import { Router, type Request, type Response } from 'express'
import { forwardToEros, getParamId } from './proxy.js'
import { fallbackHunterJobs, findJob } from './fallbackHunterData.js'
import { computeHunterStats, evaluateJobHeuristic, evaluateMultipleJobsHeuristic, evaluateSampleOnce, generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { hunterApplyRouter } from './hunterApply.js'
import { hunterCvRouter } from './hunterCvRoutes.js'
import { loadProfile } from './profile.js'

/**
 * /api/admin/hunter/*: proxy a Eros con respaldo local cuando el agente no responde. El CV
 * (hunterCvRoutes.ts) y la postulación (hunterApply.ts) tienen su propio módulo.
 */
export const hunterRouter = Router()

hunterRouter.use(hunterCvRouter, hunterApplyRouter)

/** GET /api/admin/hunter/stats */
hunterRouter.get('/stats', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/stats')
  if (result.ok) {
    res.status(result.status).json(result.data)
  } else {
    await evaluateSampleOnce(() => loadProfile('es'))
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

  // Fallback si Eros está desconectado o no autorizado: la cola de ejemplo evaluada contra la base
  await evaluateSampleOnce(() => loadProfile('es'))
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
  const fallbackResult = evaluateMultipleJobsHeuristic(Number(limit) || 15, await loadProfile('es'))
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
  const job = findJob(id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  const evalResult = evaluateJobHeuristic(job, await loadProfile('es'))
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
  const job = findJob(id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...generatePitchHeuristic(job, await loadProfile(jobLang(job))), _source: 'fallback' })
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
  const job = findJob(id)
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

