/**
 * El explorador de DATOS. Dado un path devuelve las columnas que hay que
 * dibujar, la tabla o la hoja que ocupa el resto de la pantalla y el request
 * que lo produjo. Un solo resolutor para todas las colecciones: una base de
 * datos trata a todos los records igual.
 *
 *   []                       columna 0: el schema · hoja: la persona
 *   [about]                  columna 0 · hoja: los campos del documento
 *   [projects]               columna 0 · tabla: los records, con las facetas de la query
 *   [projects, la-rucula]    columna 0 · columna 1: los records · hoja: el record, relaciones incluidas
 *   [orgs, pegasuz]          orgs no está en el schema: la columna 1 es la org alcanzada
 *
 * No hay sub-nivel: las relaciones de un record se leen en su hoja y cada
 * una es un link. Quien busca "qué hizo con Vue" filtra la tabla tocando el
 * valor; no baja tres niveles.
 *
 * Trampa conocida: cada columna extra requiere que haya algo seleccionado en
 * la anterior. Acá eso es estructural, porque las columnas salen del path.
 */
import type { LocationQuery, RouteLocationRaw } from 'vue-router'
import type { AnyRecord, LinkRef, Org, TechRef } from '~/lib/api'
import { fieldMeta, fieldsFor, type CollectionKey, type FieldMeta } from '~/lib/fieldMeta'
import { isDoc, isRoot, routeFor, type Path } from '~/lib/path'
import { filtersFor, listEndpoint, listFilters, type Answer, type useApi } from '~/composables/useApi'

type Api = ReturnType<typeof useApi>

export interface Item {
  key: string
  label: string
  /** El dato dominante de la colección, alineado a la derecha. */
  meta: string
  kids: boolean
  to?: RouteLocationRaw
  href?: string
}

export interface Facet {
  key: string
  value: string
  remove: RouteLocationRaw
}

export interface Column {
  /** Nivel del path que esta columna elige. */
  level: number
  /** Encabezado: `db` en la raíz; después, el nombre de lo elegido en la columna anterior. */
  head: string
  count: number
  items: Item[]
  selected: string | null
  facets: Facet[]
}

/** Un valor que lleva a algún lado: record, filtro o URL externa. */
export interface Link {
  label: string
  meta?: string
  to?: RouteLocationRaw
  href?: string
  /** Es un filtro válido de la colección: tocarlo faceta la tabla. */
  facet?: RouteLocationRaw
}

export interface Cell {
  value: string | null
  /** Relación: link al record. */
  to?: RouteLocationRaw
  /** URL externa. */
  href?: string
  /** Valor que es un filtro válido: facetar es tocar el valor. */
  facet?: RouteLocationRaw
  /** Relación de lista: cada item con su propio link. */
  items?: Link[]
}

export interface Row extends Cell {
  name: string
  type: string
  wide?: boolean
}

export interface Detail {
  kind: 'root' | 'record' | 'document'
  name: string
  type: string
  updated: string | null
  rows: Row[]
}

/** La colección como tabla: una columna por campo declarado en `fieldMeta[...].list`. */
export interface Table {
  collection: CollectionKey
  model: string
  count: number
  head: { name: string, type: string }[]
  rows: { key: string, to: RouteLocationRaw, cells: Cell[] }[]
  facets: Facet[]
  /** Por qué campos se puede filtrar: la query que el visitante puede correr. */
  filters: readonly string[]
}

export interface Explorer {
  columns: Column[]
  table: Table | null
  detail: Detail | null
  request: { line: string, status: number, ms: number, count: number }
}

const modelName: Record<CollectionKey, string> = {
  projects: 'Project',
  experience: 'Experience',
  stack: 'Tech',
  orgs: 'Org',
}

export const pad = (n: number) => String(n).padStart(2, '0')

const notFound = (msg = 'no existe') => createError({ statusCode: 404, statusMessage: msg })

const field = (record: object, name: string): unknown => (record as Record<string, unknown>)[name]

function nameOf(collection: CollectionKey, record: AnyRecord): string {
  return String(field(record, fieldMeta[collection].nameField) ?? record.slug)
}

const year = (iso: unknown) => String(iso).slice(0, 4)

/** El dato corto junto al nombre: la dimensión dominante de cada colección. */
function metaOf(collection: CollectionKey, record: object): string {
  switch (collection) {
    case 'projects': return String(field(record, 'year'))
    case 'experience': {
      const to = field(record, 'endedAt')
      return `${year(field(record, 'startedAt'))}–${to ? year(to) : ''}`
    }
    case 'stack': return String(field(record, 'since'))
    case 'orgs': return String(field(record, 'city') ?? '')
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

const host = (url: string) => { try { return new URL(url).host } catch { return url } }

/** Cuántos items tiene una relación de lista, venga inline o como `_count`. */
function countOf(record: AnyRecord, name: string): number {
  const value = field(record, name)
  if (Array.isArray(value)) return value.length
  return Number((field(record, '_count') as Record<string, number> | undefined)?.[name] ?? 0)
}

/** A qué colección lleva una relación de lista, y con qué filtro se obtiene la misma lista. */
function inverse(collection: CollectionKey, name: string): { target: CollectionKey, filter: string } | null {
  if (collection === 'stack' && name === 'projects') return { target: 'projects', filter: 'stack' }
  if (collection === 'stack' && name === 'experiences') return { target: 'experience', filter: 'stack' }
  if (collection === 'orgs' && name === 'projects') return { target: 'projects', filter: 'org' }
  if (collection === 'orgs' && name === 'experiences') return { target: 'experience', filter: 'org' }
  return null
}

const canFilter = (collection: CollectionKey, key: string) => (listFilters[collection] as readonly string[]).includes(key)

/**
 * Un valor como celda. En la tabla las relaciones se vuelven filtros de la misma
 * colección (tocar "Vue 3" en projects es preguntar qué se hizo con Vue); en la
 * hoja son links al record relacionado. `extra` trae las listas inversas ya pedidas.
 */
function cellFor(
  collection: CollectionKey,
  record: AnyRecord,
  name: string,
  where: 'table' | 'sheet',
  extra: Record<string, AnyRecord[]> = {},
): Cell {
  const meta = fieldMeta[collection].fields[name]
  if (!meta) throw new Error(`${collection}.${name} no está en fieldMeta`)
  const value = field(record, name)
  const cell: Cell = { value: fmt(meta, value) }

  if (name === fieldMeta[collection].nameField && where === 'table') {
    cell.to = routeFor('datos', [collection, record.slug])
  }
  else if (meta.type.startsWith('relation[]')) {
    const inv = inverse(collection, name)
    if (name === 'techs') {
      const techs = (field(record, 'techs') as TechRef[] | undefined) ?? []
      cell.value = techs.length ? null : '—'
      cell.items = techs.map(t => where === 'table' && canFilter(collection, 'stack')
        ? { label: t.name, facet: routeFor('datos', [collection], { stack: t.slug }) }
        : { label: t.name, to: routeFor('datos', ['stack', t.slug]) })
    }
    else if (name === 'links') {
      const links = (field(record, 'links') as LinkRef[] | undefined) ?? []
      cell.value = links.length ? null : '—'
      cell.items = links.map(l => ({ label: l.label, meta: host(l.url), href: l.url }))
    }
    else if (inv) {
      const list = extra[name] ?? (field(record, name) as AnyRecord[] | undefined)
      const count = list ? list.length : countOf(record, name)
      cell.value = `${pad(count)} ${count === 1 ? 'record' : 'records'}`
      if (count && canFilter(inv.target, inv.filter)) cell.to = routeFor('datos', [inv.target], { [inv.filter]: record.slug })
      if (where === 'sheet' && list?.length) {
        cell.value = null
        cell.items = list.map(r => ({ label: nameOf(inv.target, r), meta: metaOf(inv.target, r), to: routeFor('datos', [inv.target, r.slug]) }))
      }
    }
  }
  else if (meta.type.startsWith('relation')) {
    const ref = value as { slug?: string, name?: string } | null
    cell.value = ref?.name ?? null
    if (ref?.slug) {
      if (where === 'table' && canFilter(collection, name)) cell.facet = routeFor('datos', [collection], { [name]: ref.slug })
      else cell.to = routeFor('datos', [meta.type.endsWith('Org') ? 'orgs' : collection, ref.slug])
    }
  }
  else if (meta.type === 'url' && typeof value === 'string') {
    cell.href = value
    if (where === 'table') cell.value = host(value)
  }
  else if (value !== null && value !== undefined && canFilter(collection, name)) {
    // year, role, featured, category: filtros del endpoint. Tocar el valor faceta la colección.
    cell.facet = routeFor('datos', [collection], { [name]: String(value) })
  }
  return cell
}

/** Un campo de documento como fila: las urls y los mails se vuelven links. */
function docRow(f: { name: string, type: string, value: string, wide?: boolean }): Row {
  const row: Row = { name: f.name, type: f.type, value: f.value, wide: f.wide }
  if (f.type === 'url') row.href = f.value
  else if (/^[^\s@]+@[^\s@]+$/.test(f.value)) row.href = `mailto:${f.value}`
  return row
}

function facetsOf(collection: CollectionKey, query: LocationQuery): Facet[] {
  const active = filtersFor(collection, query)
  return Object.entries(active).map(([key, value]) => {
    const rest = Object.fromEntries(Object.entries(active).filter(([k]) => k !== key))
    return { key, value, remove: routeFor('datos', [collection], rest) }
  })
}

export async function resolveExplorer(api: Api, path: Path, query: LocationQuery): Promise<Explorer> {
  const [root, slug, sub] = path
  const columns: Column[] = []
  let table: Table | null = null
  let detail: Detail | null = null
  let last: Answer<unknown>

  // Columna 0: el schema.
  const schema = await api.schema()
  last = schema
  columns.push({
    level: 0,
    head: 'db',
    count: schema.meta.count,
    selected: root ?? null,
    facets: [],
    items: schema.data.map(e => ({
      key: e.key,
      label: e.label,
      meta: `${pad(e.count)} ${e.kind === 'collection' ? 'records' : 'fields'}`,
      kids: true,
      to: routeFor('datos', [e.key]),
    })),
  })

  if (!root) {
    // La raíz es la ficha de la persona, no la base: quien entra por /datos ve a Mateo
    // como registro y, al lado, las tablas. El motor y el request van al pie.
    const [about, contact] = await Promise.all([api.doc('about'), api.doc('contact')])
    const pick = (doc: typeof about, names: string[]): Row[] => names
      .map(n => doc.data.fields.find(f => f.name === n && (!f.worlds || f.worlds.includes('datos'))))
      .filter((f): f is NonNullable<typeof f> => !!f)
      .map(f => docRow(f))
    const name = about.data.fields.find(f => f.name === 'name')?.value ?? about.data.title
    detail = {
      kind: 'root',
      name,
      type: 'record · about + contact',
      updated: about.data.updatedAt.slice(0, 10),
      rows: [
        ...pick(about, ['role', 'from', 'available', 'availability', 'languages', 'freelance_since']),
        ...pick(contact, contact.data.fields.map(f => f.name)),
      ],
    }
    return done()
  }
  if (!isRoot(root)) throw notFound()
  if (sub) throw notFound('no hay nada debajo de un record')

  // Documento: es una hoja. Sus campos van directo al detalle.
  if (isDoc(root)) {
    if (slug) throw notFound()
    const answer = await api.doc(root)
    last = answer
    detail = {
      kind: 'document',
      name: answer.data.title,
      type: `document · ${root}`,
      updated: answer.data.updatedAt.slice(0, 10),
      rows: answer.data.fields
        .filter(f => !f.worlds || f.worlds.includes('datos'))
        .map(f => docRow(f)),
    }
    return done()
  }

  const collection = root
  const meta = fieldMeta[collection]

  // Columna 1: los records de la colección (o la org alcanzada por relación).
  let record: AnyRecord | null = null
  if (listEndpoint[collection]) {
    const answer = await api.list(collection, query)
    last = answer
    const records = answer.data as AnyRecord[]
    columns.push({
      level: 1,
      head: collection,
      count: answer.meta.count,
      selected: slug ?? null,
      facets: facetsOf(collection, query),
      items: records.map(r => ({
        key: r.slug,
        label: nameOf(collection, r),
        meta: metaOf(collection, r),
        kids: true,
        to: routeFor('datos', [collection, r.slug], query),
      })),
    })
    if (!slug) {
      // La colección es una tabla: una fila por record, una columna por campo de lista.
      table = {
        collection,
        model: modelName[collection],
        count: answer.meta.count,
        head: meta.list.map(name => ({ name, type: meta.fields[name]!.type })),
        rows: records.map(r => ({
          key: r.slug,
          to: routeFor('datos', [collection, r.slug], query),
          cells: meta.list.map(name => cellFor(collection, r, name, 'table')),
        })),
        facets: facetsOf(collection, query),
        filters: listFilters[collection],
      }
      return done()
    }
    // projects tiene detalle propio (media, steps); el resto ya vino completo en la lista.
    if (collection === 'projects') {
      const one = await api.record(collection, slug)
      last = one
      record = one.data
    }
    else {
      record = records.find(r => r.slug === slug) ?? null
      if (!record) throw notFound()
    }
  }
  else {
    if (!slug) throw notFound(`${collection} no tiene lista: se llega desde un record`)
    const one = await api.record(collection, slug)
    last = one
    record = one.data
    columns.push({
      level: 1,
      head: collection,
      count: 1,
      selected: slug,
      facets: [],
      items: [{ key: slug, label: nameOf(collection, record), meta: metaOf(collection, record), kids: true, to: routeFor('datos', [collection, slug]) }],
    })
  }

  // Las relaciones inversas de una tech son literalmente un filtro de la otra
  // colección: el mismo request que /datos/projects?stack=<slug>. Se piden acá
  // para que la hoja las liste con nombre, no como un conteo.
  const extra: Record<string, AnyRecord[]> = {}
  if (collection === 'stack') {
    const [projects, experiences] = await Promise.all([
      api.list('projects', { stack: record.slug }),
      api.list('experience', { stack: record.slug }),
    ])
    extra.projects = projects.data as AnyRecord[]
    extra.experiences = experiences.data as AnyRecord[]
  }
  if (collection === 'orgs') {
    const org = record as Org
    extra.projects = org.projects as unknown as AnyRecord[]
    extra.experiences = org.experiences as unknown as AnyRecord[]
  }

  // La hoja del record. El nombre es el título de la hoja, no una fila más.
  detail = {
    kind: 'record',
    name: nameOf(collection, record),
    type: `record · ${modelName[collection]}`,
    updated: 'updatedAt' in record ? String(record.updatedAt).slice(0, 10) : null,
    rows: fieldsFor(collection, 'datos')
      .filter(name => name !== meta.nameField)
      .map(name => ({ name, type: meta.fields[name]!.type, wide: meta.fields[name]!.wide, ...cellFor(collection, record!, name, 'sheet', extra) })),
  }
  return done()

  function done(): Explorer {
    return {
      columns,
      table,
      detail,
      request: { line: last.request, status: last.status, ms: last.ms, count: last.meta.count },
    }
  }
}
