import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { asBool, asInt, readFilters } from '../filters.js'
import { fallbackProjects, getFallbackProjects } from '../fallbackData.js'
import { ProjectStatus, type Prisma } from '../../generated/prisma/client.js'

export const projects = Router()

const FILTERS = ['stack', 'year', 'role', 'featured', 'status', 'org'] as const

const orgSelect = { select: { slug: true, name: true } } satisfies Prisma.Project$orgArgs
const techSelect = { select: { slug: true, name: true }, orderBy: { name: 'asc' } } satisfies Prisma.Project$techsArgs

/** GET /api/projects?stack=&year=&role=&featured=&status=&org= */
projects.get('/projects', async (req, res) => {
  const filters = readFilters(req, FILTERS)
  const org = typeof req.query.org === 'string' ? req.query.org : undefined
  if (org) {
    filters.org = org
  }

  try {
    const where: Prisma.ProjectWhereInput = {}
    if (filters.stack) where.techs = { some: { slug: filters.stack } }
    const year = asInt(filters.year)
    if (year !== undefined) where.year = year
    if (filters.role) where.role = { contains: filters.role, mode: 'insensitive' }
    const featured = asBool(filters.featured)
    if (featured !== undefined) where.featured = featured

    // Validar status de forma segura contra ProjectStatus para evitar 500 en Prisma
    const validStatuses = Object.values(ProjectStatus)
    if (filters.status && validStatuses.includes(filters.status as ProjectStatus)) {
      where.status = filters.status as ProjectStatus
    }

    if (filters.org) {
      where.org = { slug: filters.org }
    }

    const data = await db.project.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }, { title: 'asc' }],
      include: {
        org: orgSelect,
        techs: techSelect,
        links: { select: { label: true, url: true } },
        // La portada viaja en la lista: DISEÑO arma su tira de fotogramas con ella.
        media: { where: { role: 'COVER' }, orderBy: { order: 'asc' }, take: 1 },
        _count: { select: { media: true, steps: true } },
      },
    })

    res.json(envelope(data, { filters }))
  } catch {
    // Fallback resiliente en memoria
    const data = getFallbackProjects(filters)
    res.json(envelope(data, { filters }))
  }
})

/** GET /api/projects/:slug → record + subvistas (steps) + media + links */
projects.get('/projects/:slug', async (req, res) => {
  try {
    const data = await db.project.findUnique({
      where: { slug: req.params.slug },
      include: {
        org: orgSelect,
        techs: techSelect,
        links: { select: { label: true, url: true } },
        media: { orderBy: [{ role: 'asc' }, { order: 'asc' }] },
        steps: {
          orderBy: { order: 'asc' },
          include: { media: true },
        },
      },
    })

    if (!data) {
      const fb = fallbackProjects.find(p => p.slug === req.params.slug)
      if (fb) {
        res.json(envelope(fb))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }
    res.json(envelope(data))
  } catch {
    const fb = fallbackProjects.find(p => p.slug === req.params.slug)
    if (fb) {
      res.json(envelope(fb))
      return
    }
    res.status(500).json({ error: 'internal error' })
  }
})
