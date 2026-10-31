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
 *   1. pg_dump --format=custom --file=antes-rediseno.dump "$DATABASE_URL", ANTES de que el merge o el
 *      deploy lleguen a Coolify: el contenedor de la API corre `prisma migrate deploy` en cada arranque
 *      (Dockerfile.api), así que la migración destructiva se aplica sola al desplegar.
 *   2. pnpm prisma migrate deploy (en producción ya lo hizo el arranque del contenedor; la migración
 *      20261101000100 deja null-net y lampone ocultas desde ese momento)
 *   3. pnpm tsx server/src/patches/2026-10-30-eros-barberpole.ts        (Eros: métricas nuevas y Json viejo alineados)
 *   4. pnpm tsx server/src/patches/2026-11-01-rediseno-datos.ts --dry   (imprime el diff, no escribe)
 *   5. pnpm tsx server/src/patches/2026-11-01-rediseno-datos.ts         (aplica todo en una transacción)
 *   6. Repetir el paso 4: tiene que decir "sin cambios".
 *   7. Reiniciar la API: el parche borra data/content-last-good.json, pero la memoria del proceso
 *      guarda respuestas de antes del parche hasta el reinicio.
 * Los pasos 3 a 7 van apenas arranca el contenedor nuevo: hasta entonces el sitio sirve los datos con
 * la forma de main (Eros sin portada, el inicio sin display_name ni headline).
 * El paso 3 va antes porque este parche completa Metric desde el Json viejo: sin él, las métricas viejas
 * de Eros (si producción las tiene) volverían como filas.
 * Para volver atrás: pg_restore --clean --if-exists --dbname="$DATABASE_URL" antes-rediseno.dump
 */
import { db } from '../db.js'
import { dropLastGoodFile } from '../content/snapshot.js'
import type { Change } from './rediseno/change.js'
import { docChanges } from './rediseno/docs.js'
import { experienceChanges } from './rediseno/experience.js'
import { articleChanges, projectChanges } from './rediseno/projects.js'

const dry = process.argv.includes('--dry')

async function main() {
  const projects = await projectChanges(db)
  const docs = await docChanges(db)
  const changes: Change[] = [
    ...projects.changes,
    ...await experienceChanges(db),
    ...docs.changes,
    ...await articleChanges(db),
  ]

  for (const warning of [...projects.warnings, ...docs.warnings]) console.warn(`aviso: ${warning}`)

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
  // La API guarda la última respuesta buena de cada consulta: sin esto, una obra recién ocultada
  // podría volver desde esa copia si la base cae. La memoria del proceso se vacía reiniciándola.
  if (dropLastGoodFile()) console.log('se borró la última respuesta buena guardada en disco')
  console.log('reiniciá la API para que olvide también las respuestas que tiene en memoria')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
