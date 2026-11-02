/**
 * Una lista que vive en Eros (las publicaciones, las tendencias), una sola copia por módulo para la
 * pantalla, el registro y volver a la lista sin pedir de nuevo:
 * - `ready`: Eros respondió (o la muestra de EROS_DEMO, que se reconoce por `demo`).
 * - `offline`: Eros no respondió. No se guarda ni se inventa nada: la lista queda vacía y se dice por qué.
 * - `error`: cualquier otro problema, con su motivo en palabras y Reintentar.
 */
import { computed, readonly, ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import { ApiError, isAbort, messageOf } from '../../api/errors'
import { isErosDown } from '../hunter/adapter'

export type ListPhase = 'idle' | 'loading' | 'ready' | 'offline' | 'error'

interface Row {
  id: string
  _source?: string
  demo?: true
}

export interface ErosList<T extends Row> {
  rows: ComputedRef<T[]>
  phase: Readonly<Ref<ListPhase>>
  error: Readonly<Ref<ApiError | null>>
  /** Hay un pedido en curso (también al reintentar sin Eros). */
  fetching: Readonly<Ref<boolean>>
  offline: ComputedRef<boolean>
  /** La lista salió de la muestra ficticia (EROS_DEMO): se mira, no se cambia. */
  isSample: ComputedRef<boolean>
  /** Lo último que se abrió y el filtro con que se vino, para volver a la lista en el mismo lugar. */
  lastOpened: Ref<string | null>
  lastFilter: Ref<string | null>
  load: (force?: boolean) => Promise<void>
  find: (id: string) => T | null
  /** Pone (o reemplaza) un registro con lo que respondió el servidor. */
  upsert: (row: T) => void
  drop: (id: string) => void
}

const FRESH_MS = 60_000

export const isSampleRow = (row: Row) => row.demo === true || row._source === 'demo'

export function erosList<T extends Row>(fetchAll: () => Promise<T[]>, order: (a: T, b: T) => number): ErosList<T> {
  const data = shallowRef<T[]>([])
  const phase = ref<ListPhase>('idle')
  const error = shallowRef<ApiError | null>(null)
  const fetching = ref(false)
  let loadedAt = 0
  let inflight: Promise<void> | null = null

  async function fetchRows(): Promise<void> {
    try {
      const list = await fetchAll()
      data.value = Array.isArray(list) ? list : []
      error.value = null
      phase.value = 'ready'
    }
    catch (err) {
      if (isAbort(err)) return
      error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
      if (isErosDown(err)) {
        data.value = []
        phase.value = 'offline'
        return
      }
      phase.value = 'error'
    }
    finally {
      loadedAt = Date.now()
    }
  }

  function load(force = true): Promise<void> {
    if (inflight) return inflight
    const settled = phase.value === 'ready' || phase.value === 'offline'
    if (!force && settled && Date.now() - loadedAt < FRESH_MS) return Promise.resolve()
    if (!settled) phase.value = 'loading'
    fetching.value = true
    inflight = fetchRows().finally(() => {
      inflight = null
      fetching.value = false
    })
    return inflight
  }

  return {
    rows: computed(() => [...data.value].sort(order)),
    phase: readonly(phase),
    error: readonly(error),
    fetching: readonly(fetching),
    offline: computed(() => phase.value === 'offline'),
    isSample: computed(() => data.value.some(isSampleRow)),
    lastOpened: ref<string | null>(null),
    lastFilter: ref<string | null>(null),
    load,
    find: id => data.value.find(row => row.id === id) ?? null,
    upsert(row) {
      const exists = data.value.some(x => x.id === row.id)
      data.value = exists ? data.value.map(x => (x.id === row.id ? { ...x, ...row } : x)) : [row, ...data.value]
    },
    drop(id) {
      data.value = data.value.filter(row => row.id !== id)
    },
  }
}

/** Más nuevo primero; lo que no trae fecha va al final, en el orden en que llegó. */
export function newestFirst<T>(dateOf: (row: T) => string | null): (a: T, b: T) => number {
  const time = (row: T) => {
    const value = dateOf(row)
    const ms = value ? Date.parse(value) : Number.NaN
    return Number.isNaN(ms) ? -Infinity : ms
  }
  return (a, b) => {
    const ta = time(a)
    const tb = time(b)
    return ta === tb ? 0 : tb > ta ? 1 : -1
  }
}
