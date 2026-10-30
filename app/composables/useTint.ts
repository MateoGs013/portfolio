/**
 * Temperatura por obra (docs/diseno.md §3): el fondo toma el `tint` de la obra mezclado al 8 % en
 * oscuro y al 5 % en claro; al anticipar (apuntar o enfocar un `[data-tint]`) va al 75 % de eso. Con
 * Hiperfoco o reduced motion es ambiental y queda en 0. Se escribe `--tint` y `--tint-amt` en
 * `<html>`; tokens.css los registra con @property y transiciona el fondo en 1,2 s.
 *
 * - `useTint(tint)` fija la temperatura de la página mientras el componente está montado (el caso).
 * - `anticipate(tint)` / `release()` la adelantan mientras se apunta algo; `installTintAnchors()`
 *   (motion.client.ts) lo hace solo para todo `[data-tint]`.
 */
import type { MaybeRefOrGetter } from 'vue'

const AMOUNT = { dark: 8, light: 5 } as const
const ANTICIPATION = 0.75
const HEX = /^#[0-9a-f]{6}$/i

/** Solo un color #rrggbb llega a una propiedad CSS. */
function validTint(value: unknown): string | null {
  return typeof value === 'string' && HEX.test(value) ? value : null
}

interface TintState {
  base: string | null
  baseOwner: symbol | null
  hover: string | null
}

const state = reactive<TintState>({ base: null, baseOwner: null, hover: null })

/** El único efecto que escribe en <html>. Corre en el contexto del plugin (usa cookies y estado). */
function applyTint() {
  const prefs = useMotionPrefs()
  const { theme } = useTheme()
  // El color se conserva al apagar: así el fondo vuelve desde la obra y no salta.
  let last: string | null = null
  watchEffect(() => {
    const tint = state.hover ?? state.base
    const full = AMOUNT[theme.value]
    const amount = !prefs.ready.value || !prefs.allowAmbient.value || !tint ? 0 : state.hover ? full * ANTICIPATION : full
    const root = document.documentElement.style
    if (tint && tint !== last) {
      root.setProperty('--tint', tint)
      last = tint
    }
    root.setProperty('--tint-amt', `${amount}%`)
  })
}

/** Adelanta la temperatura de lo apuntado o enfocado. */
export function anticipate(tint: string | null | undefined) {
  if (import.meta.client) state.hover = validTint(tint)
}

export function release() {
  state.hover = null
}

/** El efecto y la delegación sobre el contrato `data-tint`: lo instala motion.client.ts una vez. */
export function installTintAnchors() {
  applyTint()
  const anchorOf = (target: EventTarget | null) => (target instanceof Element ? target.closest<HTMLElement>('[data-tint]') : null)
  const enter = (e: Event) => {
    const anchor = anchorOf(e.target)
    if (anchor) anticipate(anchor.dataset.tint)
  }
  const leave = (e: Event) => {
    const from = anchorOf(e.target)
    const to = anchorOf((e as PointerEvent | FocusEvent).relatedTarget)
    if (from && from !== to) release()
  }
  document.addEventListener('pointerover', enter, { passive: true })
  document.addEventListener('pointerout', leave, { passive: true })
  document.addEventListener('focusin', enter)
  document.addEventListener('focusout', leave)
  // Al cambiar de página, lo apuntado ya no existe.
  useRouter().afterEach(release)
}

/** La temperatura de la página mientras el componente está montado. */
export function useTint(tint?: MaybeRefOrGetter<string | null | undefined>) {
  const owner = Symbol('tint')

  function set(value: string | null | undefined) {
    if (import.meta.server) return
    state.base = validTint(value)
    state.baseOwner = owner
  }

  if (import.meta.client && tint !== undefined) {
    let live = false
    onMounted(() => {
      live = true
      set(toValue(tint))
    })
    watch(() => toValue(tint), (value) => {
      if (live) set(value)
    })
    onBeforeUnmount(() => {
      live = false
      if (state.baseOwner !== owner) return
      state.base = null
      state.baseOwner = null
    })
  }

  return { set, anticipate, release }
}
