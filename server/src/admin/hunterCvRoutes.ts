import { Router, type Request, type Response } from 'express'
import type { HunterSource, TailoredCv } from '../shared/hunterContracts.js'
import { createCvTicket, isAdminAuthorized, validateCvTicket } from './auth.js'
import { isManualJob, jobFromBody, missingJob } from './erosContract.js'
import { extractHints, normalizeErosCv } from './erosHints.js'
import { findDemoJob, inputOf } from './fallbackHunterData.js'
import { jobHints, tailorCv, type CvHints } from './hunterCv.js'
import { recallCv, rememberCv, cvExpired } from './hunterCvCache.js'
import { renderCvHtml, sheetHeaders, sheetTarget } from './hunterCvHtml.js'
import { renderCvText } from './hunterCvText.js'
import { jobLang } from './hunterMatch.js'
import { cvFileName, loadCv } from './profile.js'
import { forwardToEros, getParamId } from './proxy.js'

/**
 * CV Harvard ATS de una vacante: se compone siempre desde la base (GET /api/cv) y de Eros solo se
 * toman pistas de orden (erosHints.ts). El resultado queda en la caché (hunterCvCache.ts) y de ahí
 * salen la hoja, la impresión y el texto plano: una sola fuente. El PDF que armaba Eros no existe más.
 */
export const hunterCvRouter = Router()

/** Respuesta de error para una hoja: una página legible si la abrió el navegador, JSON si fue un pedido. */
export function refuse(req: Request, res: Response, status: number, body: { error: string, code: string }): void {
  if (req.accepts(['json', 'html']) === 'html') {
    res.status(status).type('html').send(`<!DOCTYPE html><html lang="es"><meta charset="utf-8"><title>CV</title><p>${body.error}</p></html>`)
    return
  }
  res.status(status).json({ ...body, errors: [] })
}

const unauthorized = { error: 'Esta hoja necesita la sesión del admin o un ticket vigente para esta vacante.', code: 'unauthorized' }

/** Las pistas de Eros para esta vacante, o null si no hay (vacante manual, Eros caído o sin CV usable). */
async function erosHintsFor(id: string, job: unknown, base: Awaited<ReturnType<typeof loadCv>>): Promise<CvHints | null> {
  if (isManualJob(id)) return null
  const result = await forwardToEros(`api/cv/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ job }) }, 45000)
  if (!result.ok) return null
  const eros = normalizeErosCv(result.data)
  return eros ? extractHints(eros, base) : null
}

/** POST /api/admin/hunter/cv/:id/ticket - Ticket firmado para abrir la hoja o el texto: 1 hora, solo esa vacante. */
hunterCvRouter.post('/cv/:id/ticket', (req: Request, res: Response) => {
  const id = getParamId(req)
  res.json({ ticket: createCvTicket(id) })
})

/** La caché tiene pistas de Eros para esta misma vacante (mismo título y descripción). */
function cachedHints(id: string, job: { title: string, description: string | null }): CvHints | null {
  const entry = recallCv(id)
  if (!entry?.hints) return null
  return entry.job.title === job.title && entry.job.description === job.description ? entry.hints : null
}

/**
 * POST /api/admin/hunter/cv/:id { job, useSummaryProposal?, regenerate? } → TailoredCv. Sin `job` en
 * el cuerpo solo sirve una vacante de la muestra (EROS_DEMO). Con `useSummaryProposal` el resumen es
 * el que propuso Eros, si `_adaptation.proposal` es 'ok'. Si la caché ya tiene pistas de Eros para la
 * misma vacante no se le vuelve a preguntar (aceptar y deshacer la propuesta cuestan lo mismo);
 * `regenerate: true` le pregunta de nuevo.
 */
hunterCvRouter.post('/cv/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  const demo = findDemoJob(id)
  const job = jobFromBody(req.body) ?? (demo ? inputOf(demo) : null)
  if (!job) {
    res.status(400).json(missingJob)
    return
  }

  const base = await loadCv(jobLang(job))
  const useProposal = req.body?.useSummaryProposal === true
  const cached = req.body?.regenerate === true ? null : cachedHints(id, job)
  const eros = cached ?? await erosHintsFor(id, job, base)
  const fromJob = jobHints(base, job)
  // Si Eros no ordenó el stack, el orden lo da la vacante.
  const hints: CvHints = eros
    ? { ...eros, categories: eros.categories.length ? eros.categories : fromJob.categories, techs: eros.techs.length ? eros.techs : fromJob.techs }
    : fromJob

  const { cv, adaptation, usesProposal } = tailorCv(base, job, hints, useProposal)
  rememberCv(id, { cv, job, hints: eros })

  const source: HunterSource = eros ? 'eros' : 'fallback'
  const body: TailoredCv = { data: cv, summaryProposal: eros?.summaryProposal ?? null, usesSummaryProposal: usesProposal, _adaptation: adaptation, _source: source }
  if (source === 'fallback') res.setHeader('X-Eros-Source', 'fallback')
  res.json(body)
})

function allowed(req: Request, id: string): boolean {
  return validateCvTicket(req.query['ticket'], id) || isAdminAuthorized(req)
}

/**
 * GET /api/admin/hunter/cv/:id/html[?ticket=&auto_print=true&download=true&measure=1] - La hoja A4
 * del CV en caché. Con measure=1 se mide como /cv-base/html y avisa con postMessage(CvMeasure).
 */
hunterCvRouter.get('/cv/:id/html', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!allowed(req, id)) return refuse(req, res, 401, unauthorized)
  const entry = recallCv(id)
  if (!entry) return refuse(req, res, 409, cvExpired)

  res.set(sheetHeaders)
  if (req.query['download'] === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="${cvFileName(entry.cv.name, 'Harvard_ATS')}.html"`)
  }
  res.type('html').send(renderCvHtml(entry.cv, {
    target: sheetTarget(entry.job),
    autoPrint: req.query['auto_print'] === 'true',
    measure: req.query['measure'] === '1',
  }))
})

/** GET /api/admin/hunter/cv/:id/txt[?ticket=] - El mismo CV en texto plano para un formulario ATS. */
hunterCvRouter.get('/cv/:id/txt', (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!allowed(req, id)) return refuse(req, res, 401, unauthorized)
  const entry = recallCv(id)
  if (!entry) return refuse(req, res, 409, cvExpired)
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
  res.type('text/plain; charset=utf-8').send(renderCvText(entry.cv))
})
