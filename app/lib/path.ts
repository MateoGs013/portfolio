/**
 * La ruta es el estado y el estado es un request.
 * Portafolio Técnico Unificado Mateo Sonzogni.
 *
 *   /<colección>/<slug>?filtros
 *
 *   []                       -> / (directorio raíz / base de datos)
 *   ['projects']             -> /projects (colección de proyectos)
 *   ['projects', 'la-rucula']-> /projects/la-rucula (hoja del proyecto)
 *   ['about']                -> /about (documento de especificación)
 */
import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { CollectionKey, DocKey } from './fieldMeta'
import { collectionOrder, docOrder } from './fieldMeta'

/** Segmentos del path. `[]` es la raíz. */
export type Path = string[]

/** Lo que puede ir en el primer segmento. */
export type Root = CollectionKey | DocKey | 'orgs'
export const roots: readonly Root[] = [...collectionOrder, ...docOrder, 'orgs']

export function isRoot(value: unknown): value is Root {
  return typeof value === 'string' && (roots as readonly string[]).includes(value)
}

export function isDoc(root: Root): root is DocKey {
  return (docOrder as readonly string[]).includes(root as DocKey)
}

const PATH_ALIASES: Record<string, string> = {
  proyectos: 'projects',
  proyecto: 'projects',
  project: 'projects',
  experiencia: 'experience',
  experiencias: 'experience',
  experiences: 'experience',
  habilidades: 'stack',
  tecnologias: 'stack',
  tecnologia: 'stack',
  skills: 'stack',
  skill: 'stack',
  'sobre-mi': 'about',
  sobremi: 'about',
  'about-me': 'about',
  aboutme: 'about',
  acerca: 'about',
  cv: 'about',
  resume: 'about',
  curriculum: 'about',
  contacto: 'contact',
  organizaciones: 'orgs',
  organizacion: 'orgs',
  org: 'orgs',
  organization: 'orgs',
  organizations: 'orgs',
  blog: 'articles',
  articulos: 'articles',
  articulo: 'articles',
  article: 'articles',
  posts: 'articles',
  post: 'articles',
  lab: 'lab',
  library: 'lab',
  libreria: 'lab',
  componentes: 'lab',
  components: 'lab',
  showcase: 'lab',
}

/** Del param catch-all de Nuxt (`string | string[] | undefined`) al path limpio con soporte de alias. */
export function parsePath(param: unknown): Path {
  const raw = Array.isArray(param) ? param : typeof param === 'string' ? param.split('/') : []
  const segments = raw.map(s => String(s).trim()).filter(Boolean)
  if (segments.length > 0) {
    const root = segments[0]?.toLowerCase()
    if (root && PATH_ALIASES[root]) {
      segments[0] = PATH_ALIASES[root]!
    }
  }
  return segments
}

export function pathString(path: Path): string {
  return path.length ? `/${path.map(encodeURIComponent).join('/')}` : '/'
}

/**
 * Genera la ruta para un path y query opcional.
 * Soporta sobrecarga tanto para la firma directa `routeFor(path, query)`
 * como para compatibilidad `routeFor('datos', path, query)`.
 */
export function routeFor(pathOrWorld: string | Path, maybePathOrQuery?: Path | LocationQueryRaw, maybeQuery?: LocationQueryRaw): RouteLocationRaw {
  let path: Path
  let query: LocationQueryRaw | undefined

  if (typeof pathOrWorld === 'string') {
    path = Array.isArray(maybePathOrQuery) ? maybePathOrQuery : []
    query = maybeQuery
  }
  else {
    path = pathOrWorld
    query = maybePathOrQuery as LocationQueryRaw | undefined
  }

  return { path: pathString(path), query }
}

// Stubs de compatibilidad transitoria para evitar errores durante refactor
export type World = 'datos'
export const worlds = ['datos'] as const
export function isWorld(value: unknown): value is World { return value === 'datos' }
export function otherWorld(_world: World): World { return 'datos' }
export const worldLabel: Record<string, string> = { datos: 'datos' }
export function truncate(_world: World, path: Path): Path { return path }
export function acrossWorlds(_from: World, path: Path, query?: LocationQueryRaw): RouteLocationRaw {
  return routeFor(path, query)
}
