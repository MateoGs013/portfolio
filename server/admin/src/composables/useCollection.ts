/**
 * La lista de una colección (GET /api/admin/<path>) con una copia por colección que comparten todas
 * las vistas. Cualquier escritura que sale bien (el evento 'write') la marca vieja: la vista que la
 * muestra la vuelve a pedir y mientras tanto sigue mostrando lo que tenía. Si el pedido falla, el error
 * queda a la vista (ErrorState con Reintentar) y nada de lo de la lista se puede editar.
 */
import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import { api, onWrite } from '../api/client'
import { ApiError, isAbort, messageOf } from '../api/errors'
import type { AdminRecord, AnyModel } from '../models/types'

interface Entry {
  items: ShallowRef<AdminRecord[] | null>
  loading: Ref<boolean>
  error: ShallowRef<ApiError | null>
  stale: boolean
  controller: AbortController | null
  /** Vistas montadas que la muestran: solo esas la vuelven a pedir al invalidarse. */
  watchers: number
}

const RELOAD_DEBOUNCE_MS = 150
const cache = new Map<string, Entry>()
let debounce: ReturnType<typeof setTimeout> | undefined

function entryFor(path: string): Entry {
  let entry = cache.get(path)
  if (!entry) {
    entry = { items: shallowRef(null), loading: ref(false), error: shallowRef(null), stale: true, controller: null, watchers: 0 }
    cache.set(path, entry)
  }
  return entry
}

async function fetchList(path: string): Promise<void> {
  const entry = entryFor(path)
  entry.controller?.abort()
  const own = new AbortController()
  entry.controller = own
  entry.loading.value = true
  try {
    entry.items.value = await api.get<AdminRecord[]>(path, { signal: own.signal })
    entry.error.value = null
    entry.stale = false
  }
  catch (err) {
    if (isAbort(err)) return
    entry.error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
  }
  finally {
    if (entry.controller === own) {
      entry.controller = null
      entry.loading.value = false
    }
  }
}

/** Marca vieja la lista de `path` (o todas) y vuelve a pedir las que alguien está mostrando. */
export function invalidateCollection(path?: string): void {
  for (const [key, entry] of cache) {
    if (path && key !== path) continue
    entry.stale = true
    if (entry.watchers > 0) void fetchList(key)
  }
}

// Una escritura puede cambiar otra colección (los conteos de obras de una empresa): se invalidan todas.
onWrite(() => {
  clearTimeout(debounce)
  debounce = setTimeout(() => invalidateCollection(), RELOAD_DEBOUNCE_MS)
})

/** Pone en la copia un registro recién guardado, sin esperar a la próxima lectura. */
export function rememberRecord(path: string, record: AdminRecord): void {
  const entry = cache.get(path)
  const items = entry?.items.value
  if (!entry || !items) return
  const index = items.findIndex(item => item.id === record.id)
  entry.items.value = index >= 0 ? items.map(item => (item.id === record.id ? record : item)) : [...items, record]
}

/** Saca de la copia un registro borrado. */
export function forgetRecord(path: string, id: number): void {
  const entry = cache.get(path)
  if (entry?.items.value) entry.items.value = entry.items.value.filter(item => item.id !== id)
}

/** La lista de `model` mientras dure la vista que la pide. */
export function useCollection<TRecord extends AdminRecord>(model: AnyModel) {
  const entry = entryFor(model.path)
  entry.watchers++
  if (entry.stale || entry.error.value) void fetchList(model.path)
  if (getCurrentScope()) onScopeDispose(() => {
    entry.watchers--
  })

  return {
    items: computed(() => entry.items.value as TRecord[] | null) as ComputedRef<TRecord[] | null>,
    loading: computed(() => entry.loading.value),
    error: computed(() => entry.error.value),
    reload: () => fetchList(model.path),
  }
}

/** La lista una vez, sin quedarse mirando (el borrado busca a quién reasignar). */
export async function readCollection<TRecord extends AdminRecord>(model: AnyModel): Promise<TRecord[]> {
  const entry = entryFor(model.path)
  if (entry.stale || !entry.items.value) await fetchList(model.path)
  if (entry.error.value) throw entry.error.value
  return (entry.items.value ?? []) as TRecord[]
}
