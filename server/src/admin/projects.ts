/**
 * Obras en el admin. Guardar no pisa datos: los pasos, los enlaces y las métricas se actualizan por id
 * (así conservan sus traducciones), el orden de los pasos se renumera 1..n en el server y el de las
 * métricas sale de su posición. El inglés de la obra, de cada paso, de cada enlace y del rótulo de
 * cada métrica llega en `translations.en` y se guarda por upsert (ver translations.ts).
 *
 * La dirección (slug) se fija al crear: un PUT con otra da 400 y se cambia con PATCH /projects/:id/slug,
 * que avisa que /projects/<vieja> deja de andar. Una obra nueva va al final de Obra (sortOrder max+1).
 */
import { Router } from 'express'
import { db } from '../db.js'
import { ProjectStatus, type Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE, paramId } from './common.js'
import { HttpError, bool, enumOf, guardSlugChange, int, intList, list, newSlug, optDate, optInt, optStr, optUrl, slug, str, url, validate } from './input.js'
import { pruneFolders, removeMediaFiles } from './mediaFiles.js'
import { metricList, syncMetrics } from './metrics.js'
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
  metrics: { orderBy: { order: 'asc' }, include: withTranslations },
} satisfies Prisma.ProjectInclude

/** La columna vieja de métricas no sale del server: se borra en una migración posterior. */
const projectOmit = { legacyMetrics: true } satisfies Prisma.ProjectOmit

interface StepInput { id: number | null, order: number, title: string, body: string, mediaId: number | null, en: Body | null }
interface LinkInput { id: number | null, label: string, url: string, en: Body | null }

/** Los campos propios de la obra, sin la dirección (que se fija al crear) ni el orden. */
function projectData(b: Body) {
  return {
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

/** Todo el body validado de una vez: los fallos vuelven juntos, cada uno en su campo. */
function projectInput(b: Body, check?: () => void) {
  return validate('Project', b, () => {
    check?.()
    return { data: projectData(b), sortOrder: optInt(b, 'sortOrder'), ...projectNested(b) }
  })
}

async function currentProject(id: number) {
  const row = await db.project.findUnique({ where: { id }, select: { id: true, slug: true } })
  if (!row) throw new HttpError(404, 'No encontramos esa obra: puede que se haya borrado. Recargá la lista.')
  return row
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
  if (!row) throw new HttpError(404, 'No encontramos esa obra: puede que se haya borrado. Recargá la lista.')
  res.json(row)
})

/**
 * Una obra nueva todavía no tiene media: los pasos llegan sin imagen y sin ids. Sin dirección, sale
 * del título; sin orden, va al final.
 */
projectsRouter.post('/projects', async (req, res) => {
  const b = req.body as Body
  const { data, sortOrder, links, steps, techIds, metrics, en, address } = validate('Project', b, () => {
    const input = projectInput(b)
    return { ...input, address: newSlug(b, 'slug', input.data.title) }
  })
  const row = await db.$transaction(async (tx) => {
    const last = await tx.project.aggregate({ _max: { sortOrder: true } })
    const { id } = await tx.project.create({
      data: { ...data, slug: address, sortOrder: sortOrder ?? (last._max.sortOrder ?? 0) + 1, techs: { connect: techIds.map(id => ({ id })) } },
      select: { id: true },
    })
    await syncLinks(tx, id, links.map(l => ({ ...l, id: null })))
    await syncSteps(tx, id, steps.map(s => ({ ...s, id: null, mediaId: null })))
    if (metrics) await syncMetrics(tx, id, metrics.map(m => ({ ...m, id: null })))
    if (en) await saveProjectEn(tx, id, en)
    return tx.project.findUniqueOrThrow({ where: { id }, include: projectInclude, omit: projectOmit })
  })
  res.status(201).json(row)
})

/** Sin `sortOrder` en el body se conserva el orden guardado. */
projectsRouter.put('/projects/:id', async (req, res) => {
  const b = req.body as Body
  const { id: pid, slug: address } = await currentProject(paramId(req))
  const { data, sortOrder, links, steps, techIds, metrics, en } = projectInput(b, () => guardSlugChange(address, b['slug']))
  const row = await db.$transaction(async (tx) => {
    const order = sortOrder === null ? {} : { sortOrder }
    await tx.project.update({ where: { id: pid }, data: { ...data, ...order, techs: { set: techIds.map(id => ({ id })) } } })
    await syncLinks(tx, pid, links)
    await syncSteps(tx, pid, steps)
    if (metrics) await syncMetrics(tx, pid, metrics)
    if (en) await saveProjectEn(tx, pid, en)
    return tx.project.findUniqueOrThrow({ where: { id: pid }, include: projectInclude, omit: projectOmit })
  })
  res.json(row)
})

/** Cambios rápidos desde la lista: estado, destacado y orden (subir/bajar). */
projectsRouter.patch('/projects/:id', async (req, res) => {
  const pid = paramId(req)
  const b = (req.body ?? {}) as Body
  const patchData: Prisma.ProjectUpdateInput = validate('Project', b, () => ({
    ...('status' in b ? { status: enumOf(b, 'status', PROJECT_STATUS) } : {}),
    ...('featured' in b ? { featured: bool(b, 'featured') } : {}),
    ...('sortOrder' in b ? { sortOrder: int(b, 'sortOrder') } : {}),
  }))
  if (Object.keys(patchData).length === 0) throw new HttpError(400, 'No llegó ningún cambio para guardar.')
  res.json(await db.project.update({ where: { id: pid }, data: patchData, include: projectInclude, omit: projectOmit }))
})

/** «Cambiar dirección»: /projects/<vieja> deja de andar. Los archivos quedan donde estaban. */
projectsRouter.patch('/projects/:id/slug', async (req, res) => {
  const b = req.body as Body
  const current = await currentProject(paramId(req))
  const next = validate('Project', b, () => slug(b, 'slug'))
  res.json(await db.project.update({ where: { id: current.id }, data: { slug: next }, include: projectInclude, omit: projectOmit }))
})

/** Borra la obra, sus archivos y su carpeta si quedó vacía. */
projectsRouter.delete('/projects/:id', async (req, res) => {
  const { id: pid, slug: address } = await currentProject(paramId(req))
  const media = await db.media.findMany({ where: { projectId: pid }, select: { src: true, srcWebm: true, poster: true } })
  await db.project.delete({ where: { id: pid } })
  await removeMediaFiles(media)
  await pruneFolders([address])
  res.status(204).end()
})
