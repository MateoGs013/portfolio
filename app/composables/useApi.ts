/**
 * Acceso al API. Los dos mundos leen de acá y de ningún otro lado:
 * un solo modelo, dos renderers. Cada llamada devuelve también el request
 * que la produjo y cuánto tardó: DATOS los muestra, porque la máquina a la
 * vista es parte de su argumento.
 */
import type { LocationQuery } from 'vue-router'
import type { Doc, Envelope, Experience, Org, Project, SchemaEntry, Tech } from '~/lib/api'
import type { CollectionKey, DocKey } from '~/lib/fieldMeta'

export type ListQuery = LocationQuery | Record<string, string | undefined>

export type ListOf<K extends CollectionKey> =
  K extends 'projects' ? Project[] : K extends 'experience' ? Experience[] : K extends 'stack' ? Tech[] : never

export type RecordOf<K extends CollectionKey> =
  K extends 'projects' ? Project : K extends 'experience' ? Experience : K extends 'stack' ? Tech : K extends 'orgs' ? Org : never

/** Lo que devuelve cada llamada: el sobre del API más el request y el tiempo. */
export interface Answer<T> extends Envelope<T> {
  request: string
  status: number
  ms: number
}

/** Endpoint de lista de cada colección. `orgs` no tiene: se llega por relación. */
export const listEndpoint: Record<CollectionKey, string | null> = {
  projects: '/projects',
  experience: '/experience',
  stack: '/stack',
  orgs: null,
}

/** Filtros que acepta cada lista. Es el contrato de URL: la query pública mapea uno a uno. */
export const listFilters: Record<CollectionKey, readonly string[]> = {
  projects: ['stack', 'year', 'role', 'featured'],
  experience: ['stack', 'org'],
  stack: ['category'],
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

  /** Un record por slug. `projects` y `orgs` tienen detalle propio; el resto se saca de la lista. */
  async function record<K extends CollectionKey>(collection: K, slug: string): Promise<Answer<RecordOf<K>>> {
    if (collection === 'projects' || collection === 'orgs') {
      return get<RecordOf<K>>(`/${collection}/${encodeURIComponent(slug)}`)
    }
    const answer = await list(collection)
    const found = (answer.data as RecordOf<K>[]).find(r => r.slug === slug)
    if (!found) throw createError({ statusCode: 404, statusMessage: 'no existe', data: { request: answer.request } })
    return { ...answer, data: found, meta: { count: 1, filters: {} } }
  }

  const doc = (key: DocKey) => get<Doc>(`/docs/${key}`)

  return { apiBase, get, schema, list, record, doc }
}
