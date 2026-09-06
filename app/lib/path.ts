/**
 * La ruta es el estado y el estado es un request.
 *
 *   /<mundo>/<raíz>/<slug>?filtros
 *
 * `path = [raíz, slug]` es lo único que los dos mundos comparten como
 * posición. Al cambiar de mundo se conserva hasta donde el mundo destino la
 * entiende (`truncate`), y la query viaja intacta: DISEÑO no filtra, pero
 * tampoco olvida los filtros para que la vuelta a DATOS los encuentre.
 */
import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { CollectionKey, DocKey, World } from './fieldMeta'
import { collectionOrder, docOrder } from './fieldMeta'

export type { World }

export const worlds = ['datos', 'diseno'] as const

export function isWorld(value: unknown): value is World {
  return value === 'datos' || value === 'diseno'
}

export function otherWorld(world: World): World {
  return world === 'datos' ? 'diseno' : 'datos'
}

/** Cómo se escribe cada mundo cuando se lo nombra en pantalla. */
export const worldLabel: Record<World, string> = { datos: 'datos', diseno: 'diseño' }

/** Segmentos después del mundo. `[]` es la raíz. */
export type Path = string[]

/** Lo que puede ir en el primer segmento. `orgs` solo por relación y solo en DATOS. */
export type Root = CollectionKey | DocKey
export const roots: readonly Root[] = [...collectionOrder, ...docOrder, 'orgs']

export function isRoot(value: unknown): value is Root {
  return typeof value === 'string' && (roots as readonly string[]).includes(value)
}

export function isDoc(root: Root): root is DocKey {
  return (docOrder as readonly string[]).includes(root)
}

/**
 * Hasta qué profundidad llega cada mundo en cada raíz. Decide el truncado.
 * Los dos se detienen en el record: en DATOS las relaciones se leen en la
 * hoja y cada una es un link, no un nivel más. DISEÑO no tiene `orgs`:
 * saltar por relación es un gesto de DATOS. Los docs (`about`, `contact`)
 * son una hoja en los dos.
 */
export const depth: Record<World, Partial<Record<Root, number>>> = {
  datos: { projects: 2, experience: 2, stack: 2, orgs: 2, about: 1, contact: 1 },
  diseno: { projects: 2, experience: 2, stack: 2, about: 1, contact: 1 },
}

/** Del param catch-all de Nuxt (`string | string[] | undefined`) al path limpio. */
export function parsePath(param: unknown): Path {
  const raw = Array.isArray(param) ? param : typeof param === 'string' ? param.split('/') : []
  return raw.map(s => String(s).trim()).filter(Boolean)
}

/** Recorta el path a lo que `world` puede mostrar. Raíz desconocida → raíz. */
export function truncate(world: World, path: Path): Path {
  const root = path[0]
  if (!isRoot(root)) return []
  const max = depth[world][root]
  if (max === undefined) return []
  return path.slice(0, max)
}

export function pathString(world: World, path: Path): string {
  return `/${[world, ...path.map(encodeURIComponent)].join('/')}`
}

export function routeFor(world: World, path: Path, query?: LocationQueryRaw): RouteLocationRaw {
  return { path: pathString(world, path), query }
}

/** La misma posición, vista desde el otro mundo. */
export function acrossWorlds(from: World, path: Path, query?: LocationQueryRaw): RouteLocationRaw {
  const to = otherWorld(from)
  return routeFor(to, truncate(to, path), query)
}
