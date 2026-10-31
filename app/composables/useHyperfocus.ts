/**
 * Hiperfoco: la capa de presentación para leer sin ruido (docs/diseno.md §5). El estado vive en la
 * cookie `pf-hyperfocus`, que lee el SSR para pintar `data-hyperfocus` antes del primer cuadro; no
 * hay localStorage ni lecturas en onMounted por consumidor. `?foco=1` entra desde un enlace (prefs.ts).
 *
 * En el cliente el cambio es una view transition de tipo «hiperfoco» (220 ms, hyperfocus.css: la
 * cabecera queda quieta y la columna se angosta). Con reduced motion, o sin view transitions,
 * es instantáneo. En los dos casos la lectura no se pierde: el primer bloque que se estaba leyendo
 * vuelve a quedar a la misma altura después del cambio, aunque la columna haya cambiado de ancho.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'
import { nextTick } from 'vue'
import { prefersReducedMotion } from './useSound'

export const HYPERFOCUS_COOKIE = 'pf-hyperfocus'

const YEAR = 60 * 60 * 24 * 365

/** La cookie viaja tal cual (pf-hyperfocus=true), sin el JSON que useCookie pone por defecto. */
const plain = (value: string | null) => value ?? ''

/**
 * Bloques de lectura candidatos a ancla, en orden de documento. Texto, no figuras: una captura cambia
 * de alto con el ancho de la columna y, anclada por arriba, correría el texto que viene después.
 */
const READABLE = '#contenido :is(h1, h2, h3, p, li, dt, dd, blockquote, pre, [data-row], [data-card])'

/** Lo que el Hiperfoco oculta (cargador, vista previa, escena) o que no se lee: nunca es ancla. */
const SKIP = '[data-hf="hide"], [data-ornament], [aria-hidden="true"]'

interface ReadingAnchor {
  el: HTMLElement
  top: number
  /** La instancia de Lenis en este momento (la crea y la destruye el plugin de movimiento). */
  lenis: () => Lenis | null
}

/**
 * Un bloque pegado (los rótulos de sección `md:sticky`, la cabecera) queda a la misma altura haga lo
 * que haga la página: como ancla no sostiene nada. Cuenta también el que se pega solo en uno de los dos
 * modos (`md:sticky … focus-mode:static`): al salir del Hiperfoco vuelve a pegarse.
 */
function isStuck(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node && node.id !== 'contenido'; node = node.parentElement) {
    const position = getComputedStyle(node).position
    if (position === 'sticky' || position === 'fixed') return true
    if ([...node.classList].some(c => /(^|:)sticky$/.test(c))) return true
  }
  return false
}

/**
 * El primer bloque visible debajo de la cabecera fija, que no esté pegado: lo que el lector tiene
 * delante. Se prefiere el primero que empieza debajo de la cabecera; si un bloque largo ocupa toda la
 * pantalla, ese.
 */
function readingAnchor(lenis: () => Lenis | null): ReadingAnchor | null {
  const floor = document.querySelector('header[data-chrome]')?.getBoundingClientRect().bottom ?? 0
  let covering: ReadingAnchor | null = null
  for (const el of document.querySelectorAll<HTMLElement>(READABLE)) {
    const rect = el.getBoundingClientRect()
    if (rect.top > window.innerHeight) break
    if (rect.height === 0 || rect.bottom <= floor || el.closest(SKIP) || isStuck(el)) continue
    if (rect.top >= floor) return { el, top: rect.top, lenis }
    covering ??= { el, top: rect.top, lenis }
  }
  return covering
}

/**
 * El scroll a `top`, por Lenis si está corriendo (si no, su próximo cuadro lo devolvería). Lenis mide
 * el alto de la página con un observador diferido: recién creado al salir del modo, todavía tiene el
 * tope de antes y recortaría el destino. resize() lo mide ya.
 */
function scrollToTop(top: number, lenis: Lenis | null) {
  if (lenis) {
    lenis.resize()
    lenis.scrollTo(top, { immediate: true, force: true })
  }
  else window.scrollTo({ top, behavior: 'instant' })
}

/** Devuelve el ancla a su altura. Si el bloque quedó oculto (vista previa, escena), no se mueve nada. */
function restoreAnchor(anchor: ReadingAnchor | null) {
  if (!anchor?.el.isConnected) return
  const rect = anchor.el.getBoundingClientRect()
  if (rect.height === 0) return
  const delta = rect.top - anchor.top
  if (Math.abs(delta) < 1) return
  scrollToTop(window.scrollY + delta, anchor.lenis())
  // ScrollTrigger guarda el scroll en caché y su próximo refresh lo restauraría: que lea el nuevo.
  ScrollTrigger.update()
}

/** Un cuadro entero: con reduced motion todo transiciona en 0,01 ms y el estilo final llega después. */
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

/**
 * La corrección final, cuando la página ya se asentó: el plugin de movimiento rearma las escenas y
 * pide un ScrollTrigger.refresh en el cuadro siguiente (los pines suman o quitan su espaciador y el
 * refresh devuelve el scroll que tenía en caché). Se espera ese cuadro, se mide con un refresh propio
 * y se corrige; un cuadro después, otra vez si algo se movió.
 */
async function settleAnchor(anchor: ReadingAnchor | null) {
  if (!anchor) return
  await frame()
  await frame()
  ScrollTrigger.refresh()
  restoreAnchor(anchor)
  await frame()
  restoreAnchor(anchor)
}

/**
 * El estado al que va el modo mientras un cambio está en curso. Con view transition, `commit` corre
 * uno o más cuadros después de pedirlo: dos pulsaciones seguidas (H y Esc) se comparan contra esto y
 * no contra el estado viejo, así la segunda revierte la primera en lugar de repetirla.
 */
let pending: boolean | null = null

export function useHyperfocus() {
  const cookie = useCookie<string | null>(HYPERFOCUS_COOKIE, { maxAge: YEAR, sameSite: 'lax', path: '/', encode: plain, decode: plain })
  const state = useState<boolean>(HYPERFOCUS_COOKIE, () => cookie.value === 'true')
  const nuxtApp = useNuxtApp()
  const lenis = () => nuxtApp.$lenis?.value ?? null

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
  async function apply(on: boolean, anchor: ReadingAnchor | null, settle = false) {
    commit(on)
    const root = document.documentElement
    if (on) root.dataset.hyperfocus = 'true'
    else delete root.dataset.hyperfocus
    await nextTick()
    await nextTick()
    // Todavía en la misma tarea que escribió el atributo: el navegador no pintó la página corrida.
    restoreAnchor(anchor)
    if (settle) {
      // Con reduced motion el estilo final llega un cuadro después; solo se corrige si hace falta.
      await frame()
      await frame()
      restoreAnchor(anchor)
    }
  }

  /** Cambia el modo. En el servidor (`?foco=1`) solo deja el estado y la cookie para el SSR. */
  function setHyperfocus(on: boolean): Promise<void> {
    if (import.meta.server) {
      commit(on)
      return Promise.resolve()
    }
    if (on === target()) return Promise.resolve()
    pending = on
    const done = () => {
      if (pending === on) pending = null
    }
    // El ancla se mide antes de tocar nada: es lo que el lector tenía delante.
    const anchor = readingAnchor(lenis)
    if (prefersReducedMotion() || !document.startViewTransition) {
      return apply(on, anchor, true).then(() => settleAnchor(anchor)).finally(done)
    }
    let transition: ViewTransition
    try {
      transition = document.startViewTransition({ update: () => apply(on, anchor), types: ['hiperfoco'] })
    }
    catch {
      // Navegadores con view transitions pero sin tipos: solo aceptan la función (y fundido común).
      transition = document.startViewTransition(() => apply(on, anchor))
    }
    // Después de los 220 ms, con las escenas ya rearmadas, la lectura vuelve a su lugar si se corrió.
    void transition.finished.catch(() => {}).then(() => settleAnchor(anchor))
    return transition.updateCallbackDone.catch(() => {}).finally(done)
  }

  /** Cómo queda el modo cuando termine el cambio en curso (o el estado actual, si no hay ninguno). */
  const target = () => (import.meta.client && pending !== null ? pending : state.value)

  const toggleHyperfocus = () => setHyperfocus(!target())

  return { isHyperfocus: readonly(state), target, setHyperfocus, toggleHyperfocus }
}
