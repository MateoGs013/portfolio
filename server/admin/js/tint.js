// Portfolio CMS 2026 · Tinte de una imagen (Media.tint)
// El color característico de una captura, que el sitio usa como temperatura de la obra.
// Mismo algoritmo con el que salieron los tintes de la demo (plan §4): muestra de 32x20 en un
// canvas, cuantización a 8 colores por corte de mediana, se descartan los casi negros y casi
// blancos, gana el de mejor saturación × √peso y se lleva a luminosidad media (L 50 %,
// saturación entre 35 % y 100 %).

const W = 32
const H = 20
const COLORS = 8

/** Corte de mediana: parte la caja más poblada por su canal de mayor rango hasta tener 8. */
function medianCut(pixels) {
  const boxes = [pixels]
  while (boxes.length < COLORS) {
    boxes.sort((a, b) => b.length - a.length)
    const box = boxes[0]
    if (box.length < 2) break
    const ranges = [0, 1, 2].map(c => Math.max(...box.map(p => p[c])) - Math.min(...box.map(p => p[c])))
    const channel = ranges.indexOf(Math.max(...ranges))
    if (ranges[channel] === 0) break
    const sorted = [...box].sort((a, b) => a[channel] - b[channel])
    const mid = sorted.length >> 1
    boxes.splice(0, 1, sorted.slice(0, mid), sorted.slice(mid))
  }
  return boxes.filter(b => b.length).map(box => ({
    color: [0, 1, 2].map(c => box.reduce((sum, p) => sum + p[c], 0) / box.length),
    weight: box.length / pixels.length,
  }))
}

function toHls([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, l, s: 0 }
  const s = l <= 0.5 ? d / (max + min) : d / (2 - max - min)
  const h = max === rn ? ((gn - bn) / d + 6) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, l, s }
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')
}

/** Tinte de una imagen (File o Blob): un hex #rrggbb, o null si no tiene color utilizable. */
export async function tintFromBlob(blob) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, W, H)
  if (typeof bitmap.close === 'function') bitmap.close()
  const { data } = ctx.getImageData(0, 0, W, H)

  const pixels = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  if (!pixels.length) return null

  let best = null
  for (const { color, weight } of medianCut(pixels)) {
    const hls = toHls(color)
    if (hls.l < 0.08 || hls.l > 0.94) continue
    const score = hls.s * Math.sqrt(weight)
    if (!best || score > best.score) best = { ...hls, score }
  }
  return best ? hslToHex(best.h, Math.min(1, Math.max(0.35, best.s)), 0.5) : null
}

/** Tinte de un archivo ya publicado (/media/…), para recalcularlo desde la tarjeta. */
export async function tintFromUrl(src) {
  const res = await window.fetch(src)
  if (!res.ok) throw new Error(`no se pudo leer ${src} (código ${res.status})`)
  return tintFromBlob(await res.blob())
}
