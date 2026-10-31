/**
 * Política de movimiento (docs/diseno.md §6): la única fuente, reactiva. `allowAmbient` cubre todo lo
 * que se mueve sin que nadie lo pida (Lenis, líneas, palabras, conteos, burbuja, temperatura, autoplay);
 * `allowTransitions`, lo que responde a una acción (view transitions, morph, FLIP, Rodar, Asomar).
 *
 * Hidratación sin sorpresas: el SSR no conoce las media queries, así que `reduce`, `fine` y `saveData`
 * arrancan en false en el servidor y en el primer render del cliente, y recién toman su valor real
 * después de hidratar (`ready`). Lo que dependa de ellos en un template se pinta igual en los dos lados.
 */
import type { Ref } from 'vue'

const QUERY_REDUCE = '(prefers-reduced-motion: reduce)'
const QUERY_FINE = '(hover: hover) and (pointer: fine)'

interface MediaState {
  ready: Ref<boolean>
  reduce: Ref<boolean>
  fine: Ref<boolean>
  saveData: Ref<boolean>
}

/** Un solo juego de listeners por pestaña. En el servidor nunca se comparte entre pedidos. */
let shared: MediaState | null = null

function blank(): MediaState {
  return { ready: ref(false), reduce: ref(false), fine: ref(false), saveData: ref(false) }
}

interface SaveDataConnection extends EventTarget {
  saveData?: boolean
}

function connection(): SaveDataConnection | undefined {
  return (navigator as Navigator & { connection?: SaveDataConnection }).connection
}

function listen(state: MediaState) {
  const bind = (query: string, target: Ref<boolean>) => {
    const list = window.matchMedia(query)
    target.value = list.matches
    list.addEventListener('change', (e) => {
      target.value = e.matches
    })
  }
  bind(QUERY_REDUCE, state.reduce)
  bind(QUERY_FINE, state.fine)
  const conn = connection()
  state.saveData.value = conn?.saveData === true
  conn?.addEventListener?.('change', () => {
    state.saveData.value = conn.saveData === true
  })
  state.ready.value = true
}

function clientState(): MediaState {
  if (shared) return shared
  const state = blank()
  shared = state
  const nuxtApp = useNuxtApp()
  // Durante la hidratación los valores quedan como en el SSR; después, los reales.
  if (nuxtApp.isHydrating) nuxtApp.hooks.hookOnce('app:suspense:resolve', () => listen(state))
  else listen(state)
  return state
}

export function useMotionPrefs() {
  const { isHyperfocus } = useHyperfocus()
  const state = import.meta.client ? clientState() : blank()

  const allowAmbient = computed(() => !state.reduce.value && !isHyperfocus.value)
  const allowTransitions = computed(() => !state.reduce.value)

  return {
    /** true cuando las media queries ya tienen su valor real (después de hidratar). */
    ready: readonly(state.ready),
    reduce: readonly(state.reduce),
    fine: readonly(state.fine),
    /** El navegador pidió ahorrar datos: ningún video arranca solo. */
    saveData: readonly(state.saveData),
    hyperfocus: isHyperfocus,
    allowAmbient,
    allowTransitions,
  }
}
