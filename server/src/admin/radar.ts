import { Router, type Request, type Response } from 'express'
import { env } from '../env.js'

export const radarRouter = Router()

const getErosUrl = () => (process.env['HUNTER_API_URL'] || env.hunterApiUrl || 'https://eros.mateogs.tech').replace(/\/+$/, '')

async function forward(urlPath: string, init?: RequestInit, timeoutMs = 60000) {
  const baseUrl = getErosUrl()
  if (!baseUrl) {
    return {
      ok: false,
      status: 503,
      data: { error: 'Eros Agent no configurado: falta HUNTER_API_URL en el entorno' },
    }
  }
  const fullUrl = `${baseUrl}/${urlPath.replace(/^\//, '')}`
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}` } : {}),
      ...((init?.headers as Record<string, string>) || {}),
    }
    const res = await fetch(fullUrl, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json().catch(() => null) : await res.text()
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 502,
        data: { error: 'Fallo de autenticación con Eros Agent (verificar EROS_API_KEY en variables de entorno)' },
      }
    }
    return { ok: res.ok, status: res.status, data }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 503,
      data: { error: `Eros Agent no responde (${baseUrl}): ${msg}` },
    }
  }
}

const fallbackTrends = [
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
    post_id: null,
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
    post_id: null,
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
    post_id: null,
  },
]

function getParamId(req: Request): string {
  const val = req.params['id']
  if (Array.isArray(val)) return val[0] || ''
  return typeof val === 'string' ? val : ''
}

/** GET /api/admin/radar/trends - Lista de tendencias detectadas */
radarRouter.get('/trends', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forward(`api/radar/trends${query ? `?${query}` : ''}`)
  if (result.ok && Array.isArray(result.data)) {
    return res.status(result.status).json(result.data)
  }
  // Fallback si Eros está desconectado o en inicialización
  res.json(fallbackTrends)
})

/** POST /api/admin/radar/scan - Dispara un escaneo de fuentes tecnológicas */
radarRouter.post('/scan', async (req: Request, res: Response) => {
  const limit = req.query['limit'] ? String(req.query['limit']) : '15'
  const result = await forward(`api/radar/scan?limit=${limit}`, { method: 'POST' })
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  res.json({
    total_found: fallbackTrends.length,
    new_trends: fallbackTrends.length,
    trends: fallbackTrends,
  })
})

/** GET /api/admin/radar/trends/:id - Detalle de una tendencia */
radarRouter.get('/trends/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = await forward(`api/radar/trends/${encodeURIComponent(id)}`)
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  const found = fallbackTrends.find(t => t.id === id)
  if (found) return res.json(found)
  res.status(404).json({ error: 'Tendencia no encontrada' })
})

/** PATCH /api/admin/radar/trends/:id/status - Actualiza estado de tendencia */
radarRouter.patch('/trends/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = await forward(`api/radar/trends/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  if (result.ok) {
    return res.status(result.status).json(result.data)
  }
  res.json({ ok: true, id, status: req.body?.status || 'DISCARDED' })
})

/** POST /api/admin/radar/trends/:id/generate - Genera post omnicanal a partir de una tendencia */
radarRouter.post('/trends/:id/generate', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const result = await forward(`api/radar/trends/${encodeURIComponent(id)}/generate`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  })
  res.status(result.status).json(result.data)
})
