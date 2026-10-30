/**
 * Consultas de obras. Funciones puras sobre Prisma: traen el registro crudo en español con sus
 * translations y aplican la visibilidad en la lista, en el detalle y en cada relación hacia Project.
 * La lista y el detalle comparten la forma (ProjectRecord): así el snapshot guarda una sola copia
 * y `present` decide qué se publica en cada caso.
 */
import { db } from '../db.js'
import { visibleProject } from '../content/visibility.js'
import type { ProjectFilters } from '../filters.js'
import type { Prisma } from '../../generated/prisma/client.js'

/** La columna vieja de métricas (Json) no se publica: se borra en una migración posterior. */
export const projectOmit = { legacyMetrics: true } satisfies Prisma.ProjectOmit

/** Obras ligadas desde otra colección: solo las visibles, con su título traducible. */
export function visibleProjectStubs() {
  return {
    where: visibleProject(),
    orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
    select: {
      slug: true,
      title: true,
      year: true,
      publishedAt: true,
      translations: { select: { locale: true, title: true } },
    },
  } satisfies Prisma.Tech$projectsArgs
}

const mediaArgs = { include: { translations: true } } satisfies Prisma.MediaDefaultArgs

function projectInclude() {
  return {
    org: { select: { slug: true, name: true, city: true } },
    techs: {
      orderBy: { name: 'asc' },
      select: {
        slug: true,
        name: true,
        category: true,
        since: true,
        note: true,
        translations: { select: { locale: true, note: true } },
        projects: visibleProjectStubs(),
      },
    },
    media: { orderBy: [{ role: 'asc' }, { order: 'asc' }, { id: 'asc' }], ...mediaArgs },
    steps: { orderBy: { order: 'asc' }, include: { translations: true, media: mediaArgs } },
    links: { orderBy: { id: 'asc' }, include: { translations: true } },
    metrics: { orderBy: [{ order: 'asc' }, { key: 'asc' }] },
    experiences: {
      orderBy: { startedAt: 'desc' },
      select: { slug: true, kind: true, role: true, translations: { select: { locale: true, role: true } } },
    },
    translations: true,
  } satisfies Prisma.ProjectInclude
}

export type ProjectRecord = Prisma.ProjectGetPayload<{
  include: ReturnType<typeof projectInclude>
  omit: typeof projectOmit
}>

export const projectOrder = [
  { sortOrder: 'asc' },
  { year: 'desc' },
  { title: 'asc' },
] satisfies Prisma.ProjectOrderByWithRelationInput[]

function projectWhere(filters: ProjectFilters): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = { ...visibleProject() }
  if (filters.status) where.status = filters.status
  if (filters.featured !== undefined) where.featured = filters.featured
  if (filters.year !== undefined) where.year = filters.year
  if (filters.stack) where.techs = { some: { slug: filters.stack } }
  if (filters.org) where.org = { slug: filters.org }
  return where
}

/** Obras visibles en sortOrder, con los filtros ya validados. */
export function listProjects(filters: ProjectFilters = {}): Promise<ProjectRecord[]> {
  return db.project.findMany({
    where: projectWhere(filters),
    orderBy: projectOrder,
    omit: projectOmit,
    include: projectInclude(),
  })
}

/** Una obra visible por su slug; null si no existe o no se publica (la ruta responde 404). */
export function getProject(slug: string): Promise<ProjectRecord | null> {
  return db.project.findFirst({
    where: { slug, ...visibleProject() },
    omit: projectOmit,
    include: projectInclude(),
  })
}
