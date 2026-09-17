import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'

export const schema = Router()

/** GET /api/schema → [{ key, label, kind, count }] — la raíz del explorador. */
schema.get('/schema', async (_req, res) => {
  try {
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
  } catch {
    // Fallback resiliente si la conexión a base de datos local está en reposo
    const fallback = [
      { key: 'projects', label: 'projects', kind: 'collection', count: 6 },
      { key: 'experience', label: 'experience', kind: 'collection', count: 7 },
      { key: 'stack', label: 'stack', kind: 'collection', count: 22 },
      { key: 'about', label: 'about', kind: 'document', count: 13 },
      { key: 'contact', label: 'contact', kind: 'document', count: 6 },
    ]
    res.json(envelope(fallback))
  }
})
