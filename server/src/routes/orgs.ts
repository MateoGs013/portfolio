import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { fallbackOrgs } from '../fallbackData.js'

export const orgs = Router()

/** GET /api/orgs → lista de todas las organizaciones con conteo de proyectos y experiencias. */
orgs.get(['/orgs', '/org'], async (_req, res) => {
  try {
    const data = await db.org.findMany({
      orderBy: { name: 'asc' },
      include: {
        projects: {
          select: { slug: true, title: true, year: true },
          orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
        },
        experiences: {
          select: { slug: true, role: true, startedAt: true, endedAt: true },
          orderBy: { startedAt: 'desc' },
        },
      },
    })
    res.json(envelope(data))
  } catch {
    const fallbackList = Object.values(fallbackOrgs)
    res.json(envelope(fallbackList))
  }
})

/**
 * GET /api/orgs/:slug → la organización con sus proyectos y experiencias.
 */
orgs.get(['/orgs/:slug', '/org/:slug'], async (req, res) => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] ?? '' : String(req.params.slug ?? '')
  try {
    const data = await db.org.findUnique({
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
      },
    })
    if (!data) {
      const fb = fallbackOrgs[slug]
      if (fb) {
        res.json(envelope(fb))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }
    res.json(envelope(data))
  } catch {
    const fb = fallbackOrgs[slug]
    if (fb) {
      res.json(envelope(fb))
      return
    }
    res.status(404).json({ error: 'not found' })
  }
})
