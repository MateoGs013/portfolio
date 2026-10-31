/**
 * Imanes (docs/diseno.md §2, «Seguir»): `v-magnet` acerca el elemento al cursor con fuerza k (0,35 por
 * defecto; el email usa 0,12) y lo devuelve con `elastic.out(1, .4)` en 1 s. Universal: en el SSR no
 * agrega nada. Solo actúa con puntero fino, sin reduced motion y sin Hiperfoco, y lo decide en cada
 * movimiento, así cambiar de modo con el cursor encima no deja el elemento corrido.
 */
import { gsap } from 'gsap'
import type { Directive } from 'vue'

interface Magnet {
  k: number
  toX?: gsap.QuickToFunc
  toY?: gsap.QuickToFunc
  move: (e: PointerEvent) => void
  leave: () => void
}

const DEFAULT_K = 0.35
const magnets = new WeakMap<HTMLElement, Magnet>()

function allowed(): boolean {
  return matchMedia('(hover: hover) and (pointer: fine)').matches
    && !matchMedia('(prefers-reduced-motion: reduce)').matches
    && document.documentElement.dataset.hyperfocus !== 'true'
}

const magnet: Directive<HTMLElement, number | undefined> = {
  getSSRProps: () => ({}),

  mounted(el, binding) {
    const state: Magnet = {
      k: binding.value ?? DEFAULT_K,
      move(e) {
        if (!allowed()) return state.leave()
        state.toX ??= gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
        state.toY ??= gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
        const r = el.getBoundingClientRect()
        state.toX((e.clientX - r.left - r.width / 2) * state.k)
        state.toY((e.clientY - r.top - r.height / 2) * state.k)
      },
      leave() {
        if (!state.toX) return
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)', overwrite: true })
        state.toX = undefined
        state.toY = undefined
      },
    }
    el.addEventListener('pointermove', state.move, { passive: true })
    el.addEventListener('pointerleave', state.leave)
    magnets.set(el, state)
  },

  updated(el, binding) {
    const state = magnets.get(el)
    if (state) state.k = binding.value ?? DEFAULT_K
  },

  beforeUnmount(el) {
    const state = magnets.get(el)
    if (!state) return
    el.removeEventListener('pointermove', state.move)
    el.removeEventListener('pointerleave', state.leave)
    gsap.killTweensOf(el)
    gsap.set(el, { clearProps: 'transform' })
    magnets.delete(el)
  },
}

declare module 'vue' {
  interface GlobalDirectives {
    vMagnet: typeof magnet
  }
}

export default defineNuxtPlugin({
  name: 'magnet',
  setup(nuxtApp) {
    nuxtApp.vueApp.directive('magnet', magnet)
  },
})
