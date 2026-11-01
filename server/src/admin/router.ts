/**
 * Montaje del admin: la UI actual en /admin (solo sus archivos, por lista blanca) y la API en
 * /api/admin con el token. Cada módulo vive en su archivo; acá solo se ordenan.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import express, { Router, type Request, type Response } from 'express'
import { requireAdmin } from './auth.js'
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
import { projectsRouter } from './projects.js'
import { radarRouter } from './radar.js'
import { statusRouter } from './status.js'
import { techsRouter } from './techs.js'

const require = createRequire(import.meta.url)
const ADMIN_DIR = path.resolve('server/admin')

// ─── UI estática ────────────────────────────────────────────────────────────

/**
 * Lista blanca: index.html, admin.css, js/** y vendor/**. Lo demás de server/admin (las fuentes de
 * Tailwind, la configuración de Vite, el código del admin nuevo) responde 404.
 */
export const adminUi = Router()
// `root` en lugar de la ruta entera: sendFile rechaza rutas con carpetas que empiezan con punto (.claude).
const sendIndex = (_req: Request, res: Response) => res.sendFile('index.html', { root: ADMIN_DIR })
adminUi.get(['/', '/index.html'], sendIndex)
adminUi.get('/admin.css', (_req, res) => res.sendFile('admin.css', { root: ADMIN_DIR }))
// dotfiles: pnpm guarda los paquetes bajo node_modules/.pnpm y sendFile los rechaza por defecto.
adminUi.get('/vendor/vue.js', (_req, res) => res.sendFile(require.resolve('vue/dist/vue.global.prod.js'), { dotfiles: 'allow' }))
adminUi.use('/js', express.static(path.join(ADMIN_DIR, 'js'), { index: false, redirect: false }))

// ─── API ────────────────────────────────────────────────────────────────────

/** Los módulos que escriben en la base: después de cada escritura buena se olvidan los respaldos. */
const contentApi = Router()
contentApi.use(forgetsLastGood)
contentApi.use(metaRouter, projectsRouter, mediaRouter, experienceRouter, techsRouter, orgsRouter, articlesRouter, docsRouter)

export const adminApi = Router()
adminApi.use((req, _res, next) => {
  if (req.body === undefined || req.body === null) req.body = {}
  next()
})
adminApi.use(requireAdmin)
// Eros: /hunter y /radar son proxys que no tocan el contenido del sitio. /content sí escribe en la
// base (publica artículos que redacta Eros), así que también olvida los respaldos al salir bien.
adminApi.use('/hunter', hunterRouter)
adminApi.use('/content', forgetsLastGood, contentRouter)
adminApi.use('/radar', radarRouter)
adminApi.use(statusRouter)
adminApi.use(contentApi)
adminApi.use(adminErrors)
