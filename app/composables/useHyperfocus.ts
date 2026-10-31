/**
 * Hiperfoco: la capa de presentación para leer sin ruido (docs/diseno.md §5). El estado vive en la
 * cookie `pf-hyperfocus`, que lee el SSR para pintar `data-hyperfocus` antes del primer cuadro; no
 * hay localStorage ni lecturas en onMounted por consumidor. `?foco=1` entra desde un enlace (prefs.ts).
 *
 * En el cliente el cambio es una view transition de tipo «hiperfoco» (220 ms, hyperfocus.css: la
 * la cabecera queda quieta y la columna se angosta). Con reduced motion, o sin view transitions,
 * es instantáneo. En los dos casos la lectura no se pierde: el primer bloque que se estaba leyendo
 * vuelve a quedar a la misma altura después del cambio, aunque la columna haya cambiado de ancho.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { nextTick } from 'vue'

export const HYPERFOCUS_COOKIE = 'pf-hyperfocus'

const YEAR = 60 * 60 * 24 * 365

/** La cookie viaja tal cual (pf-hyperfocus=true), sin el JSON que useCookie pone por defecto. */
const plain = (value: string | null) => value ?? ''

/** Bloques de lectura candidatos a ancla, en orden de documento. */
const READABLE = '#contenido :is(h1, h2, h3, p, li, dt, dd, figure, blockquote, pre, [data-row], [data-card])'

/** Lo que el Hiperfoco oculta (cargador, vista previa, escena) o que no se lee: nunca es ancla. */
const SKIP = '[data-hf="hide"], [data-ornament], [aria-hidden="true"]'

interface ReadingAnchor {
  el: HTMLElement
  top: number
}

/** El primer bloque visible debajo de la cabecera fija: lo que el lector tiene delante. */
function readingAnchor(): ReadingAnchor | null {
  const floor = document.querySelector('header[data-chrome]')?.getBoundingClientRect().bottom ?? 0
  for (const el of document.querySelectorAll<HTMLElement>(READABLE)) {
    if (el.closest(SKIP)) continue
    const rect = el.getBoundingClientRect()
    if (rect.height > 0 && rect.bottom > floor) return { el, top: rect.top }
    if (rect.top > window.innerHeight) break
  }
  return null
}

/** Devuelve el ancla a su altura. Si el bloque quedó oculto (vista previa, escena), no se mueve nada. */
function restoreAnchor(anchor: ReadingAnchor | null) {
  if (!anchor?.el.isConnected) return
  const rect = anchor.el.getBoundingClientRect()
  if (rect.height === 0) return
  const delta = rect.top - anchor.top
  if (Math.abs(delta) < 1) return
  window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' })
  // ScrollTrigger guarda el scroll en caché y su próximo refresh lo restauraría: que lea el nuevo.
  ScrollTrigger.update()
}

/** Un cuadro entero: con reduced motion todo transiciona en 0,01 ms y el estilo final llega después. */
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function useHyperfocus() {
  const cookie = useCookie<string | null>(HYPERFOCUS_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const state = useState<boolean>(HYPERFOCUS_COOKIE, () => cookie.value === 'true')

  /** Entrar escribe la cookie; salir la borra, así un enlace viejo no lo vuelve a encender. */
  function commit(on: boolean) {
    state.value = on
    cookie.value = on ? 'true' : null
  }

  /**
   * El atributo se escribe ya, no en el próximo parche de useHead: la transición captura este estado.
   * Se espera a que Vue y el plugin de movimiento rearmen las escenas (dos ticks: el watch del plugin
   * revierte, espera un tick y vuelve a armar) antes de devolver la lectura a su lugar. Sin view
   * transition (`settle`) se espera además un cuadro; dentro de una no, porque el navegador no pinta
   * hasta que este callback termina.
   */
  async function apply(on: boolean, settle = false) {
    const anchor = readingAnchor()
    commit(on)
    const root = document.documentElement
    if (on) root.dataset.hyperfocus = 'true'
    else delete root.dataset.hyperfocus
    await nextTick()
    await nextTick()
    if (settle) {
      await frame()
      await frame()
    }
    restoreAnchor(anchor)
  }

  /** Cambia el modo. En el servidor (`?foco=1`) solo deja el estado y la cookie para el SSR. */
  function setHyperfocus(on: boolean): Promise<void> {
    if (import.meta.server || on === state.value) {
      commit(on)
      return Promise.resolve()
    }
    if (reduceMotion() || !document.startViewTransition) return apply(on, true)
    let transition: ViewTransition
    try {
      transition = document.startViewTransition({ update: () => apply(on), types: ['hiperfoco'] })
    }
    catch {
      // Navegadores con view transitions pero sin tipos: solo aceptan la función (y fundido común).
      transition = document.startViewTransition(() => apply(on))
    }
    transition.finished.catch(() => {})
    return transition.updateCallbackDone.catch(() => {})
  }

  const toggleHyperfocus = () => setHyperfocus(!state.value)

  return { isHyperfocus: readonly(state), setHyperfocus, toggleHyperfocus }
}
