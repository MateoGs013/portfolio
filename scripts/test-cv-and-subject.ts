/**
 * Recorrido corto del CV y del asunto del Job Hunter contra la app en un puerto libre, con el token
 * del entorno (nunca dev-token) y una vacante pegada (manual-<azar>): no depende de ids de Eros ni de
 * la muestra. El nombre y las viñetas se comparan contra GET /api/cv.
 *
 *   ADMIN_TOKEN=<aleatorio> pnpm tsx scripts/test-cv-and-subject.ts
 */
import { randomBytes } from 'node:crypto'
import type { Server } from 'node:http'
import { app } from '../server/src/app.js'
import type { CvDocument } from '../server/src/content/cv.js'
import type { ApplyPreview, TailoredCv } from '../server/src/shared/hunterContracts.js'

const token = process.env['ADMIN_TOKEN']
if (!token) throw new Error('Falta ADMIN_TOKEN en el entorno: ADMIN_TOKEN=<aleatorio> pnpm tsx scripts/test-cv-and-subject.ts')

async function run() {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('Could not get address')
  const base = `http://127.0.0.1:${addr.port}`
  const auth = { Authorization: `Bearer ${token}` }
  const json = { ...auth, 'Content-Type': 'application/json' }
  console.log('Testing CV and Subject on', base)

  const cv = ((await (await fetch(`${base}/api/cv`)).json()) as { data: CvDocument }).data
  const name = cv.header.name
  if (!name) throw new Error('GET /api/cv no trae nombre')

  const id = `manual-${randomBytes(4).toString('hex')}`
  const job = { job: { title: 'Desarrollador Frontend', company: 'Ejemplo', description: 'Buscamos experiencia en Vue 3 y Nuxt.', tags: ['Vue 3'], url: '', contact_email: '' } }

  // 1. Generar el CV: sale de la base, en el idioma de la vacante.
  const built = await fetch(`${base}/api/admin/hunter/cv/${id}`, { method: 'POST', headers: json, body: JSON.stringify(job) })
  if (built.status !== 200) throw new Error(`POST /cv failed: ${built.status}`)
  const tailored = await built.json() as TailoredCv
  if (tailored.data.name !== name || tailored.data.lang !== 'es') throw new Error('El CV no es el de /api/cv en español')
  const highlights = cv.experience.flatMap(e => e.highlights)
  if (!tailored.data.experience.flatMap(e => e.bullets).every(b => highlights.includes(b))) throw new Error('Hay viñetas que no están en la base')
  console.log('[PASS] CV generado desde la base para', id)

  // 2. Ticket y hoja HTML: la misma hoja con recargas.
  const ticketRes = await fetch(`${base}/api/admin/hunter/cv/${id}/ticket`, { method: 'POST', headers: auth })
  if (ticketRes.status !== 200) throw new Error(`Ticket failed: ${ticketRes.status}`)
  const { ticket } = await ticketRes.json() as { ticket: string }
  for (const attempt of ['primera', 'recarga']) {
    const sheet = await fetch(`${base}/api/admin/hunter/cv/${id}/html?ticket=${encodeURIComponent(ticket)}`)
    if (sheet.status !== 200) throw new Error(`CV HTML (${attempt}) failed: ${sheet.status}`)
    const html = await sheet.text()
    if (!html.includes(name)) throw new Error('La hoja no trae el nombre de /api/cv')
    if (!html.includes('@page { size: A4; margin: 10.5mm 12mm; }')) throw new Error('La hoja perdió su @page A4')
  }
  console.log('[PASS] Hoja HTML con ticket, también al recargar')

  // 3. Texto plano del mismo CV.
  const text = await (await fetch(`${base}/api/admin/hunter/cv/${id}/txt?ticket=${encodeURIComponent(ticket)}`)).text()
  if (!text.startsWith(`${name}\n`) || /<[a-z][^>]*>/i.test(text)) throw new Error('Texto plano inválido')
  console.log('[PASS] Texto plano sin marcado')

  // 4. Ticket de otra vacante y CV que no existe.
  if ((await fetch(`${base}/api/admin/hunter/cv/otra-${id}/html?ticket=${encodeURIComponent(ticket)}`)).status !== 401) throw new Error('El ticket abre otra vacante')
  if ((await fetch(`${base}/api/admin/hunter/cv/otra-${id}/html`, { headers: auth })).status !== 409) throw new Error('Sin CV no responde 409')
  console.log('[PASS] 401 con el ticket de otra vacante y 409 sin CV')

  // 5. Asunto de la vista previa, con la vacante en el cuerpo.
  const preview = await fetch(`${base}/api/admin/hunter/jobs/${id}/apply-preview`, { method: 'POST', headers: json, body: JSON.stringify(job) })
  if (preview.status !== 200) throw new Error(`apply-preview failed: ${preview.status}`)
  const { subject } = await preview.json() as ApplyPreview
  if (!subject.trim() || !subject.includes(name)) throw new Error(`Asunto inválido: ${subject}`)
  console.log('[PASS] Asunto:', subject)

  server.close()
  console.log('\nTODAS LAS PRUEBAS DE CV Y ASUNTO PASARON')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
