import { Router, type Request, type Response } from 'express'
import { env } from '../env.js'
import { createCvTicket } from './auth.js'

export const hunterRouter = Router()

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// URL del agente Eros en deploy (requiere variable de entorno HUNTER_API_URL)
const getHunterUrl = () => (process.env['HUNTER_API_URL'] || env.hunterApiUrl || 'https://eros.mateogs.tech').replace(/\/+$/, '')

async function forward(urlPath: string, init?: RequestInit, timeoutMs = 60000) {
  const baseUrl = getHunterUrl()
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
  const result = await forward('api/stats')
  res.status(result.status).json(result.data)
})

/** GET /api/admin/hunter/jobs */
hunterRouter.get('/jobs', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forward(`api/jobs${query ? `?${query}` : ''}`)
  if (!result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  // Desempaquetar array si Eros devuelve { data: [...], count: N }
  const payload = result.data
  const jobsList = Array.isArray(payload) ? payload : (payload && Array.isArray((payload as Record<string, unknown>)['data']) ? (payload as Record<string, unknown>)['data'] : payload)
  res.status(result.status).json(jobsList)
})

/** POST /api/admin/hunter/scan */
hunterRouter.post('/scan', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forward(`api/scan${query ? `?${query}` : ''}`, {
    method: 'POST',
    body: req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : undefined,
  }, 75000) // 75s para escaneo completo y evaluación de IA
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/evaluate */
hunterRouter.post('/evaluate', async (req: Request, res: Response) => {
  const result = await forward('api/evaluate', {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 60000)
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/purge */
hunterRouter.post('/purge', async (_req: Request, res: Response) => {
  const result = await forward('api/purge', { method: 'POST' }, 30000)
  res.status(result.status).json(result.data)
})

function getParamId(req: Request): string {
  const val = req.params['id']
  if (Array.isArray(val)) return val[0] || ''
  return typeof val === 'string' ? val : ''
}

/** POST /api/admin/hunter/pitch/:id */
hunterRouter.post(['/pitch/:id', '/jobs/:id/pitch'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forward(`api/pitch/${encodeURIComponent(id)}`, { method: 'POST' }, 45000)
  res.status(result.status).json(result.data)
})

/** POST /api/admin/hunter/cv/:id */
hunterRouter.post(['/cv/:id', '/jobs/:id/cv'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forward(`api/cv/${encodeURIComponent(id)}`, { method: 'POST' }, 45000)
  res.status(result.status).json(result.data)
})

/** GET /api/admin/hunter/cv/:id/html */
hunterRouter.get(['/cv/:id/html', '/jobs/:id/cv/html'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).type('html').send('<h1>ID de vacante requerido</h1>')
    return
  }
  const verifiedTicketId = (req as unknown as { verifiedTicketId?: string }).verifiedTicketId
  if (verifiedTicketId !== undefined && verifiedTicketId !== id) {
    res.status(403).type('html').send('<h1>Ticket no válido para esta vacante</h1>')
    return
  }
  const baseUrl = getHunterUrl()
  if (!baseUrl) {
    res.status(503).type('html').send('<h1>Eros Agent no configurado</h1><p>Falta HUNTER_API_URL en el entorno</p>')
    return
  }
  try {
    const upstreamRes = await fetch(`${baseUrl}/api/cv/${encodeURIComponent(id)}/html`, {
      headers: {
        ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}` } : {}),
      },
      signal: AbortSignal.timeout(45000),
    })
    let html = await upstreamRes.text()
    if (req.query['auto_print'] === 'true') {
      html = html.replace('</body>', '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 350); });</script></body>')
    }
    if (req.query['download'] === 'true') {
      res.setHeader('Content-Disposition', 'attachment; filename="CV_Mateo_Sonzogni_Harvard_ATS.html"')
    }
    // Sandbox CSP: origen opaco, sin allow-same-origin para aislar de credenciales de admin
    res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-modals; default-src 'none'; style-src 'unsafe-inline'; img-src data: https:;")
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.status(upstreamRes.status).type('html').send(html)
  } catch (err: unknown) {
    const msg = escapeHtml(err instanceof Error ? err.message : String(err))
    res.status(503).type('html').send(`<h1>Error cargando CV de Eros</h1><p>${msg}</p>`)
  }
})

/** PATCH /api/admin/hunter/jobs/:id/status */
hunterRouter.patch(['/jobs/:id/status', '/status/:id'], async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const result = await forward(`api/jobs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  res.status(result.status).json(result.data)
})
