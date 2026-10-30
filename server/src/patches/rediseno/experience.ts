/**
 * Experiencia del CV y la ciudad de cet-30. Solo completa: kind si sigue en el valor por defecto de la
 * columna, cvOrder si es NULL, highlights si están vacíos, pares con obras que falten (nunca desconecta)
 * y la entrada de Eros si no existe.
 */
import { ExperienceKind, type PrismaClient } from '../../../generated/prisma/client.js'
import { experience } from '../../seed/experience.js'
import { orgs } from '../../seed/stack.js'
import { show, type Change } from './change.js'

/** Valor que la migración dejó en las filas existentes (default de la columna). */
const KIND_DEFAULT = ExperienceKind.FREELANCE
/** Ciudad vieja de cet-30: se reemplaza solo si sigue así. */
const CET_OLD_CITIES = new Set([null, 'Río Negro, AR'])

export async function experienceChanges(db: PrismaClient): Promise<Change[]> {
  const changes: Change[] = []

  for (const e of experience) {
    const row = await db.experience.findUnique({
      where: { slug: e.slug },
      select: { id: true, kind: true, cvOrder: true, highlights: true, projects: { select: { slug: true } } },
    })

    if (!row) {
      changes.push({
        what: [`experience ${e.slug}: crear (${e.kind}, cvOrder ${show(e.cvOrder)}, obras ${e.projects.join(', ') || 'ninguna'})`],
        apply: tx => tx.experience.create({
          data: {
            slug: e.slug,
            kind: e.kind,
            role: e.role,
            startedAt: new Date(e.startedAt),
            endedAt: e.endedAt ? new Date(e.endedAt) : null,
            summary: e.summary,
            story: e.story,
            highlights: e.highlights,
            location: e.location,
            cvOrder: e.cvOrder,
            org: e.org ? { connect: { slug: e.org } } : undefined,
            techs: { connect: e.techs.map(slug => ({ slug })) },
            projects: { connect: e.projects.map(slug => ({ slug })) },
          },
        }),
      })
      continue
    }

    const what: string[] = []
    const data: { kind?: ExperienceKind, cvOrder?: number, highlights?: string[] } = {}
    if (row.kind === KIND_DEFAULT && e.kind !== KIND_DEFAULT) {
      data.kind = e.kind
      what.push(`experience ${e.slug}: kind ${row.kind} → ${e.kind}`)
    }
    if (row.cvOrder === null && e.cvOrder !== null) {
      data.cvOrder = e.cvOrder
      what.push(`experience ${e.slug}: cvOrder NULL → ${e.cvOrder}`)
    }
    if (row.highlights.length === 0 && e.highlights.length > 0) {
      data.highlights = e.highlights
      const n = e.highlights.length
      what.push(`experience ${e.slug}: highlights [] → ${n} ${n === 1 ? 'viñeta' : 'viñetas'}`)
    }
    const linked = new Set(row.projects.map(p => p.slug))
    const missing = e.projects.filter(slug => !linked.has(slug))
    const existing = missing.length
      ? (await db.project.findMany({ where: { slug: { in: missing } }, select: { slug: true } })).map(p => p.slug)
      : []
    if (existing.length) what.push(`experience ${e.slug}: projects + ${existing.join(', ')}`)

    if (what.length) {
      changes.push({
        what,
        apply: tx => tx.experience.update({
          where: { id: row.id },
          data: { ...data, projects: { connect: existing.map(slug => ({ slug })) } },
        }),
      })
    }
  }

  const cet = orgs.find(o => o.slug === 'cet-30')
  const cetRow = await db.org.findUnique({ where: { slug: 'cet-30' }, select: { id: true, city: true } })
  if (cet && cetRow && cetRow.city !== cet.city && CET_OLD_CITIES.has(cetRow.city)) {
    changes.push({
      what: [`org cet-30: city ${show(cetRow.city)} → ${cet.city}`],
      apply: tx => tx.org.update({ where: { id: cetRow.id }, data: { city: cet.city } }),
    })
  }

  return changes
}
