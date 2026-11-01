/**
 * Media de las obras: subida de imagen o video (con WebM y póster opcionales), reemplazo del archivo,
 * edición parcial y borrado. El tamaño y el formato se leen del archivo (magic bytes, mediaFiles.ts),
 * nunca del nombre ni del tipo declarado. Los archivos van a `public/media/projects/<slug>/`.
 * El alt y el pie en inglés llegan por PATCH en `en: { alt?, caption? }` (MediaTranslation).
 *
 * Reemplazar el archivo (POST /media/:id/file) conserva la fila: su id, su inglés y los pasos que la
 * muestran siguen iguales; cambian el archivo, el ancho, el alto y el peso, y el anterior se borra.
 */
import { Router } from 'express'
import { db } from '../db.js'
import { MediaKind, MediaRole, MediaViewport, type Prisma } from '../../generated/prisma/client.js'
import { optHex, paramId } from './common.js'
import { HttpError, enumOf, int, optInt, optStr, str, validate } from './input.js'
import { fileStem, removeMediaFiles, saveFile, sniff, sniffImage, undoWrites, upload } from './mediaFiles.js'
import { saveMediaEn, withTranslations } from './translations.js'

const MEDIA_ROLE = Object.values(MediaRole)
const MEDIA_VIEWPORT = Object.values(MediaViewport)

type Body = Record<string, unknown>
type Tx = Prisma.TransactionClient
type Files = Record<string, Express.Multer.File[] | undefined>

const NOT_FOUND = 'No encontramos esa imagen: puede que se haya borrado. Recargá la obra.'

/** Ruta pública de un archivo de media ya existente (para el póster). */
function optMediaPath(b: Body, k: string): string | null {
  const v = optStr(b, k, 300)
  if (v !== null && (!v.startsWith('/media/') || v.includes('..'))) {
    throw new HttpError(400, 'El póster tiene que ser un archivo ya subido a la obra (/media/…).')
  }
  return v
}

/**
 * Una sola portada por tipo: la anterior del mismo kind pasa a la galería, al final de la cola
 * (con su orden de portada empataría con la primera de la galería).
 */
async function demoteCovers(tx: Tx, projectId: number, kind: MediaKind, keepId?: number): Promise<void> {
  const covers = await tx.media.findMany({
    where: { projectId, kind, role: MediaRole.COVER, ...(keepId === undefined ? {} : { id: { not: keepId } }) },
    select: { id: true },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  })
  if (covers.length === 0) return
  const last = await tx.media.aggregate({ where: { projectId, role: MediaRole.GALLERY }, _max: { order: true } })
  const next = (last._max.order ?? -1) + 1
  for (const [i, cover] of covers.entries()) {
    await tx.media.update({ where: { id: cover.id }, data: { role: MediaRole.GALLERY, order: next + i } })
  }
}

/** `en` del PATCH: un objeto con alt y/o caption, o null si no llegó. */
function enPatch(b: Body): Body | null {
  const en = b['en']
  if (en === undefined || en === null) return null
  if (typeof en !== 'object' || Array.isArray(en)) throw new HttpError(400, 'El inglés de la imagen llegó con un formato que no esperábamos. Recargá y volvé a guardar.')
  return 'alt' in en || 'caption' in en ? en as Body : null
}

/** La pieza con la carpeta de su obra, o 404. */
async function currentMedia(id: number) {
  const media = await db.media.findUnique({
    where: { id },
    select: { id: true, kind: true, src: true, srcWebm: true, poster: true, project: { select: { slug: true } } },
  })
  if (!media) throw new HttpError(404, NOT_FOUND)
  return media
}

/** Un WebM que acompaña a un video MP4. */
function checkWebm(webm: Express.Multer.File, mainExt: string): void {
  if (sniff(webm, 'Versión WebM').ext !== 'webm') throw new HttpError(400, 'Versión WebM: se esperaba un archivo WebM.')
  if (mainExt === 'webm') throw new HttpError(400, 'El video ya es WebM: la versión WebM acompaña a un MP4.')
}

export const mediaRouter = Router()

mediaRouter.get('/media', async (req, res) => {
  const projectId = optInt(req.query as Body, 'projectId')
  res.json(await db.media.findMany({
    where: projectId === null ? {} : { projectId },
    orderBy: [{ projectId: 'asc' }, { role: 'asc' }, { order: 'asc' }],
    include: withTranslations,
  }))
})

/** multipart: file (imagen o video) + webm? + poster? · projectId, alt, caption?, role, order?, viewport?, tint? */
mediaRouter.post('/media', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'webm', maxCount: 1 }, { name: 'poster', maxCount: 1 }]), async (req, res) => {
  const files = (req.files ?? {}) as Files
  const main = files['file']?.[0]
  if (!main) throw new HttpError(400, 'Falta el archivo: elegí una imagen o un video.')
  const info = sniff(main, 'Archivo')
  const webm = files['webm']?.[0]
  const poster = files['poster']?.[0]
  if ((webm || poster) && info.kind !== MediaKind.VIDEO) throw new HttpError(400, 'La versión WebM y el póster solo acompañan a un video.')
  if (webm) checkWebm(webm, info.ext)
  const posterInfo = poster ? sniffImage(poster, 'Póster') : null

  const body = req.body as Body
  const { projectId, fields } = validate('Media', body, () => ({
    projectId: int(body, 'projectId'),
    fields: {
      alt: str(body, 'alt', 300),
      caption: optStr(body, 'caption', 300),
      role: enumOf(body, 'role', MEDIA_ROLE),
      order: optInt(body, 'order', 0, 10000) ?? 0,
      viewport: body['viewport'] ? enumOf(body, 'viewport', MEDIA_VIEWPORT) : MediaViewport.DESKTOP,
      tint: optHex(body, 'tint'),
    },
  }))
  const project = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } })
  if (!project) throw new HttpError(404, 'No encontramos esa obra: puede que se haya borrado. Recargá la lista.')

  const stem = fileStem(project.slug)
  const written: string[] = []
  try {
    const src = await saveFile(project.slug, `${stem}.${info.ext}`, main.buffer, written)
    const srcWebm = webm ? await saveFile(project.slug, `${stem}.webm`, webm.buffer, written) : null
    const posterSrc = poster && posterInfo ? await saveFile(project.slug, `${stem}-poster.${posterInfo.ext}`, poster.buffer, written) : null
    const row = await db.$transaction(async (tx) => {
      if (fields.role === MediaRole.COVER) await demoteCovers(tx, projectId, info.kind)
      return tx.media.create({
        data: { ...fields, kind: info.kind, src, srcWebm, poster: posterSrc, width: info.width, height: info.height, bytes: main.size, projectId },
        include: withTranslations,
      })
    })
    res.status(201).json(row)
  }
  catch (err) {
    await undoWrites(written)
    throw err
  }
})

/**
 * Archivo nuevo para una pieza ya cargada (multipart: file, y webm? si es un video MP4). Tiene que
 * ser del mismo tipo (imagen por imagen, video por video). La versión WebM de un video reemplazado
 * era del video anterior: se borra, salvo que llegue una nueva en el mismo envío.
 */
mediaRouter.post('/media/:id/file', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'webm', maxCount: 1 }]), async (req, res) => {
  const media = await currentMedia(paramId(req))
  const files = (req.files ?? {}) as Files
  const main = files['file']?.[0]
  if (!main) throw new HttpError(400, 'Falta el archivo: elegí el que reemplaza al actual.')
  const info = sniff(main, 'Archivo')
  if (info.kind !== media.kind) {
    throw new HttpError(400, media.kind === MediaKind.IMAGE ? 'Esta pieza es una imagen: se reemplaza por otra imagen.' : 'Esta pieza es un video: se reemplaza por otro video.')
  }
  const webm = files['webm']?.[0]
  if (webm && info.kind !== MediaKind.VIDEO) throw new HttpError(400, 'La versión WebM solo acompaña a un video.')
  if (webm) checkWebm(webm, info.ext)

  const slug = media.project.slug
  const stem = fileStem(slug)
  const written: string[] = []
  try {
    const src = await saveFile(slug, `${stem}.${info.ext}`, main.buffer, written)
    const srcWebm = webm ? await saveFile(slug, `${stem}.webm`, webm.buffer, written) : null
    const row = await db.media.update({
      where: { id: media.id },
      data: { src, srcWebm, width: info.width, height: info.height, bytes: main.size },
      include: withTranslations,
    })
    await removeMediaFiles([{ src: media.src, srcWebm: media.srcWebm, poster: null }])
    res.json(row)
  }
  catch (err) {
    await undoWrites(written)
    throw err
  }
})

/** Versión WebM nueva para un video MP4 ya subido (multipart: webm). Reemplaza la anterior. */
mediaRouter.post('/media/:id/webm', upload.single('webm'), async (req, res) => {
  const media = await currentMedia(paramId(req))
  if (!req.file) throw new HttpError(400, 'Falta el archivo WebM.')
  if (media.kind !== MediaKind.VIDEO) throw new HttpError(400, 'La versión WebM solo acompaña a un video.')
  checkWebm(req.file, media.src.endsWith('.webm') ? 'webm' : 'mp4')

  const slug = media.project.slug
  const written: string[] = []
  try {
    const srcWebm = await saveFile(slug, `${fileStem(slug)}.webm`, req.file.buffer, written)
    const row = await db.media.update({ where: { id: media.id }, data: { srcWebm }, include: withTranslations })
    await removeMediaFiles([{ src: null, srcWebm: media.srcWebm, poster: null }])
    res.json(row)
  }
  catch (err) {
    await undoWrites(written)
    throw err
  }
})

/** Póster nuevo para un video ya subido (multipart: poster). Reemplaza el anterior. */
mediaRouter.post('/media/:id/poster', upload.single('poster'), async (req, res) => {
  const media = await currentMedia(paramId(req))
  if (!req.file) throw new HttpError(400, 'Falta la imagen del póster.')
  const info = sniffImage(req.file, 'Póster')
  if (media.kind !== MediaKind.VIDEO) throw new HttpError(400, 'Solo un video lleva póster.')
  const b = req.body as Body
  const tint = validate('Media', b, () => optHex(b, 'tint'))

  const slug = media.project.slug
  const written: string[] = []
  try {
    const poster = await saveFile(slug, `${fileStem(slug)}-poster.${info.ext}`, req.file.buffer, written)
    const row = await db.media.update({ where: { id: media.id }, data: { poster, ...(tint ? { tint } : {}) }, include: withTranslations })
    await removeMediaFiles([{ src: null, srcWebm: null, poster: media.poster }])
    res.json(row)
  }
  catch (err) {
    await undoWrites(written)
    throw err
  }
})

/** Actualiza solo las claves presentes: cambiar el rol no toca el alt ni el orden, ni el inglés. */
mediaRouter.patch('/media/:id', async (req, res) => {
  const mid = paramId(req)
  const b = (req.body ?? {}) as Body
  const data: Prisma.MediaUpdateInput = validate('Media', b, () => ({
    ...('alt' in b ? { alt: str(b, 'alt', 300) } : {}),
    ...('caption' in b ? { caption: optStr(b, 'caption', 300) } : {}),
    ...('role' in b ? { role: enumOf(b, 'role', MEDIA_ROLE) } : {}),
    ...('order' in b ? { order: int(b, 'order', 0, 10000) } : {}),
    ...('tint' in b ? { tint: optHex(b, 'tint') } : {}),
    ...('viewport' in b ? { viewport: enumOf(b, 'viewport', MEDIA_VIEWPORT) } : {}),
    ...('poster' in b ? { poster: optMediaPath(b, 'poster') } : {}),
  }))
  const en = enPatch(b)
  if (Object.keys(data).length === 0 && !en) throw new HttpError(400, 'No llegó ningún cambio para guardar.')

  const row = await db.$transaction(async (tx) => {
    const current = await tx.media.findUnique({ where: { id: mid }, select: { projectId: true, kind: true, project: { select: { slug: true } } } })
    if (!current) throw new HttpError(404, NOT_FOUND)
    // El póster es un archivo de la misma obra: así borrar otra pieza nunca deja a esta sin él. Vale
    // su carpeta o un archivo que ya usa una pieza suya (después de «Cambiar dirección» los archivos
    // siguen en la carpeta vieja).
    if (typeof data.poster === 'string' && !data.poster.startsWith(`/media/projects/${current.project.slug}/`)) {
      const own = await tx.media.count({ where: { projectId: current.projectId, OR: [{ src: data.poster }, { poster: data.poster }] } })
      if (!own) throw new HttpError(400, 'El póster tiene que ser un archivo de esta misma obra.')
    }
    if (data.role === MediaRole.COVER) await demoteCovers(tx, current.projectId, current.kind, mid)
    if (en) await saveMediaEn(tx, mid, en)
    return tx.media.update({ where: { id: mid }, data, include: withTranslations })
  })
  res.json(row)
})

mediaRouter.delete('/media/:id', async (req, res) => {
  const { id } = await currentMedia(paramId(req))
  const row = await db.media.delete({ where: { id } })
  await removeMediaFiles([row])
  res.status(204).end()
})
