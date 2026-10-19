/**
 * Acceso al API del portafolio.
 * Modelo relacional unificado sobre PostgreSQL 17 / Nitro API.
 * Cada llamada devuelve el envelope de datos, el request ejecutado y la latencia en ms.
 */
import type { LocationQuery } from 'vue-router'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { Article, Doc, Envelope, Experience, Org, Project, SchemaEntry, Tech } from '~/lib/api'
import type { CollectionKey, DocKey } from '~/lib/fieldMeta'

export type ListQuery = LocationQuery | Record<string, string | undefined>

export type ListOf<K extends CollectionKey> =
  K extends 'projects' ? Project[] : K extends 'experience' ? Experience[] : K extends 'stack' ? Tech[] : K extends 'articles' ? Article[] : K extends 'orgs' ? Org[] : never

export type RecordOf<K extends CollectionKey> =
  K extends 'projects' ? Project : K extends 'experience' ? Experience : K extends 'stack' ? Tech : K extends 'articles' ? Article : K extends 'orgs' ? Org : never

/** Lo que devuelve cada llamada: el sobre del API más el request y el tiempo. */
export interface Answer<T> extends Envelope<T> {
  request: string
  status: number
  ms: number
}

/** Endpoint de lista de cada colección. */
export const listEndpoint: Record<CollectionKey, string | null> = {
  projects: '/projects',
  experience: '/experience',
  stack: '/stack',
  articles: '/articles',
  orgs: '/orgs',
}

/** Filtros que acepta cada lista. Es el contrato de URL: la query pública mapea uno a uno. */
export const listFilters: Record<CollectionKey, readonly string[]> = {
  projects: ['stack', 'year', 'role', 'featured', 'status', 'org'],
  experience: ['stack', 'org'],
  stack: ['category'],
  articles: ['stack', 'featured', 'project'],
  orgs: [],
}

/** Deja en la query solo los filtros que la colección entiende. */
export function filtersFor(collection: CollectionKey, query: ListQuery): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of listFilters[collection]) {
    const raw = (query as Record<string, unknown>)[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value === 'string' && value !== '') out[key] = value
  }
  return out
}

export function requestLine(path: string, query?: Record<string, string>): string {
  const q = new URLSearchParams(query ?? {}).toString()
  return `GET /api${path}${q ? `?${q}` : ''}`
}

export function useApi() {
  const { public: { apiBase } } = useRuntimeConfig()

  async function get<T>(path: string, query?: Record<string, string>): Promise<Answer<T>> {
    const request = requestLine(path, query)
    const t0 = performance.now()
    try {
      const res = await $fetch.raw<Envelope<T>>(`${apiBase}${path}`, { query })
      const body = res._data as Envelope<T>
      return { ...body, request, status: res.status, ms: Math.round(performance.now() - t0) }
    }
    catch (err) {
      const status = (err as { statusCode?: number, status?: number }).statusCode ?? (err as { status?: number }).status
      throw createError({
        statusCode: status === 404 ? 404 : 502,
        statusMessage: status === 404 ? 'no existe' : 'el API no respondio',
        data: { request },
      })
    }
  }

  const schema = () => get<SchemaEntry[]>('/schema')

  function list<K extends CollectionKey>(collection: K, query: ListQuery = {}) {
    const path = listEndpoint[collection]
    if (!path) throw createError({ statusCode: 404, statusMessage: `${collection} no tiene lista: se llega desde un record` })
    return get<ListOf<K>>(path, filtersFor(collection, query))
  }

  /** Un record por slug. Consulta el endpoint individual de la colección. */
  async function record<K extends CollectionKey>(collection: K, slug: string): Promise<Answer<RecordOf<K>>> {
    try {
      return await get<RecordOf<K>>(`/${collection}/${encodeURIComponent(slug)}`)
    }
    catch (err) {
      // Fallback por lista si el endpoint directo no estuviera disponible
      try {
        const answer = await list(collection)
        const found = (answer.data as RecordOf<K>[]).find(r => r.slug === slug)
        if (found) {
          return { ...answer, data: found, meta: { count: 1, filters: {} } }
        }
      } catch {
        // ignorar
      }
      throw err
    }
  }

  const doc = (key: DocKey) => get<Doc>(`/docs/${key}`)

  return { apiBase, get, schema, list, record, doc }
}

export interface ProjectFilterParams {
  stack?: string
  year?: string | number
  role?: string
  featured?: string | boolean
  status?: string
  org?: string
}

/** Composable reactivo para consultar proyectos con filtros relacionales (incluyendo ?org=). */
export function useProjects(filters?: MaybeRefOrGetter<ProjectFilterParams | undefined>) {
  const api = useApi()
  const filterParams = computed<Record<string, string>>(() => {
    const raw = toValue(filters) ?? {}
    const out: Record<string, string> = {}
    if (raw.stack) out['stack'] = String(raw.stack)
    if (raw.year !== undefined) out['year'] = String(raw.year)
    if (raw.role) out['role'] = String(raw.role)
    if (raw.featured !== undefined) out['featured'] = String(raw.featured)
    if (raw.status) out['status'] = String(raw.status)
    if (raw.org) out['org'] = String(raw.org)
    return out
  })

  return useAsyncData(
    () => `projects-${JSON.stringify(filterParams.value)}`,
    () => api.list('projects', filterParams.value),
    {
      watch: [filterParams],
    },
  )
}

