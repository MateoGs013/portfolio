/**
 * Parche puntual (9-nov-2026): suma Tienda Mística y la tecnología MariaDB a una base ya cargada.
 * Entraron al seed el 3-nov (0a70b0e) y el seed no corre sobre una base existente: producción quedó sin las dos.
 *
 * - MariaDB: se crea con su categoría, nota y color de seed/stack.ts, y su nota en inglés de seed/en.ts.
 * - Tienda Mística: se crea como la crea el seed (organización, tecnologías, enlaces, pasos, métricas y
 *   portada leída del archivo), publicada y con el mismo orden que le da el seed; después, su inglés de
 *   seed/en.ts y el texto alternativo en inglés de la portada (seed/media.ts).
 *
 * Solo crea lo que falta: si la obra o la tecnología ya existen (cargadas a mano desde el admin, por
 * ejemplo), no las toca. Idempotente: corrido otra vez después de aplicar, dice "sin cambios".
 * Requiere las migraciones hasta 20261105000000_metric_translation, la organización escuela-da-vinci
 * y las tecnologías php, tailwind y javascript (si falta algo, avisa y no escribe nada).
 *
 * Uso, después de un respaldo de la base:
 *   pnpm tsx server/src/patches/2026-11-09-tienda-mistica.ts --dry     (imprime lo que haría, no escribe)
 *   pnpm tsx server/src/patches/2026-11-09-tienda-mistica.ts           (aplica todo en una transacción)
 *   pnpm tsx server/src/patches/2026-11-09-tienda-mistica.ts --dry     (tiene que decir "sin cambios")
 * Después, reiniciar la API.
 */
import { db } from '../db.js'
import { dropLastGoodFile } from '../content/snapshot.js'
import { MediaKind, MediaRole } from '../../generated/prisma/client.js'
import { applyCaptures, applyEnglish } from '../seed/apply.js'
import { EN } from '../seed/en.js'
import { imageFile } from '../seed/files.js'
import { CAPTURES } from '../seed/media.js'
import { metricRows } from '../seed/metrics.js'
import { publicProjects } from '../seed/projects.js'
import { hiddenProjects } from '../seed/projects-hidden.js'
import { techColors, techNotes, techs } from '../seed/stack.js'
import { PUBLISHED_AT } from '../seed/types.js'
import type { Change } from './rediseno/change.js'

const dry = process.argv.includes('--dry')

const SLUG = 'tienda-mistica'
const TECH = 'mariadb'

const project = publicProjects.find(p => p.slug === SLUG)
/** El orden que le da el seed: su posición entre todas las obras (seed.ts). */
const sortOrder = [...publicProjects, ...hiddenProjects].findIndex(p => p.slug === SLUG)
const tech = techs.find(t => t.slug === TECH)
if (!project || !tech) throw new Error(`el seed ya no tiene ${project ? TECH : SLUG}: este parche quedó como registro`)

/** Lo que la obra necesita que ya exista en la base: su organización y sus otras tecnologías. */
async function missingDeps(creatingTech: boolean): Promise<string[]> {
  const missing: string[] = []
  if (project!.org && !await db.org.findUnique({ where: { slug: project!.org }, select: { id: true } })) {
    missing.push(`organización ${project!.org}`)
  }
  for (const slug of project!.techs) {
    if (slug === TECH && creatingTech) continue
    if (!await db.tech.findUnique({ where: { slug }, select: { id: true } })) missing.push(`tecnología ${slug}`)
  }
  return missing
}

async function techChange(): Promise<Change | null> {
  if (await db.tech.findUnique({ where: { slug: TECH }, select: { id: true } })) return null
  const note = EN.techs[TECH]
  return {
    what: [`tecnología ${TECH}: nueva (${tech!.name}, ${tech!.category}) con su nota${note ? ' y su inglés' : ''}`],
    apply: async (tx) => {
      await tx.tech.create({ data: { ...tech!, note: techNotes[TECH] ?? null, color: techColors[TECH] ?? null } })
      if (note) await applyEnglish(tx, { projects: {}, experience: {}, techs: { [TECH]: note }, docs: { about: {}, contact: {} }, articles: {} })
    },
  }
}

async function projectChange(): Promise<Change | null> {
  if (await db.project.findUnique({ where: { slug: SLUG }, select: { id: true } })) return null
  const { org, techs: techSlugs, links, steps, cover, metrics, published: _published, ...scalars } = project!
  const file = cover ? await imageFile(cover.src) : null
  const en = EN.projects[SLUG]
  const captures = CAPTURES.filter(c => c.project === SLUG)
  return {
    what: [
      `obra ${SLUG}: nueva y publicada (${PUBLISHED_AT.toISOString().slice(0, 10)}), orden ${sortOrder}, ${steps.length} pasos, ${links.length} enlaces, ${metricRows(metrics).length} métricas`,
      ...(cover && file ? [`obra ${SLUG}: portada ${cover.src} (${file.width}x${file.height})`] : []),
      ...(en ? [`obra ${SLUG}: inglés de rol, resumen, brief, resultado, pasos y enlaces`] : []),
      ...(captures.length ? [`obra ${SLUG}: ${captures.length} media con su inglés (seed/media.ts)`] : []),
    ],
    apply: async (tx) => {
      await tx.project.create({
        data: {
          ...scalars,
          sortOrder,
          publishedAt: PUBLISHED_AT,
          org: org ? { connect: { slug: org } } : undefined,
          techs: { connect: techSlugs.map(slug => ({ slug })) },
          links: { create: links },
          steps: { create: steps.map((s, i) => ({ ...s, order: i + 1 })) },
          metrics: { create: metricRows(metrics) },
          media: cover && file ? { create: [{ ...cover, ...file, kind: MediaKind.IMAGE, role: MediaRole.COVER, order: 0 }] } : undefined,
        },
      })
      if (en) await applyEnglish(tx, { projects: { [SLUG]: en }, experience: {}, techs: {}, docs: { about: {}, contact: {} }, articles: {} })
      await applyCaptures(tx, captures)
    },
  }
}

async function main() {
  const tc = await techChange()
  const pc = await projectChange()
  const changes = [tc, pc].filter((c): c is Change => c !== null)

  if (!changes.length) {
    console.log(`sin cambios: ${SLUG} y ${TECH} ya están en la base`)
    return
  }

  const missing = pc ? await missingDeps(tc !== null) : []
  if (missing.length) {
    console.error(`falta en la base: ${missing.join(', ')}. No se escribe nada.`)
    process.exitCode = 1
    return
  }

  console.log(`${dry ? 'cambios pendientes' : 'aplicando'}:`)
  for (const line of changes.flatMap(c => c.what)) console.log(`  ${line}`)
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    for (const change of changes) await change.apply(tx)
  }, { timeout: 60000 })
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
