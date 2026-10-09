import path from 'node:path'
import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { db } from './db.js'
import { env } from './env.js'
import { adminApi, adminUi } from './admin/router.js'
import { envelope } from './envelope.js'
import { docs } from './routes/docs.js'
import { experience } from './routes/experience.js'
import { orgs } from './routes/orgs.js'
import { projects } from './routes/projects.js'
import { schema } from './routes/schema.js'
import { stack } from './routes/stack.js'

export const app: Express = express()

app.disable('x-powered-by')
// Detrás del reverse proxy Traefik en Coolify
app.set('trust proxy', 1)

// M1: Cabeceras de seguridad generales con Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Nuxt y admin manejan sus directivas CSP específicas
  crossOriginEmbedderPolicy: false,
}))

// M1: CSP específica y ajustada para la consola de administración (permite tipografías web y Vue runtime)
app.use(['/admin', '/api/admin'], helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://api.fontshare.com', 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.fontshare.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: ["'self'", 'blob:'],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
  },
}))

// M2: Rate limiting general para la API pública
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'demasiadas peticiones, por favor reintente más tarde' },
})

// M2: Rate limiting estricto para fallos de autenticación en el admin (10 fallos por IP cada 15 min)
const adminAuthFailuresLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'demasiados intentos fallidos de autenticación en admin, reintente en 15 minutos' },
})

// M3: CORS ajustado sin credentials, sin wildcard arbitrario y montado exclusivamente en /api
const allowedOrigins = env.corsOrigin
  .split(',')
  .map(s => s.trim())
  .filter(s => s && s !== '*')

if (allowedOrigins.length > 0) {
  const corsMiddleware = cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origen ${origin} no permitido por política CORS`))
      }
    },
    credentials: false,
  })
  app.use('/api', corsMiddleware)
}

app.use(express.json())

// Baja #1: Verificación de salud sin fuga de versión de la base de datos
app.get('/api/health', async (_req, res) => {
  const dbOk = await db.$queryRaw`select 1`
    .then(() => true)
    .catch(() => false)
  res.status(dbOk ? 200 : 503).json(envelope({ ok: true, db: dbOk }))
})

// Archivos estáticos de media con protección contra MIME-sniffing
app.use('/media', express.static(path.resolve('public/media'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

// Rutas de API pública con rate limiter
app.use('/api', publicApiLimiter, schema, projects, experience, stack, orgs, docs)

// Rutas de administración con rate limiter para fallos de auth
app.use('/api/admin', adminAuthFailuresLimiter, adminApi)
app.use('/admin', adminUi)

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal' })
})
