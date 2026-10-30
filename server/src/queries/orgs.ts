/** Consultas de organizaciones: clientes, empresas e instituciones con sus obras visibles. */
import { db } from '../db.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { visibleProjectStubs } from './projects.js'
import { experienceStubArgs } from './stack.js'

function orgInclude() {
  return {
    projects: visibleProjectStubs(),
    experiences: experienceStubArgs,
  } satisfies Prisma.OrgInclude
}

export type OrgRecord = Prisma.OrgGetPayload<{ include: ReturnType<typeof orgInclude> }>

export function listOrgs(): Promise<OrgRecord[]> {
  return db.org.findMany({ orderBy: [{ name: 'asc' }, { slug: 'asc' }], include: orgInclude() })
}

export function getOrg(slug: string): Promise<OrgRecord | null> {
  return db.org.findUnique({ where: { slug }, include: orgInclude() })
}
