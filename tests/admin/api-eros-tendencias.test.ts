/**
 * Tendencias en el servidor: contrato normalizado, estados honestos sin Eros y la muestra que no se
 * cambia. Una tendencia se vuelve artículo por POST /articles/generate { trendId }
 * (tests/admin/api-articulos-eros.test.ts). Corre en los tres modos; cada bloque dice en cuál.
 * `pnpm test:e2e` corre los tres:
 *
 * admin-run: sin Eros
 * admin-run: --demo
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-eros-tendencias.test.ts              (sin Eros)
 *   node scripts/admin-run.mjs --demo -- pnpm tsx --test tests/admin/api-eros-tendencias.test.ts       (muestra)
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-eros-tendencias.test.ts  (Eros simulado)
 *
 * El modo muestra se reconoce por /hunter/stats (la muestra de vacantes de H0), no por estas rutas.
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { Trend, TrendChange, TrendScan } from '../../server/src/shared/radarContracts.js'
import { admin, JARGON, ok } from './api.js'

const base = process.env['ADMIN_API_URL']!
const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface ErrorBody { error: string, code: string, offline?: boolean, errors: { path: string, message: string }[] }

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
  test('un estado inválido → 400 en español con su campo', async () => {
    const reply = await admin<ErrorBody>('PATCH', '/radar/trends/cualquiera/status', { status: 'LEIDA' })
    assert.equal(reply.status, 400)
    assert.equal(reply.body.code, 'invalid')
    assert.deepEqual(reply.body.errors.map(e => e.path), ['status'])
    assert.doesNotMatch(`${reply.body.error} ${reply.body.errors[0]!.message}`, JARGON)
  })

  test('un cambio sobre la muestra nunca llega a Eros ni se guarda', async () => {
    if (online) await fetch(`${eros}/__requests`, { method: 'DELETE' })
    const reply = await admin<ErrorBody>('PATCH', '/radar/trends/demo-tendencia-postgres/status', { status: 'DISCARDED' })
    assert.equal(reply.status, 400)
    assert.match(reply.body.error, /muestra/)
    if (online) assert.ok((await mockRequests()).every(r => !r.path.includes('demo-')))
  })

  test('crear una publicación desde una tendencia ya no existe', async () => {
    assert.equal((await admin('POST', '/radar/trends/eros-mock-trend-postgres/generate', {})).status, 404)
  })
})

if (offline) describe('sin Eros ni muestra (sin --eros-mock ni --demo)', () => {
  test('las lecturas responden 503 { offline: true }', async () => {
    assertOffline(await admin('GET', '/radar/trends'))
    assertOffline(await admin('GET', '/radar/trends/eros_real_1'))
    assert.equal((await admin('GET', '/radar/trends/demo-algo')).status, 404)
  })

  test('las escrituras responden 503 diciendo qué no pasó', async () => {
    assertOffline(await admin('POST', '/radar/scan'), /No se buscaron tendencias nuevas/)
    assertOffline(await admin('PATCH', '/radar/trends/eros_real_1/status', { status: 'DISCARDED' }), /El estado no cambió/)
  })
})

if (demo) describe('muestra sin Eros (--demo)', () => {
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
    assert.equal((await ok<Trend>('GET', '/radar/trends/demo-tendencia-postgres')).demo, true)
  })
})

if (online) describe('con Eros (--eros-mock)', () => {
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
    assert.equal('post_id' in nuxt, false, 'la publicación de Eros ya no viaja')
  })

  test('detalle, 404 en español, buscar y estado', async () => {
    assert.equal((await ok<Trend>('GET', '/radar/trends/eros-mock-trend-postgres')).title, 'PostgreSQL como base relacional y de vectores')
    const missing = await admin<ErrorBody>('GET', '/radar/trends/no-existe')
    assert.equal(missing.status, 404)
    assert.match(missing.body.error, /Eros no tiene esa tendencia/)
    const scan = await ok<TrendScan>('POST', '/radar/scan')
    assert.equal(scan.total_found, 12)
    assert.equal(scan.new_trends, 1)
    assert.equal(scan.trends.length, 1)
    // Eros responde { ok, id, status } sin la tendencia: la UI usa el estado que pidió.
    const changed = await ok<TrendChange>('PATCH', '/radar/trends/eros-mock-trend-postgres/status', { status: 'DISCARDED' })
    assert.deepEqual(changed, { ok: true, trend: null })
  })
})
