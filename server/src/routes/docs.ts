import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'
import { docs as seedDocs } from '../seed/docs.js'

export const docs = Router()

/**
 * Respaldo si la base no responde: los mismos documentos del seed, sin una copia escrita a mano.
 * D2 lo reemplaza por el snapshot generado desde la base.
 */
const fallbackDocs = new Map(seedDocs.map(d => [d.key as string, { ...d, updatedAt: null }]))

/** GET /api/docs/:key → { key, title, fields: [{ name, type, value, en?, wide?, worlds? }] } */
docs.get('/docs/:key', async (req, res) => {
  const key = req.params.key
  const fallback = fallbackDocs.get(key)
  try {
    const data = await db.doc.findUnique({ where: { key } })
    if (!data) {
      res.status(404).json({ error: 'not found' })
      return
    }
    const count = Array.isArray(data.fields) ? data.fields.length : 0
    res.json(envelope(data, { count }))
  }
  catch {
    if (fallback) {
      res.json(envelope(fallback, { count: fallback.fields.length }))
      return
    }
    res.status(500).json({ error: 'internal error' })
  }
})
