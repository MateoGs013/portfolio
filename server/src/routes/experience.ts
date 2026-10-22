import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { readFilters } from '../filters.js'
import { fallbackExperience } from '../fallbackData.js'
import type { Prisma } from '../../generated/prisma/client.js'

export const experience = Router()

const FILTERS = ['stack', 'org'] as const

/** GET /api/experience (or /api/experiences) — ordenada de la más reciente a la más vieja. */
experience.get(['/experience', '/experiences'], async (req, res) => {
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

/** GET /api/experience/:slug (or /api/experiences/:slug) → detalle de una etapa de experiencia por su slug. */
experience.get(['/experience/:slug', '/experiences/:slug'], async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] ?? '' : String(req.params.slug ?? '')
  try {
    const data = await db.experience.findUnique({
      where: { slug },
      include: {
        org: { select: { slug: true, name: true, city: true } },
        techs: { select: { slug: true, name: true }, orderBy: { name: 'asc' } },
      },
    })

    if (!data) {
      const fb = fallbackExperience.find(e => e.slug === slug)
      if (fb) {
        res.json(envelope(fb))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }

    res.json(envelope(data))
  } catch {
    const fb = fallbackExperience.find(e => e.slug === req.params.slug)
    if (fb) {
      res.json(envelope(fb))
      return
    }
    res.status(500).json({ error: 'internal error' })
  }
})
