import { Router, type Request, type Response } from 'express'
import { parseLang } from '../content/lang.js'
import { createTicket, isAdminAuthorized, validateTicket } from './auth.js'
import { baseCv } from './hunterCv.js'
import { refuse } from './hunterCvRoutes.js'
import { renderCvHtml, sheetHeaders } from './hunterCvHtml.js'
import { loadCv } from './profile.js'

/**
 * El CV base, sin adaptar a ninguna vacante: la hoja que muestra Trayectoria para ver cómo queda el
 * CV del sitio. Tiene prefijo propio (/cv-base) para no chocar con /cv/:id de una vacante con id
 * «base», y su ticket tiene otro alcance: el de una vacante no abre esta hoja.
 */
export const hunterCvBaseRouter = Router()

const BASE = 'base'

/** POST /api/admin/hunter/cv-base/ticket → { ticket }: vale 1 hora para /cv-base/html. */
hunterCvBaseRouter.post('/cv-base/ticket', (_req: Request, res: Response) => {
  res.json({ ticket: createTicket('cv-base', BASE) })
})

/**
 * GET /api/admin/hunter/cv-base/html?lang=es|en[&ticket=&measure=1&auto_print=true]. Con measure=1,
 * al cargar hace postMessage({ type: 'cv-measure', heightMm, pages }) a la ventana que la contiene:
 * el iframe va con sandbox="allow-scripts", sin allow-same-origin.
 */
hunterCvBaseRouter.get('/cv-base/html', async (req: Request, res: Response) => {
  if (!validateTicket(req.query['ticket'], 'cv-base', BASE) && !isAdminAuthorized(req)) {
    return refuse(req, res, 401, { error: 'Esta hoja necesita la sesión del admin o un ticket vigente del CV base.', code: 'unauthorized' })
  }
  const cv = baseCv(await loadCv(parseLang(req)))
  res.set(sheetHeaders)
  res.type('html').send(renderCvHtml(cv, { measure: req.query['measure'] === '1', autoPrint: req.query['auto_print'] === 'true' }))
})
