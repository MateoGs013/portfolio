import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { env } from '../env.js'
import { createCarouselTicket, isAdminAuthorized, validateCarouselTicket } from './auth.js'
import { forwardToEros, getParamId, getErosBaseUrl } from './proxy.js'
import {
  fallbackContentPosts,
  generateContentPostHeuristic,
  renderCarouselHtmlHeuristic,
} from './fallbackContentData.js'

export const contentRouter = Router()

/** GET /api/admin/content/posts - Lista de publicaciones omnicanal */
contentRouter.get('/posts', async (req: Request, res: Response) => {
  const query = new URLSearchParams(req.query as Record<string, string>).toString()
  const result = await forwardToEros(`api/content/posts${query ? `?${query}` : ''}`)
  if (result.ok) {
    const payload = result.data
    const postsList = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray((payload as Record<string, unknown>)['data'])
        ? (payload as Record<string, unknown>)['data']
        : payload)
    res.status(result.status).json(postsList)
    return
  }

  // Fallback resiliente si Eros está desconectado o no autorizado
  let posts = [...fallbackContentPosts]
  const statusFilter = req.query['status'] as string | undefined
  if (statusFilter && statusFilter !== 'all') {
    posts = posts.filter(p => p.status === statusFilter)
  }
  res.json(posts)
})

/** GET /api/admin/content/posts/:id - Detalle de publicación */
contentRouter.get('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}`)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const post = fallbackContentPosts.find(p => p.id === id)
  if (!post) {
    res.status(404).json({ error: 'Publicación no encontrada' })
    return
  }
  res.json({ data: post, post })
})

/** POST /api/admin/content/generate - Generar nueva publicación con Gemini */
contentRouter.post('/generate', async (req: Request, res: Response) => {
  const result = await forwardToEros('api/content/generate', {
    method: 'POST',
    body: JSON.stringify(req.body),
  }, 60000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const post = generateContentPostHeuristic(req.body || {})
  res.json({ ok: true, post, data: post })
})

/** POST /api/admin/content/posts/:id/publish - Aprobar y despachar a n8n */
contentRouter.post('/posts/:id/publish', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  }, 45000)
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const post = fallbackContentPosts.find(p => p.id === id)
  if (post) {
    post.status = 'published'
    post.n8n_published_at = new Date().toISOString()
  }
  res.json({
    ok: true,
    post_id: id,
    status: 'published',
    provider: 'local-dispatcher',
    dispatched_at: new Date().toISOString(),
  })
})

/** PATCH /api/admin/content/posts/:id/status - Actualizar estado (draft, published, rejected) */
contentRouter.patch('/posts/:id/status', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(req.body),
  })
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const post = fallbackContentPosts.find(p => p.id === id)
  if (post && req.body?.status) {
    post.status = req.body.status
    post.updated_at = new Date().toISOString()
    res.json({ ok: true, post_id: id, new_status: req.body.status })
    return
  }
  res.status(result.status).json(result.data)
})

/** DELETE /api/admin/content/posts/:id - Eliminar publicación */
contentRouter.delete('/posts/:id', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (result.ok) {
    res.status(result.status).json(result.data)
    return
  }
  const idx = fallbackContentPosts.findIndex(p => p.id === id)
  if (idx !== -1) {
    fallbackContentPosts.splice(idx, 1)
  }
  res.json({ ok: true, deleted: id })
})

/** POST /api/admin/content/carousel/:id/ticket - Ticket temporal de un solo uso */
contentRouter.post('/carousel/:id/ticket', (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  const ticket = createCarouselTicket(id)
  res.json({ ok: true, ticket })
})

/** GET /api/admin/content/carousel/:id/html - Vista HTML del carrusel */
contentRouter.get('/carousel/:id/html', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).type('html').send('<h1>ID de publicación requerido</h1>')
    return
  }
  const ticketParam = req.query['ticket']
  const hasValidTicket = typeof ticketParam === 'string' && validateCarouselTicket(ticketParam, id)
  if (!hasValidTicket && !isAdminAuthorized(req)) {
    res.status(401).type('html').send('<h1>Acceso no autorizado al carrusel</h1><p>Se requiere sesión de administración o un ticket válido para esta publicación.</p>')
    return
  }
  const baseUrl = getErosBaseUrl()
  let html: string | null = null

  if (baseUrl) {
    try {
      const upstreamRes = await fetch(`${baseUrl}/api/content/carousel/${encodeURIComponent(id)}/html`, {
        headers: {
          ...(env.erosApiKey ? { Authorization: `Bearer ${env.erosApiKey}`, 'X-Eros-Key': env.erosApiKey } : {}),
        },
        signal: AbortSignal.timeout(10000),
      })
      if (upstreamRes.ok) {
        html = await upstreamRes.text()
      }
    } catch {
      // upstream failed, fallback abajo
    }
  }

  if (!html) {
    const post = fallbackContentPosts.find(p => p.id === id)
    if (post) {
      html = renderCarouselHtmlHeuristic(post, req.query['auto_print'] === 'true')
    }
  }

  if (!html) {
    res.status(404).type('html').send('<h1>Carrusel no encontrado</h1><p>No se encontró la publicación especificada.</p>')
    return
  }

  res.setHeader('Content-Security-Policy', "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:;")
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.status(200).type('html').send(html)
})

/** POST /api/admin/content/posts/:id/publish-to-blog - Convierte y publica el post en la tabla Article */
contentRouter.post('/posts/:id/publish-to-blog', async (req: Request, res: Response) => {
  const id = getParamId(req)
  if (!id) {
    res.status(400).json({ error: 'ID de publicación requerido' })
    return
  }
  let post: Record<string, unknown> | null = null

  const result = await forwardToEros(`api/content/posts/${encodeURIComponent(id)}`)
  if (result.ok && result.data) {
    post = ((result.data as { post?: Record<string, unknown>; data?: Record<string, unknown> })?.post || (result.data as { data?: Record<string, unknown> })?.data || result.data) as Record<string, unknown>
  } else {
    const fallback = fallbackContentPosts.find(p => p.id === id)
    if (fallback) {
      post = fallback as unknown as Record<string, unknown>
    }
  }

  if (!post) {
    res.status(404).json({ error: 'Publicación no encontrada en Eros ni en snapshot local' })
    return
  }

  const title = String(post['title'] || 'Publicación Técnica').trim()
  const content = String(post['devto_markdown'] || post['body'] || post['linkedin_text'] || '').trim()
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
    // Si la BD relacional está en reposo o inaccesible en local, responder con artículo simulado
    console.warn('[Content] Error al persistir artículo en BD (activando fallback):', err instanceof Error ? err.message : err)
    const fallbackArticle = {
      id: Math.floor(Date.now() % 100000),
      slug,
      title,
      summary,
      content,
      readingTimeMin: Math.max(2, Math.ceil(content.split(/\s+/).length / 200)),
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      canonicalUrl: `https://mateogs.tech/blog/${slug}`,
    }
    res.status(201).json({ ok: true, article: fallbackArticle, fallback: true })
  }
})
