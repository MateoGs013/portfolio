/**
 * Motor de movimiento del cliente (docs/diseno.md §2 y §6): registra los plugins de GSAP, crea Lenis
 * solo si `allowAmbient` (lo destruye con reduced motion o Hiperfoco y lo vuelve a crear al salir) y
 * coordina las escenas de useMotion con los hooks de la app:
 *
 * - `page:view-transition:start`: Lenis se detiene hasta que termina la transición; después se
 *   reanuda y ScrollTrigger recalcula con la página nueva.
 * - `site:overlay` ({ open }): una capa encima (la paleta) pausa Lenis y lo reanuda al cerrarse.
 * - `record:before` / `record:after`: las escenas se revierten con el DOM viejo y se arman con el nuevo.
 * - Hiperfoco: al cambiar, las escenas se rearman con el movimiento ambiental apagado o encendido.
 */
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import type { ShallowRef } from 'vue'
import { armScenes, beginNavigation, endNavigation, revertScenes } from '~/composables/useMotion'
import { installTintAnchors } from '~/composables/useTint'

/** El valor del prototipo (docs/diseno.md §2: Lenis lerp .1 con lagSmoothing(0)). */
const LERP = 0.1

/** Motivos por los que Lenis está detenido; corre solo cuando no queda ninguno. */
type Hold = 'transition' | 'overlay'

/** Un diálogo (la paleta) desplaza su propio contenido: Lenis no se mete. */
const isDialog = (node: HTMLElement) => node.matches('dialog, [role="dialog"], [aria-modal="true"]')

export default defineNuxtPlugin({
  name: 'motion',
  setup(nuxtApp) {
    gsap.registerPlugin(ScrollTrigger, SplitText, Flip)
    ScrollTrigger.config({ ignoreMobileResize: true })

    const prefs = useMotionPrefs()
    const lenis = shallowRef<Lenis | null>(null)
    const holds = new Set<Hold>()

    const raf = (time: number) => lenis.value?.raf(time * 1000)

    function create() {
      if (lenis.value) return
      const instance = new Lenis({ lerp: LERP, autoRaf: false, allowNestedScroll: true, prevent: isDialog })
      instance.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      if (holds.size) instance.stop()
      lenis.value = instance
    }

    function destroy() {
      if (!lenis.value) return
      gsap.ticker.remove(raf)
      lenis.value.destroy()
      lenis.value = null
      // Sin Lenis vuelve el suavizado de saltos por defecto de GSAP.
      gsap.ticker.lagSmoothing(500, 33)
    }

    function hold(reason: Hold) {
      holds.add(reason)
      lenis.value?.stop()
    }

    function release(reason: Hold) {
      holds.delete(reason)
      if (!holds.size) lenis.value?.start()
    }

    /** Después de que cambia la página o su layout, los ScrollTrigger miden de nuevo. */
    function refresh() {
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    watch(() => prefs.ready.value && prefs.allowAmbient.value, on => (on ? create() : destroy()), { immediate: true })

    nuxtApp.hook('page:view-transition:start', (transition) => {
      hold('transition')
      transition.finished.catch(() => {}).finally(() => {
        release('transition')
        refresh()
      })
    })

    // La ventana en la que lo que se monta es una página que entra (useMotion → `entering`): abre en el
    // guard del router, que corre antes del setup de la página nueva (los hooks de Nuxt corren en una
    // microtarea, tarde para eso), y cierra en page:finish, cuando la página ya se montó. Un cambio de
    // query en la misma página no remonta nada: cierra en el próximo tick.
    const router = useRouter()
    router.beforeEach(() => {
      if (!nuxtApp.isHydrating) beginNavigation()
    })
    router.afterEach((to, from, failure) => {
      if (failure || to.path === from.path) void nextTick(endNavigation)
    })
    nuxtApp.hook('page:finish', () => {
      endNavigation()
      refresh()
    })

    nuxtApp.hook('site:overlay', ({ open }) => (open ? hold('overlay') : release('overlay')))

    nuxtApp.hook('record:before', () => revertScenes())
    nuxtApp.hook('record:after', async () => {
      await nextTick()
      armScenes()
      refresh()
    })

    // El atributo data-hyperfocus lo pone el head: se rearma después de que el DOM lo tenga.
    watch(prefs.hyperfocus, async () => {
      revertScenes()
      await nextTick()
      armScenes()
      refresh()
    })

    installTintAnchors()

    // Solo lectura para el resto de la app: la instancia la maneja este plugin.
    return { provide: { lenis: lenis as Readonly<ShallowRef<Lenis | null>> } }
  },
})
