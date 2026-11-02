import path from 'node:path'
import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { db } from './db.js'
import { env } from './env.js'
import { adminApi } from './admin/router.js'
import { isAdminAuthorized } from './admin/auth.js'
import { adminCsp, adminUi } from './admin/ui.js'
import { envelope } from './envelope.js'
import { MEDIA_DIR, UPLOAD_DIR } from './mediaDirs.js'
import { docs } from './routes/docs.js'
import { experience } from './routes/experience.js'
import { orgs } from './routes/orgs.js'
import { projects } from './routes/projects.js'
import { schema } from './routes/schema.js'
import { stack } from './routes/stack.js'
import { articles } from './routes/articles.js'
import { cv } from './routes/cv.js'

export const app: Express = express()

app.disable('x-powered-by')
// Detrás del reverse proxy Traefik en Coolify
app.set('trust proxy', 1)

// M1: Cabeceras de seguridad generales con Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Nuxt y admin manejan sus directivas CSP específicas
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite consumir API y /media cross-origin
}))

// M1: la CSP del admin (ui.ts), para su UI y su API: mismo origen, sin eval ni nada en línea.
app.use(['/admin', '/api/admin'], adminCsp)

// M2: Rate limiting general para la API pública (desacoplado de /api/admin)
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (req) => req.baseUrl.startsWith('/api/admin') || req.path.startsWith('/admin') || (Boolean(req.originalUrl) && req.originalUrl.startsWith('/api/admin')),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'demasiadas peticiones, por favor reintente más tarde' },
})

// M2: Rate limiting estricto para fallos de autenticación en el admin (30 fallos 401 por IP cada 15 min en producción)
const adminAuthFailuresLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: (req) => {
    // 1. En desarrollo o pruebas locales, omitir rate limiting salvo si es producción
    if (process.env['NODE_ENV'] !== 'production') return true

    // En producción, solo omitir localhost bajo configuración explícita
    if (process.env['ADMIN_RATE_LIMIT_ALLOW_LOCALHOST'] === 'true') {
      const ip = req.ip || ''
      if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) return true
    }

    // 2. Si la petición ya incluye un Bearer token legítimo y verificado, jamás bloquear al administrador
    if (isAdminAuthorized(req)) return true

    return false
  },
  // Solo cuentan los 401: sin esto, cada hoja con ticket (iframe del CV, imprimir, carrusel) sumaba
  // aunque saliera bien y a los 30 pedidos la hoja respondía 429.
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'demasiados intentos fallidos de autenticación en admin, reintente en 15 minutos' },
})

// M3: CORS robusto para desarrollo y producción
const configuredOrigins = env.corsOrigin
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const isDev = process.env['NODE_ENV'] !== 'production'

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin Origin (curl, SSR, llamadas server-to-server)
    if (!origin) return callback(null, true)

    // Si se configuró wildcard '*'
    if (configuredOrigins.includes('*')) return callback(null, true)

    // Si el origen está en la lista explícita configurada
    if (configuredOrigins.includes(origin)) return callback(null, true)

    // En desarrollo local, permitir cualquier localhost o 127.0.0.1 (cualquier puerto)
    if (isDev) {
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      if (isLocalhost) return callback(null, true)
    }

    // Rechazar sin lanzar excepciones 500 no controladas
    callback(null, false)
  },
  credentials: false,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})

app.use('/api', corsMiddleware)
app.use('/media', corsMiddleware)
app.use('/uploads', corsMiddleware)

// Liveness probe ligero (sin consulta a base de datos)
app.get('/api/live', (_req, res) => {
  res.status(200).json(envelope({ ok: true }))
})

// Verificación de salud real de la base de datos (ok refleja dbOk real)
app.get('/api/health', async (_req, res) => {
  const dbOk = await db.$queryRaw`select 1`
    .then(() => true)
    .catch(() => false)
  res.status(dbOk ? 200 : 503).json(envelope({ ok: dbOk, db: dbOk }))
})

// Archivos estáticos de media con protección contra MIME-sniffing y caché de 7 días
const mediaStatic = { maxAge: '7d', immutable: false, setHeaders: (res: Response) => { res.setHeader('X-Content-Type-Options', 'nosniff') } }
app.use('/media', express.static(path.resolve('public/media'), mediaStatic))
// Lo subido desde el admin, si vive aparte de lo versionado (MEDIA_UPLOAD_DIR, mediaDirs.ts), en la misma dirección.
if (UPLOAD_DIR !== MEDIA_DIR) app.use('/media/projects', express.static(UPLOAD_DIR, mediaStatic))

// Archivos estáticos de uploads con protección contra MIME-sniffing y caché de 7 días
app.use('/uploads', express.static(path.resolve('public/media'), {
  maxAge: '7d',
  immutable: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

// Rutas de administración: parser de 2mb y rate limiter de auth desacoplado
app.use('/api/admin', express.json({ limit: '2mb' }), adminAuthFailuresLimiter, adminApi)
app.use('/admin', adminUi)

// Rutas de API pública: parser de 100kb y publicApiLimiter desacoplado del admin
app.use('/api', express.json({ limit: '100kb' }), publicApiLimiter, schema, projects, experience, stack, orgs, docs, articles, cv)

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal' })
})
