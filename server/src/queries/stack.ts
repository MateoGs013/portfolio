/** Consultas de tecnologías: cada una con sus obras visibles y la experiencia que la usa. */
import { db } from '../db.js'
import { sortByUsage } from '../content/matches.js'
import type { StackFilters } from '../filters.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { visibleProjectStubs } from './projects.js'

export const experienceStubArgs = {
  orderBy: [{ startedAt: 'desc' }, { slug: 'asc' }],
  select: {
    slug: true,
    kind: true,
    role: true,
    startedAt: true,
    endedAt: true,
    translations: { select: { locale: true, role: true } },
  },
} satisfies Prisma.Tech$experiencesArgs

function techInclude() {
  return {
    translations: true,
    projects: visibleProjectStubs(),
    experiences: experienceStubArgs,
  } satisfies Prisma.TechInclude
}

export type TechRecord = Prisma.TechGetPayload<{ include: ReturnType<typeof techInclude> }>

/** Tecnologías ordenadas por cantidad de obras visibles (desc) y después por nombre. */
export async function listStack(filters: StackFilters = {}): Promise<TechRecord[]> {
  const where: Prisma.TechWhereInput = filters.category ? { category: filters.category } : {}
  const records = await db.tech.findMany({ where, orderBy: { name: 'asc' }, include: techInclude() })
  return sortByUsage(records)
}

export function getTech(slug: string): Promise<TechRecord | null> {
  return db.tech.findUnique({ where: { slug }, include: techInclude() })
}
