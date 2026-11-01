/**
 * Recorrido de integración del admin contra la app en un puerto libre, con el token del entorno
 * (dev-token no vale con ADMIN_TOKEN definido). Sin ids fijos: la vacante es una pegada
 * (manual-<azar>) y la publicación y la tendencia son las primeras que lista Eros (sin Eros no hay
 * ninguna: esas rutas responden 503). El CV se compara contra /api/cv.
 *
 *   ADMIN_TOKEN=<aleatorio> pnpm tsx scripts/test-audit.ts
 */
import { erosUrl } from './eros-offline.js'
import { randomBytes } from 'node:crypto'
import type { Server } from 'node:http'
import { app } from '../server/src/app.js'
import type { CvDocument } from '../server/src/content/cv.js'

const token = process.env['ADMIN_TOKEN']
if (!token) throw new Error('Falta ADMIN_TOKEN en el entorno: ADMIN_TOKEN=<aleatorio> pnpm tsx scripts/test-audit.ts')

async function run() {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('Could not get address')
  const base = `http://127.0.0.1:${addr.port}`
  console.log('Testing server against', base, '· Eros:', erosUrl)

  const jobId = `manual-${randomBytes(4).toString('hex')}`
  const jobBody = JSON.stringify({ job: { title: 'Frontend Engineer', company: 'Example', description: 'React, Next.js and TypeScript.', tags: [], url: '', contact_email: 'jobs@example.com' } })
  let failed = 0

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn()
      console.log(`[PASS] ${name}`)
    } catch (e) {
      console.error(`[FAIL] ${name}:`, e)
      failed++
    }
  }

  // 1. Static admin files
  await test('GET /admin/ loads index.html', async () => {
    const res = await fetch(`${base}/admin/`)
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const text = await res.text()
    if (!text.includes('CMS 2026')) throw new Error('Missing title')
  })

  await test('GET /admin/vendor/vue.js loads Vue', async () => {
    const res = await fetch(`${base}/admin/vendor/vue.js`)
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
  })

  // 2. Auth checks
  await test('GET /api/admin/meta without token -> 401', async () => {
    const res = await fetch(`${base}/api/admin/meta`)
    if (res.status !== 401) throw new Error(`Status ${res.status}`)
  })

  await test('GET /api/admin/meta with dev-token -> 401 (ADMIN_TOKEN definido)', async () => {
    const res = await fetch(`${base}/api/admin/meta`, { headers: { Authorization: 'Bearer dev-token' } })
    if (res.status !== 401) throw new Error(`Status ${res.status}`)
  })

  await test('GET /api/admin/meta with ADMIN_TOKEN -> 200', async () => {
    const res = await fetch(`${base}/api/admin/meta`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (!json.counts || typeof json.counts.projects !== 'number') throw new Error('Missing counts')
    if (!json.options || !Array.isArray(json.options.projects)) throw new Error('Missing options')
    if (json.options.projects.length > 0 && !json.options.projects.every((p: { slug?: string }) => typeof p.slug === 'string')) {
      throw new Error('Project options must include slug')
    }
    console.log('   counts:', JSON.stringify(json.counts))
    console.log('   sample project option:', json.options.projects[0])
  })

  // 3. Collections endpoints
  for (const col of ['projects', 'articles', 'techs', 'orgs', 'experience', 'docs']) {
    await test(`GET /api/admin/${col} -> 200`, async () => {
      const res = await fetch(`${base}/api/admin/${col}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status !== 200) throw new Error(`Status ${res.status}`)
      const items = await res.json()
      if (!Array.isArray(items)) throw new Error('Expected array')
      console.log(`   ${col} length:`, items.length)
    })
  }

  // 4. Hunter endpoints
  await test('GET /api/admin/hunter/jobs -> 200 con Eros, 503 { offline } sin Eros', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const jobs = await res.json()
    if (res.status === 503) {
      if (jobs.offline !== true || !/^Eros no/.test(jobs.error)) throw new Error('503 sin offline o sin mensaje en español')
      console.log('   sin Eros:', jobs.error)
      return
    }
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    if (!Array.isArray(jobs)) throw new Error('Expected array')
    console.log('   hunter jobs length:', jobs.length)
  })

  await test('POST /api/admin/hunter/cv/:id, ticket y hoja HTML con el CV de /api/cv', async () => {
    const cv = ((await (await fetch(`${base}/api/cv?lang=en`)).json()) as { data: CvDocument }).data
    const built = await fetch(`${base}/api/admin/hunter/cv/${jobId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: jobBody,
    })
    if (built.status !== 200) throw new Error(`CV Status ${built.status}`)
    const res = await fetch(`${base}/api/admin/hunter/cv/${jobId}/ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.ticket) throw new Error('No ticket')

    const htmlRes = await fetch(`${base}/api/admin/hunter/cv/${jobId}/html?ticket=${data.ticket}`)
    if (htmlRes.status !== 200) throw new Error(`HTML Status ${htmlRes.status}`)
    const html = await htmlRes.text()
    if (!html.includes('Harvard ATS') || !html.includes('<html lang="en">')) throw new Error('Invalid CV HTML')
    if (cv.header.name && !html.includes(cv.header.name)) throw new Error('La hoja no trae el nombre de /api/cv')
  })

  await test('POST /api/admin/hunter/jobs/:id/find-email -> el contacto de la vacante, nunca uno adivinado', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs/${jobId}/find-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: jobBody,
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (data.email !== 'jobs@example.com' || data.confidence !== null) throw new Error(`email de respaldo inválido: ${JSON.stringify(data)}`)
    console.log('   resolved email:', data.email)
  })

  await test('POST /api/admin/hunter/jobs/:id/apply-email -> 200 con Eros, error sin Eros', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs/${randomBytes(6).toString('hex')}/apply-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to_email: 'postulaciones@example.com', subject: 'Application', body: 'Hello' }),
    })
    const data = await res.json()
    if (res.status >= 400) {
      // Sin Eros no hay envío y no se finge uno: tiene que venir el error.
      if (!data.error) throw new Error(`Status ${res.status} sin error`)
      console.log('   sin Eros:', res.status, data.error)
      return
    }
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    if (!data.ok) throw new Error('Apply not ok')
  })

  // 5. Content endpoints. Sin Eros no hay publicaciones: la lista responde 503 { offline } y
  // publicar, despachar o cambiar el estado responden error (nunca un éxito en memoria).
  let postId = ''
  let erosOffline = false
  const offlineBody = (data: { offline?: unknown, error?: unknown }) => data.offline === true && typeof data.error === 'string' && /^Eros no/.test(data.error)
  await test('GET /api/admin/content/posts -> 200 con Eros, 503 { offline } sin Eros', async () => {
    const res = await fetch(`${base}/api/admin/content/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const posts = await res.json()
    if (res.status === 503) {
      if (!offlineBody(posts)) throw new Error('503 sin offline o sin mensaje en español')
      erosOffline = true
      console.log('   sin Eros:', posts.error)
      return
    }
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    if (!Array.isArray(posts)) throw new Error('Expected array')
    postId = posts[0]?.id ?? ''
    console.log('   content posts length:', posts.length)
  })

  await test('POST /api/admin/content/carousel/:id/ticket -> 200 and HTML (503 sin Eros)', async () => {
    const id = postId || 'eros_real_1'
    const res = await fetch(`${base}/api/admin/content/carousel/${encodeURIComponent(id)}/ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.ticket) throw new Error('No carousel ticket')

    const htmlRes = await fetch(`${base}/api/admin/content/carousel/${encodeURIComponent(id)}/html?ticket=${data.ticket}`)
    const html = await htmlRes.text()
    if (erosOffline) {
      if (htmlRes.status !== 503 || !html.includes('Eros no responde')) throw new Error(`Carousel sin Eros: ${htmlRes.status}`)
      return
    }
    if (!postId) return
    if (htmlRes.status !== 200) throw new Error(`Carousel HTML Status ${htmlRes.status}`)
    if (!html.includes('carousel-stage')) throw new Error('Invalid Carousel HTML')
  })

  await test('POST /api/admin/content/posts/:id/publish-to-blog -> 201 borrador con Eros, error sin él', async () => {
    const before = await fetch(`${base}/api/admin/articles`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    const res = await fetch(`${base}/api/admin/content/posts/${encodeURIComponent(postId || 'eros_real_1')}/publish-to-blog`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!erosOffline) {
      if (!postId) return
      if (res.status !== 201 || !data.article?.slug) throw new Error(`Status ${res.status}`)
      console.log('   borrador creado:', data.article.slug)
      return
    }
    if (res.status < 400 || !data.error) throw new Error(`Expected an error without Eros, got ${res.status}`)
    const after = await fetch(`${base}/api/admin/articles`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    if (after.length !== before.length) throw new Error('An article was created without Eros')
    console.log(`   sin Eros: ${res.status} ${data.error}`)
  })

  for (const [method, path, body] of [['POST', 'publish', { channel: 'linkedin' }], ['PATCH', 'status', { status: 'published' }]] as const) {
    await test(`${method} /api/admin/content/posts/:id/${path} without Eros -> error`, async () => {
      if (!erosOffline) return
      const res = await fetch(`${base}/api/admin/content/posts/eros_real_1/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.status !== 503 || !offlineBody(data)) throw new Error(`Expected 503 offline, got ${res.status}`)
    })
  }

  // 6. Radar endpoints. Sin Eros no hay tendencias: nada de URLs ni relevancias inventadas.
  let trendId = ''
  await test('GET /api/admin/radar/trends -> 200 con Eros, 503 { offline } sin Eros', async () => {
    const res = await fetch(`${base}/api/admin/radar/trends`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const trends = await res.json()
    if (res.status === 503) {
      if (!offlineBody(trends)) throw new Error('503 sin offline o sin mensaje en español')
      return
    }
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    if (!Array.isArray(trends)) throw new Error('Expected array')
    trendId = trends[0]?.id ?? ''
    console.log('   radar trends length:', trends.length)
  })

  await test('POST /api/admin/radar/trends/:id/generate -> 200 con Eros, 503 sin Eros', async () => {
    const res = await fetch(`${base}/api/admin/radar/trends/${encodeURIComponent(trendId || 'eros_real_1')}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pillar: 'TECHNICAL_BREAKDOWN' }),
    })
    const data = await res.json()
    if (erosOffline) {
      if (res.status !== 503 || !offlineBody(data)) throw new Error(`Expected 503 offline, got ${res.status}`)
      return
    }
    if (!trendId) return
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    if (!data.post) throw new Error('No post generated')
    console.log('   generated post id:', data.post.id)
  })

  server.close()
  if (failed > 0) {
    console.error(`\nFAILED: ${failed} tests failed!`)
    process.exit(1)
  } else {
    console.log('\nALL AUDIT INTEGRATION TESTS PASSED!')
  }
}

run().catch((e) => {
  console.error('Test runner fatal error:', e)
  process.exit(1)
})
