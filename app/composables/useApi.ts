/**
 * Acceso al API. Los dos mundos leen de acá y de ningún otro lado:
 * un solo modelo, dos renderers. Las funciones devuelven el `data` ya
 * desenvuelto; `meta` solo importa para mostrar el request en DATOS.
 */
import type { LocationQuery } from 'vue-router'
import type { Doc, Envelope, Experience, Project, SchemaEntry, Tech } from '~/lib/api'
import type { CollectionKey, DocKey } from '~/lib/fieldMeta'

export type ListQuery = LocationQuery | Record<string, string | undefined>

export type ListOf<K extends CollectionKey> =
  K extends 'projects' ? Project[] : K extends 'experience' ? Experience[] : K extends 'stack' ? Tech[] : never

export type RecordOf<K extends CollectionKey> = ListOf<K>[number]

/** Cómo se llama el endpoint de cada colección. `orgs` no tiene: se llega por relación. */
const endpoint: Record<CollectionKey, string | null> = {
  projects: '/projects',
  experience: '/experience',
  stack: '/stack',
  orgs: null,
}

export function useApi() {
  const { public: { apiBase } } = useRuntimeConfig()

  async function get<T>(path: string, query?: ListQuery): Promise<Envelope<T>> {
    try {
      return await $fetch<Envelope<T>>(`${apiBase}${path}`, { query: query as Record<string, unknown> })
    }
    catch (err) {
      const status = (err as { statusCode?: number, status?: number }).statusCode ?? (err as { status?: number }).status
      throw createError({ statusCode: status === 404 ? 404 : 502, statusMessage: status === 404 ? 'no existe' : 'el API no respondió' })
    }
  }

  const schema = () => get<SchemaEntry[]>('/schema')

  function list<K extends CollectionKey>(collection: K, query?: ListQuery) {
    const path = endpoint[collection]
    if (!path) throw createError({ statusCode: 404, statusMessage: `${collection} no tiene endpoint propio` })
    return get<ListOf<K>>(path, query)
  }

  /** Un record por slug. `projects` tiene detalle propio; el resto se saca de la lista. */
  async function record<K extends CollectionKey>(collection: K, slug: string): Promise<RecordOf<K>> {
    if (collection === 'projects') {
      const { data } = await get<Project>(`/projects/${encodeURIComponent(slug)}`)
      return data as RecordOf<K>
    }
    const { data } = await list(collection)
    const found = (data as RecordOf<K>[]).find(r => r.slug === slug)
    if (!found) throw createError({ statusCode: 404, statusMessage: 'no existe' })
    return found
  }

  const doc = (key: DocKey) => get<Doc>(`/docs/${key}`)

  /** El request público equivalente, para mostrarlo en DATOS. */
  function requestFor(path: string, query?: ListQuery): string {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(query ?? {})) {
      const value = Array.isArray(v) ? v[0] : v
      if (typeof value === 'string' && value !== '') q.set(k, value)
    }
    const s = q.toString()
    return `GET /api${path}${s ? `?${s}` : ''}`
  }

  return { apiBase, get, schema, list, record, doc, requestFor, endpoint }
}
