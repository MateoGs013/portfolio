/**
 * Obras en el admin. Guardar no pisa datos: los pasos y enlaces se actualizan por id (así conservan
 * sus traducciones), el orden de los pasos se renumera 1..n en el server y las métricas se
 * reemplazan como filas Metric dentro de la misma transacción. El inglés de la obra, de cada paso
 * y de cada enlace llega en `translations.en` y se guarda por upsert (ver translations.ts).
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ProjectStatus, type Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE, paramId } from './common.js'
import { HttpError, bool, enumOf, int, intList, list, optDate, optInt, optStr, optUrl, slug, str, url } from './input.js'
import { removeMediaFiles } from './media.js'
import { metricList, type MetricData } from './metrics.js'
import { enBody, saveLinkEn, saveProjectEn, saveStepEn, withTranslations } from './translations.js'

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient

const PROJECT_STATUS = Object.values(ProjectStatus)

const projectInclude = {
  ...withTranslations,
  org: { select: { id: true, name: true } },
  techs: { select: { id: true, name: true } },
  links: { orderBy: { id: 'asc' }, include: withTranslations },
  steps: { orderBy: { order: 'asc' }, include: withTranslations },
  media: { orderBy: [{ role: 'asc' }, { order: 'asc' }], include: withTranslations },
  metrics: { orderBy: { order: 'asc' } },
} satisfies Prisma.ProjectInclude

/** La columna vieja de métricas no sale del server: se borra en una migración posterior. */
const projectOmit = { legacyMetrics: true } satisfies Prisma.ProjectOmit

interface StepInput { id: number | null, order: number, title: string, body: string, mediaId: number | null, en: Body | null }
interface LinkInput { id: number | null, label: string, url: string, en: Body | null }

function projectData(b: Body) {
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
    // Visibilidad («Mostrar en el sitio»): null = oculta.
    publishedAt: optDate(b, 'publishedAt'),
    orgId: optInt(b, 'orgId'),
  }
}

/** El orden de los pasos sale de su posición en la lista, nunca del cliente: 1..n sin huecos. */
function projectNested(b: Body) {
  const links: LinkInput[] = list(b, 'links').map(l => ({ id: optInt(l, 'id'), label: str(l, 'label'), url: url(l, 'url'), en: enBody(l) }))
  const steps: StepInput[] = list(b, 'steps').map((s, i) => ({
    id: optInt(s, 'id'),
    order: i + 1,
    title: str(s, 'title', 200),
    body: str(s, 'body'),
    mediaId: optInt(s, 'mediaId'),
    en: enBody(s),
  }))
  return { links, steps, techIds: intList(b, 'techIds'), metrics: metricList(b), en: enBody(b) }
}

async function syncLinks(tx: Tx, projectId: number, links: LinkInput[]): Promise<void> {
  const own = new Set((await tx.link.findMany({ where: { projectId }, select: { id: true } })).map(l => l.id))
  const kept = links.filter(l => l.id !== null && own.has(l.id))
  await tx.link.deleteMany({ where: { projectId, id: { notIn: kept.map(l => l.id as number) } } })
  for (const l of links) {
    const data = { label: l.label, url: l.url }
    const row = l.id !== null && own.has(l.id)
      ? await tx.link.update({ where: { id: l.id }, data })
      : await tx.link.create({ data: { ...data, projectId } })
    if (l.en) await saveLinkEn(tx, row.id, l.en)
  }
}

async function syncSteps(tx: Tx, projectId: number, steps: StepInput[]): Promise<void> {
  const own = new Set((await tx.processStep.findMany({ where: { projectId }, select: { id: true } })).map(s => s.id))
  const media = new Set((await tx.media.findMany({ where: { projectId }, select: { id: true } })).map(m => m.id))
  for (const s of steps) {
    if (s.mediaId !== null && !media.has(s.mediaId)) throw new HttpError(400, `paso ${s.order}: la imagen elegida no es de esta obra`)
  }
  const kept = steps.filter(s => s.id !== null && own.has(s.id))
  await tx.processStep.deleteMany({ where: { projectId, id: { notIn: kept.map(s => s.id as number) } } })
  // (projectId, order) es único: los pasos que quedan pasan a órdenes negativos antes de renumerarlos.
  await tx.processStep.updateMany({ where: { projectId }, data: { order: { multiply: -1 } } })
  for (const s of steps) {
    const data = { order: s.order, title: s.title, body: s.body, mediaId: s.mediaId }
    const row = s.id !== null && own.has(s.id)
      ? await tx.processStep.update({ where: { id: s.id }, data })
      : await tx.processStep.create({ data: { ...data, projectId } })
    if (s.en) await saveStepEn(tx, row.id, s.en)
  }
}

async function replaceMetrics(tx: Tx, projectId: number, metrics: MetricData[]): Promise<void> {
  await tx.metric.deleteMany({ where: { projectId } })
  if (metrics.length) await tx.metric.createMany({ data: metrics.map(m => ({ ...m, projectId })) })
}

export const projectsRouter = Router()

projectsRouter.get('/projects', async (_req, res) => {
  try {
    res.json(await db.project.findMany({ include: projectInclude, omit: projectOmit, orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }] }))
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})

projectsRouter.get('/projects/:id', async (req, res) => {
  const pid = paramId(req)
  let row
  try {
    row = await db.project.findUnique({ where: { id: pid }, include: projectInclude, omit: projectOmit })
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
    return
  }
  if (!row) throw new HttpError(404, 'not found')
  res.json(row)
})

/** Una obra nueva todavía no tiene media: los pasos llegan sin imagen y sin ids. */
projectsRouter.post('/projects', async (req, res) => {
  const data = projectData(req.body)
  const { links, steps, techIds, metrics, en } = projectNested(req.body)
  const row = await db.$transaction(async (tx) => {
    const { id } = await tx.project.create({
      data: { ...data, techs: { connect: techIds.map(id => ({ id })) }, metrics: { create: metrics ?? [] } },
      select: { id: true },
    })
    await syncLinks(tx, id, links.map(l => ({ ...l, id: null })))
    await syncSteps(tx, id, steps.map(s => ({ ...s, id: null, mediaId: null })))
    if (en) await saveProjectEn(tx, id, en)
    return tx.project.findUniqueOrThrow({ where: { id }, include: projectInclude, omit: projectOmit })
  })
  res.status(201).json(row)
})

projectsRouter.put('/projects/:id', async (req, res) => {
  const pid = paramId(req)
  const data = projectData(req.body)
  const { links, steps, techIds, metrics, en } = projectNested(req.body)
  const row = await db.$transaction(async (tx) => {
    await tx.project.update({ where: { id: pid }, data: { ...data, techs: { set: techIds.map(id => ({ id })) } } })
    await syncLinks(tx, pid, links)
    await syncSteps(tx, pid, steps)
    if (metrics) await replaceMetrics(tx, pid, metrics)
    if (en) await saveProjectEn(tx, pid, en)
    return tx.project.findUniqueOrThrow({ where: { id: pid }, include: projectInclude, omit: projectOmit })
  })
  res.json(row)
})

/** Cambios rápidos desde la lista: estado, destacado y orden (subir/bajar). */
projectsRouter.patch('/projects/:id', async (req, res) => {
  const pid = paramId(req)
  const b = (req.body ?? {}) as Body
  const patchData: Prisma.ProjectUpdateInput = {}
  if ('status' in b) patchData.status = enumOf(b, 'status', PROJECT_STATUS)
  if ('featured' in b) patchData.featured = bool(b, 'featured')
  if ('sortOrder' in b) patchData.sortOrder = int(b, 'sortOrder')
  if (Object.keys(patchData).length === 0) throw new HttpError(400, 'no llegó ningún campo para actualizar')
  res.json(await db.project.update({ where: { id: pid }, data: patchData, include: projectInclude, omit: projectOmit }))
})

projectsRouter.delete('/projects/:id', async (req, res) => {
  const pid = paramId(req)
  const media = await db.media.findMany({ where: { projectId: pid }, select: { src: true, srcWebm: true, poster: true } })
  await db.project.delete({ where: { id: pid } })
  await removeMediaFiles(media)
  res.status(204).end()
})
