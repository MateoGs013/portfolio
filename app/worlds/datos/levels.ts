/**
 * El árbol de DATOS. Dado un path devuelve qué hay en ese nivel: hijos
 * navegables y/o campos con tipo. Un solo resolutor para todas las
 * colecciones, porque una base de datos trata a todos los records igual.
 *
 *   []                      raíz: el schema
 *   [about]                 documento: sus campos
 *   [projects]              colección: records (con los filtros de la query)
 *   [projects, la-rucula]   record: campos del subset DATOS
 *   [projects, x, techs]    subvista: los items de una relación
 */
import type { LocationQuery, RouteLocationRaw } from 'vue-router'
import type { AnyRecord, LinkRef, TechRef } from '~/lib/api'
import { fieldMeta, fieldsFor, type CollectionKey, type FieldMeta } from '~/lib/fieldMeta'
import { isDoc, isRoot, routeFor, type Path } from '~/lib/path'
import type { useApi } from '~/composables/useApi'

type Api = ReturnType<typeof useApi>

export interface Item {
  key: string
  label: string
  meta: string
  kids: boolean
  to?: RouteLocationRaw
  href?: string
}

export interface Row {
  name: string
  type: string
  value: string | null
  wide?: boolean
  to?: RouteLocationRaw
  href?: string
}

export interface Level {
  kind: 'root' | 'collection' | 'document' | 'record' | 'sub'
  /** Nombre de la carpeta: lo que va en el header de la columna. */
  head: string
  count: number
  /** El request que produjo esto. DATOS muestra la máquina. */
  request: string
  items: Item[]
  rows: Row[]
  /** Nombre del record. Es el ancla del pasaje. */
  name?: string
  type?: string
}

/** Cómo se llama el modelo de cada colección, como lo leería alguien que mira el schema. */
const modelName: Record<CollectionKey, string> = {
  projects: 'Project',
  experience: 'Experience',
  stack: 'Tech',
  orgs: 'Org',
}

export const pad = (n: number) => String(n).padStart(2, '0')

const notFound = (msg = 'no existe') => createError({ statusCode: 404, statusMessage: msg })

function field(record: AnyRecord, name: string): unknown {
  return (record as unknown as Record<string, unknown>)[name]
}

function nameOf(collection: CollectionKey, record: AnyRecord): string {
  return String(field(record, fieldMeta[collection].nameField) ?? record.slug)
}

/** El dato corto que acompaña al nombre en la lista: la dimensión dominante de cada colección. */
function metaOf(collection: CollectionKey, record: AnyRecord): string {
  switch (collection) {
    case 'projects': return String(field(record, 'year'))
    case 'experience': {
      const from = String(field(record, 'startedAt')).slice(0, 4)
      const to = field(record, 'endedAt')
      return `${from}–${to ? String(to).slice(0, 4) : ''}`
    }
    case 'stack': return String(field(record, 'since'))
    default: return ''
  }
}

function fmt(meta: FieldMeta, value: unknown): string | null {
  if (value === null || value === undefined) return null
  switch (meta.type) {
    case 'date': return String(value).slice(0, 10)
    case 'datetime': return String(value).replace('T', ' ').slice(0, 16)
    case 'bool': return value ? 'true' : 'false'
    case 'json': return JSON.stringify(value)
    default: return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
}

function rowFor(collection: CollectionKey, record: AnyRecord, name: string, query: LocationQuery): Row {
  const meta = fieldMeta[collection].fields[name]
  if (!meta) throw new Error(`${collection}.${name} no está en fieldMeta`)
  const value = field(record, name)
  const row: Row = { name, type: meta.type, value: fmt(meta, value), wide: meta.wide }

  if (meta.type.startsWith('relation[]')) {
    const count = Array.isArray(value)
      ? value.length
      : Number((field(record, '_count') as Record<string, number> | undefined)?.[name] ?? 0)
    row.value = `${pad(count)} items`
    if (count > 0) row.to = routeFor('datos', [collection, record.slug, name], query)
  }
  else if (meta.type.startsWith('relation')) {
    // Relación simple: por ahora se imprime el nombre. El salto a /datos/orgs/:slug
    // necesita su endpoint (Fase 3).
    row.value = value && typeof value === 'object' ? String((value as { name?: string }).name ?? '') : null
  }
  else if (meta.type === 'url' && typeof value === 'string') {
    row.href = value
  }
  return row
}

export async function resolveLevel(api: Api, path: Path, query: LocationQuery): Promise<Level> {
  const [root, slug, sub] = path

  if (!root) {
    const { data, meta } = await api.schema()
    return {
      kind: 'root',
      head: 'db',
      count: meta.count,
      request: api.requestFor('/schema'),
      rows: [],
      items: data.map(e => ({
        key: e.key,
        label: e.label,
        meta: `${pad(e.count)} ${e.kind === 'collection' ? 'records' : 'fields'}`,
        kids: true,
        to: routeFor('datos', [e.key]),
      })),
    }
  }

  if (!isRoot(root)) throw notFound()

  if (isDoc(root)) {
    if (slug) throw notFound()
    const { data } = await api.doc(root)
    const rows = data.fields
      .filter(f => !f.worlds || f.worlds.includes('datos'))
      .map<Row>(f => ({ name: f.name, type: f.type, value: f.value, wide: f.wide }))
    return {
      kind: 'document',
      head: root,
      count: rows.length,
      request: api.requestFor(`/docs/${root}`),
      items: [],
      rows,
      name: data.title,
      type: 'document',
    }
  }

  const collection = root
  const endpoint = api.endpoint[collection]
  if (!endpoint) throw notFound(`${collection} no tiene endpoint propio todavía`)

  if (!slug) {
    const { data, meta } = await api.list(collection, query)
    return {
      kind: 'collection',
      head: collection,
      count: meta.count,
      request: api.requestFor(endpoint, query),
      rows: [],
      items: (data as AnyRecord[]).map(r => ({
        key: r.slug,
        label: nameOf(collection, r),
        meta: metaOf(collection, r),
        kids: true,
        to: routeFor('datos', [collection, r.slug], query),
      })),
    }
  }

  const record = (await api.record(collection, slug)) as AnyRecord
  const recordRequest = collection === 'projects'
    ? api.requestFor(`/projects/${slug}`)
    : api.requestFor(endpoint)

  if (!sub) {
    const rows = fieldsFor(collection, 'datos').map(name => rowFor(collection, record, name, query))
    return {
      kind: 'record',
      head: slug,
      count: rows.length,
      request: recordRequest,
      items: [],
      rows,
      name: nameOf(collection, record),
      type: `record · ${modelName[collection]}`,
    }
  }

  const subMeta = fieldMeta[collection].fields[sub]
  if (!subMeta || !subMeta.worlds.includes('datos') || !subMeta.type.startsWith('relation[]')) throw notFound()

  // Relaciones embebidas en el record.
  if (sub === 'techs') {
    const techs = field(record, 'techs') as TechRef[]
    return {
      kind: 'sub',
      head: sub,
      count: techs.length,
      request: recordRequest,
      rows: [],
      items: techs.map(t => ({ key: t.slug, label: t.name, meta: 'Tech', kids: true, to: routeFor('datos', ['stack', t.slug]) })),
    }
  }
  if (sub === 'links') {
    const links = field(record, 'links') as LinkRef[]
    return {
      kind: 'sub',
      head: sub,
      count: links.length,
      request: recordRequest,
      rows: [],
      items: links.map(l => ({ key: l.url, label: l.label, meta: new URL(l.url).host, kids: false, href: l.url })),
    }
  }

  // Relaciones inversas de una tech: son literalmente un filtro de la otra colección,
  // el mismo request que /datos/projects?stack=<slug>.
  if (collection === 'stack' && (sub === 'projects' || sub === 'experiences')) {
    const target: CollectionKey = sub === 'projects' ? 'projects' : 'experience'
    const filter = { stack: slug }
    const { data, meta } = await api.list(target, filter)
    return {
      kind: 'sub',
      head: sub,
      count: meta.count,
      request: api.requestFor(api.endpoint[target] ?? '', filter),
      rows: [],
      items: (data as AnyRecord[]).map(r => ({
        key: r.slug,
        label: nameOf(target, r),
        meta: metaOf(target, r),
        kids: true,
        to: routeFor('datos', [target, r.slug]),
      })),
    }
  }

  throw notFound()
}
