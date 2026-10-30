import { Router } from 'express'
import type { CollectionKey } from '../../../app/lib/fieldMeta.js'
import { docFieldsOf } from '../content/docFields.js'
import { parseLang } from '../content/lang.js'
import { resolve, type Resource, type Wire } from '../content/snapshot.js'
import { isVisible, isVisibleArticle } from '../content/visibility.js'
import { sendResolved } from '../envelope.js'
import { schemaCounts, type SchemaCounts } from '../queries/schema.js'

type Counts = Wire<SchemaCounts>

export interface SchemaEntry {
  key: string
  label: string
  kind: 'collection' | 'document'
  count: number
}

function presentSchema(counts: Counts): SchemaEntry[] {
  // Orden de lectura de collectionOrder (app/lib/fieldMeta.ts); el tipo exige cada colección.
  const byCollection: Record<CollectionKey, number> = {
    projects: counts.projects,
    experience: counts.experience,
    stack: counts.stack,
    articles: counts.articles,
    orgs: counts.orgs,
  }
  const collections = Object.entries(byCollection)
    .map(([key, count]) => ({ key, label: key, kind: 'collection' as const, count }))
  const documents = counts.docs.map(d => ({
    key: d.key,
    label: d.key,
    kind: 'document' as const,
    count: docFieldsOf(d.fields).length,
  }))
  return [...collections, ...documents]
}

export const schemaCounter: Resource<null, Counts, SchemaEntry[]> = {
  name: 'schema',
  db: () => schemaCounts(),
  snapshot: snap => ({
    projects: snap.projects.filter(isVisible).length,
    experience: snap.experience.length,
    stack: snap.stack.length,
    articles: snap.articles.filter(isVisibleArticle).length,
    orgs: snap.orgs.length,
    docs: snap.docs,
  }),
  present: presentSchema,
}

export const schema = Router()

/** GET /api/schema → [{ key, label, kind, count }] — conteos con visibilidad; documentos about y contact. */
schema.get('/schema', async (req, res) => {
  const lang = parseLang(req)
  sendResolved(res, await resolve(schemaCounter, null, lang), { lang })
})
