import { app } from '../server/src/app.js'
import type { Server } from 'node:http'

async function run() {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('Could not get address')
  const base = `http://127.0.0.1:${addr.port}`
  const token = 'dev-token'

  console.log('Testing CV and Subject on', base)

  // 1. Solicitar ticket de CV
  const ticketRes = await fetch(`${base}/api/admin/hunter/cv/0cf33b331de5caf9/ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (ticketRes.status !== 200) throw new Error(`Ticket failed: ${ticketRes.status}`)
  const { ticket } = await ticketRes.json()
  console.log('[PASS] Ticket generado:', ticket)

  // 2. Abrir CV HTML con ticket
  const cvRes1 = await fetch(`${base}/api/admin/hunter/cv/0cf33b331de5caf9/html?ticket=${encodeURIComponent(ticket)}`)
  if (cvRes1.status !== 200) throw new Error(`CV HTML failed with status: ${cvRes1.status}`)
  const html1 = await cvRes1.text()
  if (html1.includes('Acceso no autorizado al CV')) throw new Error('Returned unauthorized error!')
  if (!html1.includes('Mateo Gabriel Sonzogni')) throw new Error('Missing candidate name in CV')
  console.log('[PASS] CV HTML cargado exitosamente sin error de autorizacion')

  // 3. Re-visitar el CV HTML con el mismo ticket (simulando recarga o navegacion)
  const cvRes2 = await fetch(`${base}/api/admin/hunter/cv/0cf33b331de5caf9/html?ticket=${encodeURIComponent(ticket)}`)
  if (cvRes2.status !== 200) throw new Error(`CV reload failed: ${cvRes2.status}`)
  const html2 = await cvRes2.text()
  if (html2.includes('Acceso no autorizado al CV')) throw new Error('CV expired on reload!')
  console.log('[PASS] Ticket HMAC sobrevive a multiples accesos y recargas sin expirar')

  // 4. Probar apply-preview con ID conocido
  const prevRes1 = await fetch(`${base}/api/admin/hunter/jobs/0cf33b331de5caf9/apply-preview`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (prevRes1.status !== 200) throw new Error(`apply-preview failed: ${prevRes1.status}`)
  const prevData1 = await prevRes1.json()
  if (!prevData1.subject || !prevData1.subject.trim()) throw new Error('Subject is empty!')
  console.log('[PASS] Asunto generado para vacante conocida:', prevData1.subject)

  // 5. Probar apply-preview con ID no registrado o sintetico
  const prevRes2 = await fetch(`${base}/api/admin/hunter/jobs/custom_random_id_999/apply-preview?title=Senior+DevOps+Engineer&company=CloudCorp`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (prevRes2.status !== 200) throw new Error(`synthetic apply-preview failed: ${prevRes2.status}`)
  const prevData2 = await prevRes2.json()
  if (!prevData2.subject || !prevData2.subject.trim()) throw new Error('Synthetic subject is empty!')
  console.log('[PASS] Asunto generado para vacante dinamica/sintetica:', prevData2.subject)

  // 6. Probar render de CV para vacante dinamica/sintetica con ticket HMAC
  const ticketResSynth = await fetch(`${base}/api/admin/hunter/cv/custom_random_id_999/ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const { ticket: synthTicket } = await ticketResSynth.json()
  const cvSynthRes = await fetch(`${base}/api/admin/hunter/cv/custom_random_id_999/html?ticket=${encodeURIComponent(synthTicket)}&title=Senior+DevOps+Engineer&company=CloudCorp`)
  if (cvSynthRes.status !== 200) throw new Error(`synthetic CV HTML failed: ${cvSynthRes.status}`)
  const synthHtml = await cvSynthRes.text()
  if (synthHtml.includes('Acceso no autorizado al CV')) throw new Error('Synthetic CV unauthorized!')
  if (!synthHtml.includes('Mateo Gabriel Sonzogni')) throw new Error('Missing candidate in synthetic CV')
  console.log('[PASS] CV dinamico renderizado exitosamente para vacante sintetica')

  server.close()
  console.log('\nTODAS LAS PRUEBAS DE CV Y ASUNTO PASARON EXITOSAMENTE!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
