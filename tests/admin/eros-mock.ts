/**
 * Eros simulado para las pruebas del admin (scripts/admin-run.mjs --eros-mock). Responde con lo que
 * hay escrito a mano en tests/admin/fixtures/eros/ según el contrato de server/src/admin/erosContract.ts,
 * incluido un CV con textos inventados que la API tiene que descartar. Nunca contacta al Eros real.
 *
 *   PORT=4000 pnpm exec tsx tests/admin/eros-mock.ts
 *
 * Un id que no está en jobs.json da 404. GET /__requests devuelve los pedidos recibidos (método y
 * ruta) y DELETE /__requests los olvida: así una prueba comprueba qué le llegó y qué no.
 */
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

type Obj = Record<string, unknown>

const fixture = (name: string): Obj => JSON.parse(readFileSync(new URL(`./fixtures/eros/${name}.json`, import.meta.url), 'utf8')) as Obj

const jobs = (fixture('jobs')['data'] as Obj[])
const cv = fixture('cv')
const queue = fixture('queue')
const apply = fixture('apply')

const requests: { method: string, path: string }[] = []

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<Obj> {
  let raw = ''
  for await (const chunk of req) raw += String(chunk)
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed as Obj : {}
  }
  catch {
    return {}
  }
}

/** Respuestas por vacante: [método, acción] → cuerpo, con la vacante encontrada. */
const perJob: Record<string, (job: Obj, body: Obj) => unknown> = {
  'POST evaluate': job => ({ job: { ...job, match_score: (queue['match'] as Obj)['score'], status: 'evaluated' }, match: queue['match'] }),
  'POST pitch': () => apply['pitch'],
  'POST cv': () => cv,
  'PATCH status': (job, body) => ({ ok: true, job: { ...job, status: body['status'] } }),
  'DELETE ': () => ({ ok: true }),
  'GET apply-preview': () => apply['preview'],
  'POST find-email': () => apply['findEmail'],
  'POST apply-email': () => apply['applyEmail'],
  'PATCH contact-email': (job, body) => ({ ok: true, job: { ...job, contact_email: body['contact_email'] } }),
}

/** Rutas sin vacante: [método ruta] → cuerpo. */
const fixed: Record<string, (body: Obj) => unknown> = {
  'GET /api/stats': () => queue['stats'],
  'GET /api/jobs': () => ({ data: jobs }),
  'POST /api/scan': () => queue['scan'],
  'POST /api/vectorize': () => queue['vectorize'],
  'POST /api/purge': () => queue['purge'],
  'POST /api/evaluate': () => queue['evaluate'],
  'POST /api/jobs/semantic-search': () => ({ results: jobs.map(job => ({ ...job, semantic_score: queue['semanticScore'] })) }),
}

/** /api/jobs/:id[/acción], /api/pitch/:id y /api/cv/:id → la vacante y la acción. */
function jobRoute(path: string): { id: string, action: string } | null {
  const own = path.match(/^\/api\/(pitch|cv)\/([^/]+)$/)
  if (own) return { id: decodeURIComponent(own[2]!), action: own[1]! }
  const nested = path.match(/^\/api\/jobs\/([^/]+)(?:\/([a-z-]+))?$/)
  return nested ? { id: decodeURIComponent(nested[1]!), action: nested[2] ?? '' } : null
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://mock')
  const path = url.pathname
  const method = req.method ?? 'GET'

  if (path === '/__requests') {
    if (method === 'DELETE') requests.length = 0
    send(res, 200, requests)
    return
  }
  if (path === '/') {
    send(res, 200, { ok: true, mock: true })
    return
  }

  requests.push({ method, path })
  if (req.headers['authorization'] !== 'Bearer offline') {
    send(res, 401, { detail: 'invalid key' })
    return
  }
  const body = await readBody(req)

  const route = fixed[`${method} ${path}`]
  if (route) {
    send(res, 200, route(body))
    return
  }
  const target = jobRoute(path)
  const handler = target ? perJob[`${method} ${target.action}`] : undefined
  const job = target ? jobs.find(j => j['id'] === target.id) : undefined
  if (!handler || !job) {
    send(res, 404, { detail: 'Not Found' })
    return
  }
  send(res, 200, handler(job, body))
})

const port = Number(process.env['EROS_MOCK_PORT'] ?? process.env['PORT'] ?? 4000)
server.listen(port, '127.0.0.1', () => console.log(`eros-mock en http://127.0.0.1:${port}`))
