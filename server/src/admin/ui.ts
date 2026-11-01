/**
 * El admin compilado por Vite (server/admin/dist), servido en /admin. La base de Vite es absoluta
 * (/admin/): sin la barra final el navegador resolvería los assets contra el sitio, así que /admin
 * responde 301 a /admin/.
 *
 * Los assets llevan hash en el nombre y se cachean un año; index.html va con no-store para que cada
 * deploy se vea al recargar. Una ruta sin extensión devuelve el index (el router del admin es por
 * hash, pero una dirección vieja o tipeada a mano llega igual al ingreso); una con extensión que no
 * es un asset responde 404. Sin build (`pnpm build:admin`) el index responde 503 con el motivo.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import express, { Router, type Request, type Response } from 'express'
import helmet from 'helmet'

const DIST = path.resolve('server/admin/dist')
const INDEX = path.join(DIST, 'index.html')
const BASE = '/admin'

/**
 * CSP del admin y de /api/admin: todo del mismo origen, sin eval ni estilos en línea (Vue inserta los
 * `style` estáticos por innerHTML; check-admin-style los prohíbe y los `:style` dinámicos van por
 * CSSOM). Las hojas del CV y del carrusel que sirve /api/admin mandan su propia CSP, más cerrada.
 */
export const adminCsp = helmet.contentSecurityPolicy({
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
    res.status(503).type('text/plain; charset=utf-8').send('El admin no está compilado: corré pnpm build:admin.')
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  // Con `root`, send solo revisa la parte relativa: una carpeta con punto en la ruta absoluta (un
  // worktree en .claude/) no lo hace responder 404.
  res.sendFile('index.html', { root: DIST }, (err) => {
    if (err && !res.headersSent) res.status(503).type('text/plain; charset=utf-8').send('No se pudo leer el admin.')
  })
}

function notFound(_req: Request, res: Response): void {
  res.status(404).type('text/plain; charset=utf-8').send('No existe.')
}

export const adminUi = Router()

// Sin barra final: 301 a la base, conservando la consulta.
adminUi.get('/', (req, res, next) => {
  const [pathname, query] = req.originalUrl.split('?')
  // Express enruta sin distinguir mayúsculas: /ADMIN también va a la base canónica.
  if (pathname?.toLowerCase() === BASE) {
    res.redirect(301, `${BASE}/${query ? `?${query}` : ''}`)
    return
  }
  next()
})

adminUi.use('/assets', express.static(path.join(DIST, 'assets'), {
  immutable: true,
  maxAge: '1y',
  index: false,
  redirect: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}), notFound)

// index.html por su nombre, y cualquier ruta sin extensión: el index. Un archivo que no es del build
// (los del panel anterior, la configuración de Vite) no existe.
adminUi.get('/index.html', sendIndex)
adminUi.get(/^[^.]*$/, sendIndex)
adminUi.use(notFound)
