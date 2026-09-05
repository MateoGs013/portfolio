/**
 * En qué mundo y en qué posición estamos, leído siempre de la ruta.
 * No hay estado de navegación en memoria: la URL es la fuente.
 */
import { acrossWorlds, isWorld, otherWorld, parsePath, type Path, type World } from '~/lib/path'

export function useMundo() {
  const route = useRoute()

  const world = computed<World | null>(() => {
    const seg = route.path.split('/')[1]
    return isWorld(seg) ? seg : null
  })

  const path = computed<Path>(() => parsePath(route.params.path))

  const other = computed<World | null>(() => (world.value ? otherWorld(world.value) : null))

  /** La misma posición en el otro mundo, truncada a lo que ese mundo entiende. */
  const across = computed(() => (world.value ? acrossWorlds(world.value, path.value, route.query) : null))

  return { world, path, other, across, query: computed(() => route.query) }
}
