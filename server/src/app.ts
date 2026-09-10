import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
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

import path from 'node:path'

export const app: Express = express()

app.disable('x-powered-by')
const corsOrigins = env.corsOrigin.split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const version = await db.$queryRaw<{ v: string }[]>`select version() as v`
    .then(rows => rows[0]?.v.split(' on ')[0] ?? null)
    .catch(() => null)
  const dbOk = version !== null
  res.status(dbOk ? 200 : 503).json(envelope({ ok: true, db: dbOk, version }))
})

app.use('/media', express.static(path.resolve('public/media')))
app.use('/api', schema, projects, experience, stack, orgs, docs)
app.use('/api/admin', adminApi)
app.use('/admin', adminUi)

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal' })
})
