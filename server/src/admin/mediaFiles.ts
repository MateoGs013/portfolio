/**
 * Archivos de media en el disco: lectura del formato real (magic bytes), escritura dentro de
 * `public/media/projects/` y limpieza de lo que ya nadie usa. En producción esa carpeta todavía no
 * tiene volumen (DEPLOY.md, paso 6): lo subido dura hasta el próximo deploy, y la bandeja del Inicio
 * (pending.ts, `media_missing`) avisa cuando la base apunta a un archivo que ya no está.
 *
 * Cada obra tiene su carpeta `<slug>/`. Las carpetas que empiezan con `_` no son de una obra
 * (`_perfil/` guarda el retrato de Sobre mí): la limpieza de carpetas vacías nunca las toca.
 */
import { readdir, rmdir, unlink, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import { db } from '../db.js'
import { MediaKind } from '../../generated/prisma/client.js'
import { IMAGE_MIME, imageDims } from './image.js'
import { HttpError } from './input.js'
import { VIDEO_MIME, videoDims } from './video.js'

export const MEDIA_DIR = path.resolve('public/media/projects')
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_MAX_BYTES = 20 * 1024 * 1024

/** Carpeta del retrato y de lo que no es de una obra. */
export const PROFILE_FOLDER = '_perfil'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fields: 16, fileSize: MEDIA_MAX_BYTES },
})

export interface Sniffed { kind: MediaKind, ext: string, width: number, height: number }

/** Formato real del archivo; tiene que coincidir con el tipo declarado. `what` lo nombra en el mensaje. */
export function sniff(file: Express.Multer.File, what: string): Sniffed {
  const declared = IMAGE_MIME[file.mimetype] ?? VIDEO_MIME[file.mimetype]
  if (!declared) throw new HttpError(400, `${what}: ese tipo de archivo no se puede subir. Se aceptan PNG, JPG, WebP, MP4 y WebM.`)
  const image = imageDims(file.buffer)
  const found = image ?? videoDims(file.buffer)
  if (!found) throw new HttpError(400, `${what}: no pudimos leer el tamaño ni el formato del archivo. Probá exportarlo de nuevo.`)
  if (found.format !== declared) throw new HttpError(400, `${what}: el contenido del archivo no coincide con su extensión.`)
  if (image && file.size > IMAGE_MAX_BYTES) throw new HttpError(413, `${what}: una imagen puede pesar hasta 10 MB.`)
  return { kind: image ? MediaKind.IMAGE : MediaKind.VIDEO, ext: found.format, width: found.width, height: found.height }
}

/** Una imagen (PNG, JPG o WebP), nunca un video. */
export function sniffImage(file: Express.Multer.File, what: string): Sniffed {
  const info = sniff(file, what)
  if (info.kind !== MediaKind.IMAGE) throw new HttpError(400, `${what}: se esperaba una imagen PNG, JPG o WebP.`)
  return info
}

/** Escribe el archivo en `<folder>/` y lo anota en `written` para poder deshacerlo si algo falla después. */
export async function saveFile(folder: string, name: string, buffer: Buffer, written: string[]): Promise<string> {
  const dir = path.resolve(MEDIA_DIR, folder)
  const target = path.resolve(dir, path.basename(name))
  if (!dir.startsWith(MEDIA_DIR + path.sep) || !target.startsWith(dir + path.sep)) throw new HttpError(400, 'El nombre del archivo no es válido.')
  await mkdir(dir, { recursive: true })
  await writeFile(target, buffer)
  written.push(target)
  return `/media/projects/${folder}/${path.basename(name)}`
}

/** Deshace lo escrito por saveFile cuando la base no llegó a guardar el cambio. */
export async function undoWrites(written: string[]): Promise<void> {
  await Promise.all(written.map(f => unlink(f).catch(() => undefined)))
}

/** Un nombre único para un archivo nuevo: `<stem>-<marca de tiempo>`. */
export function fileStem(stem: string): string {
  return `${stem}-${Date.now().toString(36)}`
}

/** Borra el archivo de una ruta pública `/media/projects/…`; cualquier otra ruta se deja. */
export async function removeFile(src: string | null): Promise<void> {
  if (!src) return
  const abs = path.resolve('public', '.' + src)
  if (!abs.startsWith(MEDIA_DIR + path.sep)) return
  await unlink(abs).catch(() => undefined)
}

/** Rutas que alguna fila de Media todavía usa como src, WebM o póster. */
async function pathsInUse(paths: string[]): Promise<Set<string>> {
  if (paths.length === 0) return new Set()
  const rows = await db.media.findMany({
    where: { OR: [{ src: { in: paths } }, { srcWebm: { in: paths } }, { poster: { in: paths } }] },
    select: { src: true, srcWebm: true, poster: true },
  })
  return new Set(rows.flatMap(r => [r.src, r.srcWebm, r.poster]).filter((p): p is string => p !== null))
}

type MediaPaths = { src: string | null, srcWebm: string | null, poster: string | null }

/**
 * Borra del disco el archivo, su WebM y su póster de filas ya borradas o reemplazadas. Una ruta
 * que otra fila sigue usando (por ejemplo, un póster que apunta a la imagen de otra pieza) se deja.
 * Después borra las carpetas de obra que quedaron vacías.
 */
export async function removeMediaFiles(rows: MediaPaths[]): Promise<void> {
  const paths = [...new Set(rows.flatMap(m => [m.src, m.srcWebm, m.poster]).filter((p): p is string => !!p))]
  const used = await pathsInUse(paths)
  await Promise.all(paths.filter(p => !used.has(p)).map(removeFile))
  await pruneFolders(paths.map(folderOf).filter((f): f is string => f !== null))
}

/** La carpeta de `/media/projects/<carpeta>/<archivo>`, o null si la ruta no es de ahí. */
export function folderOf(src: string): string | null {
  const match = /^\/media\/projects\/([^/]+)\/[^/]+$/.exec(src)
  return match?.[1] ?? null
}

/** Borra las carpetas de obra vacías. Las que empiezan con `_` (como `_perfil`) quedan siempre. */
export async function pruneFolders(folders: string[]): Promise<void> {
  for (const folder of new Set(folders)) {
    if (folder.startsWith('_') || folder.includes('..')) continue
    const dir = path.resolve(MEDIA_DIR, folder)
    if (!dir.startsWith(MEDIA_DIR + path.sep)) continue
    const entries = await readdir(dir).catch(() => null)
    if (entries && entries.length === 0) await rmdir(dir).catch(() => undefined)
  }
}
