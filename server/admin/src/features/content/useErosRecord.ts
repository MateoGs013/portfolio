/**
 * Un registro de una lista de Eros (una publicación, una tendencia) abierto por su dirección: se
 * muestra enseguida la copia de la lista, si la hay, y se pide a Eros la versión al día (GET /:id).
 * Si esa lectura falla pero había copia, queda la copia; si no había, se dice por qué no se ve:
 * no existe, Eros no responde u otro error.
 */
import { computed, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { ApiError, isAbort, messageOf } from '../../api/errors'
import { isErosDown } from '../hunter/adapter'
import type { ErosList } from './erosList'

export type RecordPhase = 'loading' | 'ready' | 'missing' | 'offline' | 'error'

export function useErosRecord<T extends { id: string }>(
  id: () => string,
  list: ErosList<T>,
  fetchOne: (id: string) => Promise<T>,
): { record: ComputedRef<T | null>, phase: Ref<RecordPhase>, error: Ref<ApiError | null>, reload: () => Promise<void> } {
  const phase = ref<RecordPhase>('loading')
  const error = shallowRef<ApiError | null>(null)
  const record = computed(() => list.find(id()))

  async function reload(): Promise<void> {
    const current = id()
    if (!record.value) phase.value = 'loading'
    try {
      const fresh = await fetchOne(current)
      if (current !== id()) return
      list.upsert(fresh)
      error.value = null
      phase.value = 'ready'
    }
    catch (err) {
      if (isAbort(err) || current !== id()) return
      error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
      if (record.value) phase.value = 'ready'
      else if (isErosDown(err)) phase.value = 'offline'
      else phase.value = err instanceof ApiError && err.status === 404 ? 'missing' : 'error'
    }
  }

  watch(id, () => void reload(), { immediate: true })
  return { record, phase, error, reload }
}
