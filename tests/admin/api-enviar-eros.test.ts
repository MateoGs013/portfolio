/**
 * «Enviar desde Eros» encendido (EROS_SEND_ENABLED=on): la API imprime a PDF el CV de la etapa CV
 * (el del caché), lo mide dentro de la cota dual y se lo manda a Eros, que lo adjunta tal cual. Nunca
 * el Eros real ni un correo real: con --eros-mock el simulado valida el `cv` como Eros y no envía nada;
 * sin Eros, el envío falla diciendo que no salió.
 *
 * admin-run: --eros-mock --send
 * admin-run: --send
 *
 *   node scripts/admin-run.mjs --eros-mock --send -- pnpm tsx --test tests/admin/api-enviar-eros.test.ts
 *   node scripts/admin-run.mjs --send -- pnpm tsx --test tests/admin/api-enviar-eros.test.ts            (sin Eros)
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { after, before, describe, test } from 'node:test'
import type { AdminStatus } from '../../server/src/shared/adminContracts.js'
import type { AdminCv, ApplyEmailResult } from '../../server/src/shared/hunterContracts.js'
import { CV_HEIGHT_MM, CvPdfError, pdfPages, renderCvPdf } from '../../server/src/admin/hunterCvPdf.js'
import { admin, call, ok } from './api.js'

const eros = process.env['HUNTER_API_URL'] ?? ''
const online = !/127\.0\.0\.1:9$/.test(eros)

interface ErrorBody { error: string, code: string, offline?: boolean, errors: { path: string }[] }
interface MockRequest { method: string, path: string, body: Record<string, unknown> }
interface SentToEros {
  to_email: string
  subject: string
  body: string
  channel: string
  confirmed: boolean
  force_retry: boolean
  cv: { filename: string, pdf_base64: string, text: string, sha256: string, lang: string, height_mm: number }
}

const JOB = 'eros-mock-frontend'
const frontend = { job: { title: 'Desarrollador Frontend (Vue 3 y Nuxt)', company: 'Ejemplo Simulado', description: 'Vue 3 y Nuxt', tags: [], url: '', contact_email: 'empleos@example.com' } }
const mail = { to_email: 'rrhh@example.com', subject: 'Postulación: Desarrollador Frontend', body: 'Hola, adjunto mi CV.' }

const forget = () => fetch(`${eros}/__requests`, { method: 'DELETE' })
const sendMode = (modo: 'ok' | 'cortado' | 'rechazado') => fetch(`${eros}/__envio`, { method: 'PUT', body: JSON.stringify({ modo }) })
async function sentToEros(): Promise<SentToEros[]> {
  const all = await (await fetch(`${eros}/__requests`)).json() as MockRequest[]
  return all.filter(r => r.method === 'POST' && r.path.endsWith('/apply-email')).map(r => r.body as unknown as SentToEros)
}

const apply = (body: unknown = mail, id = JOB) => admin<ApplyEmailResult & ErrorBody>('POST', `/hunter/jobs/${id}/apply-email`, body)

/** Un CV de prueba con `bullets` viñetas por entrada: para medir fuera de la cota sin tocar la base. */
function fakeCv(bullets: number): AdminCv {
  const line = 'Viñeta de prueba con texto suficiente para ocupar una línea entera de la hoja A4 del CV.'
  return {
    lang: 'es', name: 'Persona de Prueba', title: 'Full Stack', location: 'Neuquén', email: 'persona@example.com',
    portfolio: 'https://example.com', github: null, linkedin: null, summary: 'Resumen de prueba. '.repeat(30),
    skills: { Frontend: ['Vue', 'Nuxt'] },
    experience: Array.from({ length: 5 }, (_, i) => ({ title: `Obra ${i}`, role: 'Dev', period: '2025', location: 'Remoto', bullets: Array.from({ length: bullets }, () => line) })),
    education: [], languages: ['Español'], methodologies: null,
  }
}

before(async () => {
  if (online) {
    await fetch(`${eros}/__envio`, { method: 'DELETE' })
    await fetch(`${eros}/__antes`, { method: 'DELETE' })
  }
})
after(async () => {
  if (online) await fetch(`${eros}/__envio`, { method: 'DELETE' })
})

describe('el PDF del CV (hunterCvPdf.ts)', () => {
  test('fuera de la cota no hay PDF: corto o de dos páginas, cada uno en español', async () => {
    for (const [bullets, pattern] of [[3, /menos que los 248 mm/], [12, /ocupa 2 páginas/]] as const) {
      await assert.rejects(renderCvPdf(fakeCv(bullets)), (err: unknown) => {
        assert.ok(err instanceof CvPdfError)
        assert.equal(err.reason, 'out_of_bounds')
        assert.match(err.message, pattern)
        assert.match(err.message, /No se envió nada\.$/)
        return true
      })
    }
  })

  test('cuenta las páginas de un PDF sin confundir /Pages con /Page', () => {
    assert.equal(pdfPages(Buffer.from('<</Type /Pages /Count 1>> <</Type /Page>>', 'latin1')), 1)
    assert.equal(pdfPages(Buffer.from('<</Type/Page>><</Type/Page>>', 'latin1')), 2)
  })
})

describe('«Enviar desde Eros» encendido', () => {
  test('/status lo dice: el admin muestra el botón', async () => {
    const status = await ok<AdminStatus>('GET', '/status')
    assert.equal(status.erosSend, true)
  })

  test('sin el CV de la etapa CV en la API responde 409 cv_expired y Eros no se entera', async () => {
    if (online) await forget()
    const reply = await apply(mail, 'eros-mock-backend')
    assert.equal(reply.status, 409)
    assert.equal(reply.body.code, 'cv_expired')
    if (online) assert.deepEqual(await sentToEros(), [])
  })

  test('un correo incompleto responde 400 con cada campo, sin imprimir ni enviar', async () => {
    if (online) await forget()
    const reply = await apply({ to_email: 'no-es-un-correo', subject: '', body: '' })
    assert.equal(reply.status, 400)
    assert.equal(reply.body.code, 'invalid')
    assert.deepEqual(reply.body.errors.map(e => e.path).sort(), ['body', 'subject', 'to_email'])
    if (online) assert.deepEqual(await sentToEros(), [])
  })

  test('una vacante pegada a mano no va a Eros', async () => {
    const reply = await apply(mail, 'manual-abc')
    assert.equal(reply.status, 400)
    assert.match(reply.body.error, /pegada a mano/)
  })
})

describe('con Eros (simulado): Eros recibe exactamente el CV de la etapa CV', { skip: !online }, () => {
  test('el PDF medido, su texto plano y su sha256 llegan a Eros; la respuesta nombra el adjunto', async () => {
    await ok('POST', `/hunter/cv/${JOB}`, frontend)
    const text = (await call<string>('GET', `/api/admin/hunter/cv/${JOB}/txt`)).body
    await forget()

    const reply = await apply()
    assert.equal(reply.status, 200, JSON.stringify(reply.body))
    const result = reply.body
    assert.equal(result.ok, true)
    assert.equal(result.dispatched_to, 'rrhh@example.com')
    assert.equal(result.warning, null)
    assert.ok(result.cv)
    assert.match(result.cv.filename, /^CV_[A-Za-z0-9_]+_Harvard_ATS\.pdf$/)
    assert.ok(result.cv.height_mm >= CV_HEIGHT_MM.min && result.cv.height_mm <= CV_HEIGHT_MM.max, `${result.cv.height_mm} mm`)

    const [sent, ...rest] = await sentToEros()
    assert.equal(rest.length, 0, 'un solo pedido a Eros')
    assert.ok(sent)
    assert.deepEqual({ to: sent.to_email, subject: sent.subject, body: sent.body, channel: sent.channel, confirmed: sent.confirmed, force_retry: sent.force_retry },
      { to: mail.to_email, subject: mail.subject, body: mail.body, channel: 'n8n', confirmed: true, force_retry: false })
    const pdf = Buffer.from(sent.cv.pdf_base64, 'base64')
    assert.equal(pdf.subarray(0, 5).toString('latin1'), '%PDF-')
    assert.equal(pdfPages(pdf), 1)
    assert.equal(sent.cv.sha256, createHash('sha256').update(pdf).digest('hex'))
    assert.equal(sent.cv.sha256, result.cv.sha256)
    assert.equal(sent.cv.filename, result.cv.filename)
    assert.equal(sent.cv.text, text, 'el texto es el de «Copiar texto» de la etapa CV')
    assert.equal(sent.cv.lang, 'es')
    assert.equal(sent.cv.height_mm, result.cv.height_mm)
  })

  test('envío cortado: 502 send_outcome_unknown, después 409 hasta reintentar con force_retry', async () => {
    await ok('POST', `/hunter/cv/${JOB}`, frontend)
    await sendMode('cortado')
    const cut = await apply()
    assert.equal(cut.status, 502)
    assert.equal(cut.body.code, 'send_outcome_unknown')
    assert.match(cut.body.error, /se cortó a mitad de camino: puede que haya salido/)

    await sendMode('ok')
    const blocked = await apply()
    assert.equal(blocked.status, 409)
    assert.equal(blocked.body.code, 'send_outcome_unknown')
    assert.match(blocked.body.error, /anterior se cortó/)

    await forget()
    const retried = await apply({ ...mail, force_retry: true })
    assert.equal(retried.status, 200, JSON.stringify(retried.body))
    const [sent] = await sentToEros()
    assert.equal(sent?.force_retry, true)
  })

  test('el proveedor rechaza: 502 que dice que no se envió', async () => {
    await ok('POST', `/hunter/cv/${JOB}`, frontend)
    await sendMode('rechazado')
    const reply = await apply()
    await sendMode('ok')
    assert.equal(reply.status, 502)
    assert.equal(reply.body.code, 'eros_error')
    assert.match(reply.body.error, /rechazó el envío.*no se envió/)
  })

  test('un Eros que no confirma el CV (el de antes) deja un aviso para revisar el correo enviado', async () => {
    await ok('POST', `/hunter/cv/${JOB}`, frontend)
    await fetch(`${eros}/__antes`, { method: 'PUT' })
    try {
      const reply = await apply()
      assert.equal(reply.status, 200)
      assert.match(reply.body.warning ?? '', /no confirmó que adjuntó este CV/)
    }
    finally {
      await fetch(`${eros}/__antes`, { method: 'DELETE' })
    }
  })
})

describe('sin Eros: no sale nada y lo dice', { skip: online }, () => {
  test('con el CV listo, el envío responde 503 offline', async () => {
    await ok('POST', `/hunter/cv/${JOB}`, frontend)
    const reply = await apply()
    assert.equal(reply.status, 503)
    assert.equal(reply.body.offline, true)
    assert.match(reply.body.error, /La postulación no se envió/)
  })
})
