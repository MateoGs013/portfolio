import { Router, type Request, type Response } from 'express'
import { env } from '../env.js'

export const hunterRouter = Router()

const HUNTER_URL = process.env['HUNTER_API_URL'] ?? 'http://localhost:8000'

async function forward(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(45000), // timeout de 45s para LLM
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, data }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 503,
      data: { error: `Eros Agent no responde (${HUNTER_URL}): ${msg}` },
    }
  }
}

/** GET /api/admin/hunter/stats */
hunterRouter.get('/stats', async (_req: Request, res: Response) => {
  const result = await forward(`${HUNTER_URL}/api/stats`)
  res.status(result.status).json(result.data)
})

/** GET /api/admin/hunter/jobs */
hunterRouter.get('/jobs', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forward(`${HUNTER_URL}/api/jobs${query ? `?${query}` : ''}`)
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/scan */
hunterRouter.post('/scan', async (_req: Request, res: Response) => {
  const result = await forward(`${HUNTER_URL}/api/scan`, { method: 'POST' })
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/evaluate */
hunterRouter.post('/evaluate', async (req: Request, res: Response) => {
  const result = await forward(`${HUNTER_URL}/api/evaluate`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  })
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/pitch/:id */
hunterRouter.post('/pitch/:id', async (req: Request, res: Response) => {
  const result = await forward(`${HUNTER_URL}/api/pitch/${req.params['id']}`, { method: 'POST' })
  res.status(result.status).json(result.data)
})

/** PATCH /api/admin/hunter/jobs/:id/status */
hunterRouter.patch('/jobs/:id/status', async (req: Request, res: Response) => {
  const result = await forward(`${HUNTER_URL}/api/jobs/${req.params['id']}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  res.status(result.status).json(result.data)
})
