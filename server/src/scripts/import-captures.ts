/**
 * Importa las capturas y videos de las obras (salida de docs/rediseno/capturar.mjs) como filas Media.
 *
 * 1. Archivos (salvo con --db-only): copia de $CAPTURAS_DIR/<slug>/ a public/media/projects/<slug>/ solo
 *    los formatos que se sirven: la webp de cada captura y el mp4, el webm y el -poster.webp de cada video;
 *    nunca los png. Copia solo lo que publica seed/captures.ts (una captura que no figura ahí, como
 *    eros/admin-proyectos, no se copia). Aborta sin copiar nada si un video pasa los 4 MB. Una copia
 *    idéntica se saltea.
 * 2. Base: upsert de cada Media de seed/media.ts por (obra, src) y de su MediaTranslation en inglés,
 *    con el mismo applyCaptures del seed. En una base existente, la portada de imagen anterior de cada
 *    obra se renombra a la captura nueva: conserva su id, así un paso que la usa sigue apuntando a ella.
 *
 * Idempotente: corrido otra vez, dice "sin cambios" y no duplica filas.
 *
 * Uso local:  CAPTURAS_DIR=<checkout>/docs/rediseno/capturas pnpm tsx server/src/scripts/import-captures.ts
 * Producción (los archivos llegan versionados con la imagen; solo la base), después de un pg_dump:
 *   ANTES: el volumen persistente de Coolify montado en /app/public/media/projects (o /app/public/media)
 *   tapa lo que la imagen copia en esa ruta. Hay que copiar public/media/projects/{la-rucula,argpiscinas,
 *   barberpole,eros}/ al volumen (docker cp desde el checkout, o una copia única de la imagen al volumen) o
 *   confirmar que el volumen no cubre esas carpetas. Sin eso, /media/projects/<slug>/*.webp da 404 y este
 *   script falla al cargar seed/media.ts. Lo mismo vale para el parche 11-01: desde D4 pide que exista
 *   public/media/projects/<slug>/hero.webp en el servidor.
 *   pnpm tsx server/src/scripts/import-captures.ts --db-only --dry     (imprime el diff, no escribe)
 *   pnpm tsx server/src/scripts/import-captures.ts --db-only           (aplica todo en una transacción)
 *   pnpm tsx server/src/scripts/import-captures.ts --db-only --dry     (tiene que decir "sin cambios")
 * --dry también vale sin --db-only: lista lo que copiaría y no toca ni archivos ni base.
 */
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { db } from '../db.js'
import { Locale } from '../../generated/prisma/client.js'
import { show } from '../patches/rediseno/change.js'
import { applyCaptures } from '../seed/apply.js'
import { capturedFiles, capturePath } from '../seed/captures.js'
import type { CaptureSeed } from '../seed/media.js'

const dry = process.argv.includes('--dry')
const dbOnly = process.argv.includes('--db-only')

const CAPTURAS_DIR = path.resolve(process.env['CAPTURAS_DIR'] ?? 'docs/rediseno/capturas')
const PUBLIC_DIR = path.resolve('public')
const MAX_VIDEO_BYTES = 4 * 1024 * 1024
const VIDEO = /\.(mp4|webm)$/

/** Portada de imagen que la captura reemplaza en una base cargada antes de D4 (src nuevo → src viejo). */
const PREVIOUS_COVERS: Record<string, string> = {
  '/media/projects/la-rucula/hero.webp': '/media/projects/la-rucula.jpg',
  '/media/projects/argpiscinas/hero.webp': '/media/projects/argpiscinas.jpg',
  '/media/projects/barberpole/hero.webp': '/media/projects/barberpole.png',
}

const publicPath = (src: string) => path.join(PUBLIC_DIR, src)
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

interface SourceFile {
  /** Ruta pública de destino ('/media/projects/eros/admin-radar.webp'). */
  src: string
  from: string
  bytes: number
}

async function sameFile(a: string, b: string): Promise<boolean> {
  try {
    const [x, y] = await Promise.all([readFile(a), readFile(b)])
    return x.equals(y)
  }
  catch {
    return false
  }
}

/** Lo que seed/captures.ts publica, leído de la carpeta de capturas. Falla si falta alguno. */
async function sourceFiles(): Promise<SourceFile[]> {
  return Promise.all(capturedFiles().map(async ([project, file]) => {
    const from = path.join(CAPTURAS_DIR, project, file)
    const bytes = await stat(from).then(s => s.size, () => {
      throw new Error(`falta ${from}: correr docs/rediseno/capturar.mjs ${project} o revisar CAPTURAS_DIR`)
    })
    return { src: capturePath(project, file), from, bytes }
  }))
}

/** Copia lo que falta o cambió y devuelve cuántos faltaban. */
async function copyCaptures(): Promise<number> {
  const files = await sourceFiles()
  const heavy = files.filter(f => VIDEO.test(f.src) && f.bytes > MAX_VIDEO_BYTES)
  if (heavy.length) {
    for (const f of heavy) console.error(`video de más de 4 MB: ${f.src} (${mb(f.bytes)})`)
    throw new Error('se aborta sin copiar: volver a comprimir esos videos con capturar.mjs')
  }
  let pending = 0
  for (const f of files) {
    const to = publicPath(f.src)
    if (await sameFile(f.from, to)) continue
    pending++
    console.log(`${dry ? 'copiaría' : 'copia'} ${f.src} (${mb(f.bytes)})`)
    if (dry) continue
    await mkdir(path.dirname(to), { recursive: true })
    await copyFile(f.from, to)
  }
  console.log(`archivos: ${pending ? `${pending} ${dry ? 'por copiar' : 'copiados'}` : 'sin cambios'} de ${files.length}`)
  return pending
}

/** Cada archivo referenciado existe y ningún video pasa los 4 MB. */
async function checkFiles(captures: readonly CaptureSeed[]) {
  for (const src of captures.flatMap(c => [c.src, c.poster, c.srcWebm])) {
    if (!src) continue
    const { size } = await stat(publicPath(src))
    if (VIDEO.test(src) && size > MAX_VIDEO_BYTES) throw new Error(`video de más de 4 MB: ${src} (${mb(size)})`)
  }
}

interface Plan {
  what: string[]
  renames: { id: number, src: string }[]
  captures: CaptureSeed[]
}

const FIELDS = ['kind', 'role', 'order', 'viewport', 'width', 'height', 'bytes', 'poster', 'srcWebm', 'tint'] as const

async function planCaptures(captures: readonly CaptureSeed[]): Promise<Plan> {
  const plan: Plan = { what: [], renames: [], captures: [] }
  for (const c of captures) {
    const project = await db.project.findUnique({ where: { slug: c.project }, select: { id: true } })
    if (!project) {
      console.warn(`aviso: la obra ${c.project} no está en la base, se saltea ${c.src}`)
      continue
    }
    const include = { translations: { where: { locale: Locale.en } } }
    let row = await db.media.findFirst({ where: { projectId: project.id, src: c.src }, include })
    const label = `${c.project} ${c.src}`
    const previous = PREVIOUS_COVERS[c.src]
    if (!row && previous) {
      row = await db.media.findFirst({ where: { projectId: project.id, src: previous, role: c.role, kind: c.kind }, include })
      if (row) {
        plan.renames.push({ id: row.id, src: c.src })
        plan.what.push(`${label}: reemplaza a ${previous} (misma fila, id ${row.id})`)
      }
    }
    if (!row && c.role === 'COVER') {
      // Igual que el parche 11-01: una portada del mismo tipo ya cargada (por ejemplo, subida desde el admin)
      // se respeta. Crear otra rompería "a lo sumo una portada de imagen y una de video por obra".
      const cover = await db.media.findFirst({ where: { projectId: project.id, role: 'COVER', kind: c.kind }, select: { id: true, src: true } })
      if (cover) {
        console.warn(`aviso: ${c.project} ya tiene portada ${c.kind} (${cover.src}, id ${cover.id}); se respeta y se saltea ${c.src}`)
        continue
      }
    }
    if (!row) {
      plan.what.push(`${label}: nueva ${c.kind} ${c.role} ${c.viewport} ${c.width}x${c.height}`)
      plan.captures.push(c)
      continue
    }

    const en = row.translations[0]
    const diffs = [
      ...FIELDS.map(k => [k, row[k], c[k]] as const),
      ['alt', row.alt, c.alt.es] as const,
      ['caption', row.caption, c.caption?.es ?? null] as const,
      ['en.alt', en?.alt ?? null, c.alt.en] as const,
      ['en.caption', en?.caption ?? null, c.caption?.en ?? null] as const,
    ].filter(([, before, after]) => (before ?? null) !== (after ?? null))
    for (const [k, before, after] of diffs) plan.what.push(`${label}: ${k} ${show(before)} → ${show(after)}`)
    if (diffs.length || plan.renames.some(r => r.id === row.id)) plan.captures.push(c)
  }
  return plan
}

async function main() {
  const pending = dbOnly ? 0 : await copyCaptures()
  if (dry && pending) {
    console.log('--dry: la base se revisa con los archivos ya copiados; no se escribió nada')
    return
  }
  // seed/media.ts lee tamaños de public/ al cargarse: recién ahora, con los archivos copiados.
  const { CAPTURES } = await import('../seed/media.js')
  await checkFiles(CAPTURES)

  const plan = await planCaptures(CAPTURES)
  if (!plan.what.length) {
    console.log(`sin cambios: las ${CAPTURES.length} Media de seed/media.ts ya están en la base`)
    return
  }
  console.log(`${dry ? 'cambios pendientes' : 'aplicando'} (${plan.what.length}):`)
  for (const line of plan.what) console.log(`  ${line}`)
  if (dry) {
    console.log('--dry: no se escribió nada')
    return
  }

  await db.$transaction(async (tx) => {
    for (const r of plan.renames) await tx.media.update({ where: { id: r.id }, data: { src: r.src } })
    await applyCaptures(tx, plan.captures)
    const covers = await tx.media.groupBy({ by: ['projectId', 'kind'], where: { role: 'COVER' }, _count: { _all: true } })
    const doubled = covers.filter(g => g._count._all > 1)
    if (doubled.length) throw new Error(`más de una portada por tipo en ${doubled.map(g => `obra ${g.projectId} ${g.kind}`).join(', ')}: se deshace todo`)
  }, { timeout: 60000 })
  console.log('listo')
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
