/** Lee ancho y alto de PNG, JPEG y WebP sin dependencias. Null si no lo reconoce. */
export function imageDims(buf: Buffer): { width: number, height: number } | null {
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504E47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }

  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xFF) {
        i++
        continue
      }
      const marker = buf[i + 1] ?? 0
      if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
        i += 2
        continue
      }
      const isSOF = marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC
      if (isSOF) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      i += 2 + buf.readUInt16BE(i + 2)
    }
    return null
  }

  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) }
    if (chunk === 'VP8L') {
      const b0 = buf[21] ?? 0
      const b1 = buf[22] ?? 0
      const b2 = buf[23] ?? 0
      const b3 = buf[24] ?? 0
      return {
        width: 1 + (((b1 & 0x3F) << 8) | b0),
        height: 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6)),
      }
    }
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3FFF, height: buf.readUInt16LE(28) & 0x3FFF }
  }

  return null
}

export const IMAGE_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
