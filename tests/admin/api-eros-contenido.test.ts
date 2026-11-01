/**
 * Publicaciones y Tendencias en el servidor (R0): contrato normalizado, «Publicar en el blog» que crea
 * un borrador y estados honestos sin Eros. Corre en los tres modos; cada bloque dice en cuál:
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-eros-contenido.test.ts              (sin Eros)
 *   node scripts/admin-run.mjs --demo -- pnpm tsx --test tests/admin/api-eros-contenido.test.ts       (muestra)
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-eros-contenido.test.ts  (Eros simulado)
 *
 * El modo muestra se reconoce por /hunter/stats (la muestra de vacantes de H0), no por estas rutas.
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { BlogDraft, ContentPost, DispatchResult, PostResult, Trend, TrendChange, TrendPost, TrendScan } from '../../server/src/shared/contentContracts.js'
import { admin, call, JARGON, ok } from './api.js'

const base = process.env['ADMIN_API_URL']!
const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface ErrorBody { error: string, code: string, offline?: boolean, errors: { path: string, message: string }[] }
interface AdminArticle { id: number, slug: string, status: string, publishedAt: string | null, projectId: number | null, techs: { slug: string }[] }
interface PublicArticle { slug: string, title: string }

/** Con --demo la API sirve la muestra de vacantes de H0: así se sabe el modo sin mirar estas rutas. */
async function demoMode(): Promise<boolean> {
  if (online) return false
  const res = await fetch(`${base}/api/admin/hunter/stats`, { headers: { Authorization: `Bearer ${process.env['PW_ADMIN_TOKEN']}` } })
  return res.headers.get('x-eros-source') === 'demo'
}

const demo = await demoMode()
const offline = !online && !demo

async function mockRequests(): Promise<{ method: string, path: string, body: Record<string, unknown> }[]> {
  return (await fetch(`${eros}/__requests`)).json() as Promise<{ method: string, path: string, body: Record<string, unknown> }[]>
}

async function articleCount(): Promise<number> {
  return (await ok<unknown[]>('GET', '/articles')).length
}

async function publicArticles(): Promise<PublicArticle[]> {
  return (await call<{ data: PublicArticle[] }>('GET', '/api/articles')).body.data
}

async function carousel(id: string): Promise<{ status: number, text: string }> {
  const { ticket } = await ok<{ ticket: string }>('POST', `/content/carousel/${encodeURIComponent(id)}/ticket`)
  const res = await fetch(`${base}/api/admin/content/carousel/${encodeURIComponent(id)}/html?ticket=${ticket}`)
  return { status: res.status, text: await res.text() }
}

function assertIssue(reply: { status: number, body: unknown }, path: string): void {
  const body = reply.body as ErrorBody
  assert.equal(reply.status, 400, JSON.stringify(body))
  assert.equal(body.code, 'invalid')
  assert.deepEqual(body.errors.map(e => e.path), [path])
  assert.doesNotMatch(`${body.error} ${body.errors[0]!.message}`, JARGON)
}

function assertOffline(reply: { status: number, body: unknown }, consequence?: RegExp): void {
  const body = reply.body as ErrorBody
  assert.equal(reply.status, 503, JSON.stringify(body))
  assert.equal(body.offline, true)
  assert.equal(body.code, 'offline')
  assert.match(body.error, /^Eros no responde/)
  assert.doesNotMatch(body.error, JARGON)
  if (consequence) assert.match(body.error, consequence)
}

describe('lo que manda el admin se valida antes de preguntarle a Eros (todos los modos)', () => {
  test('estado, canal, tema y enfoque inválidos → 400 en español con su campo', async () => {
    assertIssue(await admin('PATCH', '/content/posts/cualquiera/status', { status: 'borrador' }), 'status')
    assertIssue(await admin('POST', '/content/posts/cualquiera/publish', { channel: 'fax' }), 'channel')
    assertIssue(await admin('POST', '/content/generate', {}), 'topic')
    assertIssue(await admin('POST', '/content/generate', { topic: 'PostgreSQL', pillar: 'EPICO' }), 'pillar')
    assertIssue(await admin('PATCH', '/radar/trends/cualquiera/status', { status: 'LEIDA' }), 'status')
    assertIssue(await admin('POST', '/radar/trends/cualquiera/generate', { pillar: 'EPICO' }), 'pillar')
  })

  test('un cambio sobre la muestra nunca llega a Eros ni se guarda', async () => {
    if (online) await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const writes = [
      admin('PATCH', '/content/posts/demo-algo/status', { status: 'approved' }),
      admin('POST', '/content/posts/demo-algo/publish', { channel: 'linkedin' }),
      admin('DELETE', '/content/posts/demo-algo'),
      admin('POST', '/content/posts/demo-algo/publish-to-blog'),
      admin('PATCH', '/radar/trends/demo-tendencia-postgres/status', { status: 'DISCARDED' }),
      admin('POST', '/radar/trends/demo-tendencia-postgres/generate', {}),
    ]
    for (const reply of await Promise.all(writes)) {
      assert.equal(reply.status, 400)
      assert.match((reply.body as ErrorBody).error, /muestra/)
    }
    if (online) assert.ok((await mockRequests()).every(r => !r.path.includes('demo-')))
  })
})

if (offline) describe('sin Eros ni muestra (sin --eros-mock ni --demo)', () => {
  test('las lecturas responden 503 { offline: true }', async () => {
    assertOffline(await admin('GET', '/content/posts'))
    assertOffline(await admin('GET', '/content/posts/eros_real_1'))
    assertOffline(await admin('GET', '/radar/trends'))
    assertOffline(await admin('GET', '/radar/trends/eros_real_1'))
    assert.equal((await admin('GET', '/content/posts/demo-algo')).status, 404)
  })

  test('las escrituras responden 503 diciendo qué no pasó', async () => {
    assertOffline(await admin('POST', '/content/generate', { topic: 'PostgreSQL' }), /No se generó la publicación/)
    assertOffline(await admin('PATCH', '/content/posts/eros_real_1/status', { status: 'approved' }), /El estado no cambió/)
    assertOffline(await admin('POST', '/content/posts/eros_real_1/publish', { channel: 'linkedin' }), /No se despachó a LinkedIn/)
    assertOffline(await admin('DELETE', '/content/posts/eros_real_1'), /no se borró/)
    assertOffline(await admin('POST', '/radar/scan'), /No se buscaron tendencias nuevas/)
    assertOffline(await admin('PATCH', '/radar/trends/eros_real_1/status', { status: 'DISCARDED' }), /El estado no cambió/)
    assertOffline(await admin('POST', '/radar/trends/eros_real_1/generate', {}), /No se creó la publicación/)
  })

  test('publicar en el blog sin Eros no crea nada', async () => {
    const before = await articleCount()
    assertOffline(await admin('POST', '/content/posts/eros_real_1/publish-to-blog'), /no se creó el artículo/)
    assert.equal(await articleCount(), before)
  })

  test('el carrusel avisa que Eros no responde', async () => {
    const sheet = await carousel('eros_real_1')
    assert.equal(sheet.status, 503)
    assert.match(sheet.text, /Eros no responde/)
  })
})

if (demo) describe('muestra sin Eros (--demo)', () => {
  test('una publicación por artículo publicado, con LinkedIn y marcada como muestra', async () => {
    const reply = await admin<ContentPost[]>('GET', '/content/posts')
    assert.equal(reply.status, 200)
    const articles = await publicArticles()
    assert.ok(articles.length > 0, 'la base necesita al menos un artículo publicado')
    assert.deepEqual(reply.body.map(p => p.title).sort(), articles.map(a => a.title).sort())
    for (const post of reply.body) {
      assert.ok(post.linkedin_text.trim().length > 0)
      assert.equal(post.demo, true)
      assert.equal(post._source, 'demo')
      assert.ok(post.id.startsWith('demo-'))
      assert.equal(post.dispatched_at, null)
    }
  })

  test('las tendencias de muestra no tienen dirección, fecha ni afinidad', async () => {
    const trends = await ok<Trend[]>('GET', '/radar/trends')
    assert.ok(trends.length > 0)
    for (const trend of trends) {
      assert.equal(trend.url, null)
      assert.equal(trend.detected_at, null)
      assert.equal(trend.relevance_score, null)
      assert.equal(trend.demo, true)
    }
    assert.deepEqual(await ok<Trend[]>('GET', '/radar/trends?min_score=50'), [])
  })

  test('el carrusel de la muestra se arma con el artículo y nada cambia en memoria', async () => {
    const [post] = await ok<ContentPost[]>('GET', '/content/posts')
    const sheet = await carousel(post!.id)
    assert.equal(sheet.status, 200)
    assert.match(sheet.text, /carousel-stage/)
    assert.equal((await admin('PATCH', `/content/posts/${post!.id}/status`, { status: 'approved' })).status, 400)
    assert.equal((await ok<ContentPost>('GET', `/content/posts/${post!.id}`)).status, 'draft')
    assertOffline(await admin('POST', '/content/generate', { topic: 'PostgreSQL' }), /No se generó/)
  })
})

if (online) describe('con Eros (--eros-mock)', () => {
  test('las publicaciones salen normalizadas, sin importar cómo las mande Eros', async () => {
    const posts = await ok<ContentPost[]>('GET', '/content/posts')
    assert.equal(posts.length, 2)
    const [api, lesson] = posts as [ContentPost, ContentPost]
    assert.equal(api._source, 'eros')
    assert.equal(api.demo, undefined)
    assert.equal(api.carousel_slides.length, 2, 'la lámina sin título se descarta')
    assert.deepEqual(api.carousel_slides[1]!.bullets, ['texto', 'código', 'campos'])
    assert.equal(api.carousel_slides[1]!.subtitle, null)
    assert.equal(lesson.title, 'Lo que aprendí al migrar a Prisma 7')
    assert.equal(lesson.pillar, null)
    assert.equal(lesson.linkedin_text, 'Migrar a Prisma 7 cambió cómo se genera el cliente.')
    assert.equal(lesson.twitter_thread.length, 2)
    assert.deepEqual(lesson.devto_tags, ['prisma', 'typescript'])
    assert.equal(lesson.carousel_slides[0]!.title, 'Prisma 7')
    assert.deepEqual((await ok<ContentPost[]>('GET', '/content/posts?status=approved')).map(p => p.id), [lesson.id])
  })

  test('detalle, 404 en español, generar, estado y borrar', async () => {
    assert.equal((await ok<ContentPost>('GET', '/content/posts/eros-mock-post-arquitectura')).hook?.startsWith('Cómo'), true)
    const missing = await admin<ErrorBody>('GET', '/content/posts/no-existe')
    assert.equal(missing.status, 404)
    assert.match(missing.body.error, /Eros no tiene esa publicación/)
    const generated = await ok<PostResult>('POST', '/content/generate', { topic: 'PostgreSQL', pillar: 'TECHNICAL_BREAKDOWN', key_points: 'uno, dos' })
    assert.equal(generated.post?.id, 'eros-mock-post-desde-tendencia')
    const changed = await ok<PostResult>('PATCH', '/content/posts/eros-mock-post-arquitectura/status', { status: 'rejected' })
    assert.equal(changed.post?.status, 'rejected')
    assert.deepEqual(await ok('DELETE', '/content/posts/eros-mock-post-arquitectura'), { ok: true })
  })

  test('publicar por n8n manda el canal y devuelve cuándo salió', async () => {
    await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const sent = await ok<DispatchResult>('POST', '/content/posts/eros-mock-post-arquitectura/publish', { channel: 'linkedin' })
    assert.deepEqual(sent, { ok: true, channel: 'linkedin', dispatched_at: '2026-10-31T12:00:00.000Z' })
    const [asked] = await mockRequests()
    assert.equal(asked?.path, '/api/content/posts/eros-mock-post-arquitectura/publish')
    assert.deepEqual(asked?.body, { channel: 'linkedin' })
  })

  test('publicar en el blog crea un borrador que el sitio no lista', async () => {
    const before = await articleCount()
    const reply = await admin<BlogDraft>('POST', '/content/posts/eros-mock-post-arquitectura/publish-to-blog')
    assert.equal(reply.status, 201, JSON.stringify(reply.body))
    assert.deepEqual(Object.keys(reply.body.article).sort(), ['id', 'slug'])
    assert.equal(reply.body.article.slug, 'diseno-de-una-api-con-senales-claras')
    assert.equal(await articleCount(), before + 1)

    const article = await ok<AdminArticle>('GET', `/articles/${reply.body.article.id}`)
    assert.equal(article.status, 'DRAFT')
    assert.equal(article.publishedAt, null)
    assert.notEqual(article.projectId, null, 'la obra de la publicación existe en la base')
    assert.deepEqual(article.techs.map(t => t.slug).sort(), ['node', 'postgresql', 'vue'])
    assert.ok((await publicArticles()).every(a => a.slug !== article.slug))
    assert.equal((await call('GET', `/api/articles/${article.slug}`)).status, 404)

    const again = await ok<BlogDraft>('POST', '/content/posts/eros-mock-post-arquitectura/publish-to-blog')
    assert.equal(again.article.slug, 'diseno-de-una-api-con-senales-claras-2')
  })

  test('sin texto de Dev.to usa el de LinkedIn; una obra que no existe no se asocia', async () => {
    const { article } = await ok<BlogDraft>('POST', '/content/posts/eros-mock-post-aprendizaje/publish-to-blog')
    assert.equal(article.slug, 'lo-que-aprendi-al-migrar-a-prisma-7')
    const saved = await ok<AdminArticle & { content: string }>('GET', `/articles/${article.id}`)
    assert.equal(saved.content, 'Migrar a Prisma 7 cambió cómo se genera el cliente.')
    assert.equal(saved.projectId, null)
    assert.deepEqual(saved.techs.map(t => t.slug).sort(), ['prisma', 'typescript'])
  })

  test('el carrusel se arma con la publicación de Eros y pide ticket o sesión', async () => {
    const sheet = await carousel('eros-mock-post-arquitectura')
    assert.equal(sheet.status, 200)
    assert.match(sheet.text, /carousel-stage/)
    assert.equal(sheet.text.match(/class="slide[ "]/g)?.length, 2)
    assert.equal((await fetch(`${base}/api/admin/content/carousel/eros-mock-post-arquitectura/html`)).status, 401)
    assert.equal((await carousel('no-existe')).status, 404)
  })

  test('las tendencias salen normalizadas: afinidad en %, fuente en código y solo enlaces http', async () => {
    const trends = await ok<Trend[]>('GET', '/radar/trends')
    assert.deepEqual(trends.map(tr => tr.id), ['eros-mock-trend-postgres', 'eros-mock-trend-nuxt'])
    const [postgres, nuxt] = trends as [Trend, Trend]
    assert.equal(postgres.relevance_score, 87)
    assert.equal(postgres.source, 'HACKER_NEWS')
    assert.deepEqual(postgres.tags, ['postgresql', 'pgvector'])
    assert.equal(nuxt.url, null)
    assert.equal(nuxt.relevance_score, null)
    assert.equal(nuxt.detected_at, null)
    assert.equal(nuxt.post_id, 'eros-mock-post-arquitectura')
  })

  test('detalle, buscar, estado y crear publicación desde una tendencia', async () => {
    assert.equal((await ok<Trend>('GET', '/radar/trends/eros-mock-trend-postgres')).title, 'PostgreSQL como base relacional y de vectores')
    const missing = await admin<ErrorBody>('GET', '/radar/trends/no-existe')
    assert.equal(missing.status, 404)
    assert.match(missing.body.error, /Eros no tiene esa tendencia/)
    const scan = await ok<TrendScan>('POST', '/radar/scan')
    assert.equal(scan.total_found, 12)
    assert.equal(scan.new_trends, 1)
    assert.equal(scan.trends.length, 1)
    const changed = await ok<TrendChange>('PATCH', '/radar/trends/eros-mock-trend-postgres/status', { status: 'DISCARDED' })
    assert.equal(changed.trend?.status, 'DISCARDED')
    const created = await ok<TrendPost>('POST', '/radar/trends/eros-mock-trend-postgres/generate', { pillar: 'METRICS_DRIVEN' })
    assert.equal(created.trend_id, 'eros-mock-trend-postgres')
    assert.equal(created.post?.id, 'eros-mock-post-desde-tendencia')
  })
})
