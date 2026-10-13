import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { env } from '../env.js'

export const contentRouter = Router()

const getErosUrl = () => (process.env['HUNTER_API_URL'] || env.hunterApiUrl || 'https://eros.mateogs.tech').replace(/\/+$/, '')

async function forward(urlPath: string, init?: RequestInit, timeoutMs = 60000) {
  const baseUrl = getErosUrl()
  if (!baseUrl) {
    return {
      ok: false,
      status: 503,
      data: { error: 'Eros Agent no configurado: falta HUNTER_API_URL en el entorno' },
    }
  }
  const fullUrl = `${baseUrl}/${urlPath.replace(/^\//, '')}`
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}` } : {}),
      ...((init?.headers as Record<string, string>) || {}),
    }
    const res = await fetch(fullUrl, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json().catch(() => null) : await res.text()
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 502,
        data: { error: 'Fallo de autenticación con Eros Agent (verificar EROS_API_KEY en variables de entorno)' },
      }
    }
    return { ok: res.ok, status: res.status, data }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      ok: false,
      status: 503,
      data: { error: `Eros Agent no responde (${baseUrl}): ${msg}` },
    }
  }
}

function getParamId(req: Request): string {
  const val = req.params['id']
  if (Array.isArray(val)) return val[0] || ''
  return typeof val === 'string' ? val : ''
}

/** GET /api/admin/content/posts - Lista de publicaciones omnicanal */
contentRouter.get('/posts', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forward(`api/content/posts${query ? `?${query}` : ''}`)
  res.status(result.status).json(result.data)
})

/** GET /api/admin/content/posts/:id - Detalle de publicación */
contentRouter.get('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forward(`api/content/posts/${encodeURIComponent(id)}`)
  res.status(result.status).json(result.data)
})

/** POST /api/admin/content/generate - Generar nueva publicación con Gemini */
contentRouter.post('/generate', async (req: Request, res: Response) => {
  const result = await forward('api/content/generate', {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 60000)
  res.status(result.status).json(result.data)
})

/** POST /api/admin/content/posts/:id/publish - Aprobar y despachar a n8n */
contentRouter.post('/posts/:id/publish', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forward(`api/content/posts/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  }, 45000)
  res.status(result.status).json(result.data)
})

/** PATCH /api/admin/content/posts/:id/status - Actualizar estado (draft, published, rejected) */
contentRouter.patch('/posts/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forward(`api/content/posts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  res.status(result.status).json(result.data)
})

/** DELETE /api/admin/content/posts/:id - Eliminar publicación */
contentRouter.delete('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forward(`api/content/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  res.status(result.status).json(result.data)
})

/** GET /api/admin/content/carousel/:id/html - Vista HTML del carrusel */
contentRouter.get('/carousel/:id/html', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).type('html').send('<h1>ID de publicación requerido</h1>')
    return
  }
  const baseUrl = getErosUrl()
  try {
    const upstreamRes = await fetch(`${baseUrl}/api/content/carousel/${encodeURIComponent(id)}/html`, {
      signal: AbortSignal.timeout(30000),
    })
    const html = await upstreamRes.text()
    res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:;")
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.status(upstreamRes.status).type('html').send(html)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(503).type('html').send(`<h1>Error cargando carrusel</h1><p>${msg}</p>`)
  }
})

/** POST /api/admin/content/posts/:id/publish-to-blog - Convierte y publica el post en la tabla Article */
contentRouter.post('/posts/:id/publish-to-blog', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forward(`api/content/posts/${encodeURIComponent(id)}`)
  if (!result.ok || !result.data) {
    res.status(result.status || 500).json({ error: 'No se pudo obtener el post desde Eros' })
    return
  }
  const post = ((result.data as { post?: Record<string, unknown> })?.post || result.data) as Record<string, unknown>
  
  const title = String(post['title'] || 'Publicación Técnica').trim()
  const content = String(post['devto_markdown'] || post['body'] || '').trim()
  const summary = String(post['hook'] || title).slice(0, 200).trim()
  const baseSlug = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
  const slug = `${baseSlug || 'articulo'}-${Date.now().toString(36).slice(-4)}`

  try {
    const article = await db.article.create({
      data: {
        slug,
        title,
        summary,
        content,
        readingTimeMin: Math.max(2, Math.ceil(content.split(/\s+/).length / 200)),
        status: 'PUBLISHED',
        publishedAt: new Date(),
        canonicalUrl: `https://mateogs.tech/blog/${slug}`,
      },
    })
    res.status(201).json({ ok: true, article })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: `Error al crear artículo en PostgreSQL: ${msg}` })
  }
})

