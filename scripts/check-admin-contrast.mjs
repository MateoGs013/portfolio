#!/usr/bin/env node
// Contraste WCAG de los tokens del admin (server/admin/src/styles/tokens.css, tema oscuro) y su
// coherencia con el sitio: imprime cada par texto/fondo con su ratio, compara los tokens que
// comparten con app/assets/css/tokens.css y el hash de la fuente copiada con el original.
// Termina con código 1 si algún par queda bajo su mínimo o algo se desvió.
//
//   node scripts/check-admin-contrast.mjs
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

const TEXT = 4.5
const GRAPHIC = 3
const SURFACES = ['bg', 'panel', 'surface', 'surface-2']
const TEXT_TOKENS = ['ink', 'dim', 'faint', 'danger', 'sig-text']
const DOT_TOKENS = ['ok', 'wip']
const SHARED = ['bg', 'ink', 'dim', 'faint', 'sig', 'ok', 'wip']
const FONTS = [
  ['server/admin/src/assets/fonts/GeneralSans-Variable.woff2', 'app/assets/fonts/GeneralSans-Variable.woff2'],
  ['server/admin/src/assets/fonts/GeneralSans-LICENSE.txt', 'app/assets/fonts/GeneralSans-LICENSE.txt'],
]

/** Las variables (`--x: valor`) del primer bloque cuyo selector cumple `match`. */
function tokens(css, match) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, selector, body] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!match(selector.replace(/\s+/g, ' ').trim())) continue
    return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim().toLowerCase()]))
  }
  throw new Error('no se encontró el bloque de tokens')
}

function rgb(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`se esperaba un color #rrggbb y llegó ${hex}`)
  const n = Number.parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const admin = tokens(read('server/admin/src/styles/tokens.css'), s => s.split(',').map(x => x.trim()).includes(':root[data-theme=\'dark\']'))
const site = tokens(read('app/assets/css/tokens.css'), s => s === ':root')

const failures = []
const line = (label, value, min) => {
  const ok = value >= min
  if (!ok) failures.push(label)
  console.log(`${ok ? 'ok   ' : 'FALLA'}  ${label.padEnd(30)} ${value.toFixed(2).padStart(6)}:1  (mínimo ${min}:1)`)
}

console.log('Texto sobre cada fondo (AA, 4,5:1)')
for (const fg of TEXT_TOKENS) {
  for (const bg of SURFACES) line(`${fg} sobre ${bg}`, ratio(admin[fg], admin[bg]), TEXT)
}

console.log('\nPuntos de estado (gráfico, 3:1)')
for (const fg of DOT_TOKENS) {
  for (const bg of SURFACES) line(`${fg} sobre ${bg}`, ratio(admin[fg], admin[bg]), GRAPHIC)
}

console.log('\nTexto del primario')
line(`on-sig (${admin['on-sig']}) sobre sig`, ratio(admin['on-sig'], admin.sig), TEXT)
line('on-sig sobre sig-hover', ratio(admin['on-sig'], admin['sig-hover']), TEXT)

console.log('\nTokens compartidos con el sitio (app/assets/css/tokens.css)')
for (const key of SHARED) {
  const same = admin[key] === site[key]
  if (!same) failures.push(`--${key} distinto del sitio`)
  console.log(`${same ? 'ok   ' : 'FALLA'}  --${key.padEnd(10)} admin ${admin[key]}  sitio ${site[key]}`)
}

console.log('\nFuente copiada del sitio')
const hash = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')
for (const [copy, original] of FONTS) {
  const same = hash(copy) === hash(original)
  if (!same) failures.push(`${copy} no coincide con ${original}`)
  console.log(`${same ? 'ok   ' : 'FALLA'}  ${copy.split('/').pop()}  ${hash(copy).slice(0, 12)}`)
}

if (failures.length) {
  console.error(`\n${failures.length} fallas:\n${failures.map(f => `  ${f}`).join('\n')}`)
  process.exit(1)
}
console.log('\nContraste y tokens del admin en verde.')
