#!/usr/bin/env node
// Guardarraíles del admin nuevo (docs/rediseno-admin/plan.md §4): impide volver a los tics que
// Mateo rechazó. Revisa server/admin/src (o los archivos y carpetas que se pasen) y falla con
// archivo:línea y el motivo de cada hallazgo.
//
//   node scripts/check-admin-style.mjs [archivo o carpeta…]
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(root, 'server/admin/src')
const EXTENSIONS = new Set(['.vue', '.ts', '.css', '.html'])
const MAX_LINES = 300
/** Los únicos archivos que pueden usar Martian Mono (tokens.css la declara) y el único con valores hex. */
const MONO_FILES = new Set(['ui/Mono.vue', 'ui/Kbd.vue', 'styles/tokens.css'])
const HEX_FILES = new Set(['styles/tokens.css'])
const PALETTES = 'zinc|emerald|amber|cyan|purple|blue|rose|indigo|sky|violet|red|green|slate|gray|neutral'

/**
 * Cada regla: un patrón, dónde mira (todo el archivo, solo la plantilla de un .vue o solo CSS) y el
 * motivo en palabras. `skip` exime archivos puntuales (por su ruta dentro de server/admin/src).
 */
const RULES = [
  { pattern: /\[#[0-9a-fA-F]{3,8}\]/, reason: 'color hex suelto en una clase ([#…]): usá un token (bg-surface, text-dim…)' },
  { pattern: /#[0-9a-fA-F]{3,8}\b/, scope: 'css', skip: HEX_FILES, reason: 'color hex fuera de styles/tokens.css: usá un token' },
  { pattern: /\btext-\[\d/, reason: 'tamaño suelto (text-[N…]): usá meta, label, body, row, title, figure, field, prose, list, heading o display' },
  { pattern: new RegExp(`\\b(?:${PALETTES})-\\d{2,3}\\b`), reason: 'paleta de Tailwind: el admin solo usa los tokens del sitio' },
  { pattern: /\s\/\/\s/, scope: 'template', reason: '« // » en la plantilla: es el tic de los rótulos viejos' },
  { pattern: /\buppercase\b|text-transform:\s*uppercase/, reason: 'mayúsculas forzadas: los rótulos van en minúscula de oración' },
  { pattern: /\btracking-wide(?:r|st)?\b/, reason: 'mayúsculas espaciadas (tracking-wide…): fuera' },
  { pattern: /\bfont-mono\b/, skip: MONO_FILES, reason: 'font-mono fuera de ui/Mono.vue y ui/Kbd.vue: usá <Mono> o monoClass' },
  { pattern: /\btransition-all\b|transition:\s*all\b/, reason: 'transition-all: animá solo opacity, transform, color y background-color' },
  { pattern: /(?<![\w:.-])style\s*=\s*["']/, scope: 'template', reason: 'atributo style estático: la CSP no lo admite; usá clases o :style dinámico' },
  { pattern: /!important/, scope: 'css', reason: '!important: ordená las capas en lugar de forzar' },
  { pattern: /\p{Extended_Pictographic}/u, reason: 'emoji o pictograma: cero emojis; si hace falta, un icono del set de ui/icons.ts' },
]

function walk(path) {
  const stat = statSync(path)
  if (stat.isFile()) return EXTENSIONS.has(extname(path)) ? [path] : []
  return readdirSync(path).flatMap(name => walk(join(path, name)))
}

/**
 * Rangos de líneas (desde 1) de la plantilla y de los bloques <style> de un .vue. Los bloques de
 * primer nivel de un SFC empiezan en la columna 0; los <template #slot> internos van sangrados.
 */
function regions(text) {
  const lines = text.split('\n')
  const block = (open, close) => {
    const out = []
    let from = 0
    lines.forEach((line, i) => {
      if (!from && open.test(line)) from = i + 1
      if (from && close.test(line)) {
        out.push([from, i + 1])
        from = 0
      }
    })
    return out
  }
  return { template: block(/^<template\b/, /^<\/template>/), css: block(/^<style\b/, /^<\/style>/) }
}

function inRanges(line, ranges) {
  return ranges.some(([from, to]) => line >= from && line <= to)
}

function check(file) {
  const text = readFileSync(file, 'utf8')
  const rel = relative(SRC, file).replaceAll('\\', '/')
  const fromRoot = relative(root, file).replaceAll('\\', '/')
  const display = fromRoot.startsWith('..') ? file.replaceAll('\\', '/') : fromRoot
  const ext = extname(file)
  const lines = text.split('\n')
  const found = []
  const vue = ext === '.vue' ? regions(text) : null

  const scopeOf = (n) => {
    if (ext === '.css') return { css: true, template: false }
    if (ext === '.html') return { css: false, template: true }
    if (vue) return { css: inRanges(n, vue.css), template: inRanges(n, vue.template) }
    return { css: false, template: false }
  }

  lines.forEach((line, index) => {
    const n = index + 1
    const where = scopeOf(n)
    for (const rule of RULES) {
      if (rule.skip?.has(rel)) continue
      if (rule.scope === 'css' && !where.css) continue
      if (rule.scope === 'template' && !where.template) continue
      if (rule.pattern.test(line)) found.push(`${display}:${n}  ${rule.reason}`)
    }
  })

  const count = text.endsWith('\n') ? lines.length - 1 : lines.length
  if (count > MAX_LINES) found.push(`${display}:${count}  ${count} líneas: el máximo es ${MAX_LINES}; partilo en piezas`)
  return found
}

const targets = process.argv.slice(2).map(p => resolve(p))
const files = (targets.length ? targets : [SRC]).flatMap(walk)
const findings = files.flatMap(check)

if (findings.length) {
  console.error(findings.join('\n'))
  console.error(`\n${findings.length} hallazgos de estilo en el admin.`)
  process.exit(1)
}
console.log(`Estilo del admin: 0 hallazgos en ${files.length} archivos.`)
