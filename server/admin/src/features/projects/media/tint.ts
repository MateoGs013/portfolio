/**
 * El tinte de una imagen (Media.tint): el color característico de una captura, que el sitio usa como
 * temperatura de la obra. Es el mismo algoritmo del panel anterior (server/admin/js/tint.js), con el
 * que salieron los tintes de la base: muestra de 32×20, corte de mediana a 8 colores, sin los casi
 * negros ni los casi blancos, gana el de mejor saturación × √peso y se lleva a luminosidad media.
 */
const W = 32
const H = 20
const COLORS = 8

type Rgb = [number, number, number]
interface Swatch { color: Rgb, weight: number }

function range(box: Rgb[], channel: 0 | 1 | 2): number {
  let min = 255
  let max = 0
  for (const p of box) {
    min = Math.min(min, p[channel])
    max = Math.max(max, p[channel])
  }
  return max - min
}

/** Parte la caja más poblada por su canal de mayor rango hasta tener 8. */
function medianCut(pixels: Rgb[]): Swatch[] {
  const boxes: Rgb[][] = [pixels]
  while (boxes.length < COLORS) {
    boxes.sort((a, b) => b.length - a.length)
    const box = boxes[0]!
    if (box.length < 2) break
    const ranges = [range(box, 0), range(box, 1), range(box, 2)]
    const channel = ranges.indexOf(Math.max(...ranges)) as 0 | 1 | 2
    if (ranges[channel] === 0) break
    const sorted = [...box].sort((a, b) => a[channel] - b[channel])
    const mid = sorted.length >> 1
    boxes.splice(0, 1, sorted.slice(0, mid), sorted.slice(mid))
  }
  return boxes.filter(b => b.length).map((box) => {
    const mean = (c: 0 | 1 | 2) => box.reduce((sum, p) => sum + p[c], 0) / box.length
    return { color: [mean(0), mean(1), mean(2)], weight: box.length / pixels.length }
  })
}

function toHsl([r, g, b]: Rgb): { h: number, s: number, l: number } {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l <= 0.5 ? d / (max + min) : d / (2 - max - min)
  const h = max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return `#${[r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`
}

/** El tinte de una imagen (archivo o blob): #rrggbb, o null si no tiene un color que sirva. */
export async function tintFromBlob(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, W, H)
  bitmap.close()
  const { data } = ctx.getImageData(0, 0, W, H)

  const pixels: Rgb[] = []
  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 0) >= 128) pixels.push([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0])
  }
  if (!pixels.length) return null

  let best: { h: number, s: number, score: number } | null = null
  for (const { color, weight } of medianCut(pixels)) {
    const hsl = toHsl(color)
    if (hsl.l < 0.08 || hsl.l > 0.94) continue
    const score = hsl.s * Math.sqrt(weight)
    if (!best || score > best.score) best = { h: hsl.h, s: hsl.s, score }
  }
  return best ? hslToHex(best.h, Math.min(1, Math.max(0.35, best.s)), 0.5) : null
}

/** El tinte de un archivo ya publicado (/media/…). Mismo origen: no hace falta CORS. */
export async function tintFromUrl(src: string): Promise<string | null> {
  const res = await fetch(src)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return tintFromBlob(await res.blob())
}

/** El tinte que corresponde sin tirar: null si la imagen no se puede leer. */
export async function safeTint(source: Blob | string | null): Promise<string | null> {
  if (!source) return null
  try {
    return typeof source === 'string' ? await tintFromUrl(source) : await tintFromBlob(source)
  }
  catch {
    return null
  }
}
