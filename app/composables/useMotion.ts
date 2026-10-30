/**
 * Toda animación vive acá (docs/diseno.md §6). `useMotion(scope, setup)` arma una escena: un contexto de
 * GSAP con `gsap.matchMedia` (motion, fine, desktop) sobre el elemento `scope`. `setup` crea tweens,
 * ScrollTriggers y SplitTexts adentro y puede devolver su propia limpieza. Revertir la escena deshace
 * todo (incluidos los pin-spacers), así que:
 *
 * - se revierte en `onBeforeUnmount`, antes de que Vue saque el DOM;
 * - se revierte en `record:before` y se vuelve a armar en `record:after` (lo avisa motion.client.ts);
 * - se vuelve a armar cuando cambia el Hiperfoco o cuando el elemento `scope` es otro (un `:key`).
 *
 * Nunca corre en el servidor ni durante el render: solo desde `onMounted`.
 */
import gsap from 'gsap'
import type { MaybeRefOrGetter } from 'vue'

/** Nombres estáticos de view transition (`data-vt`, docs/diseno.md §4). */
export type VtName = 'title' | 'cover' | 'page-title' | 'cv-sheet'

/** `all` siempre coincide: sin ella, matchMedia no llama a `setup` si no coincide ninguna otra. */
const QUERIES = {
  all: 'all',
  motion: '(prefers-reduced-motion: no-preference)',
  fine: '(hover: hover) and (pointer: fine)',
  desktop: '(min-width: 48rem)',
} as const

export interface MotionScene {
  /** El elemento raíz de la escena (el `scope`). */
  el: HTMLElement
  /** Sin prefers-reduced-motion. */
  motion: boolean
  /** Puntero fino con hover. */
  fine: boolean
  /** 768 px o más (el único corte de diseño). */
  desktop: boolean
  hyperfocus: boolean
  /** allowAmbient: hay movimiento y no hay Hiperfoco. */
  ambient: boolean
  /** allowTransitions: respuestas a una acción. */
  transitions: boolean
  /**
   * Primer armado de una página que entra por navegación del cliente. Es false al hidratar y al volver
   * a armar (registro, Hiperfoco, otro texto): ahí lo que ya está en pantalla no se anima.
   */
  entering: boolean
  /** Corre `fn` dentro del contexto de la escena, para que lo que cree se revierta con ella. */
  add: <T>(fn: () => T) => T
}

export type MotionSetup = (scene: MotionScene) => (() => void) | undefined

interface Scene {
  arm: () => void
  revert: () => void
}

/** Escenas montadas; motion.client.ts las revierte y las vuelve a armar en bloque. */
const scenes = new Set<Scene>()

/**
 * Hay una navegación del cliente en curso (del guard del router a `page:finish`, que avisa
 * motion.client.ts). Solo lo que se monta en esa ventana es una página que entra: un componente que
 * aparece después (v-if, ClientOnly, un fetch diferido) se comporta como al hidratar.
 */
let navigating = false

export function beginNavigation() {
  navigating = true
}

export function endNavigation() {
  navigating = false
}

export function revertScenes() {
  scenes.forEach(scene => scene.revert())
}

export function armScenes() {
  scenes.forEach(scene => scene.arm())
}

export function useMotion(scope: MaybeRefOrGetter<HTMLElement | null | undefined>, setup: MotionSetup) {
  let context: gsap.Context | null = null
  const add = <T>(fn: () => T): T => (context && !context.isReverted ? context.add(fn) : fn())
  if (import.meta.server) return { add }

  const nuxtApp = useNuxtApp()
  const { isHyperfocus } = useHyperfocus()
  let entering = navigating && !nuxtApp.isHydrating
  let mm: gsap.MatchMedia | null = null
  let mounted = false

  function arm() {
    const el = toValue(scope)
    if (!mounted || mm || !el?.isConnected) return
    mm = gsap.matchMedia(el)
    mm.add(QUERIES, (ctx) => {
      context = ctx
      const { motion = false, fine = false, desktop = false } = ctx.conditions ?? {}
      const hyperfocus = isHyperfocus.value
      return setup({ el, motion, fine, desktop, hyperfocus, ambient: motion && !hyperfocus, transitions: motion, entering, add })
    }, el)
    entering = false
  }

  function revert() {
    mm?.revert()
    mm = null
    context = null
  }

  const scene: Scene = { arm, revert }

  onMounted(() => {
    mounted = true
    scenes.add(scene)
    arm()
  })

  onBeforeUnmount(() => {
    mounted = false
    scenes.delete(scene)
    revert()
  })

  // Otro elemento (un :key que cambió): la escena vieja se deshace y se arma sobre el nuevo.
  watch(() => toValue(scope), (el, old) => {
    if (!mounted || el === old) return
    revert()
    arm()
  }, { flush: 'post' })

  return { add }
}
