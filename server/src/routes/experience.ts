import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { readFilters } from '../filters.js'
import { fallbackExperience } from '../fallbackData.js'
import type { Prisma } from '../../generated/prisma/client.js'

export const experience = Router()

const FILTERS = ['stack', 'org'] as const

/** GET /api/experience?stack=&org= — ordenada de la más reciente a la más vieja. */
experience.get('/experience', async (req, res) => {
  const filters = readFilters(req, FILTERS)

  try {
    const where: Prisma.ExperienceWhereInput = {}
    if (filters.stack) where.techs = { some: { slug: filters.stack } }
    if (filters.org) where.org = { slug: filters.org }

    const data = await db.experience.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        org: { select: { slug: true, name: true, city: true } },
        techs: { select: { slug: true, name: true }, orderBy: { name: 'asc' } },
      },
    })

    res.json(envelope(data, { filters }))
  } catch {
    // Fallback resiliente en memoria
    let data = [...fallbackExperience]
    if (filters.stack) {
      data = data.filter(e => e.techs.some(t => t.slug === filters.stack))
    }
    if (filters.org) {
      data = data.filter(e => e.org?.slug === filters.org)
    }

    res.json(envelope(data, { filters }))
  }
})
