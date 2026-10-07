/**
 * Posición en el explorador del portafolio, leída siempre de la ruta activa.
 * No hay estado de navegación volátil en memoria: la URL es la única fuente de verdad.
 */
import { parsePath, type Path } from '~/lib/path'

export function useExplorerRoute() {
  const route = useRoute()

  const path = computed<Path>(() => parsePath(route.params.path))
  const query = computed(() => route.query)

  return {
    path,
    query,
  }
}
