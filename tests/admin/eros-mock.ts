/**
 * Eros simulado para las pruebas del admin (scripts/admin-run.mjs --eros-mock). Responde con las
 * formas que manda el Eros real (eros-agent/src/eros/api.py y sus modelos), escritas en
 * tests/admin/fixtures/eros/ y eros-content/, incluido un CV con textos inventados que la API tiene
 * que descartar. Nunca contacta al Eros real.
 *
 *   PORT=4000 pnpm exec tsx tests/admin/eros-mock.ts
 *
 * Imita el Eros de después de la auditoría (eros-agent#1). Con PUT /__antes responde como el de antes
 * (DELETE /__antes vuelve al de ahora), para probar que el admin entiende a los dos mientras conviven:
 * - escanear y evaluar en lote responden 202 `{ task_id }` y el resultado sale de GET /api/tasks/:id (el
 *   escaneo dice `running` en la primera consulta); antes, 200 con el resultado;
 * - limpiar la cola responde `discarded_count`; antes, `purged_count`;
 * - «Buscar correo» manda `contact_email_source` (del aviso para la vacante en español, de Hunter.io
 *   para la de inglés) y la vista previa, `contact_email_source`; antes, `source` con un correo
 *   adivinado para la vacante en inglés e `is_email_extracted`;
 * - publicar responde `status: 'dispatched'` con `dispatched_channels`, 409 `already_published` para
 *   una publicada y 422 `invalid_channel` para Dev.to; antes, `status: 'published'`.
 *
 * Lo demás que imita del real, para que las pruebas cubran lo que pasa de verdad:
 * - el pitch trae el asunto en `subject_or_hook`;
 * - los cambios de estado y de contacto responden `{ ok, job_id, new_status }` y `{ ok, job_id,
 *   contact_email }`, sin la vacante; un contacto que no es texto da 422 con su `detail`;
 * - las publicaciones traen Dev.to anidado (`devto: { title, tags, markdown_body }`) y los enfoques de
 *   `ContentPillar`; generar con un enfoque que no existe da 422; publicar responde `status`
 *   (`approved_local` para las de `publishedLocally`);
 * - crear desde una tendencia falla como el real: 422 con `pillar: null` y 500 sin enfoque o con uno
 *   que no existe (Eros cae en un valor por defecto inválido);
 * - pedir un artículo (POST /api/articles/generate) responde 202 y la tarea termina con el artículo de
 *   fixtures/eros-articles/ en los dos idiomas, con el tema, la obra y la tendencia que se pidieron.
 *   PUT /__articulo { modo } cambia cómo termina la próxima: `ok`, `falla` (la tarea falla con
 *   `error_code: llm_unavailable`), `tabla` (el texto trae una tabla) o `lento` (sigue escribiendo
 *   hasta el próximo PUT /__articulo, que la suelta). Con el Eros de antes la ruta no existe (404);
 * - `eros-mock-falla` responde 500 y `eros-mock-redirige` una redirección (que el admin no sigue);
 *   `/api/lento` tarda 1,5 s, para probar los cortes del proxy.
 *
 * Un id que no está en las fixtures da 404. GET /__requests devuelve los pedidos recibidos (método,
 * ruta y cuerpo) y DELETE /__requests los olvida: así una prueba comprueba qué le llegó y qué no.
 * Ninguna de las rutas de control (/__requests, /__antes, /__articulo) queda registrada.
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
const articles = read('eros-articles', 'article')

const PILLARS = ['architecture', 'production_lessons', 'performance_optimization', 'ai_agent_ops', 'fullstack_engineering']
const pillarMessage = "Input should be 'architecture', 'production_lessons', 'performance_optimization', 'ai_agent_ops' or 'fullstack_engineering'"

const requests: { method: string, path: string, body: Obj }[] = []

/** true mientras responde como el Eros de antes de la auditoría (PUT /__antes). */
let before = false

interface Task {
  kind: string
  /** Cuántas consultas faltan para que diga `done` (o `failed`). */
  pending: number
  result: unknown
  /** Si termina fallando: el `error` y el `error_code` de Eros. */
  failure?: { error: string, error_code: string }
}

/** Las tareas largas en curso, por id. */
const tasks = new Map<string, Task>()
let taskCount = 0

/** El 202 del Eros de ahora: la tarea arranca y el resultado sale de GET /api/tasks/:id. */
function accepted(kind: string, result: unknown, pending = 0, failure?: Task['failure']): Reply {
  const task_id = `${kind}_mock${++taskCount}`
  tasks.set(task_id, { kind, pending, result, failure })
  return { status: 202, body: { ok: true, task_id, kind, status: 'running', started_at: '2026-11-02T12:00:00+00:00', already_running: false, status_url: `/api/tasks/${task_id}` } }
}

function taskStatus(id: string): Reply {
  const task = tasks.get(id)
  if (!task) return { status: 404, body: { detail: 'Tarea no encontrada (puede que Eros se haya reiniciado).' } }
  const running = task.pending > 0
  if (running) task.pending -= 1
  if (!running && task.failure) return ok({ task_id: id, status: 'failed', result: null, ...task.failure })
  return ok({ task_id: id, status: running ? 'running' : 'done', result: running ? null : task.result, error: null })
}

/** Cómo termina el próximo artículo (PUT /__articulo). */
type ArticleMode = 'ok' | 'falla' | 'tabla' | 'lento'
let articleMode: ArticleMode = 'ok'
/** Una tarea `lento` no termina sola: sigue hasta que se suelta. */
const HELD = 1_000_000

/** El artículo de la fixture con lo que se pidió: tema, obra y tendencia. */
function generatedArticle(body: Obj): Obj {
  const base = articles['ok'] as Obj
  const es = { ...(base['es'] as Obj) }
  if (articleMode === 'tabla') es['markdown'] = articles['table']
  return {
    ...base,
    es,
    topic: typeof body['topic'] === 'string' ? body['topic'] : base['topic'],
    project_slug: typeof body['project_slug'] === 'string' ? body['project_slug'] : base['project_slug'],
    trend_id: typeof body['trend_id'] === 'string' ? body['trend_id'] : null,
  }
}

function generateArticle(body: Obj): Reply {
  if (before) return notFound
  const failure = articleMode === 'falla' ? { error: 'El modelo de IA no está disponible.', error_code: 'llm_unavailable' } : undefined
  return accepted('article', generatedArticle(body), articleMode === 'lento' ? HELD : 1, failure)
}

/** Un error del Eros de ahora: `{ detail, error_code }` con su código. */
const refused = (status: number, error_code: string, detail: string): Reply => ({ status, body: { detail, error_code } })

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
  const common = {
    ...(apply['preview'] as Obj),
    job_id: job['id'],
    job_title: job['title'],
    company: job['company'],
    contact_email: contact,
    status: job['status'],
    is_email_extracted: extracted,
  }
  // El de antes daba «verificado» justo a los que no salen del aviso.
  if (before) return { ...common, cv_html_url: `https://eros.example.com/api/jobs/${String(job['id'])}/cv/html`, contact_email_verified: !extracted }
  const source = contact ? (extracted ? 'posting' : 'unknown') : null
  return {
    ...common,
    cv_html_url: null,
    contact_email_source: source,
    contact_email_verified: source === 'posting',
    requires_manual_email: !contact || source === 'unknown',
    pitch_source: 'stored',
    send_state: null,
    idempotency_key: `apply-${String(job['id'])}`,
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
    const found = (apply[before ? 'findEmailBefore' : 'findEmail'] as Record<string, Obj>)[String(job['id'])]
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
  'POST /api/scan': () => (before ? ok(queue['scan']) : accepted('scan', queue['scan'], 1)),
  'POST /api/vectorize': () => ok(queue['vectorize']),
  'POST /api/purge': () => ok(queue[before ? 'purgeBefore' : 'purge']),
  'POST /api/evaluate': () => (before ? ok(queue['evaluate']) : accepted('evaluate', queue['evaluate'])),
  'POST /api/jobs/semantic-search': body => ok({ data: jobs.map(job => ({ ...job, semantic_score: queue['semanticScore'] })), count: jobs.length, query: body['query'] }),
  'GET /api/lento': () => new Promise(resolve => setTimeout(() => resolve(ok({ ok: true })), 1500)),
  'POST /api/articles/generate': generateArticle,
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
  'POST publish': (post, body) => {
    const local = (contentActions['publishedLocally'] as string[]).includes(String(post['id']))
    if (local) return ok({ ...(contentActions['approvedLocal'] as Obj), post })
    if (before) return ok(contentActions['published'])
    if (body['channel'] === 'devto') return refused(422, 'invalid_channel', 'Dev.to no tiene publicación automática.')
    if (post['status'] === 'published') return refused(409, 'already_published', 'La publicación ya fue publicada; no se republica.')
    return ok(contentActions['dispatched'])
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
  const task = method === 'GET' ? path.match(/^\/api\/tasks\/([^/]+)$/) : null
  if (task) return taskStatus(decodeURIComponent(task[1]!))
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
  if (path === '/__antes') {
    if (method === 'PUT') before = true
    if (method === 'DELETE') before = false
    send(res, ok({ before }))
    return
  }
  if (path === '/__articulo') {
    const body = await readBody(req)
    const mode = body['modo']
    if (method === 'PUT' && (mode === 'ok' || mode === 'falla' || mode === 'tabla' || mode === 'lento')) {
      articleMode = mode
      // Suelta los artículos que seguían escribiendo: terminan en la consulta siguiente.
      for (const task of tasks.values()) if (task.kind === 'article' && task.pending === HELD) task.pending = 0
    }
    send(res, ok({ modo: articleMode }))
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
