import { Router, type Request, type Response } from 'express'
import { forwardToEros, getParamId } from './proxy.js'
import { generateContentPostHeuristic } from './fallbackContentData.js'

export const radarRouter = Router()

export const fallbackTrends = [
  {
    id: 'trend_pgvector_hn',
    title: 'PostgreSQL 17 as a Universal Vector and Relational Database in Production',
    url: 'https://news.ycombinator.com/item?id=41829011',
    source: 'HACKER_NEWS',
    summary: 'Debate de ingeniería sobre la consolidación de pgvector frente a Pinecone y Milvus para reducir la sobrecarga de sincronización de datos relacionales.',
    relevance_score: 96,
    engineering_angle: 'Persistencia relacional y vectores densos en PostgreSQL 17: análisis de trade-offs frente a bases vectoriales aisladas y control de latencia en un solo nodo.',
    tags: ['postgresql', 'pgvector', 'database', 'rag', 'architecture'],
    detected_at: new Date().toISOString(),
    status: 'DISCOVERED',
    post_id: null as string | null,
  },
  {
    id: 'trend_fastapi_agents_devto',
    title: 'Building Production-Ready AI Agents with FastAPI, Streaming and Deterministic Pipelines',
    url: 'https://dev.to/engineering/fastapi-production-agents',
    source: 'DEVTO',
    summary: 'Patrones de arquitectura para agentes satélites desacoplados utilizando SSE (Server-Sent Events) y contratos estrictos con Pydantic.',
    relevance_score: 92,
    engineering_angle: 'Arquitectura de agentes autónomos satélites con FastAPI y streaming: determinismo en extracción estructurada y mitigación de fallos en producción.',
    tags: ['fastapi', 'python', 'agents', 'architecture', 'api'],
    detected_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'DISCOVERED',
    post_id: null as string | null,
  },
  {
    id: 'trend_nuxt4_perf_gh',
    title: 'Nuxt 4 Nitro Engine Benchmarks: Sub-100ms Latency on Low-Cost Hardware',
    url: 'https://github.com/nuxt/nuxt/discussions/2026',
    source: 'GITHUB',
    summary: 'Discusión y benchmarks de rendimiento en renderizado híbrido y bundle footprint mínimo para aplicaciones de ingeniería con Lighthouse 98+.',
    relevance_score: 88,
    engineering_angle: 'Frontend de alta precisión y densidad de datos: optimización de Core Web Vitals (Lighthouse 98+), renderizado híbrido y ergonomía sin bloating ornamental.',
    tags: ['nuxt', 'vue', 'performance', 'typescript', 'frontend'],
    detected_at: new Date(Date.now() - 7200000).toISOString(),
    status: 'DISCOVERED',
    post_id: null as string | null,
  },
]

/** GET /api/admin/radar/trends - Lista de tendencias detectadas */
radarRouter.get('/trends', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forwardToEros(`api/radar/trends${query ? `?${query}` : ''}`)
  if (result.ok && Array.isArray(result.data)) {
    return res.status(result.status).json(result.data)
  }
  // Fallback si Eros está desconectado o en inicialización
  res.setHeader('X-Eros-Source', 'fallback')
  res.json(fallbackTrends.map(t => ({ ...t, _source: 'fallback' })))
})

/** POST /api/admin/radar/scan - Dispara un escaneo de fuentes tecnológicas */
radarRouter.post('/scan', async (req: Request, res: Response) => {
  const rawLimit = Number.parseInt(String(req.query['limit'] ?? '15'), 10)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 15
  const result = await forwardToEros(`api/radar/scan?limit=${encodeURIComponent(String(limit))}`, { method: 'POST' })
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({
    _source: 'fallback',
    total_found: fallbackTrends.length,
    new_trends: fallbackTrends.length,
    trends: fallbackTrends.map(t => ({ ...t, _source: 'fallback' })),
  })
})

/** GET /api/admin/radar/trends/:id - Detalle de una tendencia */
radarRouter.get('/trends/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = await forwardToEros(`api/radar/trends/${encodeURIComponent(id)}`)
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  const found = fallbackTrends.find(t => t.id === id)
  if (found) {
    res.setHeader('X-Eros-Source', 'fallback')
    return res.json({ ...found, _source: 'fallback' })
  }
  res.status(404).json({ error: 'Tendencia no encontrada' })
})

/** PATCH /api/admin/radar/trends/:id/status - Actualiza estado de tendencia */
radarRouter.patch('/trends/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de tendencia requerido' })
    return
  }
  const result = await forwardToEros(`api/radar/trends/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  const trend = fallbackTrends.find(t => t.id === id)
  if (trend && req.body?.status) {
    trend.status = req.body.status
    return res.json({ ok: true, id, status: req.body.status })
  }
  res.status(result.status).json(result.data)
})

/** POST /api/admin/radar/trends/:id/generate - Genera post omnicanal a partir de una tendencia */
radarRouter.post('/trends/:id/generate', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de tendencia requerido' })
    return
  }
  const result = await forwardToEros(`api/radar/trends/${encodeURIComponent(id)}/generate`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  })
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }

  // Fallback heurístico
  const trend = fallbackTrends.find(t => t.id === id)
  if (!trend) {
    res.status(404).json({ error: 'Tendencia no encontrada' })
    return
  }
  const angle = req.body?.custom_angle || trend.engineering_angle
  const post = generateContentPostHeuristic({
    topic: trend.title,
    pillar: req.body?.pillar || 'TECHNICAL_BREAKDOWN',
    project_slug: req.body?.project_slug,
    custom_angle: angle,
    key_points: [
      `Referencia original: ${trend.url}`,
      `Síntesis: ${trend.summary}`,
      `Ángulo de ingeniería: ${angle}`,
    ],
  })
  trend.status = 'GENERATED'
  trend.post_id = post.id

  res.json({
    ok: true,
    trend_id: id,
    post,
  })
})
