/**
 * El admin nuevo compilado por Vite (server/admin/dist), servido en /admin-next mientras convive con
 * el actual. La base de Vite es absoluta (/admin-next/): sin la barra final el navegador resolvería
 * los assets contra el sitio, así que /admin-next responde 301 a /admin-next/.
 *
 * Los assets llevan hash en el nombre y se cachean un año; index.html va con no-store para que cada
 * deploy se vea al recargar. Sin build (`pnpm build:admin`) responde 503 con el motivo.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import express, { Router, type Request, type Response } from 'express'
import helmet from 'helmet'

const DIST = path.resolve('server/admin/dist')
const INDEX = path.join(DIST, 'index.html')
const BASE = '/admin-next'

/**
 * CSP propia: todo del mismo origen, sin eval ni estilos en línea (Vue inserta los `style` estáticos
 * por innerHTML; check-admin-style los prohíbe y los `:style` dinámicos van por CSSOM).
 */
export const adminNextCsp = helmet.contentSecurityPolicy({
  useDefaults: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    scriptSrcAttr: ["'none'"],
    styleSrc: ["'self'"],
    fontSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'", 'https://api.github.com'],
    frameSrc: ["'self'"],
    mediaSrc: ["'self'", 'blob:'],
    workerSrc: ["'none'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    ...(process.env['NODE_ENV'] === 'production' ? { upgradeInsecureRequests: [] } : {}),
  },
})

function sendIndex(_req: Request, res: Response): void {
  if (!existsSync(INDEX)) {
    res.status(503).type('text/plain; charset=utf-8').send('El admin nuevo no está compilado: corré pnpm build:admin.')
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  // Con `root`, send solo revisa la parte relativa: una carpeta con punto en la ruta absoluta (un
  // worktree en .claude/) no lo hace responder 404.
  res.sendFile('index.html', { root: DIST }, (err) => {
    if (err && !res.headersSent) res.status(503).type('text/plain; charset=utf-8').send('No se pudo leer el admin nuevo.')
  })
}

export const adminUiNext = Router()

// Sin barra final: 301 a la base, conservando la consulta.
adminUiNext.get('/', (req, res, next) => {
  const [pathname, query] = req.originalUrl.split('?')
  if (pathname === BASE) {
    res.redirect(301, `${BASE}/${query ? `?${query}` : ''}`)
    return
  }
  next()
})

adminUiNext.get(['/', '/index.html'], sendIndex)

adminUiNext.use('/assets', express.static(path.join(DIST, 'assets'), {
  immutable: true,
  maxAge: '1y',
  index: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

// Lo demás no existe: el router del admin es por hash, así que ninguna ruta necesita el index.
adminUiNext.use((_req, res) => {
  res.status(404).type('text/plain; charset=utf-8').send('No existe.')
})
