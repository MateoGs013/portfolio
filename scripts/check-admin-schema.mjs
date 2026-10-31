#!/usr/bin/env node
/**
 * Cada campo de prisma/schema.prisma tiene su descriptor en server/src/shared/adminSchema.ts, y cada
 * valor de un enum su rótulo en server/src/shared/labels.ts. Falla nombrando lo que falta y lo que
 * sobra (un descriptor de un campo que ya no existe). Lo corre `pnpm lint` (scripts/admin-checks.mjs).
 *
 * Uso: node scripts/check-admin-schema.mjs [--schema otra/ruta/schema.prisma]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const flag = process.argv.indexOf('--schema')
const schemaPath = flag === -1 ? path.join(root, 'prisma/schema.prisma') : path.resolve(process.argv[flag + 1] ?? '')

/** Bloques `model X { … }` y `enum Y { … }` con los nombres de sus campos o valores. */
function parse(source) {
  const blocks = { model: new Map(), enum: new Map() }
  const pattern = /^(model|enum)\s+(\w+)\s*\{([\s\S]*?)^\}/gm
  for (const [, kind, name, body] of source.matchAll(pattern)) {
    const names = body
      .split(/\r?\n/)
      .map(line => line.replace(/\/\/.*$/, '').trim())
      .filter(line => line && !line.startsWith('@@'))
      .map(line => line.split(/\s+/)[0])
    blocks[kind].set(name, names)
  }
  return blocks
}

const { model: models, enum: enums } = parse(readFileSync(schemaPath, 'utf8'))
const importer = pathToFileURL(path.join(root, 'scripts/check-admin-schema.mjs')).href
const { adminSchema } = await tsImport('../server/src/shared/adminSchema.ts', importer)
const { enumLabels } = await tsImport('../server/src/shared/labels.ts', importer)

const problems = []

for (const [model, fields] of models) {
  const described = adminSchema[model]
  if (!described) {
    problems.push(`${model}: el modelo no tiene descriptor en adminSchema`)
    continue
  }
  for (const field of fields) {
    if (!Object.hasOwn(described, field)) problems.push(`${model}.${field}: falta su entrada en adminSchema`)
  }
  for (const field of Object.keys(described)) {
    if (!fields.includes(field)) problems.push(`${model}.${field}: está en adminSchema pero no en el schema de Prisma`)
  }
}
for (const model of Object.keys(adminSchema)) {
  if (!models.has(model)) problems.push(`${model}: está en adminSchema pero no en el schema de Prisma`)
}

for (const [name, values] of enums) {
  // Locale es el idioma de las traducciones: no se elige en ningún formulario.
  if (name === 'Locale') continue
  const labels = enumLabels[name]
  if (!labels) {
    problems.push(`enum ${name}: no tiene rótulos en labels.ts`)
    continue
  }
  for (const value of values) {
    if (!Object.hasOwn(labels, value)) problems.push(`enum ${name}.${value}: falta su rótulo en labels.ts`)
  }
}

for (const [model, fields] of Object.entries(adminSchema)) {
  for (const [field, d] of Object.entries(fields)) {
    if (!d.label || !d.help) problems.push(`${model}.${field}: le falta el rótulo o la ayuda`)
    if (d.kind === 'enum' && !d.options) problems.push(`${model}.${field}: es un enum sin options`)
  }
}

if (problems.length) {
  console.error(`check-admin-schema: ${problems.length} problema(s) en ${path.relative(root, schemaPath)}`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
const count = [...models.values()].reduce((n, fields) => n + fields.length, 0)
console.log(`check-admin-schema: ${models.size} modelos y ${count} campos descritos, ${enums.size - 1} enums con rótulos.`)
