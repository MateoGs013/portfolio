/**
 * GET /api/admin/meta: rótulos de los enums, opciones relacionales, esquema de campos y resumen con
 * las reglas de visibilidad del sitio. Una sola copia para todo el admin, que se vuelve a pedir 300 ms
 * después de la última escritura (el evento 'write' del cliente): varias seguidas piden una vez.
 */
import type { AdminMeta, AdminOptions, AdminSchema, AdminSummary, EnumOption } from '@shared/adminContracts'
import type { EnumName } from '@shared/labels'
import { computed, readonly, ref, shallowRef } from 'vue'
import { api, onWrite } from '../api/client'
import { ApiError, isAbort, messageOf } from '../api/errors'

const RELOAD_DEBOUNCE_MS = 300

const data = shallowRef<AdminMeta | null>(null)
const loading = ref(false)
const error = shallowRef<ApiError | null>(null)
let controller: AbortController | null = null
let debounce: ReturnType<typeof setTimeout> | undefined
let enabled = false

export const meta = readonly(data)
export const metaLoading = readonly(loading)
export const metaError = readonly(error)

export const summary = computed<AdminSummary | null>(() => data.value?.summary ?? null)
export const options = computed<AdminOptions | null>(() => data.value?.options ?? null)
export const schema = computed<AdminSchema | null>(() => data.value?.schema ?? null)

export async function loadMeta(): Promise<void> {
  controller?.abort()
  const own = new AbortController()
  controller = own
  loading.value = true
  try {
    data.value = await api.get<AdminMeta>('/meta', { signal: own.signal })
    error.value = null
  }
  catch (err) {
    if (isAbort(err)) return
    // Lo que ya había sigue sirviendo: solo se marca que no está al día.
    error.value = err instanceof ApiError ? err : new ApiError(0, null, messageOf(err))
  }
  finally {
    if (controller === own) {
      loading.value = false
      controller = null
    }
  }
}

/** Con sesión: carga y se mantiene al día. Sin sesión: deja de escuchar y olvida lo cargado. */
export function enableMeta(on: boolean): void {
  enabled = on
  clearTimeout(debounce)
  if (on) {
    if (!data.value) void loadMeta()
    return
  }
  controller?.abort()
  data.value = null
  error.value = null
}

onWrite(() => {
  if (!enabled) return
  clearTimeout(debounce)
  debounce = setTimeout(() => void loadMeta(), RELOAD_DEBOUNCE_MS)
})

/** Las opciones rotuladas de un enum, en el orden del esquema. */
export function enumOptions(name: EnumName): readonly EnumOption[] {
  return data.value?.enumOptions[name] ?? []
}

/** El rótulo de un valor: nunca se muestra el valor crudo de un enum mientras haya rótulo. */
export function label(name: EnumName, value: string | null | undefined): string {
  if (!value) return ''
  return enumOptions(name).find(option => option.value === value)?.label ?? ''
}
