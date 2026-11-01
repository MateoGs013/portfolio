/**
 * La bandeja del Inicio: GET /pending, una sola copia a nivel de módulo (volver al Inicio muestra la
 * última mientras se pide otra). Se vuelve a pedir después de cada escritura del panel y al volver a
 * la pestaña: un pendiente resuelto en otra pestaña o con `pnpm cv:pdf` se va solo.
 */
import type { PendingItem } from '@shared/adminContracts'
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { api, onWrite } from '../../api/client'
import { ApiError, isAbort, messageOf } from '../../api/errors'
import { PENDING_GROUPS, type PendingGroupId } from './dict'

const items = shallowRef<PendingItem[] | null>(null)
const error = shallowRef<ApiError | null>(null)
const loading = ref(false)
let inflight: Promise<void> | null = null

export interface PendingGroup {
  id: PendingGroupId
  label: string
  items: PendingItem[]
}

function fetchPending(): Promise<void> {
  if (inflight) return inflight
  loading.value = true
  inflight = api.get<PendingItem[]>('/pending')
    .then((list) => {
      items.value = Array.isArray(list) ? list : []
      error.value = null
    })
    .catch((err: unknown) => {
      if (isAbort(err)) return
      error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
    })
    .finally(() => {
      inflight = null
      loading.value = false
    })
  return inflight
}

const AFTER_WRITE_MS = 300

export function usePending() {
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopWrites: (() => void) | undefined

  const onVisible = () => {
    if (document.visibilityState === 'visible') void fetchPending()
  }

  onMounted(() => {
    void fetchPending()
    stopWrites = onWrite(() => {
      clearTimeout(timer)
      timer = setTimeout(() => void fetchPending(), AFTER_WRITE_MS)
    })
    document.addEventListener('visibilitychange', onVisible)
  })
  onUnmounted(() => {
    clearTimeout(timer)
    stopWrites?.()
    document.removeEventListener('visibilitychange', onVisible)
  })

  /** Por grupo, en el orden de la bandeja; los grupos vacíos no figuran. */
  const groups = computed<PendingGroup[]>(() => PENDING_GROUPS
    .map(g => ({ id: g.id, label: g.label, items: (items.value ?? []).filter(i => g.kinds.includes(i.kind)) }))
    .filter(g => g.items.length > 0))

  return { items, groups, error, loading, reload: fetchPending }
}
