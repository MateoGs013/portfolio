/**
 * Eros simulado para las pruebas del admin (scripts/admin-run.mjs --eros-mock). Responde con las
 * formas que manda el Eros real (eros-agent/src/eros/api.py y sus modelos), escritas en
 * tests/admin/fixtures/eros/ y eros-content/, incluido un CV con textos inventados que la API tiene
 * que descartar. Nunca contacta al Eros real.
 *
 *   PORT=4000 pnpm exec tsx tests/admin/eros-mock.ts
 *
 * Lo que imita del real, para que las pruebas cubran lo que pasa de verdad:
 * - el pitch trae el asunto en `subject_or_hook`; la vista previa, `contact_email` e `is_email_extracted`;
 *   «Buscar correo», `{ ok, job_id, contact_email, source, found }` (adivinado para la vacante en inglés);
 * - los cambios de estado y de contacto responden `{ ok, job_id, new_status }` y `{ ok, job_id,
 *   contact_email }`, sin la vacante; un contacto que no es texto da 422 con su `detail`;
 * - las publicaciones traen Dev.to anidado (`devto: { title, tags, markdown_body }`) y los enfoques de
 *   `ContentPillar`; generar con un enfoque que no existe da 422; publicar responde `status`
 *   (`approved_local` para las de `publishedLocally`);
 * - crear desde una tendencia falla como el real: 422 con `pillar: null` y 500 sin enfoque o con uno
 *   que no existe (Eros cae en un valor por defecto inválido);
 * - `eros-mock-falla` responde 500 y `eros-mock-redirige` una redirección (que el admin no sigue);
 *   `/api/lento` tarda 1,5 s, para probar los cortes del proxy.
 *
 * Un id que no está en las fixtures da 404. GET /__requests devuelve los pedidos recibidos (método,
 * ruta y cuerpo) y DELETE /__requests los olvida: así una prueba comprueba qué le llegó y qué no.
 */
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

type Obj = Record<string, unknown>

const read = (folder: string, name: string): Obj => JSON.parse(readFileSync(new URL(`./fixtures/${folder}/${name}.json`, import.meta.url), 'utf8')) as Obj
const fixture = (name: string): Obj => read('eros', name)

const jobs = (fixture('jobs')['data'] as Obj[])
const cv = fixture('cv')
/** La vacante en inglés trae su propio CV, con el resumen propuesto en inglés. */
const cvEn = fixture('cv-en')
const queue = fixture('queue')
const apply = fixture('apply')

const posts = read('eros-content', 'posts')['data'] as Obj[]
const trends = read('eros-content', 'trends')['trends'] as Obj[]
const contentActions = read('eros-content', 'actions')

const PILLARS = ['architecture', 'production_lessons', 'performance_optimization', 'ai_agent_ops', 'fullstack_engineering']
const pillarMessage = "Input should be 'architecture', 'production_lessons', 'performance_optimization', 'ai_agent_ops' or 'fullstack_engineering'"

const requests: { method: string, path: string, body: Obj }[] = []

/** Una respuesta del simulado: código y cuerpo (texto plano si es un string, como el 500 de FastAPI). */
interface Reply { status: number, body: unknown, headers?: Record<string, string> }

const ok = (body: unknown): Reply => ({ status: 200, body })
const notFound: Reply = { status: 404, body: { detail: 'Not Found' } }
const crash: Reply = { status: 500, body: 'Internal Server Error' }
const unprocessable = (field: string, msg: string): Reply => ({ status: 422, body: { detail: [{ type: 'value_error', loc: ['body', field], msg, input: null }] } })

function send(res: ServerResponse, reply: Reply): void {
  const plain = typeof reply.body === 'string'
  res.writeHead(reply.status, { 'Content-Type': plain ? 'text/plain; charset=utf-8' : 'application/json', ...reply.headers })
  res.end(plain ? reply.body as string : JSON.stringify(reply.body))
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

/** La vista previa como la arma el dispatcher de Eros (dispatcher.py, get_application_preview). */
function preview(job: Obj): Obj {
  const contact = typeof job['contact_email'] === 'string' ? job['contact_email'] : ''
  const extracted = !!contact && String(job['description'] ?? '').toLowerCase().includes(contact.toLowerCase())
  return {
    ...(apply['preview'] as Obj),
    job_id: job['id'],
    job_title: job['title'],
    company: job['company'],
    contact_email: contact,
    cv_html_url: `https://eros.example.com/api/jobs/${String(job['id'])}/cv/html`,
    status: job['status'],
    contact_email_verified: !extracted,
    is_email_extracted: extracted,
  }
}

/** Respuestas por vacante: [método, acción] → respuesta, con la vacante encontrada. */
const perJob: Record<string, (job: Obj, body: Obj) => Reply> = {
  'POST evaluate': (job) => {
    const match = queue['match'] as Obj
    return ok({ ok: true, job: { ...job, match_score: match['score'], match_analysis: JSON.stringify(match), status: 'evaluated', scored_by: match['scored_by'] }, match })
  },
  'POST pitch': () => ok(apply['pitch']),
  'POST cv': job => ok(job['id'] === 'eros-mock-backend' ? cvEn : cv),
  'PATCH status': (job, body) => ok({ ok: true, job_id: job['id'], new_status: body['status'] }),
  'DELETE ': job => ok({ ok: true, deleted_id: job['id'] }),
  'GET apply-preview': job => ok(preview(job)),
  'POST find-email': (job) => {
    const found = (apply['findEmail'] as Record<string, Obj>)[String(job['id'])]
    return ok({ ok: true, job_id: job['id'], ...(found ?? { contact_email: job['contact_email'] ?? null, source: null, found: false }) })
  },
  'POST apply-email': job => ok({ ...(apply['applyEmail'] as Obj), job_id: job['id'] }),
  'PATCH contact-email': (job, body) => typeof body['contact_email'] === 'string'
    ? ok({ ok: true, job_id: job['id'], contact_email: body['contact_email'].trim().toLowerCase() })
    : unprocessable('contact_email', 'Input should be a valid string'),
}

/** Rutas sin vacante: [método ruta] → respuesta. */
const fixed: Record<string, (body: Obj) => Reply | Promise<Reply>> = {
  'GET /api/stats': () => ok(queue['stats']),
  'GET /api/jobs': () => ok({ data: jobs, count: jobs.length }),
  'POST /api/scan': () => ok(queue['scan']),
  'POST /api/vectorize': () => ok(queue['vectorize']),
  'POST /api/purge': () => ok(queue['purge']),
  'POST /api/evaluate': () => ok(queue['evaluate']),
  'POST /api/jobs/semantic-search': body => ok({ data: jobs.map(job => ({ ...job, semantic_score: queue['semanticScore'] })), count: jobs.length, query: body['query'] }),
  'GET /api/lento': () => new Promise(resolve => setTimeout(() => resolve(ok({ ok: true })), 1500)),
}

const generatedPost = (pillar: unknown, topic?: unknown): Obj => ({
  ...(contentActions['generated'] as Obj),
  ...(typeof topic === 'string' ? { topic } : {}),
  pillar: typeof pillar === 'string' ? pillar : 'architecture',
})

/** Rutas de contenido sin id: [método ruta] → respuesta. */
const contentFixed: Record<string, (body: Obj) => Reply> = {
  'GET /api/content/posts': () => ok({ data: posts, count: posts.length }),
  'POST /api/content/generate': body => body['pillar'] !== undefined && body['pillar'] !== null && !PILLARS.includes(String(body['pillar']))
    ? unprocessable('pillar', pillarMessage)
    : ok({ ok: true, data: generatedPost(body['pillar'], body['topic']) }),
  'GET /api/radar/trends': () => ok(trends),
  'POST /api/radar/scan': () => ok({ ...(contentActions['scan'] as Obj), trends: trends.slice(0, 1) }),
}

/** Publicaciones y tendencias por id: [método acción] → respuesta, con el registro encontrado. */
const perPost: Record<string, (post: Obj, body: Obj) => Reply> = {
  'GET ': post => ok({ data: post }),
  'DELETE ': post => ok({ ok: true, deleted: post['id'] }),
  'PATCH status': (post, body) => ok({ ok: true, post_id: post['id'], new_status: body['status'] }),
  'POST publish': (post) => {
    const local = (contentActions['publishedLocally'] as string[]).includes(String(post['id']))
    return ok(local ? { ...(contentActions['approvedLocal'] as Obj), post } : contentActions['published'])
  },
}
const perTrend: Record<string, (trend: Obj, body: Obj) => Reply> = {
  'GET ': trend => ok(trend),
  'PATCH status': (trend, body) => ok({ ok: true, id: trend['id'], status: body['status'] }),
  'POST generate': (trend, body) => {
    if (!('pillar' in body)) return crash
    if (typeof body['pillar'] !== 'string') return unprocessable('pillar', 'Input should be a valid string')
    if (!PILLARS.includes(body['pillar'])) return crash
    return ok({ ok: true, trend_id: trend['id'], post: generatedPost(body['pillar'], trend['title']) })
  },
}

/** /api/content/posts/:id[/acción] y /api/radar/trends/:id[/acción] → la respuesta, o null si no es de contenido. */
function contentRoute(method: string, path: string, body: Obj): Reply | null {
  const route = contentFixed[`${method} ${path}`]
  if (route) return route(body)
  const match = path.match(/^\/api\/(content\/posts|radar\/trends|content\/carousel)\/([^/]+)(?:\/([a-z-]+))?$/)
  if (!match) return null
  const [, kind, rawId, action = ''] = match
  const id = decodeURIComponent(rawId!)
  if (kind === 'content/carousel') return notFound
  const rows = kind === 'content/posts' ? posts : trends
  const handlers = kind === 'content/posts' ? perPost : perTrend
  const row = rows.find(r => r['id'] === id)
  const handler = handlers[`${method} ${action}`]
  return row && handler ? handler(row, body) : notFound
}

/** /api/jobs/:id[/acción], /api/pitch/:id y /api/cv/:id → la vacante y la acción. */
function jobRoute(path: string): { id: string, action: string } | null {
  const own = path.match(/^\/api\/(pitch|cv)\/([^/]+)$/)
  if (own) return { id: decodeURIComponent(own[2]!), action: own[1]! }
  const nested = path.match(/^\/api\/jobs\/([^/]+)(?:\/([a-z-]+))?$/)
  return nested ? { id: decodeURIComponent(nested[1]!), action: nested[2] ?? '' } : null
}

async function route(method: string, path: string, body: Obj): Promise<Reply> {
  const content = contentRoute(method, path, body)
  if (content) return content
  const own = fixed[`${method} ${path}`]
  if (own) return own(body)
  const target = jobRoute(path)
  if (target?.id === 'eros-mock-falla') return crash
  if (target?.id === 'eros-mock-redirige') return { status: 307, body: { detail: 'moved' }, headers: { Location: 'http://127.0.0.1:9/api/jobs' } }
  const handler = target ? perJob[`${method} ${target.action}`] : undefined
  const job = target ? jobs.find(j => j['id'] === target.id) : undefined
  return handler && job ? handler(job, body) : notFound
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://mock')
  const path = url.pathname
  const method = req.method ?? 'GET'

  if (path === '/__requests') {
    if (method === 'DELETE') requests.length = 0
    send(res, ok(requests))
    return
  }
  if (path === '/') {
    send(res, ok({ ok: true, mock: true }))
    return
  }

  const body = await readBody(req)
  requests.push({ method, path, body })
  if (req.headers['authorization'] !== 'Bearer offline') {
    send(res, { status: 401, body: { detail: 'invalid key' } })
    return
  }
  send(res, await route(method, path, body))
})

const port = Number(process.env['EROS_MOCK_PORT'] ?? process.env['PORT'] ?? 4000)
server.listen(port, '127.0.0.1', () => console.log(`eros-mock en http://127.0.0.1:${port}`))
