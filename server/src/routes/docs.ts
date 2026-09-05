import { Router } from 'express'
import { db } from '../db.js'
import { envelope } from '../envelope.js'

export const docs = Router()

/** GET /api/docs/:key → { key, title, fields: [{ name, type, value, wide?, worlds? }] } */
docs.get('/docs/:key', async (req, res) => {
  const data = await db.doc.findUnique({ where: { key: req.params.key } })
  if (!data) {
    res.status(404).json({ error: 'not found' })
    return
  }
  const count = Array.isArray(data.fields) ? data.fields.length : 0
  res.json(envelope(data, { count }))
})
