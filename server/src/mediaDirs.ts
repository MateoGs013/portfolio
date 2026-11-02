/**
 * Dónde viven los archivos de `/media/projects/…`. Hay dos carpetas detrás de la misma dirección:
 * - MEDIA_DIR (`public/media/projects`): lo versionado en git, que la imagen de la API copia en cada deploy.
 * - UPLOAD_DIR: lo que se sube desde el admin. Con `MEDIA_UPLOAD_DIR` (en producción `/app/uploads/projects`,
 *   sobre el volumen persistente) queda aparte, así el volumen nunca tapa lo versionado. Sin la variable
 *   (desarrollo y pruebas) es la misma carpeta que MEDIA_DIR.
 */
import { access } from 'node:fs/promises'
import path from 'node:path'

export const MEDIA_DIR = path.resolve('public/media/projects')
export const UPLOAD_DIR = process.env['MEDIA_UPLOAD_DIR'] ? path.resolve(process.env['MEDIA_UPLOAD_DIR']) : MEDIA_DIR

const PREFIX = '/media/projects/'

/** La ruta en disco de `/media/projects/<carpeta>/<archivo>` dentro de `root`, o null si se sale de ahí. */
export function inDir(root: string, src: string): string | null {
  if (!src.startsWith(PREFIX)) return null
  const abs = path.resolve(root, src.slice(PREFIX.length))
  return abs.startsWith(root + path.sep) ? abs : null
}

/** Si el archivo de una ruta `/media/projects/…` existe en alguna de las dos carpetas. */
export async function mediaFileExists(src: string): Promise<boolean> {
  for (const root of new Set([UPLOAD_DIR, MEDIA_DIR])) {
    const abs = inDir(root, src)
    if (abs && await access(abs).then(() => true, () => false)) return true
  }
  return false
}
