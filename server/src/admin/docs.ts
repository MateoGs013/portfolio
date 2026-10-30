/**
 * Documentos `about` y `contact` en el admin. Cada campo es un DocField (app/lib/fieldMeta.ts):
 * `value` y `en` son texto o lista según su tipo, y guardar el español nunca borra el inglés.
 */
import { Router } from 'express'
import { db } from '../db.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { DB_UNAVAILABLE } from './common.js'
import { HttpError, bool, list, optUrl, slug, str } from './input.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Valor de un campo de Doc según su tipo (DocFieldValue en app/lib/fieldMeta.ts).
 * - list: array de textos; si llega un texto (el textarea del admin), se parte por renglón.
 * - url / email: se validan; vacío queda vacío.
 * Devuelve undefined cuando no vino nada (sirve para `en`, que es opcional).
 */
function docValue(raw: unknown, type: string, where: string): string | string[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (type === 'list') {
    const items = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === 'string')
      : typeof raw === 'string' ? raw.split(/\r?\n/) : []
    return items.map(x => x.trim()).filter(Boolean)
  }
  if (typeof raw !== 'string') throw new HttpError(400, `${where}: se esperaba texto`)
  const val = raw.trim()
  if (val === '') return ''
  if (type === 'url') return optUrl({ val }, 'val') ?? ''
  if (type === 'email' && !EMAIL.test(val)) throw new HttpError(400, `${where}: email inválido`)
  return type === 'email' ? val : raw
}

type StoredEn = Map<string, unknown>

/** `en` de cada campo tal como está guardado, para conservarlo si el cliente no lo manda. */
function storedEn(fields: unknown): StoredEn {
  const entries = Array.isArray(fields) ? fields : []
  return new Map(entries.flatMap((f: unknown) => {
    if (!f || typeof f !== 'object') return []
    const { name, en } = f as { name?: unknown, en?: unknown }
    return typeof name === 'string' && en !== undefined ? [[name, en] as const] : []
  }))
}

/**
 * Sin la clave `en` se conserva el inglés guardado; `en: ''` (o una lista vacía) lo borra a propósito.
 */
function docFields(b: Record<string, unknown>, previous: StoredEn): Prisma.InputJsonValue {
  return list(b, 'fields').map((f) => {
    const name = str(f, 'name')
    const type = str(f, 'type')
    const value = docValue(f['value'], type, name) ?? (type === 'list' ? [] : '')
    const kept = previous.get(name)
    const fallback = Array.isArray(kept) && type !== 'list' ? kept.join('\n') : kept
    const en = docValue('en' in f ? f['en'] : fallback, type, `${name} (en)`)
    const worlds = Array.isArray(f['worlds'])
      ? f['worlds'].filter((w): w is string => typeof w === 'string')
      : []
    return {
      name,
      type,
      value,
      ...(en !== undefined && en !== '' && !(Array.isArray(en) && !en.length) ? { en } : {}),
      ...(bool(f, 'wide') ? { wide: true } : {}),
      ...(worlds.length ? { worlds } : {}),
    }
  })
}

export const docsRouter = Router()

docsRouter.get('/docs', async (_req, res) => {
  try {
    res.json(await db.doc.findMany({ orderBy: { key: 'asc' } }))
  }
  catch {
    res.status(503).json(DB_UNAVAILABLE)
  }
})
docsRouter.put('/docs/:key', async (req, res) => {
  const key = slug({ key: req.params['key'] }, 'key')
  const current = await db.doc.findUnique({ where: { key }, select: { fields: true } })
  const data = { title: str(req.body, 'title'), fields: docFields(req.body, storedEn(current?.fields)) }
  res.json(await db.doc.upsert({ where: { key }, create: { key, ...data }, update: data }))
})
docsRouter.delete('/docs/:key', async (req, res) => {
  const key = slug({ key: req.params['key'] }, 'key')
  await db.doc.delete({ where: { key } })
  res.status(204).end()
})
