/**
 * Empresas en el admin. Antes de borrar una, GET /orgs/:id/impact dice qué obras y experiencias la
 * nombran; DELETE las pasa a otra empresa con ?reassignTo= (o las deja sin empresa) y borra, todo en
 * una transacción. La dirección solo cambia con PATCH /orgs/:id/slug.
 */
import { Router, type Request } from 'express'
import { db } from '../db.js'
import type { AdminImpact, DeleteResult } from '../shared/adminContracts.js'
import { paramId, readOr503 } from './common.js'
import { HttpError, guardSlugChange, newSlug, optStr, optUrl, slug, str, validate } from './input.js'

type Body = Record<string, unknown>

const orgInclude = { _count: { select: { projects: true, experiences: true } } } as const

function orgData(b: Body) {
  return { name: str(b, 'name'), url: optUrl(b, 'url'), city: optStr(b, 'city') }
}

async function currentOrg(id: number) {
  const row = await db.org.findUnique({ where: { id }, select: { id: true, slug: true, name: true } })
  if (!row) throw new HttpError(404, 'No encontramos esa empresa: puede que se haya borrado. Recargá la lista.')
  return row
}

/** `?reassignTo=` del borrado: otra empresa que exista, o null para dejar los registros sin empresa. */
export async function reassignTarget(req: Request, id: number, exists: (target: number) => Promise<boolean>): Promise<number | null> {
  const raw = req.query['reassignTo']
  if (raw === undefined || raw === '') return null
  const target = Number(raw)
  if (!Number.isInteger(target) || target <= 0) throw new HttpError(400, 'Elegí a qué registro pasar lo que depende de este.')
  if (target === id) throw new HttpError(400, 'No se puede pasar lo que depende de un registro a ese mismo registro.')
  if (!await exists(target)) throw new HttpError(400, 'El registro elegido para recibir lo que depende de este ya no existe. Recargá y elegí otro.')
  return target
}

export const orgsRouter = Router()

orgsRouter.get('/orgs', async (_req, res) => {
  const rows = await readOr503(res, () => db.org.findMany({ orderBy: { name: 'asc' }, include: orgInclude }))
  if (rows) res.json(rows)
})

orgsRouter.get('/orgs/:id', async (req, res) => {
  const id = paramId(req)
  const row = await readOr503(res, () => db.org.findUnique({ where: { id }, include: orgInclude }))
  if (row === undefined) return
  if (!row) throw new HttpError(404, 'No encontramos esa empresa: puede que se haya borrado. Recargá la lista.')
  res.json(row)
})

orgsRouter.post('/orgs', async (req, res) => {
  const b = req.body as Body
  const data = validate('Org', b, () => {
    const fields = orgData(b)
    return { ...fields, slug: newSlug(b, 'slug', fields.name) }
  })
  res.status(201).json(await db.org.create({ data, include: orgInclude }))
})

orgsRouter.put('/orgs/:id', async (req, res) => {
  const b = req.body as Body
  const current = await currentOrg(paramId(req))
  const data = validate('Org', b, () => {
    guardSlugChange(current.slug, b['slug'])
    return orgData(b)
  })
  res.json(await db.org.update({ where: { id: current.id }, data, include: orgInclude }))
})

/** «Cambiar dirección»: la única forma de tocar el slug. Los enlaces viejos dejan de andar. */
orgsRouter.patch('/orgs/:id/slug', async (req, res) => {
  const b = req.body as Body
  const current = await currentOrg(paramId(req))
  const next = validate('Org', b, () => slug(b, 'slug'))
  res.json(await db.org.update({ where: { id: current.id }, data: { slug: next }, include: orgInclude }))
})

orgsRouter.get('/orgs/:id/impact', async (req, res) => {
  const id = paramId(req)
  const row = await readOr503(res, () => db.org.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      projects: { select: { id: true, title: true, slug: true }, orderBy: { title: 'asc' } },
      experiences: { select: { id: true, role: true, slug: true }, orderBy: { startedAt: 'desc' } },
    },
  }))
  if (row === undefined) return
  if (!row) throw new HttpError(404, 'No encontramos esa empresa: puede que se haya borrado. Recargá la lista.')
  const experiences = row.experiences.map(e => ({ id: e.id, title: e.role, slug: e.slug }))
  const impact: AdminImpact = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    projects: row.projects,
    experiences,
    articles: [],
    total: row.projects.length + experiences.length,
  }
  res.json(impact)
})

orgsRouter.delete('/orgs/:id', async (req, res) => {
  const { id } = await currentOrg(paramId(req))
  const target = await reassignTarget(req, id, async other => (await db.org.count({ where: { id: other } })) > 0)
  const moved = await db.$transaction(async (tx) => {
    const projects = await tx.project.updateMany({ where: { orgId: id }, data: { orgId: target } })
    const experiences = await tx.experience.updateMany({ where: { orgId: id }, data: { orgId: target } })
    await tx.org.delete({ where: { id } })
    return projects.count + experiences.count
  })
  const result: DeleteResult = { deleted: id, reassignedTo: target, moved }
  res.json(result)
})
