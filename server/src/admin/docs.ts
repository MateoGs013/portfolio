/**
 * Documentos `about` y `contact` en el admin, con el esquema fijo de shared/docSchema.ts. Cada bloque
 * es un DocField (app/lib/fieldMeta.ts): `value` y `en` son texto o lista según su tipo, y guardar el
 * español nunca borra el inglés. La validación vive en docInput.ts.
 *
 * Los documentos no se crean ni se borran: son dos y fijos. Doc.title no se pide en el formulario y el
 * servidor conserva el guardado. El retrato se sube con POST /docs/about/portrait a `_perfil/` de la
 * carpeta de subidas (mediaDirs.ts) y se sirve en `/media/projects/_perfil/`.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { docFieldsOf } from '../content/docFields.js'
import type { DocField } from '../../../app/lib/fieldMeta.js'
import type { Doc, Prisma } from '../../generated/prisma/client.js'
import type { AdminDoc } from '../shared/adminContracts.js'
import { docBlock, docSchemas, isDocKey, type DocKey } from '../shared/docSchema.js'
import { readOr503 } from './common.js'
import { docPayload } from './docInput.js'
import { HttpError, validate } from './input.js'
import { PROFILE_FOLDER, fileStem, removeFile, saveFile, sniffImage, undoWrites, upload } from './mediaFiles.js'

type Body = Record<string, unknown>

function docKey(raw: unknown): DocKey {
  if (typeof raw === 'string' && isDocKey(raw)) return raw
  throw new HttpError(404, 'Ese documento no existe: el perfil tiene Sobre mí (about) y Contacto (contact).')
}

/** El documento como lo edita el admin: sus bloques normalizados, el esquema y lo que falta. */
function adminDoc(key: DocKey, row: Doc | null): AdminDoc {
  const schema = docSchemas[key]
  const fields = docFieldsOf(row?.fields, key)
  const names = new Set(fields.map(f => f.name))
  return {
    key,
    title: row?.title ?? schema.title,
    fields,
    schema: schema.blocks,
    missing: schema.blocks.filter(b => !names.has(b.name)).map(b => b.name),
    updatedAt: row?.updatedAt.toISOString() ?? null,
  }
}

/** Guarda los bloques; el título queda el que estaba (o el del esquema si el documento no existía). */
async function saveFields(key: DocKey, fields: DocField[]): Promise<Doc> {
  const json = fields as unknown as Prisma.InputJsonValue
  return db.doc.upsert({ where: { key }, create: { key, title: docSchemas[key].title, fields: json }, update: { fields: json } })
}

export const docsRouter = Router()

docsRouter.get('/docs/:key', async (req, res) => {
  const key = docKey(req.params['key'])
  const row = await readOr503(res, () => db.doc.findUnique({ where: { key } }))
  if (row !== undefined) res.json(adminDoc(key, row))
})

docsRouter.put('/docs/:key', async (req, res) => {
  const key = docKey(req.params['key'])
  const b = req.body as Body
  const current = await db.doc.findUnique({ where: { key } })
  const fields = validate('Doc', b, () => docPayload(key, b, docFieldsOf(current?.fields)))
  res.json(adminDoc(key, await saveFields(key, fields)))
})

/**
 * Retrato nuevo (multipart: file, PNG, JPG o WebP de hasta 10 MB). Queda en /media/projects/_perfil/
 * y pasa a ser el valor de `portrait`, que no tiene inglés: el sitio lo muestra en los dos idiomas.
 * El retrato anterior se borra si estaba en esa carpeta.
 */
docsRouter.post('/docs/about/portrait', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Falta la imagen: elegí la foto del retrato.')
  const info = sniffImage(req.file, 'Retrato')
  const block = docBlock('about', 'portrait')
  if (!block) throw new HttpError(500, 'El esquema de Sobre mí no tiene retrato.')

  const written: string[] = []
  try {
    const src = await saveFile(PROFILE_FOLDER, `${fileStem('retrato')}.${info.ext}`, req.file.buffer, written)
    const current = await db.doc.findUnique({ where: { key: 'about' } })
    const fields = docFieldsOf(current?.fields, 'about')
    const previous = fields.find(f => f.name === block.name)
    const portrait: DocField = { name: block.name, type: 'image', value: src }
    // Sin retrato guardado, el bloque nuevo va en su lugar del esquema (antes del primero que lo sigue).
    const order = docSchemas.about.blocks.map(b => b.name)
    const after = fields.findIndex(f => order.indexOf(f.name) > order.indexOf(block.name) || !order.includes(f.name))
    const next = previous
      ? fields.map(f => (f.name === block.name ? portrait : f))
      : after === -1 ? [...fields, portrait] : [...fields.slice(0, after), portrait, ...fields.slice(after)]
    const row = await saveFields('about', next)
    const old = typeof previous?.value === 'string' ? previous.value : null
    if (old && old !== src && old.startsWith(`/media/projects/${PROFILE_FOLDER}/`)) await removeFile(old)
    res.status(201).json(adminDoc('about', row))
  }
  catch (err) {
    await undoWrites(written)
    throw err
  }
})
