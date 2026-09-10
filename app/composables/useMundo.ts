/**
 * Posición en el explorador del portafolio, leída siempre de la ruta.
 * No hay estado de navegación en memoria: la URL es la fuente de verdad.
 */
import { parsePath, type Path } from '~/lib/path'

export function useMundo() {
  const route = useRoute()

  const path = computed<Path>(() => parsePath(route.params.path))
  const world = computed<'datos'>(() => 'datos')
  const query = computed(() => route.query)

  return {
    world,
    path,
    query,
    other: computed(() => null),
    across: computed(() => null),
  }
}
