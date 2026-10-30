/**
 * Parche del rediseño «movimiento» (1-nov-2026): lleva una base ya cargada a lo que deja el seed,
 * sin recargarla (el seed borra todo y pisaría lo editado desde el admin).
 *
 * Requiere la migración 20261101000000_rediseno_movimiento aplicada (`pnpm prisma migrate deploy`).
 * Cubre: visibilidad de las 8 obras (6 publicadas, null-net y lampone con publishedAt NULL), tints y
 * dimensiones de portada, portada de Eros, verificación de métricas Json → Metric, kind, cvOrder,
 * highlights y obras de la experiencia, la experiencia de Eros, la ciudad de cet-30, los docs about y
 * contact reformados (contact.email con type email) y el borrado del doc home.
 *
 * Idempotente y conservador: solo completa lo que falta o reemplaza valores viejos conocidos.
 * Nunca borra un registro ni un valor editado desde el admin.
 *
 * Uso, siempre en este orden y nunca sin el respaldo:
 *   1. pg_dump --format=custom --file=antes-rediseno.dump "$DATABASE_URL"
 *   2. pnpm tsx server/src/patches/2026-11-01-rediseno-datos.ts --dry   (imprime el diff, no escribe)
 *   3. pnpm tsx server/src/patches/2026-11-01-rediseno-datos.ts         (aplica todo en una transacción)
 *   4. Repetir el paso 2: tiene que decir "sin cambios".
 * Para volver atrás: pg_restore --clean --if-exists --dbname="$DATABASE_URL" antes-rediseno.dump
 */
import { db } from '../db.js'
import type { Change } from './rediseno/change.js'
import { docChanges } from './rediseno/docs.js'
import { experienceChanges } from './rediseno/experience.js'
import { projectChanges } from './rediseno/projects.js'

const dry = process.argv.includes('--dry')

async function main() {
  const projects = await projectChanges(db)
  const changes: Change[] = [
    ...projects.changes,
    ...await experienceChanges(db),
    ...await docChanges(db),
  ]

  for (const warning of projects.warnings) console.warn(`aviso: ${warning}`)

  const lines = changes.flatMap(c => c.what)
  if (!lines.length) {
    console.log('sin cambios: la base ya está al día con el rediseño')
    return
  }

  console.log(`${dry ? 'cambios pendientes' : 'aplicando'} (${lines.length}):`)
  for (const line of lines) console.log(`  ${line}`)
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    for (const change of changes) await change.apply(tx)
  }, { timeout: 60000 })
  console.log('listo')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
