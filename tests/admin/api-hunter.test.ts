/**
 * Job Hunter en el servidor (H0): contrato con Eros, una sola fuente del CV, la caché por vacante y la
 * política sin Eros. Corre en los dos modos; cada bloque dice en cuál. `pnpm test:e2e` corre los dos:
 *
 * admin-run: sin Eros
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-hunter.test.ts              (sin Eros)
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-hunter.test.ts  (Eros simulado)
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import type { AdminStatus } from '../../server/src/shared/adminContracts.js'
import type { CvDocument } from '../../server/src/content/cv.js'
import type { BatchEvaluation, HunterJob, HunterStats, JobChange, Pitch, PurgeResult, ScanResult, TailoredCv } from '../../server/src/shared/hunterContracts.js'
import { extractHints, normalizeErosCv } from '../../server/src/admin/erosHints.js'
import { erosState, forwardToEros } from '../../server/src/admin/proxy.js'
import { admin, call, JARGON, ok } from './api.js'

const base = process.env['ADMIN_API_URL']!
const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface Envelope<T> { data: T }
interface ErrorBody { error: string, code: string, offline?: boolean }

const job = (title: string, description: string) => ({ job: { title, company: 'Ejemplo', description, tags: [], url: '', contact_email: '' } })
const frontend = job('Desarrollador Frontend', 'Vue 3 y Nuxt')

/** Un pedido sin el token del admin: lo que hace una pestaña o un iframe con ticket. */
async function bare(path: string): Promise<{ status: number, type: string, text: string }> {
  const res = await fetch(`${base}/api/admin${path}`)
  return { status: res.status, type: res.headers.get('content-type') ?? '', text: await res.text() }
}

async function ticket(id: string): Promise<string> {
  return (await ok<{ ticket: string }>('POST', `/hunter/cv/${id}/ticket`)).ticket
}

async function siteCv(lang: 'es' | 'en' = 'es'): Promise<CvDocument> {
  return (await call<Envelope<CvDocument>>('GET', `/api/cv?lang=${lang}`)).body.data
}

async function mockRequests(): Promise<{ method: string, path: string }[]> {
  return (await fetch(`${eros}/__requests`)).json() as Promise<{ method: string, path: string }[]>
}

/** El CV entero en un texto, para buscar lo que no puede estar. */
const flat = (cv: TailoredCv['data']) => JSON.stringify(cv)

function assertSpanishOffline(reply: { status: number, body: ErrorBody }, consequence?: RegExp): void {
  assert.equal(reply.status, 503, JSON.stringify(reply.body))
  assert.equal(reply.body.offline, true)
  assert.equal(reply.body.code, 'offline')
  assert.match(reply.body.error, /^Eros no responde/)
  assert.doesNotMatch(reply.body.error, /Circuit Breaker|cooldown|OPEN/i)
  assert.doesNotMatch(reply.body.error, JARGON)
  if (consequence) assert.match(reply.body.error, consequence)
}

describe('pistas de Eros (sin red)', () => {
  test('del CV simulado solo queda lo que existe en la base', async () => {
    const fixture = JSON.parse(readFileSync(new URL('./fixtures/eros/cv.json', import.meta.url), 'utf8')) as unknown
    const cv = await siteCv()
    const hints = extractHints(normalizeErosCv(fixture)!, cv)
    const names = cv.skills.flatMap(g => g.items)
    assert.ok(hints.techs.every(t => names.includes(t)))
    assert.ok(hints.entries.every(slug => cv.experience.some(e => e.slug === slug)))
    for (const [slug, order] of Object.entries(hints.bullets)) {
      const entry = cv.experience.find(e => e.slug === slug)!
      assert.ok(order.every(i => i >= 0 && i < entry.highlights.length))
    }
    const discarded = hints.discarded.map(d => `${d.kind}:${d.value}`)
    assert.ok(discarded.includes('category:Superpoderes'))
    assert.ok(discarded.includes('entry:Portafolio Dos Mundos'))
    assert.ok(discarded.some(d => d.startsWith('bullet:') && d.includes('3 años')))
    assert.match(hints.summaryProposal ?? '', /3 años/)
  })

  test('sin HUNTER_API_URL Eros queda «no configurado» y no se le pregunta nada', async () => {
    const saved = process.env['HUNTER_API_URL']
    process.env['HUNTER_API_URL'] = ''
    try {
      assert.equal(erosState().state, 'unconfigured')
      const result = await forwardToEros('api/jobs')
      assert.equal(result.status, 503)
      assert.equal(result.failure?.reason, 'unconfigured')
      assert.match(result.failure?.message ?? '', /HUNTER_API_URL/)
    }
    finally {
      process.env['HUNTER_API_URL'] = saved
    }
  })
})

describe('el CV, con Eros o sin él', () => {
  test('dev-token con ADMIN_TOKEN definido da 401', async () => {
    const res = await fetch(`${base}/api/admin/meta`, { headers: { Authorization: 'Bearer dev-token' } })
    assert.equal(res.status, 401)
  })

  test('sin la vacante en el cuerpo responde 400 en español', async () => {
    const reply = await admin<ErrorBody & { errors: { path: string }[] }>('POST', '/hunter/cv/sin-cuerpo', {})
    assert.equal(reply.status, 400)
    assert.equal(reply.body.error, 'Falta la descripción de la vacante.')
    assert.deepEqual(reply.body.errors.map(e => e.path), ['job.description'])
  })

  test('una vacante pegada sale de la base, en español, y su hoja y su texto son el mismo CV', async () => {
    const id = 'manual-abc123'
    const cv = await siteCv()
    const reply = await admin<TailoredCv>('POST', `/hunter/cv/${id}`, frontend)
    assert.equal(reply.status, 200)
    assert.equal(reply.body._source, 'fallback')
    assert.equal(reply.body.data.lang, 'es')
    assert.equal(reply.body.data.name, cv.header.name)
    assert.equal(reply.body.summaryProposal, null)

    const t = await ticket(id)
    const text = await bare(`/hunter/cv/${id}/txt?ticket=${t}`)
    assert.equal(text.status, 200)
    assert.match(text.type, /text\/plain/)
    assert.ok(text.text.startsWith(`${cv.header.name}\n`))
    assert.doesNotMatch(text.text, /<[a-z][^>]*>/i)
    for (const bullet of reply.body.data.experience.flatMap(e => e.bullets)) assert.ok(text.text.includes(`- ${bullet}`))

    const html = await bare(`/hunter/cv/${id}/html?ticket=${t}`)
    assert.equal(html.status, 200)
    assert.ok(html.text.includes('<html lang="es">'))
    assert.ok(html.text.includes('@page { size: A4; margin: 10.5mm 12mm; }'))
  })

  test('sin CV en la caché: 409 cv_expired; con el ticket de otra vacante: 401; el PDF de Eros no existe', async () => {
    const missing = await admin<ErrorBody>('GET', '/hunter/cv/otra/html')
    assert.equal(missing.status, 409)
    assert.equal(missing.body.code, 'cv_expired')
    assert.equal((await admin<ErrorBody>('GET', '/hunter/cv/otra/txt')).status, 409)

    await ok('POST', '/hunter/cv/manual-propia', frontend)
    const foreign = await ticket('manual-propia')
    assert.equal((await bare(`/hunter/cv/otra/html?ticket=${foreign}`)).status, 401)
    assert.equal((await bare(`/hunter/cv/otra/txt?ticket=${foreign}`)).status, 401)
    assert.equal((await admin('GET', '/hunter/cv/x/pdf')).status, 404)
  })

  test('/cv-base/html es la hoja base, no la de una vacante con id «base»', async () => {
    await ok('POST', '/hunter/cv/base', frontend)
    const vacancy = await ticket('base')
    const own = (await ok<{ ticket: string }>('POST', '/hunter/cv-base/ticket')).ticket
    assert.equal((await bare(`/hunter/cv-base/html?lang=en&ticket=${vacancy}`)).status, 401)

    const sheet = await bare(`/hunter/cv-base/html?lang=en&ticket=${own}`)
    assert.equal(sheet.status, 200)
    assert.ok(sheet.text.includes('<html lang="en">'))
    assert.ok(!sheet.text.includes('Stack para esta búsqueda'))
    const [english, spanish] = await Promise.all([siteCv('en'), siteCv('es')])
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    assert.ok(english.summary && sheet.text.includes(`<p>${escape(english.summary)}</p>`))
    if (spanish.summary !== english.summary) assert.ok(!sheet.text.includes(escape(spanish.summary ?? '')))

    const measured = await bare(`/hunter/cv-base/html?lang=es&measure=1&ticket=${own}`)
    assert.ok(measured.text.includes('cv-measure') && measured.text.includes('class="measure"'))
  })

  test('el estado de una vacante se valida antes de ir a Eros', async () => {
    const reply = await admin<ErrorBody>('PATCH', '/hunter/jobs/x/status', { status: 'inventado' })
    assert.equal(reply.status, 400)
    assert.equal(reply.body.code, 'invalid')
  })
})

if (!online) {
  describe('sin Eros', () => {
    test('la cola y sus números: 503 { offline: true } en español', async () => {
      assertSpanishOffline(await admin<ErrorBody>('GET', '/hunter/jobs'))
      assertSpanishOffline(await admin<ErrorBody>('GET', '/hunter/stats'))
    })

    test('las escrituras dicen qué no pasó', async () => {
      assertSpanishOffline(await admin<ErrorBody>('PATCH', '/hunter/jobs/x/status', { status: 'applied' }), /El estado no cambió/)
      assertSpanishOffline(await admin<ErrorBody>('POST', '/hunter/scan'), /No se buscaron vacantes nuevas/)
      assertSpanishOffline(await admin<ErrorBody>('DELETE', '/hunter/jobs/x'), /no se borró/)
      assertSpanishOffline(await admin<ErrorBody>('POST', '/hunter/search/semantic', { query: 'vue' }))
    })

    test('una vacante de Eros se analiza, se escribe y se adapta desde la base', async () => {
      const cv = await admin<TailoredCv>('POST', '/hunter/cv/eros_real_123', frontend)
      assert.equal(cv.status, 200)
      assert.equal(cv.body.data.lang, 'es')
      assert.equal(cv.body._source, 'fallback')
      const pitch = await admin<{ data: Pitch }>('POST', '/hunter/jobs/eros_real_123/pitch', frontend)
      assert.equal(pitch.body.data.lang, 'es')
      const evaluation = await admin<{ match: { score: number } }>('POST', '/hunter/jobs/eros_real_123/evaluate', frontend)
      assert.ok(evaluation.body.match.score >= 0 && evaluation.body.match.score <= 100)

      const t = await ticket('eros_real_123')
      const text = await bare(`/hunter/cv/eros_real_123/txt?ticket=${t}`)
      assert.ok(text.text.startsWith(`${(await siteCv()).header.name}\n`))
    })

    test('/status dice que Eros no responde', async () => {
      const status = await ok<AdminStatus>('GET', '/status')
      assert.ok(['down', 'cooldown'].includes(status.eros.state))
    })
  })
}

if (online) {
  describe('con el Eros simulado', () => {
    test('la cola, los números y el escaneo llegan con el contrato normalizado', async () => {
      const jobs = await ok<HunterJob[]>('GET', '/hunter/jobs')
      assert.ok(jobs.length >= 2)
      assert.ok(jobs.every(j => typeof j.is_remote === 'boolean' && Array.isArray(j.tags) && j._source === 'eros'))
      assert.equal(typeof jobs[0]!.match_analysis, 'string')
      const stats = await ok<HunterStats>('GET', '/hunter/stats')
      assert.equal(stats.total, 2)
      assert.equal(stats.high_match_count, 1)
      const scan = await ok<ScanResult>('POST', '/hunter/scan')
      assert.deepEqual(scan, { scanned: 42, new_jobs: 2, evaluated_count: 0, vectorized: 2 })
      const semantic = await ok<{ results: HunterJob[] }>('POST', '/hunter/search/semantic', { query: 'vue' })
      assert.equal(semantic.results[0]!.semantic_score, 82)
    })

    test('escanear y evaluar esperan la tarea del Eros de ahora y aceptan la respuesta directa del de antes', async () => {
      const eros = process.env['HUNTER_API_URL'] ?? ''
      await fetch(`${eros}/__requests`, { method: 'DELETE' })
      const scan = await ok<ScanResult>('POST', '/hunter/scan')
      assert.deepEqual(scan, { scanned: 42, new_jobs: 2, evaluated_count: 0, vectorized: 2 })
      const calls = ((await (await fetch(`${eros}/__requests`)).json()) as { method: string, path: string }[]).map(r => `${r.method} ${r.path}`)
      assert.deepEqual(calls.filter(c => c.startsWith('GET /api/tasks/')).length, 2, 'consulta la tarea hasta que dice done')
      const batch = await ok<BatchEvaluation>('POST', '/hunter/evaluate')
      assert.deepEqual([batch.evaluated_count, batch.evaluated[0]?.id], [1, 'eros-mock-backend'])
      assert.deepEqual(await ok<PurgeResult>('POST', '/hunter/purge'), { purged_count: 1 })

      await fetch(`${eros}/__antes`, { method: 'PUT' })
      try {
        assert.deepEqual(await ok<ScanResult>('POST', '/hunter/scan'), scan)
        assert.equal((await ok<BatchEvaluation>('POST', '/hunter/evaluate')).evaluated_count, 1)
        assert.deepEqual(await ok<PurgeResult>('POST', '/hunter/purge'), { purged_count: 1 })
      }
      finally {
        await fetch(`${eros}/__antes`, { method: 'DELETE' })
      }
    })

    test('el CV adaptado no trae nada que no esté en la base', async () => {
      const [cv, stack] = await Promise.all([siteCv(), call<Envelope<{ name: string }[]>>('GET', '/api/stack')])
      const reply = await admin<TailoredCv>('POST', '/hunter/cv/eros-mock-frontend', frontend)
      assert.equal(reply.status, 200)
      assert.equal(reply.body._source, 'eros')
      const data = reply.body.data
      assert.doesNotMatch(flat(data), /Dos Mundos|3 años|Svelte|CockroachDB|Universidad Inventada|otro@example\.com/)
      assert.equal(data.name, cv.header.name)
      assert.equal(data.email, cv.header.email)

      const highlights = cv.experience.flatMap(e => e.highlights)
      for (const bullet of data.experience.flatMap(e => e.bullets)) assert.ok(highlights.includes(bullet), `viñeta fuera de la base: ${bullet}`)
      const names = stack.body.data.map(t => t.name)
      for (const tech of Object.values(data.skills).flat()) assert.ok(names.includes(tech), `tecnología fuera de la base: ${tech}`)

      assert.ok(reply.body._adaptation.discarded.length >= 3)
      assert.ok(reply.body._adaptation.categories.length > 0)
      assert.equal(data.experience[0]!.title, cv.experience.find(e => e.slug === 'arg-piscinas')?.title ?? data.experience[0]!.title)
      assert.match(reply.body.summaryProposal ?? '', /3 años/)
      assert.equal(reply.body.usesSummaryProposal, false)
    })

    test('aceptar el resumen de Eros no le vuelve a preguntar', async () => {
      await fetch(`${eros}/__requests`, { method: 'DELETE' })
      const reply = await ok<TailoredCv>('POST', '/hunter/cv/eros-mock-frontend', { ...frontend, useSummaryProposal: true })
      assert.equal(reply.usesSummaryProposal, true)
      assert.equal(reply.data.summary, reply.summaryProposal)
      assert.equal((await mockRequests()).length, 0)
    })

    test('una vacante manual-* nunca va a Eros y un id que Eros no conoce cae al respaldo', async () => {
      await fetch(`${eros}/__requests`, { method: 'DELETE' })
      const manual = await admin<TailoredCv>('POST', '/hunter/cv/manual-abc123', frontend)
      assert.equal(manual.status, 200)
      assert.equal(manual.body._source, 'fallback')
      await ok('POST', '/hunter/jobs/manual-abc123/evaluate', frontend)
      await ok('POST', '/hunter/jobs/manual-abc123/pitch', frontend)
      assert.ok((await mockRequests()).every(r => !r.path.includes('manual-abc123')))

      const unknown = await admin<TailoredCv>('POST', '/hunter/cv/eros-desconocida', frontend)
      assert.equal(unknown.status, 200)
      assert.equal(unknown.body._source, 'fallback')
    })

    test('tres 404 de Eros no cortan: sigue «ok»', async () => {
      for (const id of ['no-1', 'no-2', 'no-3']) {
        const reply = await admin<{ _source: string }>('POST', `/hunter/jobs/${id}/evaluate`, frontend)
        assert.equal(reply.body._source, 'fallback')
      }
      assert.equal((await ok<AdminStatus>('GET', '/status')).eros.state, 'ok')
      assert.equal((await ok<HunterJob[]>('GET', '/hunter/jobs'))[0]!._source, 'eros')
    })

    test('pitch, análisis y estado pasan por el contrato', async () => {
      const pitch = await ok<{ data: Pitch, _source: string }>('POST', '/hunter/jobs/eros-mock-frontend/pitch', frontend)
      assert.equal(pitch._source, 'eros')
      assert.equal(pitch.data.lang, 'es')
      assert.equal(pitch.data.subject, 'Postulación simulada')
      const evaluation = await ok<{ match: { score: number, verdict: string } }>('POST', '/hunter/jobs/eros-mock-backend/evaluate', {})
      assert.deepEqual([evaluation.match.score, evaluation.match.verdict], [77, 'BUEN_MATCH'])
      // Eros responde { ok, job_id, new_status }, sin la vacante: el cambio va en status.
      const changed = await ok<JobChange>('PATCH', '/hunter/jobs/eros-mock-backend/status', { status: 'saved' })
      assert.equal(changed.status, 'saved')
      assert.equal(changed.job, null)
    })
  })
}
