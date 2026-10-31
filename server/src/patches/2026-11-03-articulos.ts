/**
 * Parche de artículos (3-nov-2026): carga en una base ya en uso los artículos de seed/articles.ts que
 * todavía no existen (por slug), con sus tecnologías y su inglés de seed/en.ts. El blog nuevo (/articles)
 * quedó vacío en producción porque esa base nunca tuvo el artículo del seed.
 *
 * Conservador: nunca toca un artículo que ya existe (lo editado desde el admin manda); si una tecnología
 * del seed no está en la base, la saltea y lo avisa. Idempotente: corrido otra vez dice "sin cambios".
 *
 * Uso, después de un pg_dump:
 *   pnpm tsx server/src/patches/2026-11-03-articulos.ts --dry     (imprime lo que cargaría, no escribe)
 *   pnpm tsx server/src/patches/2026-11-03-articulos.ts           (aplica todo en una transacción)
 *   pnpm tsx server/src/patches/2026-11-03-articulos.ts --dry     (tiene que decir "sin cambios")
 */
import { db } from '../db.js'
import { dropLastGoodFile } from '../content/snapshot.js'
import { Locale } from '../../generated/prisma/client.js'
import { articles } from '../seed/articles.js'
import { EN } from '../seed/en.js'

const dry = process.argv.includes('--dry')

async function main() {
  const existing = new Set((await db.article.findMany({ select: { slug: true } })).map(a => a.slug))
  const missing = articles.filter(a => !existing.has(a.slug))
  if (!missing.length) {
    console.log('sin cambios: los artículos del seed ya están en la base')
    return
  }

  const known = new Set((await db.tech.findMany({ select: { slug: true } })).map(t => t.slug))
  const plan = missing.map((a) => {
    const techs = a.techs.filter(slug => known.has(slug))
    for (const slug of a.techs) if (!known.has(slug)) console.warn(`aviso: artículo ${a.slug}: la tecnología ${slug} no está en la base, se saltea`)
    return { article: a, techs, en: EN.articles[a.slug] }
  })

  console.log(`${dry ? 'cambios pendientes' : 'aplicando'} (${plan.length}):`)
  for (const { article, techs, en } of plan) {
    console.log(`  artículo ${article.slug}: nuevo · ${article.status} · techs ${techs.join(', ') || 'ninguna'} · inglés ${en ? 'sí' : 'no'}`)
  }
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    for (const { article, techs, en } of plan) {
      const { techs: _seedTechs, ...scalars } = article
      const row = await tx.article.create({ data: { ...scalars, techs: { connect: techs.map(slug => ({ slug })) } } })
      if (en) await tx.articleTranslation.create({ data: { articleId: row.id, locale: Locale.en, ...en } })
    }
  })
  console.log('listo')
  // Una lista vacía de artículos pudo quedar guardada como última respuesta buena.
  if (dropLastGoodFile()) console.log('se borró la última respuesta buena guardada en disco')
  console.log('reiniciá la API para que olvide también las respuestas que tiene en memoria')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
