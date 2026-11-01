import { Router, type Request, type Response } from 'express'
import { isHunterJobStatus, type HunterJob, type JobInput } from '../shared/hunterContracts.js'
import {
  isManualJob,
  jobFromBody,
  manualJobRefusal,
  missingJob,
  normalizeBatchEvaluation,
  normalizeEvaluation,
  normalizeJobChange,
  normalizeJobs,
  normalizePitch,
  normalizePurge,
  normalizeScan,
  normalizeSemantic,
  normalizeStats,
  normalizeVectorize,
} from './erosContract.js'
import { demoJobs, erosDemo, findDemoJob, jobFromInput } from './fallbackHunterData.js'
import { hunterApplyRouter } from './hunterApply.js'
import { hunterCvBaseRouter } from './hunterCvBase.js'
import { hunterCvRouter } from './hunterCvRoutes.js'
import { computeHunterStats, evaluateJobHeuristic, generatePitchHeuristic } from './hunterHeuristics.js'
import { jobLang } from './hunterMatch.js'
import { loadProfile } from './profile.js'
import { forwardToEros, getParamId, sendErosFailure, useLocalFallback } from './proxy.js'

/**
 * /api/admin/hunter/*: Eros con su contrato normalizado (erosContract.ts). Sin Eros, las lecturas
 * responden 503 { offline: true } y las escrituras fallan diciendo qué no pasó; solo analizar, el
 * mensaje y el CV tienen respaldo desde la base, con la vacante en el cuerpo. Las vacantes manual-*
 * nunca van a Eros. Con EROS_DEMO=1 la cola y sus números salen de la muestra ficticia.
 */
export const hunterRouter = Router()

hunterRouter.use(hunterCvBaseRouter, hunterCvRouter, hunterApplyRouter)

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body ?? {}) })

/** La muestra evaluada contra la base (copias nuevas: nada se guarda en memoria). */
async function demoQueue(): Promise<HunterJob[]> {
  const profile = await loadProfile('es')
  return demoJobs().map(job => evaluateJobHeuristic(job, profile).job)
}

function sendDemo(res: Response, body: unknown): void {
  res.setHeader('X-Eros-Source', 'demo')
  res.json(body)
}

/** La vacante para el respaldo: la de la muestra o la del cuerpo. */
function localJob(id: string, input: JobInput | null): HunterJob | null {
  return findDemoJob(id) ?? (input ? jobFromInput(id, input) : null)
}

/** GET /api/admin/hunter/stats */
hunterRouter.get('/stats', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/stats')
  if (result.ok) res.json(normalizeStats(result.data))
  else if (erosDemo()) sendDemo(res, { ...computeHunterStats(await demoQueue()), _source: 'demo', demo: true })
  else sendErosFailure(res, result)
})

/** GET /api/admin/hunter/jobs[?status=&min_score=] */
hunterRouter.get('/jobs', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forwardToEros(`api/jobs${query ? `?${query}` : ''}`)
  if (result.ok) {
    res.json(normalizeJobs(result.data))
    return
  }
  if (!erosDemo()) {
    sendErosFailure(res, result)
    return
  }
  const status = typeof req.query['status'] === 'string' ? req.query['status'] : 'all'
  const minScore = Number(req.query['min_score'])
  const jobs = (await demoQueue())
    .filter(j => status === 'all' || j.status === status)
    .filter(j => !Number.isFinite(minScore) || (j.match_score ?? 0) >= minScore)
  sendDemo(res, jobs)
})

/**
 * POST /api/admin/hunter/scan → ScanResult. Al terminar el escaneo vectoriza las vacantes nuevas
 * (para la búsqueda por afinidad) con lo que queda de tiempo: todo cabe en 80 s, debajo de los 90 s
 * que espera el admin.
 */
hunterRouter.post('/scan', async (req: Request, res: Response) => {
  const started = Date.now()
  const params = new URLSearchParams(req.query as Record<string, string>)
  if (!params.has('evaluate')) params.set('evaluate', 'false')
  const result = await forwardToEros(`api/scan?${params.toString()}`, post(req.body), 60000)
  if (!result.ok) {
    sendErosFailure(res, result, 'No se buscaron vacantes nuevas.')
    return
  }
  const budget = 80000 - (Date.now() - started)
  const vectorize = budget >= 5000 ? await forwardToEros('api/vectorize', post({}), Math.min(25000, budget)) : null
  res.json(normalizeScan(result.data, vectorize?.ok ? normalizeVectorize(vectorize.data).vectorized_count : null))
})

/** POST /api/admin/hunter/evaluate[?limit=] - Evaluar en lote las pendientes (solo Eros). */
hunterRouter.post('/evaluate', async (req: Request, res: Response) => {
  const limit = Number(req.query['limit'] ?? req.body?.limit) || 15
  const result = await forwardToEros(`api/evaluate?limit=${limit}`, post({ limit }), 60000)
  if (result.ok) res.json(normalizeBatchEvaluation(result.data))
  else sendErosFailure(res, result, 'No se evaluaron las vacantes pendientes.')
})

/** POST /api/admin/hunter/jobs/:id/evaluate { job } - Analizar una vacante, con respaldo desde la base. */
hunterRouter.post('/jobs/:id/evaluate', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const input = jobFromBody(req.body)
  const result = isManualJob(id) ? null : await forwardToEros(`api/jobs/${encodeURIComponent(id)}/evaluate`, post(input ? { job: input } : {}), 45000)
  const evaluation = result?.ok ? normalizeEvaluation(result.data) : null
  if (evaluation) {
    res.json(evaluation)
    return
  }
  if (result && !useLocalFallback(result)) {
    sendErosFailure(res, result)
    return
  }
  const job = localJob(id, input)
  if (!job) {
    res.status(400).json(missingJob)
    return
  }
  const { job: evaluated, match } = evaluateJobHeuristic(job, await loadProfile('es'))
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ok: true, job: { ...evaluated, _source: job.demo ? 'demo' : 'fallback' }, match, _source: 'fallback' })
})

/** POST /api/admin/hunter/jobs/:id/pitch { job } → { data: Pitch }, en el idioma de la vacante. */
hunterRouter.post('/jobs/:id/pitch', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const input = jobFromBody(req.body)
  const job = localJob(id, input)
  if (!job) {
    res.status(400).json(missingJob)
    return
  }
  const lang = jobLang(job)
  const result = isManualJob(id) ? null : await forwardToEros(`api/pitch/${encodeURIComponent(id)}`, post({ job: input, lang }), 45000)
  const pitch = result?.ok ? normalizePitch(result.data, lang) : null
  if (pitch) {
    res.json({ data: pitch, _source: 'eros' })
    return
  }
  if (result && !useLocalFallback(result)) {
    sendErosFailure(res, result)
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ data: generatePitchHeuristic(job, await loadProfile(lang)), _source: 'fallback' })
})

const statusIssue = {
  error: 'Ese estado no existe.',
  code: 'invalid',
  errors: [{ path: 'status', message: 'Elegí un estado: nueva, evaluada, guardada, postulada o descartada.' }],
}

/** PATCH /api/admin/hunter/jobs/:id/status { status } */
hunterRouter.patch('/jobs/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const status: unknown = req.body?.status
  if (!isHunterJobStatus(status) || isManualJob(id)) {
    res.status(400).json(isManualJob(id) ? manualJobRefusal : statusIssue)
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  if (result.ok) res.json(normalizeJobChange(result.data))
  else sendErosFailure(res, result, 'El estado no cambió.')
})

/** DELETE /api/admin/hunter/jobs/:id - Eliminar una vacante. Borrar la cola entera ya no existe. */
hunterRouter.delete('/jobs/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (isManualJob(id)) {
    res.status(400).json(manualJobRefusal)
    return
  }
  const result = await forwardToEros(`api/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }, 15000)
  if (result.ok) res.json({ ok: true })
  else sendErosFailure(res, result, 'La vacante no se borró.')
})

/** POST /api/admin/hunter/purge - Limpiar la cola de descartadas e incompatibles (solo Eros). */
hunterRouter.post('/purge', async (_req: Request, res: Response) => {
  const result = await forwardToEros('api/purge', { method: 'POST' }, 30000)
  if (result.ok) res.json(normalizePurge(result.data))
  else sendErosFailure(res, result, 'La cola no se limpió.')
})

/** POST /api/admin/hunter/search/semantic { query, limit? } - Búsqueda por afinidad (solo Eros). */
hunterRouter.post('/search/semantic', async (req: Request, res: Response) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : ''
  if (!query) {
    res.status(400).json({ error: 'Escribí qué buscar.', code: 'invalid', errors: [{ path: 'query', message: 'Escribí qué buscar.' }] })
    return
  }
  const result = await forwardToEros('api/jobs/semantic-search', post({ query, limit: Number(req.body?.limit) || 30 }), 30000)
  if (result.ok) res.json(normalizeSemantic(result.data))
  else sendErosFailure(res, result, 'La búsqueda por afinidad necesita a Eros.')
})

/** POST /api/admin/hunter/vectorize - Indexar las vacantes para la búsqueda por afinidad (solo Eros). */
hunterRouter.post('/vectorize', async (req: Request, res: Response) => {
  const result = await forwardToEros('api/vectorize', post({ limit: Number(req.body?.limit) || 100 }), 45000)
  if (result.ok) res.json(normalizeVectorize(result.data))
  else sendErosFailure(res, result, 'Las vacantes no se indexaron.')
})
