import type { Request } from 'express'
import { ProjectStatus, TechCategory } from '../generated/prisma/client.js'

/**
 * Filtros de las listas públicas. Cada endpoint declara qué acepta y cómo se lee cada valor:
 * lo inválido se descarta (no filtra y no vuelve en `meta.filters`). Lo que se devuelve en
 * `meta.filters` es exactamente lo aplicado, en su forma pública en minúscula, uno a uno con la URL.
 */
type Parser<V> = (raw: string) => V | undefined
type Spec = Record<string, Parser<unknown>>
export type Filters<S extends Spec> = { [K in keyof S]?: Exclude<ReturnType<S[K]>, undefined> }

const slugPattern = /^[a-z0-9][a-z0-9-]*$/

const slug: Parser<string> = (raw) => {
  const value = raw.trim().toLowerCase()
  return slugPattern.test(value) ? value : undefined
}

const int: Parser<number> = (raw) => {
  const n = Number(raw)
  return raw.trim() !== '' && Number.isInteger(n) ? n : undefined
}

const bool: Parser<boolean> = (raw) => {
  const value = raw.trim().toLowerCase()
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/** Valor de un enum de Prisma: se acepta en minúscula (`live`) y se compara en mayúscula. */
function enumOf<E extends string>(values: Record<string, E>): Parser<E> {
  const allowed = Object.values(values)
  return (raw) => {
    const value = raw.trim().toUpperCase()
    return allowed.find(v => v === value)
  }
}

export const projectFilters = { status: enumOf(ProjectStatus), stack: slug, featured: bool, year: int, org: slug }
export const stackFilters = { category: enumOf(TechCategory) }
export const experienceFilters = { stack: slug, org: slug }
export const articleFilters = { stack: slug, featured: bool, project: slug }

export type ProjectFilters = Filters<typeof projectFilters>
export type StackFilters = Filters<typeof stackFilters>
export type ExperienceFilters = Filters<typeof experienceFilters>
export type ArticleFilters = Filters<typeof articleFilters>

/** Lee de la query solo los filtros declarados en `spec`, ya convertidos. */
export function readFilters<S extends Spec>(query: Request['query'], spec: S): Filters<S> {
  const out: Record<string, unknown> = {}
  for (const [key, parse] of Object.entries(spec)) {
    const raw = query[key]
    const first = Array.isArray(raw) ? raw[0] : raw
    if (typeof first !== 'string' || first === '') continue
    const value = parse(first)
    if (value !== undefined) out[key] = value
  }
  return out as Filters<S>
}

/** Forma pública de lo aplicado: `{ status: 'live', featured: 'true', year: '2026' }`. */
export function publicFilters(filters: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) out[key] = String(value).toLowerCase()
  }
  return out
}
