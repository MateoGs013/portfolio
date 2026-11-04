/**
 * /api/admin/radar/*: las tendencias que detecta el radar de Eros (notas de terceros), con el
 * contrato de erosRadarContract.ts. Sin Eros, la lista responde 503 { offline: true } y buscar o
 * cambiar el estado fallan diciendo qué no pasó. Con EROS_DEMO=1 la lista sale de la muestra, sin
 * dirección, fecha ni afinidad, y nunca se modifica. Una tendencia se vuelve artículo con
 * POST /articles/generate { trendId } (articleRuns.ts).
 */
import { Router, type Request, type Response } from 'express'
import { isTrendStatus, trendStatusLabels, type TrendChange } from '../shared/radarContracts.js'
import { invalid, normalizeOneTrend, normalizeTrends, normalizeTrendScan, sendRadarFailure, sendUnreadable } from './erosRadarContract.js'
import { demoTrends, erosDemo, findDemoTrend, isDemoId, refuseDemo, sendDemo } from './fallbackRadarData.js'
import { erosIdParam, forwardToEros, getParamId } from './proxy.js'

export const radarRouter = Router()

/** Un id que no es de Eros (`%2F`, `..`) responde 400 y nunca se reenvía. */
radarRouter.param('id', erosIdParam)

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body ?? {}) })
const trendPath = (id: string, rest = '') => `api/radar/trends/${encodeURIComponent(id)}${rest}`

const statusHint = `Elegí un estado: ${Object.values(trendStatusLabels).map(l => l.toLowerCase()).join(', ')}.`

/** GET /api/admin/radar/trends[?status=&min_score=] → Trend[]. */
radarRouter.get('/trends', async (req: Request, res: Response) => {
  const status = isTrendStatus(req.query['status']) ? req.query['status'] : null
  const minScore = Number(req.query['min_score'])
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (Number.isFinite(minScore) && minScore > 0) query.set('min_score', String(minScore))
  const result = await forwardToEros(`api/radar/trends${query.size ? `?${query}` : ''}`)
  if (result.ok) {
    res.json(normalizeTrends(result.data).filter(t => !status || t.status === status))
    return
  }
  // La muestra no tiene afinidad: con un mínimo pedido no hay ninguna que lo cumpla.
  if (erosDemo()) sendDemo(res, query.has('min_score') ? [] : demoTrends().filter(t => !status || t.status === status))
  else sendRadarFailure(res, result)
})

/** POST /api/admin/radar/scan[?limit=] → TrendScan (solo Eros). */
radarRouter.post('/scan', async (req: Request, res: Response) => {
  const rawLimit = Number.parseInt(String(req.query['limit'] ?? '15'), 10)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 15
  const result = await forwardToEros(`api/radar/scan?limit=${limit}`, { method: 'POST' }, 60000)
  if (result.ok) res.json(normalizeTrendScan(result.data))
  else sendRadarFailure(res, result, 'No se buscaron tendencias nuevas.')
})

/** GET /api/admin/radar/trends/:id → Trend. */
radarRouter.get('/trends/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (isDemoId(id)) {
    const trend = erosDemo() ? findDemoTrend(id) : null
    if (trend) sendDemo(res, trend)
    else res.status(404).json({ error: 'Esa tendencia de muestra no existe.', code: 'not_found', errors: [] })
    return
  }
  const result = await forwardToEros(trendPath(id))
  const trend = result.ok ? normalizeOneTrend(result.data) : null
  if (trend) res.json(trend)
  else if (result.ok) sendUnreadable(res, 'Recargá la lista.')
  else sendRadarFailure(res, result)
})

/** PATCH /api/admin/radar/trends/:id/status { status } → TrendChange (solo Eros). */
radarRouter.patch('/trends/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const status: unknown = req.body?.status
  if (!isTrendStatus(status)) {
    res.status(400).json(invalid('status', statusHint, 'Ese estado no existe.'))
    return
  }
  if (refuseDemo(res, id)) return
  const result = await forwardToEros(trendPath(id, '/status'), json('PATCH', { status }))
  if (result.ok) res.json({ ok: true, trend: normalizeOneTrend(result.data) } satisfies TrendChange)
  else sendRadarFailure(res, result, 'El estado no cambió.')
})
