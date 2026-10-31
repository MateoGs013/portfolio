#!/usr/bin/env node
/**
 * Genera la imagen Open Graph por defecto (public/og/default.png, 1200 x 630) desde la base (X3).
 *
 *   pnpm build && pnpm start          # con la API arriba
 *   node scripts/og-default.mjs       # OG_BASE_URL o PLAYWRIGHT_BASE_URL; por defecto http://localhost:3000
 *
 * Lee about.display_name y about.headline de /api/docs/about (español: la imagen es una sola para los
 * dos idiomas) y los compone como el inicio: el nombre monumental, una palabra por línea, con el
 * cuadrado en --sig, y el titular debajo. Las fuentes son las locales del sitio, incrustadas: nada
 * se pide afuera. Se regenera cuando cambian el nombre o el titular.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/og/default.png')
const base = (process.env.OG_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const SIZE = { width: 1200, height: 630 }

/** Los tokens del tema oscuro (app/assets/css/tokens.css), el tema por defecto del sitio. */
const TOKENS = { bg: '#0b0b0c', ink: '#ededee', dim: '#a1a1a9', sig: '#ff3e00', rule: 'rgb(255 255 255 / 0.1)' }

async function aboutFields() {
  const res = await fetch(`${base}/api/docs/about`)
  if (!res.ok) throw new Error(`GET /api/docs/about respondió ${res.status}`)
  const { data } = await res.json()
  const field = name => data.fields.find(f => f.name === name)?.value
  const name = field('display_name') ?? field('name')
  const headline = field('headline')
  if (typeof name !== 'string' || !name.trim()) throw new Error('about.display_name está vacío')
  if (typeof headline !== 'string' || !headline.trim()) throw new Error('about.headline está vacío')
  return { name: name.trim(), headline: headline.trim() }
}

async function fontFace() {
  const woff2 = await readFile(resolve(root, 'app/assets/fonts/GeneralSans-Variable.woff2'))
  return `@font-face{font-family:'General Sans Variable';font-weight:200 700;src:url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2-variations')}`
}

const page = (face) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
${face}
*{margin:0;box-sizing:border-box}
html,body{width:${SIZE.width}px;height:${SIZE.height}px;background:${TOKENS.bg};overflow:hidden}
body{display:flex;flex-direction:column;justify-content:space-between;padding:68px 76px 64px;font-family:'General Sans Variable',sans-serif;color:${TOKENS.ink};-webkit-font-smoothing:antialiased}
#name{font-weight:560;line-height:.86;letter-spacing:-.045em;margin-left:-.045em;padding-bottom:.16em}
#name span{display:block;width:max-content;white-space:nowrap}
#name i{display:inline-block;width:.13em;height:.13em;margin-left:.04em;background:${TOKENS.sig}}
#headline{max-width:26ch;padding-top:28px;border-top:1px solid ${TOKENS.rule};font-weight:420;font-size:34px;line-height:1.25;letter-spacing:-.01em;color:${TOKENS.dim}}
</style></head><body><h1 id="name"></h1><p id="headline"></p></body></html>`

async function render({ name, headline }) {
  const browser = await chromium.launch()
  try {
    const tab = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 })
    await tab.setContent(page(await fontFace()))
    // El texto entra por textContent: lo que venga de la base nunca se lee como HTML.
    await tab.evaluate(({ name, headline }) => {
      const title = document.getElementById('name')
      const words = name.split(/\s+/).filter(Boolean)
      words.forEach((word, i) => {
        const line = document.createElement('span')
        line.textContent = word
        if (i === words.length - 1) line.append(document.createElement('i'))
        title.append(line)
      })
      document.getElementById('headline').textContent = headline
    }, { name, headline })
    await tab.evaluate(() => document.fonts.ready)

    // El nombre toma el mayor cuerpo que entra a lo ancho y deja lugar al titular.
    const size = await tab.evaluate(({ width, height }) => {
      const title = document.getElementById('name')
      const headline = document.getElementById('headline')
      const room = { width: width - 152, height: height - 132 - headline.getBoundingClientRect().height - 40 }
      let px = 210
      for (; px > 48; px -= 2) {
        title.style.fontSize = `${px}px`
        const widest = Math.max(...[...title.children].map(line => line.getBoundingClientRect().width))
        if (widest <= room.width && title.getBoundingClientRect().height <= room.height) break
      }
      return px
    }, SIZE)

    const png = await tab.screenshot({ type: 'png', clip: { x: 0, y: 0, ...SIZE } })
    return { png, size }
  }
  finally {
    await browser.close()
  }
}

try {
  const fields = await aboutFields()
  const { png, size } = await render(fields)
  // Ancho y alto del PNG (cabecera IHDR): la imagen tiene que medir lo que declara el og:image.
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  if (width !== SIZE.width || height !== SIZE.height) throw new Error(`la imagen mide ${width}x${height}`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, png)
  console.log(`og-default: ${width}x${height}, nombre a ${size}px, ${(png.length / 1024).toFixed(1)} KB -> public/og/default.png`)
}
catch (error) {
  console.error(`og-default: ${error instanceof Error ? error.message : error}`)
  process.exit(1)
}
