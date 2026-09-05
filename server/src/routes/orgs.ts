import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'

export const orgs = Router()

/**
 * GET /api/orgs/:slug → la organización con sus proyectos y experiencias.
 * No hay lista: a las orgs se llega por relación, saltando de lado desde un
 * proyecto o una experiencia. Este endpoint existe para que ese salto tenga
 * dónde caer.
 */
orgs.get('/orgs/:slug', async (req, res) => {
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
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json(envelope(data))
})
