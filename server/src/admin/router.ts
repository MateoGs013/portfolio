import { createRequire } from 'node:module'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import express, { Router, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { db } from '../db.js'
import { MediaKind, MediaRole, Prisma, ProjectStatus, TechCategory } from '../../generated/prisma/client.js'
import { requireAdmin } from './auth.js'
import { IMAGE_MIME, imageDims } from './image.js'
import { HttpError, bool, date, enumOf, int, intList, json, list, optDate, optInt, optStr, str } from './input.js'

const require = createRequire(import.meta.url)
const ADMIN_DIR = path.resolve('server/admin')
const MEDIA_DIR = path.resolve('public/media/projects')

// ─── UI estática ────────────────────────────────────────────────────────────

export const adminUi = Router()
// dotfiles: pnpm guarda los paquetes bajo node_modules/.pnpm y sendFile los rechaza por defecto.
adminUi.get('/vendor/vue.js', (_req, res) => res.sendFile(require.resolve('vue/dist/vue.global.prod.js'), { dotfiles: 'allow' }))
adminUi.use(express.static(ADMIN_DIR, { index: 'index.html' }))

// ─── API ────────────────────────────────────────────────────────────────────

export const adminApi = Router()
adminApi.use(requireAdmin)

const PROJECT_STATUS = Object.values(ProjectStatus)
const TECH_CATEGORY = Object.values(TechCategory)
const MEDIA_KIND = Object.values(MediaKind)
const MEDIA_ROLE = Object.values(MediaRole)

function id(req: Request): number {
  const n = Number(req.params['id'])
  if (!Number.isInteger(n)) throw new HttpError(400, 'id inválido')
  return n
}

/** Enums y opciones para los selects de la UI. */
adminApi.get('/meta', async (_req, res) => {
  const [orgs, techs, projects] = await Promise.all([
    db.org.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.tech.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.project.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])
  res.json({
    enums: { ProjectStatus: PROJECT_STATUS, TechCategory: TECH_CATEGORY, MediaKind: MEDIA_KIND, MediaRole: MEDIA_ROLE },
    options: { orgs, techs, projects },
  })
})

// ─── projects ───────────────────────────────────────────────────────────────

const projectInclude = {
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
  links: { orderBy: { id: 'asc' } },
  steps: { orderBy: { order: 'asc' } },
  media: { orderBy: [{ role: 'asc' }, { order: 'asc' }] },
} satisfies Prisma.ProjectInclude

function projectData(b: Record<string, unknown>) {
  return {
    slug: str(b, 'slug'),
    title: str(b, 'title'),
    year: int(b, 'year'),
    role: str(b, 'role'),
    status: enumOf(b, 'status', PROJECT_STATUS),
    featured: bool(b, 'featured'),
    summary: str(b, 'summary'),
    brief: optStr(b, 'brief'),
    outcome: optStr(b, 'outcome'),
    url: optStr(b, 'url'),
    repo: optStr(b, 'repo'),
    metrics: json(b, 'metrics') as Prisma.InputJsonValue | null,
    sortOrder: optInt(b, 'sortOrder') ?? 0,
    publishedAt: optDate(b, 'publishedAt'),
    orgId: optInt(b, 'orgId'),
  }
}

function projectNested(b: Record<string, unknown>) {
  const links = list(b, 'links').map(l => ({ label: str(l, 'label'), url: str(l, 'url') }))
  const steps = list(b, 'steps').map((s, i) => ({
    order: optInt(s, 'order') ?? i + 1,
    title: str(s, 'title'),
    body: str(s, 'body'),
    mediaId: optInt(s, 'mediaId'),
  }))
  return { links, steps, techIds: intList(b, 'techIds') }
}

adminApi.get('/projects', async (_req, res) => {
  res.json(await db.project.findMany({ include: projectInclude, orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }] }))
})

adminApi.get('/projects/:id', async (req, res) => {
  const row = await db.project.findUnique({ where: { id: id(req) }, include: projectInclude })
  if (!row) throw new HttpError(404, 'not found')
  res.json(row)
})

adminApi.post('/projects', async (req, res) => {
  const data = projectData(req.body)
  const { links, steps, techIds } = projectNested(req.body)
  const row = await db.project.create({
    data: {
      ...data,
      metrics: data.metrics ?? undefined,
      techs: { connect: techIds.map(id => ({ id })) },
      links: { create: links },
      steps: { create: steps },
    },
    include: projectInclude,
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
        metrics: data.metrics === null ? Prisma.DbNull : data.metrics,
        techs: { set: techIds.map(id => ({ id })) },
        links: { create: links },
        steps: { create: steps },
      },
      include: projectInclude,
    })
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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

async function removeFile(src: string) {
  const abs = path.resolve('public', '.' + src)
  if (!abs.startsWith(MEDIA_DIR)) return
  await unlink(abs).catch(() => undefined)
}

function mediaData(b: Record<string, unknown>) {
  return {
    alt: str(b, 'alt'),
    role: enumOf(b, 'role', MEDIA_ROLE),
    layer: optInt(b, 'layer'),
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

/** multipart: file + projectId + alt + role + layer? + order? */
adminApi.post('/media', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) throw new HttpError(400, 'falta el archivo (campo "file")')
  const ext = IMAGE_MIME[file.mimetype]
  if (!ext) throw new HttpError(400, `tipo no soportado: ${file.mimetype} (png, jpeg, webp)`)
  const dims = imageDims(file.buffer)
  if (!dims) throw new HttpError(400, 'no se pudo leer el tamaño de la imagen')

  const body = req.body as Record<string, unknown>
  const projectId = int(body, 'projectId')
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  if (!project) throw new HttpError(404, 'proyecto inexistente')

  const name = `${project.slug}-${Date.now().toString(36)}.${ext}`
  await mkdir(MEDIA_DIR, { recursive: true })
  await writeFile(path.join(MEDIA_DIR, name), file.buffer)

  const row = await db.media.create({
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
    slug: str(b, 'slug'),
    name: str(b, 'name'),
    category: enumOf(b, 'category', TECH_CATEGORY),
    since: int(b, 'since'),
    note: optStr(b, 'note'),
    color: optStr(b, 'color'),
  }
}

adminApi.get('/techs', async (_req, res) => {
  res.json(await db.tech.findMany({ orderBy: [{ since: 'asc' }, { name: 'asc' }], include: { _count: { select: { projects: true, experiences: true } } } }))
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
  return { slug: str(b, 'slug'), name: str(b, 'name'), url: optStr(b, 'url'), city: optStr(b, 'city') }
}

adminApi.get('/orgs', async (_req, res) => {
  res.json(await db.org.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { projects: true, experiences: true } } } }))
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
    slug: str(b, 'slug'),
    role: str(b, 'role'),
    startedAt: date(b, 'startedAt'),
    endedAt: optDate(b, 'endedAt'),
    summary: str(b, 'summary'),
    story: optStr(b, 'story'),
    orgId: optInt(b, 'orgId'),
  }
}

adminApi.get('/experience', async (_req, res) => {
  res.json(await db.experience.findMany({ orderBy: { startedAt: 'desc' }, include: experienceInclude }))
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

function docFields(b: Record<string, unknown>): Prisma.InputJsonValue {
  return list(b, 'fields').map(f => ({
    name: str(f, 'name'),
    type: str(f, 'type'),
    value: typeof f['value'] === 'string' ? f['value'] : '',
    ...(bool(f, 'wide') ? { wide: true } : {}),
    ...(Array.isArray(f['worlds']) && f['worlds'].length ? { worlds: f['worlds'] as string[] } : {}),
  }))
}

adminApi.get('/docs', async (_req, res) => {
  res.json(await db.doc.findMany({ orderBy: { key: 'asc' } }))
})
adminApi.put('/docs/:key', async (req, res) => {
  const key = String(req.params['key'])
  const data = { title: str(req.body, 'title'), fields: docFields(req.body) }
  res.json(await db.doc.upsert({ where: { key }, create: { key, ...data }, update: data }))
})
adminApi.delete('/docs/:key', async (req, res) => {
  await db.doc.delete({ where: { key: String(req.params['key']) } })
  res.status(204).end()
})

// ─── errores del admin ──────────────────────────────────────────────────────

adminApi.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
    res.status(409).json({ error: 'ya existe un registro con ese slug/clave' })
    return
  }
  if (err && typeof err === 'object' && 'code' in err && err.code === 'P2025') {
    res.status(404).json({ error: 'not found' })
    return
  }
  next(err)
})
