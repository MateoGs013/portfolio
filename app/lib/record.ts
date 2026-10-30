/**
 * Un registro de la API como filas tipadas (vista registro, tecla R). Viene del explorador anterior
 * (cellFor, fmt, safeHref y los tipos de celda), adaptado a las rutas nuevas: las relaciones llevan
 * al caso o a /projects facetado, nunca a páginas de colección que ya no existen. F5 lo completa.
 */
import type { RouteLocationRaw } from 'vue-router'
import type { FieldMeta, FieldType } from './fieldMeta'

/** Un item de una relación de lista: cada uno con su propio destino. */
export interface CellLink {
  label: string
  meta?: string
  to?: RouteLocationRaw
  href?: string
}

export interface Cell {
  /** El valor ya escrito; null es `NULL` en registro y no se ve en diseño. */
  value: string | null
  /** Relación: link al registro relacionado. */
  to?: RouteLocationRaw
  /** URL externa segura. */
  href?: string
  /** Valor que es un filtro válido de /projects: facetar es tocar el valor. */
  facet?: RouteLocationRaw
  /** Relación de lista. */
  items?: CellLink[]
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

const host = (url: string) => {
  try { return new URL(url).host }
  catch { return url }
}

/** Filtros de /projects que un valor escalar del caso puede facetar. */
const projectFacets = new Set(['status', 'year', 'featured'])

type Ref = { slug?: string, name?: string, title?: string, role?: string, label?: string, url?: string }

function listItems(name: string, refs: Ref[]): CellLink[] {
  return refs.map((ref) => {
    if (name === 'techs') return { label: ref.name ?? '', to: { path: '/projects', query: { stack: ref.slug } } }
    if (name === 'links') return { label: ref.label ?? '', meta: ref.url ? host(ref.url) : undefined, href: safeHref(ref.url) }
    if (name === 'projects') return { label: ref.title ?? '', to: `/projects/${ref.slug}` }
    if (name === 'experiences') return { label: ref.role ?? '', to: { path: '/about', hash: '#trayectoria' } }
    return { label: ref.title ?? ref.name ?? ref.label ?? ref.slug ?? '' }
  })
}

/**
 * Un campo de una obra como celda. `meta` es la entrada de fieldMeta; las relaciones de lista que
 * no se navegan (media, steps, metrics) solo cuentan cuántas hay: su detalle lo dibuja la página.
 */
export function cellFor(record: Record<string, unknown>, name: string, meta: FieldMeta): Cell {
  const value = record[name]
  if (meta.type.startsWith('relation[]')) {
    const refs = Array.isArray(value) ? value as Ref[] : []
    if (['media', 'steps', 'metrics'].includes(name)) return { value: refs.length ? String(refs.length) : null }
    // Con items la celda se dibuja como lista; sin ninguno queda NULL.
    return { value: null, items: listItems(name, refs) }
  }
  if (meta.type.startsWith('relation')) {
    const ref = value as Ref | null | undefined
    const cell: Cell = { value: ref?.title ?? ref?.name ?? null }
    if (ref?.slug) cell.to = meta.type.includes('Org') ? { path: '/projects', query: { org: ref.slug } } : `/projects/${ref.slug}`
    return cell
  }
  const cell: Cell = { value: fmt(meta.type, value) }
  if ((meta.type === 'url' || meta.type === 'email') && typeof value === 'string') {
    cell.href = safeHref(meta.type === 'email' ? `mailto:${value}` : value)
  }
  else if (cell.value !== null && projectFacets.has(name)) {
    cell.facet = { path: '/projects', query: { [name]: cell.value.toLowerCase() } }
  }
  return cell
}

/** Las filas de un registro en el orden de lectura de su fieldMeta. */
export function rowsFor(record: Record<string, unknown>, fields: Record<string, FieldMeta>): Row[] {
  return Object.entries(fields)
    .filter(([name]) => name in record)
    .map(([name, meta]) => ({ name, type: meta.type, wide: meta.wide, ...cellFor(record, name, meta) }))
}
