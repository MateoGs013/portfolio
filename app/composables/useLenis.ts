/**
 * El scroll con inercia (Lenis), si está encendido. Lo crea y lo apaga motion.client.ts según
 * `allowAmbient`: con reduced motion o Hiperfoco no existe y el scroll es el nativo. Por eso todo
 * desplazamiento por programa pasa por `scrollTo`, que usa Lenis si está y el scroll nativo si no.
 */
import type Lenis from 'lenis'
import type { ShallowRef } from 'vue'

/** Una capa encima de la página (paleta, diálogo): mientras está abierta, Lenis se detiene. */
export interface SiteOverlay {
  open: boolean
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'site:overlay': (overlay: SiteOverlay) => void | Promise<void>
  }
}

export type ScrollTarget = number | string | HTMLElement

export interface ScrollOptions {
  /** Sin animación (anclar la página, saltar al inicio). */
  immediate?: boolean
  /** Desplazamiento extra en px (por ejemplo, el alto de la cabecera). */
  offset?: number
}

function nativeScroll(target: ScrollTarget, { immediate = false, offset = 0 }: ScrollOptions) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior: ScrollBehavior = immediate || reduce ? 'instant' : 'smooth'
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (typeof el === 'number') return window.scrollTo({ top: el + offset, behavior })
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior })
}

export function useLenis() {
  const nuxtApp = useNuxtApp()
  // El plugin es solo del cliente: en el SSR no hay instancia.
  const lenis: Readonly<ShallowRef<Lenis | null>> = nuxtApp.$lenis ?? shallowRef(null)

  function scrollTo(target: ScrollTarget, options: ScrollOptions = {}) {
    if (import.meta.server) return
    const instance = lenis.value
    if (instance) instance.scrollTo(target, { immediate: options.immediate, offset: options.offset, force: true })
    else nativeScroll(target, options)
  }

  return { lenis, scrollTo }
}
