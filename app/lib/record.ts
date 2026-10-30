/**
 * Un registro de la API como filas tipadas (vista registro, tecla R; docs/diseno.md §2.1 y §4). Cada
 * campo es una celda: su valor ya escrito, su destino si es una relación y su forma (string con
 * comillas, cifra, enum, lista, miniaturas). Las relaciones llevan al caso o a /projects facetado,
 * nunca a páginas de colección que no existen. Lo usan RecordField, RecordValue y RecordTable.
 */
import type { RouteLocationRaw } from 'vue-router'
import { fieldMeta, relationMeta, type CollectionKey, type DocKey, type FieldMeta, type FieldType } from './fieldMeta'

/** Todo lo que se puede leer como registro: colecciones, documentos y los registros de una obra. */
export type RecordCollection = CollectionKey | DocKey | keyof typeof relationMeta

/** Cómo se dibuja el valor: define las comillas, la familia y la forma (§4: `.fv.q`, `.fv-list`). */
export type CellKind = 'string' | 'text' | 'number' | 'enum' | 'relation' | 'list' | 'media'

/** Un item de una relación de lista: cada uno con su propio destino. */
export interface CellLink {
  label: string
  meta?: string
  to?: RouteLocationRaw
  href?: string
  /** El rótulo quedó en español al pedir inglés (`lang="es"`). */
  untranslated?: boolean
}

/** Una imagen o un video de la obra como miniatura (los videos muestran su póster). */
export interface CellMedia {
  src: string | null
  alt: string
  width: number
  height: number
  /** `IMAGE · /media/projects/… · 1440×900 · 312 KB · tint #…` */
  meta: string
  untranslated?: boolean
}

export interface Cell {
  kind: CellKind
  /** El valor ya escrito; null es `NULL` en registro y no se ve en diseño. */
  value: string | null
  /** Relación: link al registro relacionado. */
  to?: RouteLocationRaw
  /** URL externa segura. */
  href?: string
  /** Valor que es un filtro válido de /projects: facetar es tocar el valor. */
  facet?: RouteLocationRaw
  /** Relación de lista o campo `list`. */
  items?: CellLink[]
  /** Relación con Media. */
  media?: CellMedia[]
}

export interface Row extends Cell {
  name: string
  type: FieldType
  wide?: boolean
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/** La URL solo si usa http, https o mailto. */
export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  try {
    return ALLOWED_PROTOCOLS.has(new URL(trimmed).protocol) ? trimmed : undefined
  }
  catch {
    return undefined
  }
}

/** Un valor escalar según el tipo declarado en fieldMeta. */
export function fmt(type: FieldType, value: unknown): string | null {
  if (value === null || value === undefined) return null
  // Un string vacío (o solo espacios) es un campo sin valor: NULL en registro, nada en diseño.
  if (typeof value === 'string' && !value.trim()) return null
  if (Array.isArray(value)) return value.length ? value.map(String).join(' · ') : null
  switch (type) {
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

/**
 * Tipos de los campos de los documentos que no son `string`. Es el esquema de `server/src/seed/docs.ts`
 * (la API manda el tipo en Doc.fields, pero useDoc entrega solo los valores).
 */
const docFieldTypes: Record<DocKey, Record<string, FieldType>> = {
  about: { languages: 'list', engineering_philosophy: 'text', professional_goal: 'text' },
  contact: { email: 'email', github: 'url', linkedin: 'url', website: 'url' },
}

const isDoc = (collection: RecordCollection): collection is DocKey => collection === 'about' || collection === 'contact'
const isRelationRecord = (collection: RecordCollection): collection is keyof typeof relationMeta => collection in relationMeta

/** El modelo de Prisma de cada colección, para el encabezado de la tabla (`colección Project`). */
export const modelName: Record<CollectionKey, string> = {
  projects: 'Project', experience: 'Experience', stack: 'Tech', articles: 'Article', orgs: 'Org',
}

/** Tipo de un campo que no declara fieldMeta, deducido de su valor. */
function inferType(value: unknown): FieldType {
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'decimal'
  if (typeof value === 'boolean') return 'bool'
  if (Array.isArray(value)) return 'list'
  return 'string'
}

/** La entrada de fieldMeta de un campo; el campo nombre (`title`, `name`) es un string. */
export function metaFor(collection: RecordCollection, name: string, value?: unknown): FieldMeta {
  if (isDoc(collection)) {
    const type = docFieldTypes[collection][name] ?? inferType(value)
    return { type, wide: type === 'text' }
  }
  const fields: Record<string, FieldMeta> = isRelationRecord(collection) ? relationMeta[collection].fields : fieldMeta[collection].fields
  return fields[name] ?? { type: inferType(value) }
}

/** El tipo como se lee en `.ft`: `relation → Tech[]`, `relation → Org?`, `text?`. */
export function typeLabel(meta: FieldMeta): string {
  const many = meta.type.match(/^relation\[\] → (.+)$/)
  const type = many ? `relation → ${many[1]}[]` : meta.type
  return meta.nullable ? `${type}?` : type
}

/** Forma del valor según su tipo. */
export function cellKind(type: FieldType): CellKind {
  if (type === 'string' || type === 'url' || type === 'email') return 'string'
  if (type === 'text' || type === 'json') return 'text'
  if (type === 'list') return 'list'
  if (type.startsWith('enum') || type === 'bool') return 'enum'
  if (type.startsWith('relation')) return 'relation'
  return 'number'
}

const host = (url: string) => {
  try { return new URL(url).host }
  catch { return url }
}

/** Filtros de /projects que un valor escalar de una obra puede facetar. */
const projectFacets = new Set(['status', 'year', 'featured'])

type Ref = {
  slug?: string, name?: string, title?: string, role?: string, label?: string, url?: string, key?: string
  value?: number | null, items?: string[], unit?: string | null, untranslated?: readonly string[]
}

const isUntranslated = (ref: Ref, field: string) => ref.untranslated?.includes(field) || undefined

/** Una métrica tal como está guardada: el número con su unidad cruda o su lista. */
function rawMetric(ref: Ref): string | undefined {
  if (ref.value !== null && ref.value !== undefined) return ref.unit ? `${ref.value} ${ref.unit}` : String(ref.value)
  return ref.items?.length ? ref.items.join(' · ') : undefined
}

function listItems(name: string, refs: Ref[]): CellLink[] {
  return refs.map((ref) => {
    if (name === 'techs') return { label: ref.name ?? '', to: { path: '/projects', query: { stack: ref.slug } } }
    if (name === 'links') return { label: ref.label ?? '', meta: ref.url ? host(ref.url) : undefined, href: safeHref(ref.url), untranslated: isUntranslated(ref, 'label') }
    if (name === 'projects') return { label: ref.title ?? '', to: `/projects/${ref.slug}` }
    if (name === 'experiences') return { label: ref.role ?? '', to: { path: '/about', hash: '#trayectoria' }, untranslated: isUntranslated(ref, 'role') }
    if (name === 'steps') return { label: ref.title ?? '', untranslated: isUntranslated(ref, 'title') }
    if (name === 'metrics') return { label: ref.key ?? '', meta: rawMetric(ref) }
    return { label: ref.title ?? ref.name ?? ref.label ?? ref.slug ?? '' }
  })
}

type MediaRef = {
  kind: string, src: string, poster?: string | null, alt: string, width: number, height: number
  bytes?: number | null, tint?: string | null, untranslated?: readonly string[]
}

function mediaItems(refs: MediaRef[]): CellMedia[] {
  return refs.map((m) => {
    const parts = [m.kind, m.src, `${m.width}×${m.height}`]
    if (m.bytes) parts.push(`${Math.round(m.bytes / 1024)} KB`)
    if (m.tint) parts.push(`tint ${m.tint}`)
    const src = m.kind === 'VIDEO' ? (m.poster ?? null) : m.src
    return { src, alt: m.alt, width: m.width, height: m.height, meta: parts.join(' · '), untranslated: m.untranslated?.includes('alt') || undefined }
  })
}

/**
 * Un campo como celda. `meta` es la entrada de fieldMeta. Con `collection` 'projects', estado, año y
 * destacada facetan /projects. Una lista vacía queda NULL.
 */
export function cellFor(record: Record<string, unknown>, name: string, meta: FieldMeta, collection?: RecordCollection): Cell {
  const value = record[name]
  const kind = cellKind(meta.type)
  if (meta.type.startsWith('relation[]')) {
    const refs = Array.isArray(value) ? value : []
    if (name === 'media') return { kind: 'media', value: null, media: mediaItems(refs as MediaRef[]) }
    return { kind, value: null, items: listItems(name, refs as Ref[]) }
  }
  if (meta.type.startsWith('relation')) {
    const ref = value as Ref | null | undefined
    const cell: Cell = { kind, value: ref?.title ?? ref?.name ?? null }
    if (ref?.slug) cell.to = meta.type.includes('Org') ? { path: '/projects', query: { org: ref.slug } } : `/projects/${ref.slug}`
    return cell
  }
  if (meta.type === 'list') {
    const items = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []
    return { kind, value: null, items: items.map(item => ({ label: String(item) })) }
  }
  const cell: Cell = { kind, value: fmt(meta.type, value) }
  if ((meta.type === 'url' || meta.type === 'email') && typeof value === 'string') {
    cell.href = safeHref(meta.type === 'email' ? `mailto:${value}` : value)
  }
  else if (cell.value !== null && collection === 'projects' && projectFacets.has(name)) {
    cell.facet = { path: '/projects', query: { [name]: cell.value.toLowerCase() } }
  }
  return cell
}

/** Sin valor: `NULL` en registro, nada en diseño. */
export function isEmptyCell(cell: Cell): boolean {
  if (cell.media) return cell.media.length === 0
  if (cell.items) return cell.items.length === 0
  return cell.value === null
}

/** Las filas de un registro en el orden de lectura de su fieldMeta. */
export function rowsFor(record: Record<string, unknown>, fields: Record<string, FieldMeta>, collection?: RecordCollection): Row[] {
  return Object.entries(fields)
    .filter(([name]) => name in record)
    .map(([name, meta]) => ({ name, type: meta.type, wide: meta.wide, ...cellFor(record, name, meta, collection) }))
}

/** Adónde lleva un registro de una colección: el caso, el artículo o /projects facetado. */
export function recordRoute(collection: CollectionKey, record: { slug?: unknown }): RouteLocationRaw | undefined {
  if (typeof record.slug !== 'string' || !record.slug) return undefined
  const slug = record.slug
  switch (collection) {
    case 'projects': return `/projects/${slug}`
    case 'articles': return `/articles/${slug}`
    case 'experience': return { path: '/about', hash: '#trayectoria' }
    case 'stack': return { path: '/projects', query: { stack: slug } }
    case 'orgs': return { path: '/projects', query: { org: slug } }
  }
}

/** Columnas de cada colección como tabla: el nombre primero, después identificador, estado y fecha. */
export const tableColumns: Record<CollectionKey, string[]> = {
  projects: ['title', 'slug', 'status', 'year'],
  experience: ['role', 'slug', 'kind', 'startedAt'],
  stack: ['name', 'slug', 'category', 'since'],
  articles: ['title', 'slug', 'status', 'publishedAt'],
  orgs: ['name', 'slug', 'city'],
}

/**
 * Clases de las piezas del registro (§4). Fuera de registro no pesan: el nodo `.fv` conserva la
 * tipografía de su diseño y `record:` le da la lectura de tabla (gana a las utilidades sin variante).
 * Las líneas son un fondo de 1 px que crece con `--rs` (0 → 1), así el morph las traza.
 */
export const recordLine = 'bg-[linear-gradient(var(--rule),var(--rule))] bg-no-repeat bg-[length:calc(var(--rs,1)*100%)_1px]'

const quoteMarks = String.raw`q record:before:content-['\22'] record:after:content-['\22'] record:before:text-faint record:after:text-faint record:before:transition-opacity record:after:transition-opacity record:before:duration-450 record:after:duration-450 [.quotes-off_&]:before:opacity-0 [.quotes-off_&]:after:opacity-0`

/** Clase del nodo que viaja: `fv`, más `q` si es un string con comillas, y la familia de su tipo. */
export function valueClass(kind: CellKind, quoted = true): string {
  const mono = kind === 'number' || kind === 'enum'
  return [
    'fv record:m-0 record:max-w-focus record:font-body record:tracking-normal record:text-dim',
    mono ? 'record:font-mono record:text-xs record:tabular-nums' : 'record:text-s record:leading-[1.55]',
    quoted && kind === 'string' ? quoteMarks : '',
  ].join(' ').trim()
}
