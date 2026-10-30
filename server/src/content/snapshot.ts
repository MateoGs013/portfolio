/**
 * Respaldos generados, nunca escritos a mano. Cada ruta consulta la base; si la consulta falla,
 * responde con la última respuesta buena de esa misma consulta (memoria y disco) y, si nunca hubo
 * una, con server/src/snapshot/content.json (`pnpm db:snapshot`). Las dos copias son registros
 * crudos que pasan por el mismo `present`, así la respuesta tiene la misma forma que la de la base.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Prisma } from '../../generated/prisma/client.js'
import type { ContentSource } from '../envelope.js'
import type { ArticleRecord } from '../queries/articles.js'
import type { DocRecord } from '../queries/docs.js'
import type { ExperienceRecord } from '../queries/experience.js'
import type { OrgRecord } from '../queries/orgs.js'
import type { ProjectRecord } from '../queries/projects.js'
import type { TechRecord } from '../queries/stack.js'
import type { Lang } from './lang.js'

/** Un registro tal como llega de Prisma o tal como vuelve de un JSON (fechas y decimales como texto). */
export type Wire<T> = T extends Date ? Date | string
  : T extends Prisma.Decimal ? Prisma.Decimal | string
    : T extends readonly (infer U)[] ? Wire<U>[]
      : T extends object ? { [K in keyof T]: Wire<T[K]> }
        : T

export interface ContentSnapshot {
  _generated: string
  at: string
  projects: Wire<ProjectRecord>[]
  stack: Wire<TechRecord>[]
  experience: Wire<ExperienceRecord>[]
  orgs: Wire<OrgRecord>[]
  docs: Wire<DocRecord>[]
  articles: Wire<ArticleRecord>[]
}

/** Una consulta pública: cómo se trae de la base, cómo se arma desde el snapshot y cómo se publica. */
export interface Resource<A, W, O> {
  /** Prefijo de la clave de la última respuesta buena (la clave suma los argumentos, no el idioma). */
  name: string
  db: (args: A) => Promise<W | null>
  snapshot: (snap: ContentSnapshot, args: A) => W | null
  present: (raw: W, lang: Lang) => O
}

export interface Resolved<O> {
  data: O | null
  source: ContentSource
}

export const SNAPSHOT_FILE = fileURLToPath(new URL('../snapshot/content.json', import.meta.url))
const LAST_GOOD_FILE = path.resolve(process.env['CONTENT_LAST_GOOD_FILE'] ?? 'data/content-last-good.json')
/** Tope de consultas recordadas: las claves llevan slugs y filtros que llegan de la URL. */
const LAST_GOOD_MAX = 256

let snapshot: ContentSnapshot | undefined
const lastGood = new Map<string, unknown>()
let lastGoodLoaded = false
let writeTimer: NodeJS.Timeout | undefined
let warnedAt = 0

/** Carga perezosa del snapshot versionado. */
export function readSnapshot(): ContentSnapshot {
  snapshot ??= JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) as ContentSnapshot
  return snapshot
}

function loadLastGood() {
  if (lastGoodLoaded) return
  lastGoodLoaded = true
  try {
    const stored = JSON.parse(fs.readFileSync(LAST_GOOD_FILE, 'utf8')) as Record<string, unknown>
    for (const [key, raw] of Object.entries(stored)) {
      if (!lastGood.has(key)) lastGood.set(key, raw)
    }
  }
  catch {
    // Sin archivo todavía: se usa el snapshot versionado.
  }
}

function persistLastGood() {
  clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(LAST_GOOD_FILE), { recursive: true })
      const tmp = `${LAST_GOOD_FILE}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(lastGood)))
      fs.renameSync(tmp, LAST_GOOD_FILE)
    }
    catch (err) {
      console.warn('[content] no se pudo guardar la última respuesta buena:', (err as Error).message)
    }
  }, 2000)
  writeTimer.unref()
}

function remember(key: string, raw: unknown) {
  loadLastGood()
  lastGood.delete(key)
  lastGood.set(key, raw)
  while (lastGood.size > LAST_GOOD_MAX) {
    const oldest = lastGood.keys().next().value
    if (oldest === undefined) break
    lastGood.delete(oldest)
  }
  persistLastGood()
}

function recall(key: string): unknown {
  loadLastGood()
  return lastGood.get(key)
}

function warnDbDown(name: string, err: unknown) {
  if (Date.now() - warnedAt < 60_000) return
  warnedAt = Date.now()
  // El mensaje de Prisma trae el código de la consulta: alcanza con su último renglón.
  const reason = String((err as Error)?.message ?? err).trim().split('\n').at(-1)
  console.warn(`[content] la base no respondió (${name}); se sirve el snapshot: ${reason}`)
}

/**
 * Trae y publica una consulta. `force` lo usa el chequeo de paridad: 'db' no recuerda nada y
 * 'snapshot' lee solo content.json, sin la última respuesta buena.
 */
export async function resolve<A, W, O>(
  resource: Resource<A, W, O>,
  args: A,
  lang: Lang,
  force?: ContentSource,
): Promise<Resolved<O>> {
  const key = `${resource.name}:${JSON.stringify(args)}`
  const publish = (raw: W | null, source: ContentSource): Resolved<O> => ({
    data: raw === null ? null : resource.present(raw, lang),
    source,
  })

  if (force !== 'snapshot') {
    try {
      const raw = await resource.db(args)
      if (!force && raw !== null) remember(key, raw)
      return publish(raw, 'db')
    }
    catch (err) {
      if (force === 'db') throw err
      warnDbDown(resource.name, err)
    }
  }

  const recalled = force ? undefined : recall(key)
  if (recalled !== undefined) return publish(recalled as W, 'snapshot')
  return publish(resource.snapshot(readSnapshot(), args), 'snapshot')
}
