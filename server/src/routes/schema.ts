import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'

export const schema = Router()

/** GET /api/schema → [{ key, label, kind, count }] — la raíz del explorador. */
schema.get('/schema', async (_req, res) => {
  const [projects, experience, stack, docs] = await Promise.all([
    db.project.count(),
    db.experience.count(),
    db.tech.count(),
    db.doc.findMany({ select: { key: true, fields: true }, orderBy: { key: 'asc' } }),
  ])

  const collections = [
    { key: 'projects', label: 'projects', kind: 'collection', count: projects },
    { key: 'experience', label: 'experience', kind: 'collection', count: experience },
    { key: 'stack', label: 'stack', kind: 'collection', count: stack },
  ]
  const documents = docs.map(d => ({
    key: d.key,
    label: d.key,
    kind: 'document',
    count: Array.isArray(d.fields) ? d.fields.length : 0,
  }))

  res.json(envelope([...collections, ...documents]))
})
