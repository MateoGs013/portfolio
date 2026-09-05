/**
 * El explorador de DATOS. Dado un path devuelve las columnas que hay que
 * dibujar, la hoja de detalle del record alcanzado y el request que lo
 * produjo. Un solo resolutor para todas las colecciones: una base de datos
 * trata a todos los records igual.
 *
 *   []                       columna 0: el schema
 *   [about]                  + detalle del documento (hoja)
 *   [projects]               + columna 1: records, con las facetas de la query
 *   [projects, la-rucula]    + columna 2: relaciones del record · detalle del record
 *   [projects, x, techs]     + columna 3: los items de esa relación
 *   [orgs, pegasuz]          orgs no está en el schema: la columna 1 es la org alcanzada
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

export interface Row {
  name: string
  type: string
  value: string | null
  wide?: boolean
  /** Relación: link al record o a la subvista. */
  to?: RouteLocationRaw
  /** URL externa. */
  href?: string
  /** Valor que es un filtro válido: facetar es tocar el valor. */
  facet?: RouteLocationRaw
}

export interface Detail {
  kind: 'root' | 'record' | 'document'
  name: string
  type: string
  updated: string | null
  rows: Row[]
  /** Bloques adicionales con su propio encabezado (la raíz lista las tablas). */
  groups?: { head: string, rows: Row[] }[]
}

export interface Explorer {
  columns: Column[]
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

/** Las relaciones de lista de un record, en el orden de fieldMeta, con cuántos items tiene cada una. */
function relationLists(collection: CollectionKey, record: AnyRecord): { name: string, count: number }[] {
  return Object.entries(fieldMeta[collection].fields)
    .filter(([, meta]) => meta.worlds.includes('datos') && meta.type.startsWith('relation[]'))
    .map(([name]) => {
      const value = field(record, name)
      const count = Array.isArray(value)
        ? value.length
        : Number((field(record, '_count') as Record<string, number> | undefined)?.[name] ?? 0)
      return { name, count }
    })
}

function rowFor(collection: CollectionKey, record: AnyRecord, name: string, query: LocationQuery): Row {
  const meta = fieldMeta[collection].fields[name]
  if (!meta) throw new Error(`${collection}.${name} no está en fieldMeta`)
  const value = field(record, name)
  const row: Row = { name, type: meta.type, value: fmt(meta, value), wide: meta.wide }

  if (meta.type.startsWith('relation[]')) {
    const count = relationLists(collection, record).find(r => r.name === name)?.count ?? 0
    row.value = `${pad(count)} items`
    if (count > 0) row.to = routeFor('datos', [collection, record.slug, name], query)
  }
  else if (meta.type.startsWith('relation')) {
    const ref = value as { slug?: string, name?: string } | null
    row.value = ref?.name ?? null
    if (ref?.slug) row.to = routeFor('datos', [meta.type.endsWith('Org') ? 'orgs' : collection, ref.slug])
  }
  else if (meta.type === 'url' && typeof value === 'string') {
    row.href = value
  }
  else if (value !== null && value !== undefined && (listFilters[collection] as readonly string[]).includes(name)) {
    // year, role, featured, category: filtros del endpoint. Tocar el valor faceta la colección.
    row.facet = routeFor('datos', [collection], { [name]: String(value) })
  }
  return row
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
    // como registro y, debajo, las tablas. El motor y el request van al pie.
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
      groups: [{
        head: 'tables',
        rows: schema.data.map(e => ({
          name: e.key,
          type: e.kind === 'collection' ? `collection · ${modelName[e.key as CollectionKey] ?? e.key}` : 'document',
          value: `${pad(e.count)} ${e.kind === 'collection' ? 'records' : 'fields'}`,
          to: routeFor('datos', [e.key]),
        })),
      }],
    }
    return done()
  }
  if (!isRoot(root)) throw notFound()

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
    if (slug) {
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
  }
  else {
    if (!slug) throw notFound(`${collection} no tiene lista: se llega por relación`)
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

  if (!record || !slug) {
    // La hoja de una colección es su definición: la tabla, tal como la ve este mundo.
    const meta = fieldMeta[collection]
    const filters = listFilters[collection]
    detail = {
      kind: 'document',
      name: collection,
      type: `collection · ${modelName[collection]}`,
      updated: null,
      rows: [
        { name: 'records', type: 'int', value: String(columns[1]?.count ?? 0) },
        { name: 'nameField', type: 'string', value: meta.nameField },
        { name: 'filters', type: 'string[]', value: filters.length ? filters.join(' · ') : null },
        { name: 'fields', type: 'int', value: String(fieldsFor(collection, 'datos').length) },
        {
          name: 'schema',
          type: 'text',
          wide: true,
          value: fieldsFor(collection, 'datos').map(f => `${f}: ${meta.fields[f]!.type}`).join('  ·  '),
        },
      ],
    }
    return done()
  }

  // Detalle: la hoja del record.
  detail = {
    kind: 'record',
    name: nameOf(collection, record),
    type: `record · ${modelName[collection]}`,
    updated: 'updatedAt' in record ? String(record.updatedAt).slice(0, 10) : null,
    rows: fieldsFor(collection, 'datos').map(name => rowFor(collection, record!, name, query)),
  }

  // Columna 2: las relaciones del record que tienen algo adentro.
  const relations = relationLists(collection, record).filter(r => r.count > 0)
  columns.push({
    level: 2,
    head: detail.name,
    count: relations.length,
    selected: sub ?? null,
    facets: [],
    items: relations.map(r => ({
      key: r.name,
      label: r.name,
      meta: `${pad(r.count)} items`,
      kids: true,
      to: routeFor('datos', [collection, slug, r.name], query),
    })),
  })

  if (!sub) return done()
  if (!relations.some(r => r.name === sub)) throw notFound()

  // Columna 3: los items de la relación elegida.
  columns.push({ level: 3, head: sub, count: 0, selected: null, facets: [], items: await subItems(api, collection, record, sub) })
  columns[3]!.count = columns[3]!.items.length
  return done()

  function done(): Explorer {
    return {
      columns,
      detail,
      request: { line: last.request, status: last.status, ms: last.ms, count: last.meta.count },
    }
  }
}

async function subItems(api: Api, collection: CollectionKey, record: AnyRecord, sub: string): Promise<Item[]> {
  if (sub === 'techs') {
    return (field(record, 'techs') as TechRef[]).map(t => ({
      key: t.slug, label: t.name, meta: 'Tech', kids: true, to: routeFor('datos', ['stack', t.slug]),
    }))
  }
  if (sub === 'links') {
    return (field(record, 'links') as LinkRef[]).map(l => ({
      key: l.url, label: l.label, meta: new URL(l.url).host, kids: false, href: l.url,
    }))
  }
  if (collection === 'orgs') {
    const org = record as Org
    if (sub === 'projects') return org.projects.map(p => ({ key: p.slug, label: p.title, meta: String(p.year), kids: true, to: routeFor('datos', ['projects', p.slug]) }))
    if (sub === 'experiences') return org.experiences.map(e => ({ key: e.slug, label: e.role, meta: `${year(e.startedAt)}–${e.endedAt ? year(e.endedAt) : ''}`, kids: true, to: routeFor('datos', ['experience', e.slug]) }))
  }
  if (collection === 'stack' && (sub === 'projects' || sub === 'experiences')) {
    // Las relaciones inversas de una tech son literalmente un filtro de la otra colección:
    // el mismo request que /datos/projects?stack=<slug>.
    const target: CollectionKey = sub === 'projects' ? 'projects' : 'experience'
    const answer = await api.list(target, { stack: record.slug })
    return (answer.data as AnyRecord[]).map(r => ({
      key: r.slug, label: nameOf(target, r), meta: metaOf(target, r), kids: true, to: routeFor('datos', [target, r.slug], { stack: record.slug }),
    }))
  }
  throw notFound()
}
