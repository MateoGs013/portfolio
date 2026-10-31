import { createRequire } from 'node:module'
import path from 'node:path'
import express, { Router } from 'express'
import { forgetLastGood } from '../content/snapshot.js'
import { db } from '../db.js'
import { ArticleStatus, ExperienceKind, MediaKind, MediaRole, MediaViewport, ProjectStatus, TechCategory } from '../../generated/prisma/client.js'
import { metricUnits } from '../shared/metricUnits.js'
import { requireAdmin } from './auth.js'
import { DB_UNAVAILABLE, paramId as id } from './common.js'
import { docsRouter } from './docs.js'
import { adminErrors } from './errors.js'
import { experienceRouter } from './experience.js'
import { HttpError, bool, enumOf, intList, optDate, optInt, optStr, optUrl, slug, str } from './input.js'
import { hunterRouter } from './hunter.js'
import { contentRouter } from './content.js'
import { mediaRouter } from './media.js'
import { projectsRouter } from './projects.js'
import { radarRouter } from './radar.js'
import { techsRouter } from './techs.js'

const require = createRequire(import.meta.url)
const ADMIN_DIR = path.resolve('server/admin')

const prisma = db
export const requireAuth = requireAdmin

// ─── UI estática ────────────────────────────────────────────────────────────

export const adminUi = Router()
// dotfiles: pnpm guarda los paquetes bajo node_modules/.pnpm y sendFile los rechaza por defecto.
adminUi.get('/vendor/vue.js', (_req, res) => res.sendFile(require.resolve('vue/dist/vue.global.prod.js'), { dotfiles: 'allow' }))
adminUi.use(express.static(ADMIN_DIR, { index: 'index.html' }))

// ─── API ────────────────────────────────────────────────────────────────────

export const adminApi = Router()
adminApi.use((req, _res, next) => {
  if (req.body === undefined || req.body === null) req.body = {}
  next()
})
adminApi.use(requireAuth)
// Cada escritura que sale bien invalida las últimas respuestas buenas de la API pública.
adminApi.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.on('finish', () => {
      if (res.statusCode < 400) forgetLastGood()
    })
  }
  next()
})
adminApi.use('/hunter', hunterRouter)
adminApi.use('/content', contentRouter)
adminApi.use('/radar', radarRouter)
// Obras, media, trayectoria, stack y documentos tienen su propio módulo (cada uno con su inglés).
adminApi.use(projectsRouter, mediaRouter, experienceRouter, techsRouter, docsRouter)

const ARTICLE_STATUS = Object.values(ArticleStatus)

/** Enums que la UI usa en sus selects. */
const ENUMS = {
  ProjectStatus: Object.values(ProjectStatus),
  ArticleStatus: ARTICLE_STATUS,
  TechCategory: Object.values(TechCategory),
  MediaKind: Object.values(MediaKind),
  MediaRole: Object.values(MediaRole),
  MediaViewport: Object.values(MediaViewport),
  ExperienceKind: Object.values(ExperienceKind),
  MetricUnit: metricUnits,
}

/** Enums, opciones para los selects de la UI y conteos agregados vía transacción Prisma. */
adminApi.get('/meta', async (_req, res) => {
  interface AdminCounts {
    projects: number
    experiences: number
    experience: number
    stack: number
    orgs: number
    education: number
    certs: number
    labs: number
    articles: number
    docs: number
    inbox: number
  }

  let counts: AdminCounts
  let options: { orgs: { id: number, name: string }[], techs: { id: number, name: string }[], projects: { id: number, title: string, slug: string }[] }
  try {
    const [projectCount, experienceCount, techCount, orgCount, articleCount, docCount] = await prisma.$transaction([
      prisma.project.count(),
      prisma.experience.count(),
      prisma.tech.count(),
      prisma.org.count(),
      prisma.article.count(),
      prisma.doc.count(),
    ])
    counts = {
      projects: projectCount,
      experiences: experienceCount,
      experience: experienceCount,
      stack: techCount,
      orgs: orgCount,
      education: 0,
      certs: 0,
      labs: 0,
      articles: articleCount,
      docs: docCount,
      inbox: 0,
    }
    const [orgs, techs, projects] = await Promise.all([
      prisma.org.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.tech.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.project.findMany({ select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } }),
    ])
    options = { orgs, techs, projects }
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
    return
  }

  res.json({
    counts,
    enums: ENUMS,
    options,
  })
})

// ─── orgs ───────────────────────────────────────────────────────────────────

function orgData(b: Record<string, unknown>) {
  return { slug: slug(b, 'slug'), name: str(b, 'name'), url: optUrl(b, 'url'), city: optStr(b, 'city') }
}

adminApi.get('/orgs', async (_req, res) => {
  try {
    res.json(await db.org.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { projects: true, experiences: true } } } }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
adminApi.post('/orgs', async (req, res) => {
  res.status(201).json(await db.org.create({ data: orgData(req.body) }))
})
adminApi.put('/orgs/:id', async (req, res) => {
  res.json(await db.org.update({ where: { id: id(req) }, data: orgData(req.body) }))
})
adminApi.delete('/orgs/:id', async (req, res) => {
  await db.org.delete({ where: { id: id(req) } })
  res.status(204).end()
})

// ─── articles ───────────────────────────────────────────────────────────────

function articleData(b: Record<string, unknown>) {
  return {
    slug: slug(b, 'slug'),
    title: str(b, 'title'),
    summary: str(b, 'summary'),
    content: str(b, 'content'),
    readingTimeMin: optInt(b, 'readingTimeMin') ?? 5,
    status: enumOf(b, 'status', ARTICLE_STATUS),
    featured: bool(b, 'featured'),
    coverImage: optStr(b, 'coverImage'),
    canonicalUrl: optUrl(b, 'canonicalUrl'),
    sortOrder: optInt(b, 'sortOrder') ?? 0,
    publishedAt: optDate(b, 'publishedAt'),
    projectId: optInt(b, 'projectId'),
  }
}

adminApi.get('/articles', async (_req, res) => {
  try {
    res.json(await db.article.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        techs: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, title: true, slug: true } },
      },
    }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})

adminApi.get('/articles/:id', async (req, res) => {
  const aid = id(req)
  let row
  try {
    row = await db.article.findUnique({
      where: { id: aid },
      include: {
        techs: { select: { id: true, name: true, slug: true } },
        project: { select: { id: true, title: true, slug: true } },
      },
    })
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
    return
  }
  if (!row) throw new HttpError(404, 'artículo inexistente')
  res.json(row)
})

adminApi.post('/articles', async (req, res) => {
  const b = req.body as Record<string, unknown>
  const techIds = intList(b, 'techIds')
  const row = await db.article.create({
    data: {
      ...articleData(b),
      techs: techIds.length > 0 ? { connect: techIds.map(n => ({ id: n })) } : undefined,
    },
    include: {
      techs: { select: { id: true, name: true, slug: true } },
      project: { select: { id: true, title: true, slug: true } },
    },
  })
  res.status(201).json(row)
})

adminApi.put('/articles/:id', async (req, res) => {
  const articleId = id(req)
  const b = req.body as Record<string, unknown>
  const techIds = intList(b, 'techIds')
  const row = await db.article.update({
    where: { id: articleId },
    data: {
      ...articleData(b),
      techs: { set: techIds.map(n => ({ id: n })) },
    },
    include: {
      techs: { select: { id: true, name: true, slug: true } },
      project: { select: { id: true, title: true, slug: true } },
    },
  })
  res.json(row)
})

adminApi.delete('/articles/:id', async (req, res) => {
  await db.article.delete({ where: { id: id(req) } })
  res.status(204).end()
})

adminApi.use(adminErrors)
