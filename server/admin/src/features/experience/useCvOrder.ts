/**
 * El orden del CV mientras se edita en la vista CV: la lista cambia al instante (arrastrar, ↑↓,
 * sumar, sacar) y se guarda sola un momento después, en un solo PATCH aunque se hayan hecho varios
 * movimientos. Si mientras guarda llega otro cambio, se guarda a continuación con el orden nuevo.
 * Si falla, vuelve al orden de la base y lo dice. Al salir de la vista, lo pendiente se guarda ya.
 * `version` sube con cada guardado bueno: la hoja se vuelve a pedir con eso.
 */
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { messageOf } from '../../api/errors'
import { toast } from '../../stores/toasts'
import { saveCvOrder } from './cvOrder'
import { experience as t } from './dict'
import { cvEntries, isEducation, type Experience } from './record'

export type OrderState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DELAY_MS = 450

export function useCvOrder(items: Ref<Experience[] | null>) {
  const ids = ref<number[]>([])
  const state = ref<OrderState>('idle')
  const version = ref(0)
  /** Hay cambios locales que la base todavía no tiene: la lista que llega no los pisa. */
  let local = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let inflight = false
  let again = false

  const fromBase = () => cvEntries(items.value ?? []).map(e => e.id)
  watch(items, () => {
    if (!local) ids.value = fromBase()
  }, { immediate: true })

  const byId = computed(() => new Map((items.value ?? []).map(e => [e.id, e])))
  const entries = computed(() => ids.value.map(id => byId.value.get(id)).filter((e): e is Experience => !!e))
  const outside = computed(() => (items.value ?? []).filter(e => !isEducation(e) && !ids.value.includes(e.id)))
  const education = computed(() => (items.value ?? []).filter(isEducation))

  async function flush(): Promise<void> {
    clearTimeout(timer)
    timer = undefined
    if (inflight) {
      again = true
      return
    }
    inflight = true
    try {
      await saveCvOrder(ids.value)
      if (!again) {
        local = false
        state.value = 'saved'
        version.value++
      }
    }
    catch (err) {
      again = false
      local = false
      ids.value = fromBase()
      state.value = 'error'
      toast(`${t.cv.saveFailed}. ${messageOf(err)}`, { tone: 'error' })
    }
    finally {
      inflight = false
      if (again) {
        again = false
        void flush()
      }
    }
  }

  function change(next: number[]): void {
    ids.value = next
    local = true
    state.value = 'saving'
    clearTimeout(timer)
    timer = setTimeout(() => void flush(), SAVE_DELAY_MS)
  }

  function move(from: number, to: number): void {
    if (from === to || to < 0 || to >= ids.value.length) return
    const next = [...ids.value]
    const [id] = next.splice(from, 1)
    if (id === undefined) return
    next.splice(to, 0, id)
    change(next)
  }

  const add = (id: number) => change([...ids.value.filter(other => other !== id), id])
  const remove = (id: number) => change(ids.value.filter(other => other !== id))

  onBeforeUnmount(() => {
    if (timer !== undefined) void flush()
  })

  return { ids, entries, outside, education, state, version, move, add, remove }
}
