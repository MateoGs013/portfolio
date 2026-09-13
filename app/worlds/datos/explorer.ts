/**
 * El explorador de DATOS (Portafolio Mateo Sonzogni).
 *
 * Dado un path resuelve el panel correspondiente:
 *   []                       carpeta: las tablas y documentos de la base
 *   [about]                  hoja: campos del documento de especificación
 *   [projects]               carpeta: los records, con facetas de filtrado
 *   [projects, la-rucula]    hoja: el record completo con dossier de ingeniería
 *   [orgs, pegasuz]          hoja de organización o cliente
 *
 * Es un explorador de alta precisión: las relaciones son hipervínculos bidireccionales,
 * los filtros son facetas interactivas y los registros exponen el dossier completo
 * (brief, outcome, pasos de proceso, capturas técnicas y métricas).
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
  /** El dato dominante, debajo del nombre: el conteo de una tabla, el año de un record. */
  meta: string
  /** Lo que se ve en el ícono: `06` en una carpeta, `2026` en un archivo. */
  badge: string
  /** Una tabla es una carpeta; un record o un documento es un archivo. */
  kind: 'folder' | 'file'
  to: RouteLocationRaw
  summary?: string
  cover?: string
  status?: string
  techs?: { name: string, slug: string }[]
  category?: string
  note?: string
  org?: string
  role?: string
  year?: number
  since?: number
  desc?: string
}

export interface Facet {
  key: string
  value: string
  remove: RouteLocationRaw
}

/** Una carpeta: la base (sus tablas y documentos) o una colección (sus records). */
export interface Folder {
  /** `db` en la raíz; el nombre de la colección adentro. */
  head: string
  /** La línea de tipo bajo el nombre: `database · 05 tables`, `collection · Project · 06 records`. */
  line: string[]
  count: number
  items: Item[]
  facets: Facet[]
}

/** Un record vecino en la lista de la colección: a dónde se pasa de lado. */
export interface Vecino {
  label: string
  to: RouteLocationRaw
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

export interface MediaItem {
  id: number
  kind: 'IMAGE' | 'VIDEO'
  role: 'COVER' | 'GALLERY' | 'LAYER'
  src: string
  alt: string
  width: number
  height: number
  bytes?: number | null
}

export interface StepItem {
  id?: number
  order: number
  title: string
  body: string
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
  /** Archivos multimedia / capturas técnicas del proyecto */
  media?: MediaItem[]
  /** Pasos del proceso de diseño e ingeniería */
  steps?: StepItem[]
  /** Métricas de rendimiento, accesibilidad o bundle */
  metrics?: Record<string, unknown> | null
}

export interface Row extends Cell {
  name: string
  label?: string
  type: string
  wide?: boolean
}

export interface Detail {
  kind: 'record' | 'document'
  name: string
  type: string
  updated: string | null
  rows: Row[]
  rawRecord?: unknown
}

export interface Explorer {
  /** Profundidad del path: 0 raíz, 1 colección o documento, 2 record. */
  level: number
  /** Lo que se ve es una carpeta o una hoja, nunca las dos. */
  folder: Folder | null
  detail: Detail | null
  /** A dónde se sube desde este nivel: null solo en la raíz. */
  up: RouteLocationRaw | null
  /** Records anterior y siguiente en la lista de la colección, si estamos en una hoja. */
  prev?: Vecino | null
  next?: Vecino | null
  /** El request que produjo este panel: la URL, el status, la latencia. */
  request: { line: string, status: number, ms: number, count: number }
}

export const pad = (n: number) => String(n).padStart(2, '0')

const notFound = (message = 'no encontrado') => createError({ statusCode: 404, statusMessage: message })

const modelName: Record<CollectionKey, string> = {
  projects: 'Project',
  experience: 'Experience',
  stack: 'Tech',
  orgs: 'Org',
}

const field = (record: AnyRecord, name: string): unknown => (record as unknown as Record<string, unknown>)[name]

const nameOf = (collection: CollectionKey, record: AnyRecord): string =>
  String(field(record, fieldMeta[collection].nameField) ?? record.slug)

/** El dato dominante de una fila según la colección. */
function metaOf(collection: CollectionKey, record: AnyRecord): string {
  if (collection === 'projects') return String(field(record, 'year') ?? '')
  if (collection === 'experience') {
    const s = String(field(record, 'startedAt') ?? '').slice(0, 4)
    const e = field(record, 'endedAt') ? String(field(record, 'endedAt')).slice(0, 4) : 'act'
    return `${s}–${e}`
  }
  if (collection === 'stack') return String(field(record, 'since') ?? '')
  if (collection === 'orgs') return String(field(record, 'city') ?? '')
  return ''
}

/** Formatea un valor según el tipo declarado en fieldMeta. */
function fmt(meta: FieldMeta, value: unknown): string | null {
  if (value === null || value === undefined) return null
  switch (meta.type) {
    case 'bool':
      return value ? 'true' : 'false'
    case 'date':
      return String(value).slice(0, 10)
    case 'datetime':
      return String(value).slice(0, 19).replace('T', ' ')
    case 'json':
      return JSON.stringify(value)
    default:
      return String(value)
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
 * Un valor de la hoja como celda. Las relaciones son links al record
 * relacionado; los valores que el endpoint acepta como filtro llevan a la
 * carpeta filtrada. `extra` trae las listas inversas ya pedidas.
 */
function cellFor(collection: CollectionKey, record: AnyRecord, name: string, extra: Record<string, AnyRecord[]> = {}): Cell {
  const meta = fieldMeta[collection].fields[name]
  if (!meta) throw new Error(`${collection}.${name} no está en fieldMeta`)
  const value = field(record, name)
  const cell: Cell = { value: fmt(meta, value) }

  if (name === 'media') {
    const mediaList = (field(record, 'media') as MediaItem[] | undefined) ?? []
    cell.value = mediaList.length ? `${pad(mediaList.length)} piezas` : null
    cell.media = mediaList
  }
  else if (name === 'steps') {
    const stepList = (field(record, 'steps') as StepItem[] | undefined) ?? []
    cell.value = stepList.length ? `${pad(stepList.length)} etapas` : null
    cell.steps = stepList
  }
  else if (name === 'metrics') {
    const m = field(record, 'metrics') as Record<string, unknown> | null
    cell.metrics = m
    cell.value = m ? JSON.stringify(m) : null
  }
  else if (meta.type.startsWith('relation[]')) {
    const inv = inverse(collection, name)
    if (name === 'techs') {
      const techs = (field(record, 'techs') as TechRef[] | undefined) ?? []
      cell.value = techs.length ? null : '—'
      cell.items = techs.map(t => ({ label: t.name, to: routeFor(['stack', t.slug]) }))
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
      if (count && canFilter(inv.target, inv.filter)) cell.to = routeFor([inv.target], { [inv.filter]: record.slug })
      if (list?.length) {
        cell.value = null
        cell.items = list.map(r => ({ label: nameOf(inv.target, r), meta: metaOf(inv.target, r), to: routeFor([inv.target, r.slug]) }))
      }
    }
  }
  else if (meta.type.startsWith('relation')) {
    const ref = value as { slug?: string, name?: string } | null
    cell.value = ref?.name ?? null
    if (ref?.slug) cell.to = routeFor([meta.type.endsWith('Org') ? 'orgs' : collection, ref.slug])
  }
  else if (meta.type === 'url' && typeof value === 'string') {
    cell.href = value
  }
  else if (value !== null && value !== undefined && canFilter(collection, name)) {
    cell.facet = routeFor([collection], { [name]: String(value) })
  }
  return cell
}

/** Un campo de documento como fila: las urls y los mails se vuelven links. */
function docRow(f: { name: string, type: string, value: string, wide?: boolean }): Row {
  const row: Row = { name: f.name, type: f.type, value: f.value, wide: f.wide }
  if (/^[^\s@]+@[^\s@]+$/.test(f.value)) row.href = `mailto:${f.value}`
  else if (f.type === 'url') row.href = f.value
  return row
}

function facetsOf(collection: CollectionKey, query: LocationQuery): Facet[] {
  const active = filtersFor(collection, query)
  return Object.entries(active).map(([key, value]) => {
    const { [key]: _removed, ...next } = query
    return { key, value: String(value), remove: routeFor([collection], next) }
  })
}

export async function resolveExplorer(api: Api, path: Path, query: LocationQuery): Promise<Explorer> {
  const [root, slug, sub] = path

  let folder: Folder | null = null
  let detail: Detail | null = null
  let up: RouteLocationRaw | null = null
  let prev: Vecino | null = null
  let next: Vecino | null = null
  let last: Answer<unknown>

  if (!root) {
    // La raíz es la base de datos completa: sus colecciones y documentos
    const schema = await api.schema()
    last = schema
    const rootInfo: Record<string, { label: string, desc: string }> = {
      projects: { label: 'proyectos', desc: '06 aplicaciones reales en producción' },
      experience: { label: 'experiencia', desc: '07 etapas: freelance, Da Vinci y CET 30' },
      stack: { label: 'stack', desc: '22 tecnologías con criterio técnico' },
      about: { label: 'sobre mí', desc: 'Perfil, formación técnica y visión' },
      contact: { label: 'contacto', desc: 'Email directo y disponibilidad inmediata' },
      orgs: { label: 'organizaciones', desc: '05 empresas e instituciones' },
    }
    folder = {
      head: 'db',
      line: ['database', `${pad(schema.meta.count)} tables`, 'PostgreSQL 17'],
      count: schema.meta.count,
      facets: [],
      items: schema.data.map(e => ({
        key: e.key,
        label: rootInfo[e.key]?.label ?? e.label,
        meta: rootInfo[e.key]?.desc ?? `${pad(e.count)} ${e.kind === 'collection' ? 'records' : 'fields'}`,
        desc: rootInfo[e.key]?.desc,
        badge: pad(e.count),
        kind: e.kind === 'collection' ? 'folder' : 'file',
        to: routeFor([e.key]),
      })),
    }
    return done()
  }
  if (!isRoot(root)) throw notFound()
  if (sub) throw notFound('no hay nada debajo de un record')
  up = routeFor([])

  // Documento: es una hoja directa
  if (isDoc(root)) {
    if (slug) throw notFound()
    const answer = await api.doc(root)
    last = answer
    detail = {
      kind: 'document',
      name: answer.data.title,
      type: `document · ${root}`,
      updated: answer.data.updatedAt.slice(0, 10),
      rawRecord: answer.data,
      rows: answer.data.fields.map(f => docRow(f)),
    }
    return done()
  }

  const collection = root
  const meta = fieldMeta[collection]

  let record: AnyRecord | null = null
  if (listEndpoint[collection]) {
    const answer = await api.list(collection, query)
    last = answer
    const records = answer.data as AnyRecord[]
    if (!slug) {
      // La colección es una carpeta
      folder = {
        head: collection,
        line: ['collection', modelName[collection], `${pad(answer.meta.count)} ${answer.meta.count === 1 ? 'record' : 'records'}`],
        count: answer.meta.count,
        facets: facetsOf(collection, query),
        items: records.map(r => {
          const item: Item = {
            key: r.slug,
            label: nameOf(collection, r),
            meta: metaOf(collection, r),
            badge: metaOf(collection, r).slice(0, 4),
            kind: 'file',
            to: routeFor([collection, r.slug], query),
          }
          if (collection === 'projects') {
            const p = r as unknown as Record<string, unknown>
            const mediaList = (p.media as MediaItem[] | undefined) ?? []
            const coverObj = mediaList.length ? mediaList[0] : null
            item.summary = typeof p.summary === 'string' ? p.summary : undefined
            item.cover = coverObj?.src
            item.status = typeof p.status === 'string' ? p.status : 'LIVE'
            item.year = typeof p.year === 'number' ? p.year : undefined
            item.role = typeof p.role === 'string' ? p.role : undefined
            item.org = p.org && typeof p.org === 'object' && 'name' in p.org ? String((p.org as { name?: unknown }).name) : undefined
            item.techs = Array.isArray(p.techs) ? (p.techs as TechRef[]).map(t => ({ name: t.name, slug: t.slug })) : []
          }
          else if (collection === 'stack') {
            const s = r as unknown as Record<string, unknown>
            item.category = typeof s.category === 'string' ? s.category : undefined
            item.since = typeof s.since === 'number' ? s.since : undefined
            item.note = typeof s.note === 'string' ? s.note : undefined
          }
          else if (collection === 'experience') {
            const e = r as unknown as Record<string, unknown>
            item.role = typeof e.role === 'string' ? e.role : undefined
            item.org = e.org && typeof e.org === 'object' && 'name' in e.org ? String((e.org as { name?: unknown }).name) : undefined
            item.summary = typeof e.summary === 'string' ? e.summary : undefined
            item.techs = Array.isArray(e.techs) ? (e.techs as TechRef[]).map(t => ({ name: t.name, slug: t.slug })) : []
          }
          return item
        }),
      }
      return done()
    }

    up = routeFor([collection], query)
    const at = records.findIndex(r => r.slug === slug)
    const vecino = (r?: AnyRecord): Vecino | null => r ? { label: nameOf(collection, r), to: routeFor([collection, r.slug], query) } : null
    prev = vecino(records[at - 1])
    next = vecino(records[at + 1])

    if (collection === 'projects') {
      const one = await api.record(collection, slug)
      last = one
      record = one.data
    }
    else {
      record = records[at] ?? null
      if (!record) throw notFound()
    }
  }
  else {
    if (!slug) throw notFound(`${collection} no tiene lista: se llega desde un record`)
    const one = await api.record(collection, slug)
    last = one
    record = one.data
  }

  // Relaciones inversas
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

  // Hoja del record
  detail = {
    kind: 'record',
    name: nameOf(collection, record),
    type: `record · ${modelName[collection]}`,
    updated: 'updatedAt' in record ? String(record.updatedAt).slice(0, 10) : null,
    rawRecord: record,
    rows: fieldsFor(collection)
      .filter(name => name !== meta.nameField)
      .map(name => ({
        name,
        label: meta.fields[name]?.label ?? name,
        type: meta.fields[name]!.type,
        wide: meta.fields[name]!.wide,
        ...cellFor(collection, record!, name, extra),
      })),
  }
  return done()

  function done(): Explorer {
    return {
      level: path.length,
      folder,
      detail,
      up,
      prev,
      next,
      request: { line: last.request, status: last.status, ms: last.ms, count: last.meta.count },
    }
  }
}
