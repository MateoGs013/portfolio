/**
 * Parche de datos del admin (5-nov-2026): deja los documentos about y contact de una base en uso
 * alineados con su esquema fijo (server/src/shared/docSchema.ts).
 *
 * - Borra el `en` de los bloques que no se traducen: email, las direcciones web y el retrato. Ese inglés
 *   era una copia del español que quedaba vieja cuando se cambiaba el valor desde el admin.
 * - No toca `cv`: su `en` es el PDF en inglés, un valor propio.
 * - Lista los bloques requeridos que faltan, sin crearlos: se crean al guardar desde Perfil.
 *
 * Idempotente: corrido otra vez dice "sin cambios" (los bloques faltantes se siguen avisando).
 *
 * Uso, después de un pg_dump:
 *   pnpm tsx server/src/patches/2026-11-05-admin-datos.ts --dry     (imprime lo que cambiaría, no escribe)
 *   pnpm tsx server/src/patches/2026-11-05-admin-datos.ts           (aplica todo en una transacción)
 *   pnpm tsx server/src/patches/2026-11-05-admin-datos.ts --dry     (tiene que decir "sin cambios")
 */
import { db } from '../db.js'
import { dropLastGoodFile } from '../content/snapshot.js'
import type { Prisma } from '../../generated/prisma/client.js'
import { docBlock, docKeys, docSchemas, englishOf, type DocKey } from '../shared/docSchema.js'

const dry = process.argv.includes('--dry')

type Stored = Record<string, unknown> & { name?: unknown, type?: unknown, en?: unknown }

interface DocPlan {
  key: DocKey
  fields: Stored[]
  dropped: string[]
  missing: string[]
}

/** El tipo que manda: el del esquema para un bloque requerido, el guardado para uno libre. */
function typeOf(key: DocKey, field: Stored): string {
  const name = typeof field.name === 'string' ? field.name : ''
  return docBlock(key, name)?.type ?? (typeof field.type === 'string' ? field.type : 'string')
}

function plan(key: DocKey, json: unknown): DocPlan {
  const entries = Array.isArray(json) ? json.filter((f): f is Stored => !!f && typeof f === 'object') : []
  const dropped: string[] = []
  const fields = entries.map((field) => {
    if (field.en === undefined || englishOf(typeOf(key, field)) !== 'none') return field
    dropped.push(String(field.name))
    const { en: _en, ...rest } = field
    return rest
  })
  const names = new Set(entries.map(f => f.name))
  const missing = docSchemas[key].blocks.filter(b => !names.has(b.name)).map(b => b.name)
  return { key, fields, dropped, missing }
}

async function main() {
  const rows = await db.doc.findMany({ where: { key: { in: docKeys } } })
  const plans = docKeys.map(key => plan(key, rows.find(r => r.key === key)?.fields))
  for (const p of plans) {
    if (!rows.some(r => r.key === p.key)) console.warn(`aviso: el documento ${p.key} no está en la base: se crea al guardarlo desde Perfil`)
    else if (p.missing.length) console.warn(`aviso: ${p.key} no tiene ${p.missing.join(', ')}: se crean al guardar desde Perfil`)
  }

  const changes = plans.filter(p => p.dropped.length > 0)
  if (!changes.length) {
    console.log('sin cambios: about y contact ya no tienen inglés en email, direcciones web ni retrato')
    return
  }
  console.log(`${dry ? 'cambios pendientes' : 'aplicando'} (${changes.length}):`)
  for (const p of changes) console.log(`  ${p.key}: se borra el inglés de ${p.dropped.join(', ')}`)
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    for (const p of changes) {
      await tx.doc.update({ where: { key: p.key }, data: { fields: p.fields as Prisma.InputJsonValue } })
    }
  })
  console.log('listo')
  if (dropLastGoodFile()) console.log('se borró la última respuesta buena guardada en disco')
  console.log('reiniciá la API para que olvide también las respuestas que tiene en memoria')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
