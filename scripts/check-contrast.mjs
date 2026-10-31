#!/usr/bin/env node
// Contraste WCAG de los tokens del sitio público (docs/diseno.md §3).
// Lee app/assets/css/tokens.css y hyperfocus.css, arma cada paleta (oscuro, claro,
// los dos con Hiperfoco y el papel de impresión) y mide cada par texto/fondo usado.
// Termina con código 1 si algún par queda bajo su mínimo.
//
//   node scripts/check-contrast.mjs
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const css = name => readFileSync(resolve(root, 'app/assets/css', name), 'utf8')

const TEXT = 4.5
const GRAPHIC = 3
const TEXT_TOKENS = ['ink', 'dim', 'faint', 'sig-text']
const SURFACES = ['bg', 'surface']
// La temperatura mezcla --tint en el fondo: 8 % en oscuro y 5 % en claro (diseno.md §3).
// Se mide el peor caso, un tinte blanco en oscuro y uno negro en claro.
const TINT = { dark: { color: '#ffffff', amt: 0.08 }, light: { color: '#000000', amt: 0.05 } }

// ── Lectura de las reglas ────────────────────────────────────────────────────

/** Recorre el CSS y devuelve cada regla con sus declaraciones y los @ que la envuelven. */
function rules(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = []
  const stack = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '{') {
      stack.push(text.slice(start, i).trim())
      start = i + 1
    } else if (c === '}') {
      const prelude = stack.pop()
      const body = text.slice(start, i)
      if (prelude && !prelude.startsWith('@')) out.push({ at: stack.filter(p => p.startsWith('@')), selector: norm(prelude), decls: decls(body) })
      start = i + 1
    } else if (c === ';' && stack.length === 0) {
      start = i + 1
    }
  }
  return out
}

const norm = s => s.replace(/\s+/g, ' ').replace(/"/g, '\'').trim()

function decls(body) {
  const map = {}
  for (const part of body.split(';')) {
    const m = part.match(/^\s*--([\w-]+)\s*:\s*([\s\S]+?)\s*$/)
    if (m) map[m[1]] = m[2].replace(/\s*!important$/, '')
  }
  return map
}

/** Declaraciones de la primera regla con ese selector y ese contexto de @. */
function block(all, selector, at = []) {
  const found = all.find(r => r.selector === selector && r.at.join('|') === at.join('|'))
  if (!found) throw new Error(`falta la regla «${selector}»${at.length ? ` en ${at.join(' > ')}` : ''}`)
  return found.decls
}

const tokens = rules(css('tokens.css'))
const focus = rules(css('hyperfocus.css'))
const SCREEN = ['@media screen']

const dark = block(tokens, ':root')
const light = { ...dark, ...block(tokens, ':root[data-theme=\'light\']') }
const hf = block(focus, ':root[data-hyperfocus=\'true\']', SCREEN)
const hfLight = block(focus, ':root[data-theme=\'light\'][data-hyperfocus=\'true\']', SCREEN)
const paper = { ...dark, ...block(tokens, ':root, :root[data-theme=\'light\']', ['@media print']) }

const palettes = [
  { name: 'oscuro', vars: dark, tint: TINT.dark },
  { name: 'claro', vars: light, tint: TINT.light },
  { name: 'oscuro · Hiperfoco', vars: { ...dark, ...hf } },
  { name: 'claro · Hiperfoco', vars: { ...light, ...hf, ...hfLight } },
  { name: 'impresión', vars: paper },
]

// ── Color ────────────────────────────────────────────────────────────────────

/** Resuelve var() y color-mix() hasta un color [r, g, b, a] en 0–1. */
function resolveColor(value, vars, seen = new Set()) {
  const v = value.trim()
  const ref = v.match(/^var\(--([\w-]+)\)$/)
  if (ref) {
    if (seen.has(ref[1]) || !(ref[1] in vars)) throw new Error(`no se puede resolver --${ref[1]}`)
    return resolveColor(vars[ref[1]], vars, new Set([...seen, ref[1]]))
  }
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map(c => c + c).join('') : hex[1]
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).concat(1)
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : Number(rgb[4])
    return [rgb[1], rgb[2], rgb[3]].map(n => Number(n) / 255).concat(alpha)
  }
  if (v === 'transparent') return [0, 0, 0, 0]
  const mix = v.match(/^color-mix\(in oklab,\s*(.+?)(?:\s+([\d.]+)%)?,\s*(.+?)(?:\s+([\d.]+)%)?\)$/)
  if (mix) {
    const p2 = mix[4] !== undefined ? Number(mix[4]) / 100 : mix[2] !== undefined ? 1 - Number(mix[2]) / 100 : 0.5
    return mixOklab(resolveColor(mix[1], vars, seen), resolveColor(mix[3], vars, seen), p2)
  }
  throw new Error(`color no soportado: ${v}`)
}

const toLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function toOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(c => Math.min(1, Math.max(0, toGamma(c))))
}

/** color-mix(in oklab, c1, c2 p2) con alfa premultiplicado, como el navegador. */
function mixOklab(c1, c2, p2) {
  const a1 = c1[3] * (1 - p2)
  const a2 = c2[3] * p2
  const alpha = a1 + a2
  if (alpha === 0) return [0, 0, 0, 0]
  const [l1, l2] = [toOklab(c1), toOklab(c2)]
  return fromOklab(l1.map((v, i) => (v * a1 + l2[i] * a2) / alpha)).concat(alpha)
}

/** Un color con alfa sobre un fondo opaco. */
const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3])).concat(1)

const luminance = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

function ratio(fg, bg) {
  const [a, b] = [luminance(over(fg, bg)), luminance(bg)]
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

const hexOf = c => '#' + c.slice(0, 3).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')

// ── Pares ────────────────────────────────────────────────────────────────────

const rows = []
for (const { name, vars, tint } of palettes) {
  const color = token => resolveColor(`var(--${token})`, vars)
  const grounds = SURFACES.map(token => ({ label: token, color: color(token) }))
  if (tint) grounds.push({ label: `bg + tint ${tint.amt * 100} %`, color: mixOklab(color('bg'), resolveColor(tint.color, vars), tint.amt) })

  for (const ground of grounds) {
    for (const token of TEXT_TOKENS) rows.push({ palette: name, fg: token, bg: ground, value: color(token), min: TEXT })
  }
  // El punto de estado es gráfico: 3:1 contra el fondo de página.
  for (const token of ['ok', 'wip']) rows.push({ palette: name, fg: token, bg: grounds[0], value: color(token), min: GRAPHIC })
}

const pad = (s, n) => String(s).padEnd(n)
console.log(`${pad('paleta', 20)}${pad('texto', 12)}${pad('', 9)}${pad('fondo', 18)}${pad('', 9)}${pad('ratio', 8)}mín.`)
let failures = 0
for (const r of rows) {
  const value = ratio(r.value, r.bg.color)
  const ok = value >= r.min
  if (!ok) failures++
  console.log(`${pad(r.palette, 20)}${pad(r.fg, 12)}${pad(hexOf(r.value), 9)}${pad(r.bg.label, 18)}${pad(hexOf(r.bg.color), 9)}${pad(value.toFixed(2), 8)}${r.min}${ok ? '' : '  FALLA'}`)
}

console.log(failures ? `\n${failures} par(es) bajo el mínimo.` : `\n${rows.length} pares en AA.`)
process.exit(failures ? 1 : 0)
