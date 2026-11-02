/**
 * La guarda de un editor sobre la del shell (useLeaveGuards: beforeEach y beforeunload). Pregunta
 * antes de salir si hay cambios sin guardar, salvo:
 * - mientras se guarda: lo escrito ya va en camino (y queda en el borrador si falla);
 * - si la navegación se queda en el mismo registro (otra sección, ?campo=, un filtro).
 */
import { toValue, type MaybeRefOrGetter } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import { useLeaveGuard } from './useLeaveGuards'

export interface DirtyGuardOptions {
  dirty: MaybeRefOrGetter<boolean>
  saving?: MaybeRefOrGetter<boolean>
  /** ¿`to` es el mismo registro? Por defecto: misma ruta con el mismo id. */
  keeps?: (to: RouteLocationNormalized) => boolean
}

export function useDirtyGuard(options: DirtyGuardOptions): () => void {
  return useLeaveGuard({
    dirty: () => toValue(options.dirty) && !toValue(options.saving ?? false),
    keeps: options.keeps,
  })
}
