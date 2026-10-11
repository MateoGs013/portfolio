import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { readFilters } from '../filters.js'
import { fallbackStack } from '../fallbackData.js'
import { TechCategory, type Prisma } from '../../generated/prisma/client.js'

export const stack = Router()

const FILTERS = ['category'] as const

function isCategory(value: string): value is TechCategory {
  return (Object.values(TechCategory) as string[]).includes(value)
}

/** GET /api/stack?category= (alias /api/techs) — cada tech con cuántos proyectos y experiencias la usan. */
stack.get(['/stack', '/techs'], async (req, res) => {
  const filters = readFilters(req, FILTERS)

  try {
    const where: Prisma.TechWhereInput = {}
    const category = filters.category?.toUpperCase()
    if (category && isCategory(category)) where.category = category

    const data = await db.tech.findMany({
      where,
      orderBy: [{ since: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { projects: true, experiences: true } },
      },
    })

    res.json(envelope(data, { filters }))
  } catch {
    // Fallback resiliente en memoria
    let data = [...fallbackStack]
    const category = filters.category?.toUpperCase()
    if (category && isCategory(category)) {
      data = data.filter(t => t.category === category)
    }

    res.json(envelope(data, { filters }))
  }
})

/** GET /api/stack/:slug (alias /api/techs/:slug) — detalle de una tecnología por slug. */
stack.get(['/stack/:slug', '/techs/:slug'], async (req, res) => {
  const slug = String(Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug)
  try {
    const data = await db.tech.findUnique({
      where: { slug },
      include: {
        projects: {
          select: { slug: true, title: true, year: true },
          orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
        },
        experiences: {
          select: { slug: true, role: true, startedAt: true, endedAt: true },
          orderBy: { startedAt: 'desc' },
        },
        _count: { select: { projects: true, experiences: true } },
      },
    })

    if (!data) {
      const fb = fallbackStack.find(t => t.slug === slug)
      if (fb) {
        res.json(envelope(fb))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }

    res.json(envelope(data))
  } catch {
    const fb = fallbackStack.find(t => t.slug === slug)
    if (fb) {
      res.json(envelope(fb))
      return
    }
    res.status(500).json({ error: 'internal error' })
  }
})
