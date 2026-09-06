import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { asBool, asInt, readFilters } from '../filters.js'
import type { Prisma } from '../../generated/prisma/client.js'

export const projects = Router()

const FILTERS = ['stack', 'year', 'role', 'featured'] as const

const orgSelect = { select: { slug: true, name: true } } satisfies Prisma.Project$orgArgs
const techSelect = { select: { slug: true, name: true }, orderBy: { name: 'asc' } } satisfies Prisma.Project$techsArgs

/** GET /api/projects?stack=&year=&role=&featured= */
projects.get('/projects', async (req, res) => {
  const filters = readFilters(req, FILTERS)

  const where: Prisma.ProjectWhereInput = {}
  if (filters.stack) where.techs = { some: { slug: filters.stack } }
  const year = asInt(filters.year)
  if (year !== undefined) where.year = year
  if (filters.role) where.role = { contains: filters.role, mode: 'insensitive' }
  const featured = asBool(filters.featured)
  if (featured !== undefined) where.featured = featured

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
})

/** GET /api/projects/:slug → record + subvistas (steps) + media + links */
projects.get('/projects/:slug', async (req, res) => {
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
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(envelope(data))
})
