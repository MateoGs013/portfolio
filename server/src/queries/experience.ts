/** Consultas de trayectoria: formación, tesis, clientes, freelance y proyectos propios. */
import { db } from '../db.js'
import type { ExperienceFilters } from '../filters.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { visibleProjectStubs } from './projects.js'

function experienceInclude() {
  return {
    org: { select: { slug: true, name: true, city: true } },
    techs: { orderBy: { name: 'asc' }, select: { slug: true, name: true, category: true } },
    projects: visibleProjectStubs(),
    translations: true,
  } satisfies Prisma.ExperienceInclude
}

export type ExperienceRecord = Prisma.ExperienceGetPayload<{ include: ReturnType<typeof experienceInclude> }>

export const experienceOrder = [
  { startedAt: 'desc' },
  { slug: 'asc' },
] satisfies Prisma.ExperienceOrderByWithRelationInput[]

/** De la más reciente a la más vieja. */
export function listExperience(filters: ExperienceFilters = {}): Promise<ExperienceRecord[]> {
  const where: Prisma.ExperienceWhereInput = {}
  if (filters.stack) where.techs = { some: { slug: filters.stack } }
  if (filters.org) where.org = { slug: filters.org }
  return db.experience.findMany({ where, orderBy: experienceOrder, include: experienceInclude() })
}

export function getExperience(slug: string): Promise<ExperienceRecord | null> {
  return db.experience.findUnique({ where: { slug }, include: experienceInclude() })
}
