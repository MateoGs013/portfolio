#!/usr/bin/env node
// Corre cada scripts/check-admin-*.mjs que exista, uno detrás de otro, y falla si alguno falla.
// `pnpm lint` lo llama después de eslint: un paquete nuevo suma su chequeo creando el archivo, sin
// tocar package.json.
//
//   node scripts/admin-checks.mjs
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const checks = readdirSync(dir).filter(name => /^check-admin-.+\.mjs$/.test(name)).sort()

const failed = []
for (const name of checks) {
  console.log(`\n· ${name}`)
  const result = spawnSync(process.execPath, [join(dir, name)], { stdio: 'inherit' })
  if (result.status !== 0) failed.push(name)
}

if (!checks.length) console.log('No hay chequeos del admin.')
if (failed.length) {
  console.error(`\nFallaron ${failed.length} de ${checks.length} chequeos del admin: ${failed.join(', ')}`)
  process.exit(1)
}
console.log(`\n${checks.length} chequeos del admin en verde.`)
