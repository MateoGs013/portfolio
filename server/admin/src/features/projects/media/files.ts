/**
 * Los archivos que se eligen o se sueltan, antes de subirlos: qué se acepta (lo mismo que el servidor,
 * server/src/admin/mediaFiles.ts), qué tipo de pieza son y si se ven verticales (captura de celular).
 * El formato real lo vuelve a leer el servidor de los bytes: esto solo evita esperar una subida que
 * igual se rechazaría.
 */
import type { MediaKind, MediaViewport } from '../types'
import { mediaText } from './dict'

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const VIDEO_TYPES = ['video/mp4', 'video/webm'] as const
export const ACCEPT_ALL = [...IMAGE_TYPES, ...VIDEO_TYPES].join(',')
export const ACCEPT_IMAGE = IMAGE_TYPES.join(',')
export const ACCEPT_VIDEO = VIDEO_TYPES.join(',')

const MB = 1024 * 1024
export const IMAGE_MAX_BYTES = 10 * MB
export const VIDEO_MAX_BYTES = 20 * MB

const isImage = (file: File) => (IMAGE_TYPES as readonly string[]).includes(file.type)
const isVideo = (file: File) => (VIDEO_TYPES as readonly string[]).includes(file.type)

export function kindOfFile(file: File): MediaKind | null {
  if (isImage(file)) return 'IMAGE'
  if (isVideo(file)) return 'VIDEO'
  return null
}

export const isWebm = (file: File) => file.type === 'video/webm'

/** El problema de un archivo para el lugar donde se eligió, o null si se puede subir. */
export function fileProblem(file: File, want: MediaKind | 'any' | 'webm' | 'poster'): string | null {
  const kind = kindOfFile(file)
  const t = mediaText.files
  if (want === 'webm') return isWebm(file) ? sizeProblem(file, 'VIDEO') : t.notWebm(file.name)
  if (want === 'poster') return kind === 'IMAGE' ? sizeProblem(file, 'IMAGE') : t.notImage(file.name)
  if (!kind) return t.unsupported(file.name)
  if (want !== 'any' && kind !== want) return want === 'IMAGE' ? t.notImage(file.name) : t.notVideo(file.name)
  return sizeProblem(file, kind)
}

function sizeProblem(file: File, kind: MediaKind): string | null {
  const max = kind === 'IMAGE' ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES
  return file.size > max ? mediaText.files.tooBig(file.name, max / MB) : null
}

/** Una captura más alta que ancha es de celular. Si no se puede leer, escritorio. */
export async function viewportOf(file: File): Promise<MediaViewport> {
  if (!isImage(file)) return 'DESKTOP'
  try {
    const bitmap = await createImageBitmap(file)
    const tall = bitmap.height > bitmap.width
    bitmap.close()
    return tall ? 'MOBILE' : 'DESKTOP'
  }
  catch {
    return 'DESKTOP'
  }
}

/** «1,2 MB», «340 kB». */
export function sizeLabel(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes >= MB) return `${(bytes / MB).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('es-AR')} kB`
}
