/**
 * Ver como registro (tecla R): el estado es `?vista=registro`, que el SSR renderiza sin JS. El cambio
 * reemplaza la URL al instante, conserva el resto de la query y no se apila: una segunda llamada
 * mientras corre se ignora. Los hooks `record:before` y `record:after` dejan engancharse al morph
 * (X2) y a useMotion (F4): `before` corre con el DOM viejo y `after` con el nuevo ya pintado.
 */
import type { LocationQuery } from 'vue-router'

export const RECORD_PARAM = 'vista'
export const RECORD_VALUE = 'registro'

export interface RecordChange {
  /** true: de diseño a registro; false: de registro a diseño. */
  on: boolean
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'record:before': (change: RecordChange) => void | Promise<void>
    'record:after': (change: RecordChange) => void | Promise<void>
  }
}

export function isRecordQuery(query: LocationQuery): boolean {
  const raw = query[RECORD_PARAM]
  return (Array.isArray(raw) ? raw[0] : raw) === RECORD_VALUE
}

export function useRecordView() {
  const route = useRoute()
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const busy = useState('record-view-busy', () => false)
  const isRecord = computed(() => isRecordQuery(route.query))

  async function setRecord(on: boolean) {
    if (busy.value || on === isRecord.value) return
    busy.value = true
    const change: RecordChange = { on }
    try {
      await nuxtApp.callHook('record:before', change)
      const { [RECORD_PARAM]: _drop, ...rest } = route.query
      await router.replace({ path: route.path, hash: route.hash, query: on ? { ...rest, [RECORD_PARAM]: RECORD_VALUE } : rest })
      await nextTick()
      await nuxtApp.callHook('record:after', change)
    }
    finally {
      busy.value = false
    }
  }

  const toggleRecord = () => setRecord(!isRecord.value)

  return { isRecord, busy: readonly(busy), setRecord, toggleRecord }
}
