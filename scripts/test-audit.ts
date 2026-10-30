import { app } from '../server/src/app.js'
import type { Server } from 'node:http'

async function run() {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const addr = server.address()
  if (!addr || typeof addr === 'string') throw new Error('Could not get address')
  const base = `http://127.0.0.1:${addr.port}`
  console.log('Testing server against', base)

  const token = 'dev-token'
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

  await test('GET /api/admin/meta with dev-token -> 200', async () => {
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
  await test('GET /api/admin/hunter/jobs -> 200', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const jobs = await res.json()
    if (!Array.isArray(jobs)) throw new Error('Expected array')
    console.log('   hunter jobs length:', jobs.length)
  })

  await test('POST /api/admin/hunter/cv/0cf33b331de5caf9/ticket -> 200', async () => {
    const res = await fetch(`${base}/api/admin/hunter/cv/0cf33b331de5caf9/ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.ticket) throw new Error('No ticket')

    // test opening HTML with ticket
    const htmlRes = await fetch(`${base}/api/admin/hunter/cv/0cf33b331de5caf9/html?ticket=${data.ticket}`)
    if (htmlRes.status !== 200) throw new Error(`HTML Status ${htmlRes.status}`)
    const html = await htmlRes.text()
    if (!html.includes('Harvard ATS')) throw new Error('Invalid CV HTML')
  })

  await test('POST /api/admin/hunter/jobs/0cf33b331de5caf9/find-email -> 200', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs/0cf33b331de5caf9/find-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.email) throw new Error('No email found')
    console.log('   resolved email:', data.email)
  })

  await test('POST /api/admin/hunter/jobs/0cf33b331de5caf9/apply-email -> 200', async () => {
    const res = await fetch(`${base}/api/admin/hunter/jobs/0cf33b331de5caf9/apply-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to_email: 'test@epam.com', subject: 'Application', body: 'Hello' }),
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.ok) throw new Error('Apply not ok')
  })

  // 5. Content endpoints. Sin Eros, los posts son ejemplos generados desde los artículos de la base
  // y publicar, despachar o cambiar el estado responde error (nunca un éxito en memoria).
  let postId = ''
  let erosOffline = false
  await test('GET /api/admin/content/posts -> 200', async () => {
    const res = await fetch(`${base}/api/admin/content/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const posts = await res.json()
    if (!Array.isArray(posts)) throw new Error('Expected array')
    erosOffline = res.headers.get('X-Eros-Source') === 'fallback'
    postId = posts[0]?.id ?? ''
    if (!postId) throw new Error('No posts to test with')
    console.log('   content posts length:', posts.length, erosOffline ? '(ejemplos desde la base)' : '(Eros)')
  })

  await test('POST /api/admin/content/carousel/:id/ticket -> 200 and HTML', async () => {
    const res = await fetch(`${base}/api/admin/content/carousel/${encodeURIComponent(postId)}/ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
    if (!data.ticket) throw new Error('No carousel ticket')

    const htmlRes = await fetch(`${base}/api/admin/content/carousel/${encodeURIComponent(postId)}/html?ticket=${data.ticket}`)
    if (htmlRes.status !== 200) throw new Error(`Carousel HTML Status ${htmlRes.status}`)
    const html = await htmlRes.text()
    if (!html.includes('carousel-stage')) throw new Error('Invalid Carousel HTML')
  })

  await test('POST /api/admin/content/posts/:id/publish-to-blog -> 201 with Eros, error without it', async () => {
    const before = await fetch(`${base}/api/admin/articles`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    const res = await fetch(`${base}/api/admin/content/posts/${encodeURIComponent(postId)}/publish-to-blog`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!erosOffline) {
      if (res.status !== 201 || !data.article) throw new Error(`Status ${res.status}`)
      console.log('   published article slug:', data.article.slug)
      return
    }
    if (res.status < 400 || !data.error) throw new Error(`Expected an error without Eros, got ${res.status}`)
    const after = await fetch(`${base}/api/admin/articles`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    if (after.length !== before.length) throw new Error('An article was created without Eros')
    console.log(`   sin Eros: ${res.status} ${data.error}`)
  })

  for (const [method, path] of [['POST', 'publish'], ['PATCH', 'status']] as const) {
    await test(`${method} /api/admin/content/posts/:id/${path} without Eros -> error`, async () => {
      if (!erosOffline) return
      const res = await fetch(`${base}/api/admin/content/posts/${encodeURIComponent(postId)}/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      const data = await res.json()
      if (res.status < 400 || !data.error) throw new Error(`Expected an error, got ${res.status}`)
    })
  }

  // 6. Radar endpoints
  await test('GET /api/admin/radar/trends -> 200', async () => {
    const res = await fetch(`${base}/api/admin/radar/trends`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const trends = await res.json()
    if (!Array.isArray(trends)) throw new Error('Expected array')
    console.log('   radar trends length:', trends.length)
  })

  await test('POST /api/admin/radar/trends/trend_pgvector_hn/generate -> 200', async () => {
    const res = await fetch(`${base}/api/admin/radar/trends/trend_pgvector_hn/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pillar: 'TECHNICAL_BREAKDOWN' }),
    })
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const data = await res.json()
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
