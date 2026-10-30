/**
 * Ancho, alto y formato real de un video sin dependencias, como image.ts con las imágenes.
 * - MP4: la caja `ftyp` en el byte 4 y la primera `tkhd` (moov → trak) con tamaño distinto de cero.
 * - WebM: la cabecera EBML 0x1A45DFA3 y PixelWidth (0xB0) / PixelHeight (0xBA) en
 *   Segment → Tracks → TrackEntry → Video.
 */

export type VideoFormat = 'mp4' | 'webm'

export const VIDEO_MIME: Record<string, VideoFormat> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

interface Dims { width: number, height: number }

export function videoDims(buf: Buffer): (Dims & { format: VideoFormat }) | null {
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    const dims = mp4Dims(buf, 0, buf.length)
    return dims ? { ...dims, format: 'mp4' } : null
  }
  if (buf.length >= 4 && buf.readUInt32BE(0) === 0x1A45DFA3) {
    const dims = webmDims(buf, 0, buf.length)
    return dims ? { ...dims, format: 'webm' } : null
  }
  return null
}

// ─── MP4 (ISO BMFF) ─────────────────────────────────────────────────────────

function mp4Dims(buf: Buffer, start: number, end: number): Dims | null {
  let i = start
  while (i + 8 <= end) {
    let size = buf.readUInt32BE(i)
    const type = buf.toString('ascii', i + 4, i + 8)
    let header = 8
    if (size === 1) {
      if (i + 16 > end) return null
      size = Number(buf.readBigUInt64BE(i + 8))
      header = 16
    }
    else if (size === 0) {
      size = end - i
    }
    if (size < header || i + size > end) return null

    const dims = type === 'moov' || type === 'trak'
      ? mp4Dims(buf, i + header, i + size)
      : type === 'tkhd' ? tkhdDims(buf, i + header, i + size) : null
    if (dims) return dims
    i += size
  }
  return null
}

/** tkhd: versión y flags, tiempos (v0 20 bytes, v1 32), 8 reservados, 8 de capa/volumen, matriz de 36 y ancho/alto en 16.16. */
function tkhdDims(buf: Buffer, start: number, end: number): Dims | null {
  const at = start + 4 + (buf[start] === 1 ? 32 : 20) + 8 + 8 + 36
  if (at + 8 > end) return null
  const width = Math.round(buf.readUInt32BE(at) / 65536)
  const height = Math.round(buf.readUInt32BE(at + 4) / 65536)
  return width > 0 && height > 0 ? { width, height } : null
}

// ─── WebM (EBML) ────────────────────────────────────────────────────────────

/** Segment, Tracks, TrackEntry y Video: los únicos elementos en los que hace falta entrar. */
const EBML_PATH = new Set([0x18538067, 0x1654AE6B, 0xAE, 0xE0])

interface Vint { value: number, len: number, unknown: boolean }

/** Entero de largo variable. Los ids conservan el bit marcador; los tamaños no. */
function vint(buf: Buffer, i: number, isId: boolean): Vint | null {
  const first = buf[i]
  if (first === undefined || first === 0) return null
  let len = 1
  while (!(first & (0x80 >> (len - 1)))) len++
  if (len > (isId ? 4 : 8) || i + len > buf.length) return null
  let value = isId ? first : first & (0xFF >> len)
  for (let k = 1; k < len; k++) value = value * 256 + (buf[i + k] ?? 0)
  return { value, len, unknown: !isId && value === 2 ** (7 * len) - 1 }
}

function uint(buf: Buffer, at: number, len: number): number {
  let value = 0
  for (let k = 0; k < len; k++) value = value * 256 + (buf[at + k] ?? 0)
  return value
}

function webmDims(buf: Buffer, start: number, end: number): Dims | null {
  let width = 0
  let height = 0
  let i = start
  while (i < end) {
    const id = vint(buf, i, true)
    const size = id && vint(buf, i + id.len, false)
    if (!id || !size) return null
    const body = i + id.len + size.len
    const stop = size.unknown ? end : Math.min(end, body + size.value)

    if (EBML_PATH.has(id.value)) {
      const dims = webmDims(buf, body, stop)
      if (dims) return dims
    }
    else if (id.value === 0xB0) width = uint(buf, body, size.value)
    else if (id.value === 0xBA) height = uint(buf, body, size.value)
    else if (size.unknown) return null

    if (width > 0 && height > 0) return { width, height }
    i = stop
  }
  return null
}
