/** Lee de public/ el tamaño real de una imagen servida por el sitio. */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { imageDims } from '../admin/image.js'

const PUBLIC_DIR = path.resolve('public')

export interface FileDims {
  width: number
  height: number
  bytes: number
}

/** `src` es la ruta pública ('/media/projects/eros.webp'). Falla si el archivo no existe o no es imagen. */
export async function imageFile(src: string): Promise<FileDims> {
  const abs = path.resolve(PUBLIC_DIR, '.' + src)
  if (!abs.startsWith(PUBLIC_DIR + path.sep)) throw new Error(`ruta fuera de public/: ${src}`)
  const buf = await readFile(abs)
  const dims = imageDims(buf)
  if (!dims) throw new Error(`no se pudo leer el tamaño de ${src}`)
  return { width: dims.width, height: dims.height, bytes: buf.length }
}
