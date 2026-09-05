import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import { db } from './db.js'
import { env } from './env.js'
import { envelope } from './envelope.js'

export const app: Express = express()

app.disable('x-powered-by')
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const version = await db.$queryRaw<{ v: string }[]>`select version() as v`
    .then(rows => rows[0]?.v.split(' on ')[0] ?? null)
    .catch(() => null)
  const dbOk = version !== null
  res.status(dbOk ? 200 : 503).json(envelope({ ok: true, db: dbOk, version }))
})

// Los seis endpoints de contenido (Fase 1) se montan acá cuando el schema esté aprobado.

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'internal' })
})
