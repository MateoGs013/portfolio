/**
 * Artículos que escribe Eros y publica la API sola: POST /articles/generate, el pedido que se sigue en
 * segundo plano (GET /articles/runs/:id) y el artículo publicado en los dos idiomas en la API pública.
 * Corre en los tres modos; cada bloque dice en cuál. `pnpm test:e2e` corre los tres:
 *
 * admin-run: sin Eros
 * admin-run: --demo
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-articulos-eros.test.ts              (sin Eros)
 *   node scripts/admin-run.mjs --demo -- pnpm tsx --test tests/admin/api-articulos-eros.test.ts       (muestra)
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-articulos-eros.test.ts  (Eros simulado)
 *
 * El Eros simulado cambia cómo termina el próximo artículo con PUT /__articulo { modo } (ok, falla,
 * tabla, lento). admin-run apaga el horario de los lunes (ARTICLES_WEEKLY=off): `next` es null.
 */
import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'
import type { ArticleRunList, ArticleRunReply, ArticleRunView } from '../../server/src/shared/articleRunContracts.js'
import { markdownProblem, normalizeErosArticle } from '../../server/src/admin/erosArticleContract.js'
import { admin, call, JARGON, ok } from './api.js'

const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface ErrorBody { error: string, code: string, offline?: boolean, errors: { path: string, message: string }[], run?: ArticleRunView }
interface AdminArticle { id: number, slug: string, title: string, status: string, publishedAt: string | null, readingTimeMin: number, featured: boolean, projectId: number | null, techs: { slug: string }[], translations: { locale: string, title: string | null, content: string | null }[] }
interface PublicArticle { slug: string, title: string, summary: string, content: string, untranslated: string[] }

async function mode(modo: 'ok' | 'falla' | 'tabla' | 'lento'): Promise<void> {
  await fetch(`${eros}/__articulo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ modo }) })
}

async function mockRequests(): Promise<{ method: string, path: string, body: Record<string, unknown> }[]> {
  return (await fetch(`${eros}/__requests`)).json() as Promise<{ method: string, path: string, body: Record<string, unknown> }[]>
}

/** Consulta el pedido hasta que deja de escribir (la API mira la tarea de Eros cada 2 s). */
async function settled(id: number, seconds = 40): Promise<ArticleRunView> {
  for (let i = 0; i < seconds * 2; i++) {
    const { run } = await ok<ArticleRunReply>('GET', `/articles/runs/${id}`)
    if (run.status !== 'running') return run
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`el pedido ${id} siguió escribiendo más de ${seconds} s`)
}

async function articleCount(): Promise<number> {
  return (await ok<unknown[]>('GET', '/articles')).length
}

function assertIssue(reply: { status: number, body: unknown }, path: string): void {
  const body = reply.body as ErrorBody
  assert.equal(reply.status, 400, JSON.stringify(body))
  assert.equal(body.code, 'invalid')
  assert.deepEqual(body.errors.map(e => e.path), [path])
  assert.doesNotMatch(`${body.error} ${body.errors[0]!.message}`, JARGON)
}

describe('el contrato del artículo de Eros (sin red)', () => {
  test('una tabla o HTML fuera del código no se publican; dentro del código sí', () => {
    assert.match(markdownProblem('Texto\n\n| a | b |\n|---|---|\n| 1 | 2 |') ?? '', /tabla/)
    assert.match(markdownProblem('Hola <div>mundo</div>') ?? '', /HTML/)
    assert.match(markdownProblem('Un comentario <!-- oculto -->') ?? '', /HTML/)
    assert.equal(markdownProblem('```html\n<div>|a|b|</div>\n```\n\nY `<br>` en línea, 3 < 4 y a | b.'), null)
    assert.equal(markdownProblem('Un `Ref` es un Array<string> o un Map<K, V> en el texto.'), null)
    assert.match(markdownProblem('Una imagen <img src="x.png"> suelta') ?? '', /HTML/)
  })

  test('los dos idiomas completos, recortados y con los topes del admin', () => {
    const text = { title: `  ${'Título largo '.repeat(20)}`, summary: ' Bajada. ', markdown: '## Uno\r\n\r\nTexto.' }
    const parsed = normalizeErosArticle({ topic: ' Tema ', project_slug: 'La-Rucula', tags: ['Vue', 'vue', '', 3], es: text, en: { ...text, title: 'Title' }, model: 'm' })
    assert.equal(parsed.ok, true)
    if (!parsed.ok) return
    assert.ok(parsed.article.es.title.length <= 160)
    assert.ok(parsed.article.es.title.endsWith('…'))
    assert.equal(parsed.article.es.summary, 'Bajada.')
    assert.equal(parsed.article.es.markdown, '## Uno\n\nTexto.')
    assert.deepEqual(parsed.article.tags, ['vue', '3'])
    assert.equal(parsed.article.projectSlug, 'la-rucula')
    const missing = normalizeErosArticle({ es: text, en: { title: 'T', summary: '', markdown: 'x' } })
    assert.equal(missing.ok, false)
    if (!missing.ok) assert.match(missing.error, /inglés/)
    assert.equal(normalizeErosArticle(null).ok, false)
  })
})

describe('lo que se pide se valida antes de preguntarle a Eros (todos los modos)', () => {
  test('tema, obra y tendencia inválidos → 400 en español con su campo', async () => {
    assertIssue(await admin('POST', '/articles/generate', { topic: 42 }), 'topic')
    assertIssue(await admin('POST', '/articles/generate', { topic: 'x'.repeat(301) }), 'topic')
    assertIssue(await admin('POST', '/articles/generate', { projectSlug: 'una-obra-que-no-existe' }), 'projectSlug')
    assertIssue(await admin('POST', '/articles/generate', { trendId: 'a/b' }), 'trendId')
  })

  test('una tendencia de muestra no se vuelve artículo y nunca llega a Eros', async () => {
    if (online) await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const before = await articleCount()
    const reply = await admin<ErrorBody>('POST', '/articles/generate', { trendId: 'demo-tendencia-postgres' })
    assert.equal(reply.status, 400)
    assert.match(reply.body.error, /muestra/)
    assert.equal(await articleCount(), before)
    if (online) assert.deepEqual(await mockRequests(), [])
  })

  test('un pedido que no existe da 404 y una dirección rara 400', async () => {
    assert.equal((await admin('GET', '/articles/runs/999999')).status, 404)
    assert.equal((await admin('GET', '/articles/runs/abc')).status, 400)
  })

  test('la lista de pedidos dice que el horario está apagado (admin-run lo apaga)', async () => {
    const list = await ok<ArticleRunList>('GET', '/articles/runs?limit=3')
    assert.equal(list.weekly, false)
    assert.equal(list.next, null)
    assert.ok(list.runs.length <= 3)
  })
})

if (!online) describe('sin Eros (sin --eros-mock; con --demo tampoco hay artículo de muestra)', () => {
  test('pedir responde 503 { offline: true }, el pedido queda fallido y no se publica nada', async () => {
    const before = await articleCount()
    const reply = await admin<ErrorBody>('POST', '/articles/generate', { topic: 'PostgreSQL' })
    assert.equal(reply.status, 503, JSON.stringify(reply.body))
    assert.equal(reply.body.code, 'offline')
    assert.equal(reply.body.offline, true)
    assert.match(reply.body.error, /^Eros no responde/)
    assert.match(reply.body.error, /No se publicó nada/)
    assert.equal(reply.body.run?.status, 'failed')
    assert.equal(reply.body.run?.trigger, 'manual')
    assert.equal(await articleCount(), before)
    const { runs } = await ok<ArticleRunList>('GET', '/articles/runs')
    assert.equal(runs[0]?.id, reply.body.run?.id)
    assert.equal(runs[0]?.article, null)
  })
})

if (online) describe('con Eros (--eros-mock)', () => {
  after(() => mode('ok'))

  test('pedir → 202, Eros escribe y el artículo sale publicado en español y en inglés', async () => {
    await mode('ok')
    await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const titles = (await ok<{ title: string }[]>('GET', '/articles')).map(a => a.title)
    const reply = await admin<ArticleRunReply>('POST', '/articles/generate', { topic: '  Errores de API  ', projectSlug: 'la-rucula' })
    assert.equal(reply.status, 202, JSON.stringify(reply.body))
    assert.equal(reply.body.run.status, 'running')
    assert.equal(reply.body.run.trigger, 'manual')
    assert.equal(reply.body.run.topic, 'Errores de API')

    const sent = (await mockRequests()).find(r => r.path === '/api/articles/generate')?.body
    assert.equal(sent?.['topic'], 'Errores de API')
    assert.equal(sent?.['project_slug'], 'la-rucula')
    assert.equal(sent?.['trend_id'], undefined)
    assert.deepEqual([...(sent?.['avoid_titles'] as string[])].sort(), [...titles].sort(), 'avoid_titles son los títulos que ya hay')

    const run = await settled(reply.body.run.id)
    assert.equal(run.status, 'done', run.error ?? '')
    assert.ok(run.article, 'el pedido hecho trae su artículo')
    assert.equal(run.article.title, 'Una sola forma de error para toda la API')
    assert.equal(run.error, null)
    assert.ok(run.finishedAt)

    const saved = await ok<AdminArticle>('GET', `/articles/${run.article.id}`)
    assert.equal(saved.status, 'PUBLISHED')
    assert.ok(saved.publishedAt && Date.parse(saved.publishedAt) <= Date.now())
    assert.equal(saved.featured, false)
    assert.equal(saved.readingTimeMin, 1)
    assert.notEqual(saved.projectId, null)
    assert.deepEqual(saved.techs.map(t => t.slug).sort(), ['node', 'postgresql', 'vue'], 'las etiquetas que existen, Node.js incluida; «inventada» no')
    assert.equal(saved.translations.find(t => t.locale === 'en')?.title, 'One error shape for the whole API')

    const es = await call<{ data: PublicArticle }>('GET', `/api/articles/${run.article.slug}`)
    assert.equal(es.status, 200, 'la API pública lo sirve enseguida (forgetLastGood)')
    assert.equal(es.body.data.title, 'Una sola forma de error para toda la API')
    assert.match(es.body.data.content, /^## El problema/)
    const en = await call<{ data: PublicArticle }>('GET', `/api/articles/${run.article.slug}?lang=en`)
    assert.equal(en.body.data.title, 'One error shape for the whole API')
    assert.equal(en.body.data.summary, 'How a single error format keeps the client, the forms and the logs in order.')
    assert.deepEqual(en.body.data.untranslated, [])
    const list = await call<{ data: { slug: string }[] }>('GET', '/api/articles')
    assert.ok(list.body.data.some(a => a.slug === run.article!.slug))
  })

  test('mientras Eros escribe, otro pedido da 409 con el que está en curso', async () => {
    await mode('lento')
    const first = await admin<ArticleRunReply>('POST', '/articles/generate', {})
    assert.equal(first.status, 202, JSON.stringify(first.body))
    const second = await admin<ErrorBody>('POST', '/articles/generate', { topic: 'Otro' })
    assert.equal(second.status, 409)
    assert.equal(second.body.code, 'conflict')
    assert.match(second.body.error, /ya está escribiendo/)
    assert.equal(second.body.run?.id, first.body.run.id)
    await mode('ok')
    const run = await settled(first.body.run.id)
    assert.equal(run.status, 'done', run.error ?? '')
    assert.match(run.article?.slug ?? '', /-2$/, 'el mismo título toma la primera dirección libre')
  })

  test('si Eros falla, el pedido queda fallido con su motivo y su código, y no se publica nada', async () => {
    await mode('falla')
    const before = await articleCount()
    const reply = await admin<ArticleRunReply>('POST', '/articles/generate', {})
    assert.equal(reply.status, 202)
    const run = await settled(reply.body.run.id)
    assert.equal(run.status, 'failed')
    assert.equal(run.errorCode, 'llm_unavailable')
    assert.match(run.error ?? '', /El modelo de IA no está disponible/)
    assert.match(run.error ?? '', /No se publicó nada/)
    assert.doesNotMatch(run.error ?? '', JARGON)
    assert.equal(run.article, null)
    assert.equal(await articleCount(), before)
  })

  test('un texto con una tabla se rechaza: pedido fallido, nada publicado', async () => {
    await mode('tabla')
    const before = await articleCount()
    const reply = await admin<ArticleRunReply>('POST', '/articles/generate', {})
    const run = await settled(reply.body.run.id)
    assert.equal(run.status, 'failed')
    assert.equal(run.errorCode, 'invalid_output')
    assert.match(run.error ?? '', /tabla/)
    assert.equal(await articleCount(), before)
  })

  test('desde una tendencia: origen trend y Eros recibe la tendencia', async () => {
    await mode('ok')
    await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const reply = await admin<ArticleRunReply>('POST', '/articles/generate', { trendId: 'eros-mock-trend-postgres' })
    assert.equal(reply.status, 202)
    assert.equal(reply.body.run.trigger, 'trend')
    assert.equal(reply.body.run.trendId, 'eros-mock-trend-postgres')
    const sent = (await mockRequests()).find(r => r.path === '/api/articles/generate')?.body
    assert.equal(sent?.['trend_id'], 'eros-mock-trend-postgres')
    assert.equal((await settled(reply.body.run.id)).status, 'done')
  })

  test('una tendencia que Eros no conoce: 202 y el pedido falla con trend_not_found, en español', async () => {
    await mode('ok')
    const reply = await admin<ArticleRunReply>('POST', '/articles/generate', { trendId: 'una-tendencia-que-eros-no-tiene' })
    assert.equal(reply.status, 202)
    const run = await settled(reply.body.run.id)
    assert.equal(run.status, 'failed')
    assert.equal(run.errorCode, 'trend_not_found')
    assert.match(run.error ?? '', /^Eros no encontró esa tendencia/)
    assert.doesNotMatch(run.error ?? '', /not found/)
  })

  test('la lista trae los pedidos del más nuevo al más viejo, con el artículo de los hechos', async () => {
    const { runs, next, weekly } = await ok<ArticleRunList>('GET', '/articles/runs?limit=50')
    assert.equal(weekly, false)
    assert.equal(next, null)
    assert.ok(runs.length >= 6)
    const times = runs.map(r => Date.parse(r.startedAt))
    assert.deepEqual(times, [...times].sort((a, b) => b - a))
    assert.equal(runs[0]?.trigger, 'trend')
    assert.equal(runs[0]?.errorCode, 'trend_not_found')
    for (const run of runs) {
      assert.notEqual(run.status, 'running')
      assert.equal(run.status === 'done', run.article !== null)
    }
    assert.equal((await ok<ArticleRunList>('GET', '/articles/runs?limit=2')).runs.length, 2)
  })

  test('con el Eros de antes, que no escribe artículos: 502 diciendo que falta actualizarlo', async () => {
    await fetch(`${eros}/__antes`, { method: 'PUT' })
    try {
      const reply = await admin<ErrorBody>('POST', '/articles/generate', {})
      assert.equal(reply.status, 502)
      assert.equal(reply.body.code, 'eros_error')
      assert.match(reply.body.error, /todavía no escribe artículos/)
      assert.equal(reply.body.run?.errorCode, 'not_supported')
    }
    finally {
      await fetch(`${eros}/__antes`, { method: 'DELETE' })
    }
  })
})
