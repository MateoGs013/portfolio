/**
 * Montaje de la API del admin en /api/admin, detrás del token. Cada módulo vive en su archivo; acá
 * solo se ordenan. La UI compilada la sirve ui.ts en /admin.
 */
import { Router } from 'express'
import { requireAdmin } from './auth.js'
import { articleRunsRouter } from './articleRuns.js'
import { articlesRouter } from './articles.js'
import { forgetsLastGood } from './common.js'
import { contentRouter } from './content.js'
import { docsRouter } from './docs.js'
import { adminErrors } from './errors.js'
import { experienceRouter } from './experience.js'
import { hunterRouter } from './hunter.js'
import { mediaRouter } from './media.js'
import { metaRouter } from './meta.js'
import { orgsRouter } from './orgs.js'
import { pendingRouter } from './pending.js'
import { projectsRouter } from './projects.js'
import { radarRouter } from './radar.js'
import { statusRouter } from './status.js'
import { techsRouter } from './techs.js'

/**
 * Los módulos que escriben en la base: después de cada escritura buena se olvidan los respaldos. Los
 * pedidos de artículos a Eros van antes que articles.ts (/articles/runs chocaría con /articles/:id);
 * el artículo que publica Eros llega después de la respuesta y olvida los respaldos por su cuenta.
 */
const contentApi = Router()
contentApi.use(forgetsLastGood)
contentApi.use(metaRouter, projectsRouter, mediaRouter, experienceRouter, techsRouter, orgsRouter, articleRunsRouter, articlesRouter, docsRouter)

export const adminApi = Router()
adminApi.use((req, _res, next) => {
  if (req.body === undefined || req.body === null) req.body = {}
  next()
})
adminApi.use(requireAdmin)
// Eros: /hunter, /content y /radar son proxys que no tocan lo que muestra el sitio. Lo único que
// /content escribe en la base es un artículo en borrador («Publicar en el blog»), que la API pública
// no lista: no hace falta olvidar sus respaldos.
adminApi.use('/hunter', hunterRouter)
adminApi.use('/content', contentRouter)
adminApi.use('/radar', radarRouter)
adminApi.use(statusRouter)
// La bandeja del Inicio solo lee.
adminApi.use(pendingRouter)
adminApi.use(contentApi)
adminApi.use(adminErrors)
