import { Router } from 'express'
import { parseLang } from '../content/lang.js'
import { presentDoc } from '../content/present.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { sendResolved } from '../envelope.js'
import { getDoc, isDocKey, type DocRecord } from '../queries/docs.js'

export const docDetail: Resource<string, Wire<DocRecord>, ReturnType<typeof presentDoc>> = {
  name: 'doc',
  db: getDoc,
  snapshot: (snap, key) => (isDocKey(key) ? snap.docs.find(d => d.key === key) ?? null : null),
  present: presentDoc,
}

export const docs = Router()

/** GET /api/docs/:key?lang= → { key, title, fields: [{ name, type, value, wide?, worlds? }] } (about, contact). */
docs.get('/docs/:key', async (req, res) => {
  const lang = parseLang(req)
  const resolved = await resolve(docDetail, req.params.key, lang)
  sendResolved(res, resolved, { lang, count: resolved.data?.fields.length ?? 0 })
})
