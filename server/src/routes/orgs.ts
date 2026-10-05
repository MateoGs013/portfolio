import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { fallbackOrgs } from '../fallbackData.js'

export const orgs = Router()

/**
 * GET /api/orgs/:slug → la organización con sus proyectos y experiencias.
 * No hay lista: a las orgs se llega por relación, saltando de lado desde un
 * proyecto o una experiencia. Este endpoint existe para que ese salto tenga
 * dónde caer.
 */
orgs.get('/orgs/:slug', async (req, res) => {
  try {
    const data = await db.org.findUnique({
      where: { slug: req.params.slug },
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
      const fb = fallbackOrgs[req.params.slug]
      if (fb) {
        res.json(envelope(fb))
        return
      }
      res.status(404).json({ error: 'not found' })
      return
    }
    res.json(envelope(data))
  } catch {
    const fb = fallbackOrgs[req.params.slug]
    if (fb) {
      res.json(envelope(fb))
      return
    }
    res.status(404).json({ error: 'not found' })
  }
})
