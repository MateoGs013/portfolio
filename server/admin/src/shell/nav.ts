/**
 * La navegación del admin, una sola vez: de acá salen la columna (Nav.vue), el menú del celular, el
 * grupo «Ir a» de la paleta y las pestañas de Búsqueda laboral. Sin iconos ni numeración; el contador
 * aparece solo si hay pendientes.
 */
import type { AdminSummary } from '@shared/adminContracts'
import { computed, shallowReactive } from 'vue'
import { summary } from '../stores/meta'
import { shell } from './dict'

export type NavId = 'inicio' | 'obras' | 'trayectoria' | 'articulos' | 'perfil' | 'tecnologias' | 'empresas' | 'busqueda'

/** Una pantalla dentro de una sección: solo la paleta (y las pestañas de Búsqueda) las listan. */
export interface NavChild {
  label: string
  to: string
}

export interface NavLink {
  id: NavId
  label: string
  to: string
  /** Pendientes según /meta (lo mismo que lista la bandeja de Inicio). */
  pending?: (summary: AdminSummary) => number
  children?: readonly NavChild[]
}

/** Un grupo plegado (Catálogos): secundario, se abre solo si se está adentro. */
export interface NavGroup {
  group: 'catalogos'
  label: string
  items: readonly NavLink[]
}

export type NavEntry = NavLink | NavGroup

const n = shell.nav

export const SEARCH_TABS: readonly NavChild[] = [
  { label: n.jobs, to: '/busqueda/vacantes' },
  { label: n.posts, to: '/busqueda/publicaciones' },
  { label: n.trends, to: '/busqueda/tendencias' },
]

export const NAV: readonly NavEntry[] = [
  { id: 'inicio', label: n.home, to: '/inicio' },
  { id: 'obras', label: n.projects, to: '/obras', pending: s => s.projects.hidden },
  { id: 'trayectoria', label: n.experience, to: '/trayectoria', children: [{ label: n.cvView, to: '/trayectoria/cv' }] },
  { id: 'articulos', label: n.articles, to: '/articulos', pending: s => s.articles.draft },
  {
    id: 'perfil',
    label: n.profile,
    to: '/perfil/sobre-mi',
    children: [{ label: n.about, to: '/perfil/sobre-mi' }, { label: n.contact, to: '/perfil/contacto' }],
  },
  {
    group: 'catalogos',
    label: n.catalogs,
    items: [
      { id: 'tecnologias', label: n.stack, to: '/tecnologias' },
      { id: 'empresas', label: n.orgs, to: '/empresas' },
    ],
  },
  { id: 'busqueda', label: n.search, to: '/busqueda/vacantes', children: SEARCH_TABS },
]

export function isGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry
}

/** Todas las secciones en orden, sin los grupos. */
export const NAV_LINKS: readonly NavLink[] = NAV.flatMap(entry => (isGroup(entry) ? entry.items : [entry]))

/**
 * Pendientes que no salen de /meta (las vacantes nuevas compatibles, por ejemplo): el área que los
 * conoce los deja acá y la navegación los suma a los de /meta.
 */
export const extraPending = shallowReactive(new Map<NavId, number>())

export function setNavPending(id: NavId, count: number): void {
  if (count > 0) extraPending.set(id, count)
  else extraPending.delete(id)
}

/** Pendientes por sección; las que no tienen nada no figuran. */
export const navPending = computed<Partial<Record<NavId, number>>>(() => {
  const counts: Partial<Record<NavId, number>> = {}
  for (const link of NAV_LINKS) {
    const fromMeta = summary.value && link.pending ? link.pending(summary.value) : 0
    const total = fromMeta + (extraPending.get(link.id) ?? 0)
    if (total > 0) counts[link.id] = total
  }
  return counts
})
