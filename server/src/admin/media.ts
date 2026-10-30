/**
 * Media de las obras: subida de imagen o video (con WebM y póster opcionales), edición parcial y borrado.
 * El tamaño y el formato se leen del archivo (magic bytes), nunca del nombre ni del tipo declarado.
 * Los archivos van a `public/media/projects/<slug>/`, como las capturas versionadas.
 */
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { db } from '../db.js'
import { MediaKind, MediaRole, MediaViewport, type Prisma } from '../../generated/prisma/client.js'
import { optHex, paramId } from './common.js'
import { IMAGE_MIME, imageDims } from './image.js'
import { HttpError, enumOf, int, optInt, optStr, str } from './input.js'
import { VIDEO_MIME, videoDims } from './video.js'

const MEDIA_DIR = path.resolve('public/media/projects')
const IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_MAX_BYTES = 20 * 1024 * 1024

const MEDIA_ROLE = Object.values(MediaRole)
const MEDIA_VIEWPORT = Object.values(MediaViewport)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fields: 16, fileSize: MEDIA_MAX_BYTES },
})

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient

interface Sniffed { kind: MediaKind, ext: string, width: number, height: number }

/** Formato real del archivo; tiene que coincidir con el tipo MIME declarado. */
function sniff(file: Express.Multer.File, field: string): Sniffed {
  const declared = IMAGE_MIME[file.mimetype] ?? VIDEO_MIME[file.mimetype]
  if (!declared) throw new HttpError(400, `${field}: tipo no soportado (${file.mimetype}). Se aceptan PNG, JPG, WebP, MP4 y WebM`)
  const image = imageDims(file.buffer)
  const found = image ?? videoDims(file.buffer)
  if (!found) throw new HttpError(400, `${field}: no se pudo leer el tamaño o el formato del archivo`)
  if (found.format !== declared) throw new HttpError(400, `${field}: el contenido del archivo no coincide con su tipo`)
  if (image && file.size > IMAGE_MAX_BYTES) throw new HttpError(413, `${field}: una imagen puede pesar hasta 10MB`)
  return { kind: image ? MediaKind.IMAGE : MediaKind.VIDEO, ext: found.format, width: found.width, height: found.height }
}

/** Ruta pública de un archivo de media ya existente (para el póster). */
function optMediaPath(b: Body, k: string): string | null {
  const v = optStr(b, k, 300)
  if (v !== null && (!v.startsWith('/media/') || v.includes('..'))) {
    throw new HttpError(400, `campo "${k}": se esperaba una ruta /media/…`)
  }
  return v
}

/** Escribe el archivo y lo anota en `written` para poder deshacerlo si algo falla después. */
async function saveFile(slug: string, name: string, buffer: Buffer, written: string[]): Promise<string> {
  const dir = path.resolve(MEDIA_DIR, slug)
  const target = path.resolve(dir, path.basename(name))
  if (!target.startsWith(MEDIA_DIR + path.sep)) throw new HttpError(400, 'nombre de archivo inválido')
  await mkdir(dir, { recursive: true })
  await writeFile(target, buffer)
  written.push(target)
  return `/media/projects/${slug}/${path.basename(name)}`
}

async function removeFile(src: string | null): Promise<void> {
  if (!src) return
  const abs = path.resolve('public', '.' + src)
  if (!abs.startsWith(MEDIA_DIR + path.sep)) return
  await unlink(abs).catch(() => undefined)
}

/** Borra del disco el archivo, su WebM y su póster. */
export async function removeMediaFiles(rows: { src: string, srcWebm: string | null, poster: string | null }[]): Promise<void> {
  await Promise.all(rows.flatMap(m => [removeFile(m.src), removeFile(m.srcWebm), removeFile(m.poster)]))
}

/** Una sola portada por tipo: la anterior del mismo kind pasa a la galería. */
async function demoteCovers(tx: Tx, projectId: number, kind: MediaKind, keepId?: number): Promise<void> {
  await tx.media.updateMany({
    where: { projectId, kind, role: MediaRole.COVER, ...(keepId === undefined ? {} : { id: { not: keepId } }) },
    data: { role: MediaRole.GALLERY },
  })
}

export const mediaRouter = Router()

mediaRouter.get('/media', async (req, res) => {
  const projectId = optInt(req.query as Body, 'projectId')
  res.json(await db.media.findMany({
    where: projectId === null ? {} : { projectId },
    orderBy: [{ projectId: 'asc' }, { role: 'asc' }, { order: 'asc' }],
  }))
})

/** multipart: file (imagen o video) + webm? + poster? · projectId, alt, caption?, role, order?, viewport?, tint? */
mediaRouter.post('/media', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'webm', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), async (req, res) => {
  const files = (req.files ?? {}) as Record<string, Express.Multer.File[] | undefined>
  const main = files['file']?.[0]
  if (!main) throw new HttpError(400, 'falta el archivo (campo "file")')
  const info = sniff(main, 'archivo')
  const webm = files['webm']?.[0]
  const poster = files['poster']?.[0]
  if ((webm || poster) && info.kind !== MediaKind.VIDEO) throw new HttpError(400, 'la variante WebM y el póster solo acompañan a un video')
  if (webm && sniff(webm, 'webm').ext !== 'webm') throw new HttpError(400, 'webm: se esperaba un archivo WebM')
  const posterInfo = poster ? sniff(poster, 'póster') : null
  if (posterInfo && posterInfo.kind !== MediaKind.IMAGE) throw new HttpError(400, 'póster: se esperaba una imagen')

  const body = req.body as Body
  const projectId = int(body, 'projectId')
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  if (!project) throw new HttpError(404, 'proyecto inexistente')
  const fields = {
    alt: str(body, 'alt', 300),
    caption: optStr(body, 'caption', 300),
    role: enumOf(body, 'role', MEDIA_ROLE),
    order: optInt(body, 'order', 0, 10000) ?? 0,
    viewport: body['viewport'] ? enumOf(body, 'viewport', MEDIA_VIEWPORT) : MediaViewport.DESKTOP,
    tint: optHex(body, 'tint'),
  }

  const stem = `${project.slug}-${Date.now().toString(36)}`
  const written: string[] = []
  try {
    const src = await saveFile(project.slug, `${stem}.${info.ext}`, main.buffer, written)
    const srcWebm = webm ? await saveFile(project.slug, `${stem}.webm`, webm.buffer, written) : null
    const posterSrc = poster && posterInfo ? await saveFile(project.slug, `${stem}-poster.${posterInfo.ext}`, poster.buffer, written) : null
    const row = await db.$transaction(async (tx) => {
      if (fields.role === MediaRole.COVER) await demoteCovers(tx, projectId, info.kind)
      return tx.media.create({
        data: { ...fields, kind: info.kind, src, srcWebm, poster: posterSrc, width: info.width, height: info.height, bytes: main.size, projectId },
      })
    })
    res.status(201).json(row)
  }
  catch (err) {
    await Promise.all(written.map(f => unlink(f).catch(() => undefined)))
    throw err
  }
})

/** Póster nuevo para un video ya subido (multipart: poster). Reemplaza el anterior. */
mediaRouter.post('/media/:id/poster', upload.single('poster'), async (req, res) => {
  const mid = paramId(req)
  if (!req.file) throw new HttpError(400, 'falta la imagen (campo "poster")')
  const info = sniff(req.file, 'póster')
  if (info.kind !== MediaKind.IMAGE) throw new HttpError(400, 'póster: se esperaba una imagen')
  const media = await db.media.findUnique({ where: { id: mid }, select: { kind: true, poster: true, project: { select: { slug: true } } } })
  if (!media) throw new HttpError(404, 'not found')
  if (media.kind !== MediaKind.VIDEO) throw new HttpError(400, 'solo un video lleva póster')

  const written: string[] = []
  const slug = media.project.slug
  const poster = await saveFile(slug, `${slug}-${Date.now().toString(36)}-poster.${info.ext}`, req.file.buffer, written)
  const tint = optHex(req.body as Body, 'tint')
  const row = await db.media.update({ where: { id: mid }, data: { poster, ...(tint ? { tint } : {}) } })
    .catch(async (err: unknown) => {
      await Promise.all(written.map(f => unlink(f).catch(() => undefined)))
      throw err
    })
  await removeFile(media.poster)
  res.json(row)
})

/** Actualiza solo las claves presentes: cambiar el rol no toca el alt ni el orden. */
mediaRouter.patch('/media/:id', async (req, res) => {
  const mid = paramId(req)
  const b = req.body as Body
  const data: Prisma.MediaUpdateInput = {}
  if ('alt' in b) data.alt = str(b, 'alt', 300)
  if ('caption' in b) data.caption = optStr(b, 'caption', 300)
  if ('role' in b) data.role = enumOf(b, 'role', MEDIA_ROLE)
  if ('order' in b) data.order = int(b, 'order', 0, 10000)
  if ('tint' in b) data.tint = optHex(b, 'tint')
  if ('viewport' in b) data.viewport = enumOf(b, 'viewport', MEDIA_VIEWPORT)
  if ('poster' in b) data.poster = optMediaPath(b, 'poster')
  if (Object.keys(data).length === 0) throw new HttpError(400, 'no llegó ningún campo para actualizar')

  const row = await db.$transaction(async (tx) => {
    const current = await tx.media.findUnique({ where: { id: mid }, select: { projectId: true, kind: true } })
    if (!current) throw new HttpError(404, 'not found')
    if (data.role === MediaRole.COVER) await demoteCovers(tx, current.projectId, current.kind, mid)
    return tx.media.update({ where: { id: mid }, data })
  })
  res.json(row)
})

mediaRouter.delete('/media/:id', async (req, res) => {
  const row = await db.media.delete({ where: { id: paramId(req) } })
  await removeMediaFiles([row])
  res.status(204).end()
})
