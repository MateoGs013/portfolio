import { Router, type Request, type Response } from 'express'
import { env } from '../env.js'
import { createCvTicket, isAdminAuthorized, validateCvTicket } from './auth.js'
import { findJob, jobFromQuery } from './fallbackHunterData.js'
import { generateCvHeuristic } from './hunterCv.js'
import { renderCvHtmlHeuristic } from './hunterCvHtml.js'
import { cvFileName, loadSignature } from './profile.js'
import { forwardToEros, getErosBaseUrl, getParamId, isCircuitOpen, recordErosFailure } from './proxy.js'

/** CV Harvard ATS adaptado: tickets, datos, hoja HTML y PDF (Eros primero, respaldo desde la base). */
export const hunterCvRouter = Router()

/** POST /api/admin/hunter/cv/:id/ticket - Ticket de un solo uso para abrir CV HTML */
hunterCvRouter.post(['/cv/:id/ticket', '/jobs/:id/cv/ticket'], (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de vacante requerido' })
    return
  }
  const ticket = createCvTicket(id)
  res.json({ ticket })
})

/** POST /api/admin/hunter/cv/:id */
hunterCvRouter.post(['/cv/:id', '/jobs/:id/cv'], async (req: Request, res: Response) => {
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
  const job = findJob(id)
  if (!job) {
    res.status(404).json({ error: 'Vacante no encontrada' })
    return
  }
  res.setHeader('X-Eros-Source', 'fallback')
  res.json({ ...(await generateCvHeuristic(job)), _source: 'fallback' })
})

/** GET /api/admin/hunter/cv/:id/html */
hunterCvRouter.get(['/cv/:id/html', '/jobs/:id/cv/html'], async (req: Request, res: Response) => {
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
    const job = jobFromQuery(id, req.query)
    html = renderCvHtmlHeuristic((await generateCvHeuristic(job)).data, job)
    isFallbackHtml = true
  }

  if (isFallbackHtml) {
    res.setHeader('X-Eros-Source', 'fallback')
  }

  if (req.query['auto_print'] === 'true') {
    html = html.replace('</body>', '<script>window.addEventListener("load", () => { setTimeout(() => window.print(), 350); });</script></body>')
  }
  if (req.query['download'] === 'true') {
    const { name } = await loadSignature()
    res.setHeader('Content-Disposition', `attachment; filename="${cvFileName(name, 'Harvard_ATS')}.html"`)
  }
  // Sandbox CSP: origen opaco, sin allow-same-origin para aislar de credenciales de admin
  res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: https:;")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.status(200).type('html').send(html)
})

/** GET /api/admin/hunter/cv/:id/pdf */
hunterCvRouter.get(['/cv/:id/pdf', '/jobs/:id/cv/pdf'], async (req: Request, res: Response) => {
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
        const { name } = await loadSignature()
        res.setHeader('Content-Disposition', `${disposition}; filename="${cvFileName(name)}.pdf"`)
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
