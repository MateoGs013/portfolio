import { createRequire } from 'node:module'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { db } from '../db.js'
import { ArticleStatus, MediaKind, MediaRole, ProjectStatus, TechCategory, type Prisma } from '../../generated/prisma/client.js'
import { requireAdmin } from './auth.js'
import { IMAGE_MIME, imageDims } from './image.js'
import { HttpError, bool, date, enumOf, int, intList, list, optDate, optInt, optStr, optUrl, slug, str, url } from './input.js'
import { hunterRouter } from './hunter.js'
import { contentRouter } from './content.js'
import { radarRouter } from './radar.js'

const require = createRequire(import.meta.url)
const ADMIN_DIR = path.resolve('server/admin')
const MEDIA_DIR = path.resolve('public/media/projects')

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
adminApi.use('/hunter', hunterRouter)
adminApi.use('/content', contentRouter)
adminApi.use('/radar', radarRouter)

const PROJECT_STATUS = Object.values(ProjectStatus)
const ARTICLE_STATUS = Object.values(ArticleStatus)
const TECH_CATEGORY = Object.values(TechCategory)
const MEDIA_KIND = Object.values(MediaKind)
const MEDIA_ROLE = Object.values(MediaRole)

/**
 * Sin base no hay edición: las colecciones responden 503 en vez de servir datos de respaldo
 * con ids inventados (guardar sobre ellos fallaría o pisaría otro registro).
 */
const DB_UNAVAILABLE = { error: 'db_unavailable' } as const

function id(req: Request): number {
  const n = Number(req.params['id'])
  if (!Number.isInteger(n)) throw new HttpError(400, 'id inválido')
  return n
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
    enums: { ProjectStatus: PROJECT_STATUS, ArticleStatus: ARTICLE_STATUS, TechCategory: TECH_CATEGORY, MediaKind: MEDIA_KIND, MediaRole: MEDIA_ROLE },
    options,
  })
})

// ─── projects ───────────────────────────────────────────────────────────────

const projectInclude = {
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
  links: { orderBy: { id: 'asc' } },
  steps: { orderBy: { order: 'asc' } },
  media: { orderBy: [{ role: 'asc' }, { order: 'asc' }] },
  metrics: { orderBy: { order: 'asc' } },
} satisfies Prisma.ProjectInclude

/** La columna vieja de métricas no sale del server: se borra en una migración posterior. */
const projectOmit = { legacyMetrics: true } satisfies Prisma.ProjectOmit

function projectData(b: Record<string, unknown>) {
  return {
    slug: slug(b, 'slug'),
    title: str(b, 'title'),
    year: int(b, 'year'),
    role: str(b, 'role'),
    status: enumOf(b, 'status', PROJECT_STATUS),
    featured: bool(b, 'featured'),
    summary: str(b, 'summary'),
    brief: optStr(b, 'brief'),
    outcome: optStr(b, 'outcome'),
    url: optUrl(b, 'url'),
    repo: optUrl(b, 'repo'),
    sortOrder: optInt(b, 'sortOrder') ?? 0,
    publishedAt: optDate(b, 'publishedAt'),
    orgId: optInt(b, 'orgId'),
  }
}

function projectNested(b: Record<string, unknown>) {
  const links = list(b, 'links').map(l => ({ label: str(l, 'label'), url: url(l, 'url') }))
  const steps = list(b, 'steps').map((s, i) => ({
    order: optInt(s, 'order') ?? i + 1,
    title: str(s, 'title'),
    body: str(s, 'body'),
    mediaId: optInt(s, 'mediaId'),
  }))
  return { links, steps, techIds: intList(b, 'techIds') }
}

adminApi.get('/projects', async (_req, res) => {
  try {
    res.json(await db.project.findMany({ include: projectInclude, omit: projectOmit, orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }] }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})

adminApi.get('/projects/:id', async (req, res) => {
  const pid = id(req)
  let row
  try {
    row = await db.project.findUnique({ where: { id: pid }, include: projectInclude, omit: projectOmit })
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
    return
  }
  if (!row) throw new HttpError(404, 'not found')
  res.json(row)
})

adminApi.post('/projects', async (req, res) => {
  const data = projectData(req.body)
  const { links, steps, techIds } = projectNested(req.body)
  const row = await db.project.create({
    data: {
      ...data,
      techs: { connect: techIds.map(id => ({ id })) },
      links: { create: links },
      steps: { create: steps },
    },
    include: projectInclude,
    omit: projectOmit,
  })
  res.status(201).json(row)
})

adminApi.put('/projects/:id', async (req, res) => {
  const pid = id(req)
  const data = projectData(req.body)
  const { links, steps, techIds } = projectNested(req.body)
  const row = await db.$transaction(async (tx) => {
    await tx.link.deleteMany({ where: { projectId: pid } })
    await tx.processStep.deleteMany({ where: { projectId: pid } })
    return tx.project.update({
      where: { id: pid },
      data: {
        ...data,
        techs: { set: techIds.map(id => ({ id })) },
        links: { create: links },
        steps: { create: steps },
      },
      include: projectInclude,
      omit: projectOmit,
    })
  })
  res.json(row)
})

adminApi.patch('/projects/:id', async (req, res) => {
  const pid = id(req)
  const patchData: Prisma.ProjectUpdateInput = {}
  if (req.body && typeof req.body === 'object') {
    const b = req.body as Record<string, unknown>
    if ('status' in b) {
      patchData.status = enumOf(b, 'status', PROJECT_STATUS)
    }
    if ('featured' in b) {
      patchData.featured = bool(b, 'featured')
    }
    if ('sortOrder' in b) {
      patchData.sortOrder = int(b, 'sortOrder')
    }
  }
  const row = await db.project.update({
    where: { id: pid },
    data: patchData,
    include: projectInclude,
    omit: projectOmit,
  })
  res.json(row)
})

adminApi.delete('/projects/:id', async (req, res) => {
  const pid = id(req)
  const media = await db.media.findMany({ where: { projectId: pid }, select: { src: true } })
  await db.project.delete({ where: { id: pid } })
  await Promise.all(media.map(m => removeFile(m.src)))
  res.status(204).end()
})

// ─── media ──────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fields: 10,
    fileSize: 10 * 1024 * 1024,
  },
})

async function removeFile(src: string) {
  const abs = path.resolve('public', '.' + src)
  if (!abs.startsWith(MEDIA_DIR + path.sep)) return
  await unlink(abs).catch(() => undefined)
}

function mediaData(b: Record<string, unknown>) {
  return {
    alt: str(b, 'alt'),
    role: enumOf(b, 'role', MEDIA_ROLE),
    order: optInt(b, 'order') ?? 0,
  }
}

adminApi.get('/media', async (req, res) => {
  const projectId = optInt(req.query as Record<string, unknown>, 'projectId')
  res.json(await db.media.findMany({
    where: projectId === null ? {} : { projectId },
    orderBy: [{ projectId: 'asc' }, { role: 'asc' }, { order: 'asc' }],
  }))
})

/** multipart: file + projectId + alt + role + order? */
adminApi.post('/media', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) throw new HttpError(400, 'falta el archivo (campo "file")')
  const mimeExt = IMAGE_MIME[file.mimetype]
  if (!mimeExt) throw new HttpError(400, `tipo no soportado: ${file.mimetype} (png, jpeg, webp)`)
  const dims = imageDims(file.buffer)
  if (!dims) throw new HttpError(400, 'no se pudo leer el tamaño o formato de la imagen')
  if (dims.format !== mimeExt && !(mimeExt === 'jpg' && dims.format === 'jpg')) {
    throw new HttpError(400, 'el contenido del archivo no coincide con el tipo MIME declarado')
  }
  const ext = dims.format

  const body = req.body as Record<string, unknown>
  const projectId = int(body, 'projectId')
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  if (!project) throw new HttpError(404, 'proyecto inexistente')

  const name = path.basename(`${project.slug}-${Date.now().toString(36)}.${ext}`)
  const targetPath = path.resolve(MEDIA_DIR, name)
  if (!targetPath.startsWith(MEDIA_DIR + path.sep)) {
    throw new HttpError(400, 'nombre de archivo inválido')
  }
  await mkdir(MEDIA_DIR, { recursive: true })
  await writeFile(targetPath, file.buffer)

  let row
  try {
    row = await db.media.create({
      data: {
        ...mediaData(body),
        kind: MediaKind.IMAGE,
        src: `/media/projects/${name}`,
        width: dims.width,
        height: dims.height,
        bytes: file.size,
        projectId,
      },
    })
  } catch (err) {
    await unlink(targetPath).catch(() => undefined)
    throw err
  }
  res.status(201).json(row)
})

adminApi.put('/media/:id', async (req, res) => {
  res.json(await db.media.update({ where: { id: id(req) }, data: mediaData(req.body) }))
})

adminApi.delete('/media/:id', async (req, res) => {
  const row = await db.media.delete({ where: { id: id(req) } })
  await removeFile(row.src)
  res.status(204).end()
})

// ─── techs ──────────────────────────────────────────────────────────────────

function techData(b: Record<string, unknown>) {
  return {
    slug: slug(b, 'slug'),
    name: str(b, 'name'),
    category: enumOf(b, 'category', TECH_CATEGORY),
    since: int(b, 'since'),
    note: optStr(b, 'note'),
    color: optStr(b, 'color'),
  }
}

adminApi.get('/techs', async (_req, res) => {
  try {
    res.json(await db.tech.findMany({ orderBy: [{ since: 'asc' }, { name: 'asc' }], include: { _count: { select: { projects: true, experiences: true } } } }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
adminApi.post('/techs', async (req, res) => {
  res.status(201).json(await db.tech.create({ data: techData(req.body) }))
})
adminApi.put('/techs/:id', async (req, res) => {
  res.json(await db.tech.update({ where: { id: id(req) }, data: techData(req.body) }))
})
adminApi.delete('/techs/:id', async (req, res) => {
  await db.tech.delete({ where: { id: id(req) } })
  res.status(204).end()
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

// ─── experience ─────────────────────────────────────────────────────────────

const experienceInclude = {
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
} satisfies Prisma.ExperienceInclude

function experienceData(b: Record<string, unknown>) {
  return {
    slug: slug(b, 'slug'),
    role: str(b, 'role'),
    startedAt: date(b, 'startedAt'),
    endedAt: optDate(b, 'endedAt'),
    summary: str(b, 'summary'),
    story: optStr(b, 'story'),
    orgId: optInt(b, 'orgId'),
  }
}

adminApi.get('/experience', async (_req, res) => {
  try {
    res.json(await db.experience.findMany({ orderBy: { startedAt: 'desc' }, include: experienceInclude }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
adminApi.post('/experience', async (req, res) => {
  const techIds = intList(req.body, 'techIds')
  res.status(201).json(await db.experience.create({
    data: { ...experienceData(req.body), techs: { connect: techIds.map(id => ({ id })) } },
    include: experienceInclude,
  }))
})
adminApi.put('/experience/:id', async (req, res) => {
  const techIds = intList(req.body, 'techIds')
  res.json(await db.experience.update({
    where: { id: id(req) },
    data: { ...experienceData(req.body), techs: { set: techIds.map(id => ({ id })) } },
    include: experienceInclude,
  }))
})
adminApi.delete('/experience/:id', async (req, res) => {
  await db.experience.delete({ where: { id: id(req) } })
  res.status(204).end()
})

// ─── docs ───────────────────────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Valor de un campo de Doc según su tipo (DocFieldValue en app/lib/fieldMeta.ts).
 * - list: array de textos; si llega un texto (el textarea del admin), se parte por renglón.
 * - url / email: se validan; vacío queda vacío.
 * Devuelve undefined cuando no vino nada (sirve para `en`, que es opcional).
 */
function docValue(raw: unknown, type: string, where: string): string | string[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (type === 'list') {
    const items = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string')
      : typeof raw === 'string' ? raw.split(/\r?\n/) : []
    return items.map(x => x.trim()).filter(Boolean)
  }
  if (typeof raw !== 'string') throw new HttpError(400, `${where}: se esperaba texto`)
  const val = raw.trim()
  if (val === '') return ''
  if (type === 'url') return optUrl({ val }, 'val') ?? ''
  if (type === 'email' && !EMAIL.test(val)) throw new HttpError(400, `${where}: email inválido`)
  return type === 'email' ? val : raw
}

function docFields(b: Record<string, unknown>): Prisma.InputJsonValue {
  return list(b, 'fields').map(f => {
    const name = str(f, 'name')
    const type = str(f, 'type')
    const value = docValue(f['value'], type, name) ?? (type === 'list' ? [] : '')
    const en = docValue(f['en'], type, `${name} (en)`)
    const worlds = Array.isArray(f['worlds'])
      ? f['worlds'].filter((w): w is string => typeof w === 'string')
      : []
    return {
      name,
      type,
      value,
      ...(en !== undefined && en !== '' && !(Array.isArray(en) && !en.length) ? { en } : {}),
      ...(bool(f, 'wide') ? { wide: true } : {}),
      ...(worlds.length ? { worlds } : {}),
    }
  })
}

adminApi.get('/docs', async (_req, res) => {
  try {
    res.json(await db.doc.findMany({ orderBy: { key: 'asc' } }))
  } catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
adminApi.put('/docs/:key', async (req, res) => {
  const key = slug({ key: req.params['key'] }, 'key')
  const data = { title: str(req.body, 'title'), fields: docFields(req.body) }
  res.json(await db.doc.upsert({ where: { key }, create: { key, ...data }, update: data }))
})
adminApi.delete('/docs/:key', async (req, res) => {
  const key = slug({ key: req.params['key'] }, 'key')
  await db.doc.delete({ where: { key } })
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

// ─── errores del admin ──────────────────────────────────────────────────────

adminApi.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'el archivo supera el límite de 10MB' })
      return
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'solo se permite subir 1 archivo' })
      return
    }
    res.status(400).json({ error: `error en subida de archivo: ${err.message}` })
    return
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  if (err && typeof err === 'object' && 'code' in err) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'ya existe un registro con ese slug/clave' })
      return
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'violación de integridad referencial (clave foránea inválida o en uso)' })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'not found' })
      return
    }
  }
  next(err)
})
