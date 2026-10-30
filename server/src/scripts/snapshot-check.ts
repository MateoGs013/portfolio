/**
 * pnpm db:snapshot:check — con la base levantada, compara la respuesta de la base contra la del
 * snapshot en una matriz fija: las 5 listas × filtros (status, stack, featured) × es/en, el detalle
 * de cada obra, tecnología, experiencia, org, documento y artículo, /api/schema y /api/cv × es/en.
 * Termina con código 1 si alguna difiere: hay que regenerar con `pnpm db:snapshot`.
 */
import { isDeepStrictEqual } from 'node:util'
import { Locale } from '../../generated/prisma/client.js'
import { readSnapshot, resolve, type Resource } from '../content/snapshot.js'
import { db } from '../db.js'
import {
  articleFilters,
  experienceFilters,
  projectFilters,
  publicFilters,
  readFilters,
  stackFilters,
  type Filters,
} from '../filters.js'
import { articleDetail, articleList } from '../routes/articles.js'
import { cvDocument } from '../routes/cv.js'
import { docDetail } from '../routes/docs.js'
import { experienceDetail, experienceList } from '../routes/experience.js'
import { orgDetail, orgList } from '../routes/orgs.js'
import { projectDetail, projectList } from '../routes/projects.js'
import { schemaCounter } from '../routes/schema.js'
import { stackList, techDetail } from '../routes/stack.js'

/** Las consultas de la matriz: `?status=`, `?stack=` y `?featured=` sobre cada lista que los acepta. */
const queries = ['', 'status=live', 'status=wip', 'status=archived', 'stack=vue', 'stack=fastapi', 'featured=true', 'featured=false', 'category=framework']

function parse<S extends Parameters<typeof readFilters>[1]>(query: string, spec: S) {
  return readFilters(Object.fromEntries(new URLSearchParams(query)), spec)
}

interface Case {
  label: string
  run: (force: 'db' | 'snapshot', lang: Locale) => Promise<unknown>
}

function check<A, W, O>(label: string, resource: Resource<A, W, O>, args: A): Case {
  return { label, run: async (force, lang) => (await resolve(resource, args, lang, force)).data }
}

/** Una lista con cada consulta de la matriz que acepta; las que ignora darían el mismo caso. */
function listCases<S extends Parameters<typeof readFilters>[1], W, O>(
  path: string,
  resource: Resource<Filters<S>, W, O>,
  spec: S,
): Case[] {
  const cases = new Map<string, Case>()
  for (const q of queries) {
    const filters = parse(q, spec)
    const label = `${path}?${new URLSearchParams(publicFilters(filters))}`
    if (!cases.has(label)) cases.set(label, check(label, resource, filters))
  }
  return [...cases.values()]
}

/** Primer camino donde dos valores difieren, para que el aviso diga qué cambió. */
function firstDiff(a: unknown, b: unknown, path = ''): string {
  if (isDeepStrictEqual(a, b)) return ''
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return `${path || '(raíz)'}: base=${JSON.stringify(a)?.slice(0, 120)} snapshot=${JSON.stringify(b)?.slice(0, 120)}`
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const diff = firstDiff((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${path}.${key}`)
    if (diff) return diff
  }
  return path
}

async function main() {
  const snap = readSnapshot()
  const slugs = <T extends { slug: string }>(list: readonly T[]) => list.map(r => r.slug)

  const cases: Case[] = [
    ...listCases('projects', projectList, projectFilters),
    ...listCases('stack', stackList, stackFilters),
    ...listCases('experience', experienceList, experienceFilters),
    ...listCases('articles', articleList, articleFilters),
    check('orgs', orgList, null),
    check('schema', schemaCounter, null),
    check('cv', cvDocument, null),
    ...slugs(await db.project.findMany({ select: { slug: true } })).map(s => check(`projects/${s}`, projectDetail, s)),
    ...slugs(snap.stack).map(s => check(`stack/${s}`, techDetail, s)),
    ...slugs(snap.experience).map(s => check(`experience/${s}`, experienceDetail, s)),
    ...slugs(snap.orgs).map(s => check(`orgs/${s}`, orgDetail, s)),
    ...slugs(snap.articles).map(s => check(`articles/${s}`, articleDetail, s)),
    ...snap.docs.map(d => check(`docs/${d.key}`, docDetail, d.key)),
  ]

  let failures = 0
  for (const c of cases) {
    for (const lang of Object.values(Locale)) {
      const [fromDb, fromSnapshot] = await Promise.all([c.run('db', lang), c.run('snapshot', lang)])
      const diff = firstDiff(JSON.parse(JSON.stringify(fromDb ?? null)), JSON.parse(JSON.stringify(fromSnapshot ?? null)))
      if (!diff) continue
      failures++
      console.error(`difiere  ${c.label} (${lang})  ${diff}`)
    }
  }

  const total = cases.length * Object.values(Locale).length
  if (failures > 0) {
    console.error(`snapshot:check -> ${failures} de ${total} respuestas difieren. Regenerar con pnpm db:snapshot.`)
    process.exitCode = 1
    return
  }
  console.log(`snapshot:check -> ${total} respuestas iguales (snapshot del ${snap.at})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
