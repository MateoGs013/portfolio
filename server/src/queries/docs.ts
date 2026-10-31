/** Documentos `about` y `contact`: campos tipados con su inglés en `en`. */
import { db } from '../db.js'
import type { DocKey } from '../../../app/lib/fieldMeta.js'
import type { Doc } from '../../generated/prisma/client.js'

export type DocRecord = Doc

/**
 * Los documentos en orden de lectura. El tipo exige cada DocKey de app/lib/fieldMeta.ts: la imagen
 * del API no lleva app/, así que de ahí solo se importan tipos.
 */
const docKeys: Record<DocKey, true> = { about: true, contact: true }
export const docOrder = Object.keys(docKeys) as DocKey[]

export function isDocKey(key: string): key is DocKey {
  return Object.hasOwn(docKeys, key)
}

export function getDoc(key: string): Promise<DocRecord | null> {
  if (!isDocKey(key)) return Promise.resolve(null)
  return db.doc.findUnique({ where: { key } })
}

/** Los documentos en orden de lectura (about, contact). */
export async function listDocs(): Promise<DocRecord[]> {
  const records = await db.doc.findMany({ where: { key: { in: docOrder } } })
  return docOrder.flatMap(key => records.filter(d => d.key === key))
}
