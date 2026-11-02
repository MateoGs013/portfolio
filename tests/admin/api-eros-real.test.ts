/**
 * El admin contra las formas reales de Eros (docs/auditoria-eros.md): ids que no se reenvían, sin
 * seguir redirecciones, errores de Eros que no son caídas, el `detail` de un 422, las tareas largas,
 * de dónde sale el correo, el asunto en `subject_or_hook`, las estimaciones sin Gemini y «Enviar desde
 * Eros» apagado. Corre en los dos modos; cada bloque dice en cuál. `pnpm test:e2e` corre los dos:
 *
 * admin-run: sin Eros
 * admin-run: --eros-mock
 *
 *   node scripts/admin-run.mjs -- pnpm tsx --test tests/admin/api-eros-real.test.ts              (sin Eros)
 *   node scripts/admin-run.mjs --eros-mock -- pnpm tsx --test tests/admin/api-eros-real.test.ts  (Eros simulado)
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import type { AdminStatus } from '../../server/src/shared/adminContracts.js'
import type { ApplyPreview, FoundEmail, JobChange, JobEvaluation, Pitch } from '../../server/src/shared/hunterContracts.js'
import { awaitErosTask } from '../../server/src/admin/erosTask.js'
import { erosState, forwardToEros } from '../../server/src/admin/proxy.js'
import { admin, ok } from './api.js'

const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface ErrorBody { error: string, code: string, offline?: boolean, errors: { path: string }[] }

const job = (title: string, description: string, contact = '') => ({ job: { title, company: 'Ejemplo', description, tags: [], url: '', contact_email: contact } })

async function mockRequests(): Promise<{ method: string, path: string }[]> {
  return (await fetch(`${eros}/__requests`)).json() as Promise<{ method: string, path: string }[]>
}

const forget = () => fetch(`${eros}/__requests`, { method: 'DELETE' })

describe('lo que nunca llega a Eros', () => {
  test('un id raro responde 400 en español en cada ruta que reenvía a Eros', async () => {
    if (online) await forget()
    const attempts: [string, string, unknown?][] = [
      ['DELETE', '/hunter/jobs/%2F'],
      // Un .. literal lo normaliza la URL antes de salir; uno dentro del id no pasa.
      ['PATCH', '/hunter/jobs/a.b/status', { status: 'saved' }],
      ['POST', '/hunter/jobs/a%20b/evaluate', job('Frontend', 'Vue')],
      ['POST', '/hunter/jobs/a%2Fb/find-email'],
      ['POST', '/hunter/cv/a%3Fb', job('Frontend', 'Vue')],
      ['GET', '/content/posts/%2F'],
      ['DELETE', '/content/posts/x%2F..'],
      ['POST', '/content/carousel/%2F/ticket'],
      ['PATCH', '/radar/trends/%2F/status', { status: 'DISCARDED' }],
    ]
    for (const [method, path, body] of attempts) {
      const reply = await admin<ErrorBody>(method, path, body)
      assert.equal(reply.status, 400, `${method} ${path} → ${reply.status}`)
      assert.equal(reply.body.code, 'invalid')
      assert.match(reply.body.error, /identificador no es válido/)
      assert.deepEqual(reply.body.errors.map(e => e.path), ['id'])
    }
    if (online) assert.deepEqual(await mockRequests(), [], 'ninguno llegó a Eros (DELETE /api/jobs borraba la cola)')
  })

  test('«Enviar desde Eros» está apagado: 409 send_disabled sin preguntarle a Eros', async () => {
    if (online) await forget()
    const reply = await admin<ErrorBody>('POST', '/hunter/jobs/eros-mock-frontend/apply-email', { to_email: 'empleos@example.com', subject: 'Hola', body: 'Texto' })
    assert.equal(reply.status, 409)
    assert.equal(reply.body.code, 'send_disabled')
    assert.match(reply.body.error, /Enviar desde Eros está apagado.*Gmail.*Ya la envié/)
    if (online) assert.deepEqual(await mockRequests(), [])
  })

  test('sin respuesta de Eros, «Buscar correo» devuelve el que trae la vacante con su origen, nunca uno adivinado', async () => {
    // Eros no conoce esta vacante (404 del simulado) o no responde: el respaldo es el contacto que trae.
    const found = await ok<FoundEmail>('POST', '/hunter/jobs/eros-desconocida/find-email', job('Frontend', 'Escribí a rrhh@example.com', 'rrhh@example.com'))
    assert.deepEqual({ email: found.email, found: found.found, origin: found.origin }, { email: 'rrhh@example.com', found: false, origin: 'posting' })
    const preview = await ok<ApplyPreview>('POST', '/hunter/jobs/eros-desconocida/apply-preview', job('Frontend', 'Vue 3', 'alguien@example.com'))
    assert.equal(preview.email_origin, 'unknown', 'un contacto que no figura en el aviso no se sabe de dónde salió')
    // En una pegada a mano el correo lo escribió quien la pegó: no se le pone origen.
    const manual = await ok<ApplyPreview>('POST', '/hunter/jobs/manual-otro/apply-preview', job('Frontend', 'Vue 3', 'alguien@example.com'))
    assert.equal(manual.email_origin, null)
  })
})

if (online) {
  describe('con el Eros simulado (formas reales)', () => {
    test('una redirección de Eros no se sigue y no es una caída', async () => {
      await forget()
      const reply = await admin<ErrorBody>('PATCH', '/hunter/jobs/eros-mock-redirige/status', { status: 'saved' })
      assert.equal(reply.status, 502)
      assert.equal(reply.body.code, 'eros_error')
      assert.match(reply.body.error, /redirección/)
      assert.deepEqual((await mockRequests()).map(r => r.path), ['/api/jobs/eros-mock-redirige/status'], 'un solo pedido: el 307 no se siguió')
      assert.equal((await ok<AdminStatus>('GET', '/status')).eros.state, 'ok')
    })

    test('un 5xx dice «Eros respondió con un error», no «no responde», y no corta', async () => {
      for (let i = 0; i < 3; i++) {
        const reply = await admin<ErrorBody>('PATCH', '/hunter/jobs/eros-mock-falla/status', { status: 'saved' })
        assert.equal(reply.status, 502)
        assert.equal(reply.body.code, 'eros_error')
        assert.equal(reply.body.offline, false)
        assert.match(reply.body.error, /^Eros respondió con un error \(500\)\. El estado no cambió\.$/)
      }
      assert.equal((await ok<AdminStatus>('GET', '/status')).eros.state, 'ok')
    })

    test('un 422 de Eros muestra su detail con una entrada en español', async () => {
      const reply = await admin<ErrorBody>('PATCH', '/hunter/jobs/eros-mock-frontend/contact-email', { contact_email: null })
      assert.equal(reply.status, 400)
      assert.equal(reply.body.error, 'Eros no aceptó el pedido. Eros dijo: «Input should be a valid string». El correo de contacto no cambió.')
    })

    test('una tarea que Eros perdió (se reinició) no se da por hecha', async () => {
      process.env['EROS_API_KEY'] = 'offline'
      const accepted = { ok: true, status: 202, data: { task_id: 'scan_perdida' }, failure: null }
      const lost = await awaitErosTask(accepted, Date.now(), 10_000)
      assert.equal(lost.ok, false)
      assert.equal((lost.data as ErrorBody).code, 'eros_error')
      assert.match((lost.data as ErrorBody).error, /perdió la tarea/)
      const direct = { ok: true, status: 200, data: { scanned: 1 }, failure: null }
      assert.equal(await awaitErosTask(direct, Date.now(), 10_000), direct, 'la respuesta directa del Eros de antes pasa tal cual')
    })

    test('una tarea larga cortada no cuenta como caída; un corte común sí', async () => {
      // El proxy corre en este proceso: la clave del simulado, nunca la del .env.
      process.env['EROS_API_KEY'] = 'offline'
      const busy = await forwardToEros('api/lento', undefined, 300, { longTask: true })
      assert.equal(busy.status, 504)
      assert.equal(busy.failure?.reason, 'busy')
      assert.equal((busy.data as ErrorBody).code, 'eros_busy')
      assert.equal(erosState().state, 'ok')
      const cut = await forwardToEros('api/lento', undefined, 300)
      assert.equal(cut.failure?.reason, 'timeout')
      assert.equal(erosState().state, 'down')
      assert.equal((await forwardToEros('api/stats')).ok, true)
      assert.equal(erosState().state, 'ok')
    })

    test('«Buscar correo» lee contact_email_source: del aviso o de Hunter.io', async () => {
      const posting = await ok<FoundEmail & { _source: string }>('POST', '/hunter/jobs/eros-mock-frontend/find-email')
      assert.deepEqual([posting.email, posting.found, posting.origin, posting.source, posting._source], ['empleos@example.com', true, 'posting', 'posting', 'eros'])
      const hunter = await ok<FoundEmail>('POST', '/hunter/jobs/eros-mock-backend/find-email')
      assert.deepEqual([hunter.email, hunter.origin, hunter.source], ['seleccion@example.com', 'hunter', 'hunter'])
    })

    test('con el Eros de antes, «Buscar correo» lee source y marca el adivinado', async () => {
      await fetch(`${eros}/__antes`, { method: 'PUT' })
      try {
        const posting = await ok<FoundEmail>('POST', '/hunter/jobs/eros-mock-frontend/find-email')
        assert.deepEqual([posting.email, posting.found, posting.origin, posting.source], ['empleos@example.com', true, 'posting', 'description'])
        const guessed = await ok<FoundEmail>('POST', '/hunter/jobs/eros-mock-backend/find-email')
        assert.deepEqual([guessed.email, guessed.origin, guessed.source], ['jobs@example.com', 'guessed', 'domain_guessing'])
        const preview = await ok<ApplyPreview>('POST', '/hunter/jobs/eros-mock-frontend/apply-preview', {})
        assert.equal(preview.email_origin, 'posting', 'sin contact_email_source sale de is_email_extracted')
      }
      finally {
        await fetch(`${eros}/__antes`, { method: 'DELETE' })
      }
    })

    test('la vista previa lleva el origen desde contact_email_source, no contact_email_verified', async () => {
      const preview = await ok<ApplyPreview>('POST', '/hunter/jobs/eros-mock-frontend/apply-preview', {})
      assert.equal(preview.contact_email, 'empleos@example.com')
      assert.equal(preview.email_origin, 'posting')
      assert.equal(preview.subject, 'Postulación simulada')
      assert.equal('contact_email_verified' in preview, false)
      const none = await ok<ApplyPreview>('POST', '/hunter/jobs/eros-mock-backend/apply-preview', {})
      assert.equal(none.contact_email, null)
      assert.equal(none.email_origin, null)
    })

    test('el asunto del mensaje sale de subject_or_hook', async () => {
      const pitch = await ok<{ data: Pitch, _source: string }>('POST', '/hunter/jobs/eros-mock-frontend/pitch', job('Desarrollador Frontend', 'Vue 3 y Nuxt'))
      assert.equal(pitch._source, 'eros')
      assert.equal(pitch.data.subject, 'Postulación simulada')
    })

    test('un puntaje sin Gemini llega marcado como estimado; uno con Gemini, no', async () => {
      const evaluation = await ok<JobEvaluation>('POST', '/hunter/jobs/eros-mock-backend/evaluate', {})
      assert.equal(evaluation.match?.estimated, true)
      assert.equal(evaluation.job.estimated, true)
      const [frontend] = await ok<{ id: string, estimated: boolean }[]>('GET', '/hunter/jobs')
      assert.equal(frontend?.id, 'eros-mock-frontend')
      assert.equal(frontend?.estimated, false)
    })

    test('el contacto cambia con la forma real { ok, job_id, contact_email }', async () => {
      const changed = await ok<JobChange>('PATCH', '/hunter/jobs/eros-mock-backend/contact-email', { contact_email: 'RRHH@Example.com' })
      assert.deepEqual([changed.job, changed.contact_email], [null, 'rrhh@example.com'])
    })
  })
}
