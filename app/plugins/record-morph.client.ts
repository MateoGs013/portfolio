/**
 * Ver como registro (tecla R): el morph (docs/diseno.md §2.1). useRecordView cambia la URL al instante
 * y emite los dos hooks; este plugin es dueño de lo que pasa entre ellos:
 *
 * - `record:before`, con la página vieja: mide los valores, las cajas y el ancla de lectura, bloquea el
 *   alto del documento y recién entonces revierte las escenas de useMotion (pin, líneas partidas).
 * - `record:after`, con el DOM nuevo ya renderizado y antes de que se pinte (solo si la navegación pasó):
 *   escribe `data-vista` desde la ruta, ancla la página al primer valor visible, vuelve a armar las
 *   escenas (el morph llega a la composición final, con su pin), corrige el ancla, arma la coreografía
 *   (lib/morph) y la espera. Mientras corre, `busy` sigue en true y
 *   una segunda R se ignora.
 *
 * Con reduced motion el cambio es instantáneo, con la lectura en su lugar; en Hiperfoco los valores
 * viajan juntos en 250 ms. Una navegación o un cambio de Hiperfoco a mitad del morph lo adelantan al
 * final (`progress(1)`) y la capa se va. `window.__morph` (la línea de tiempo) existe solo en dev.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { armScenes, revertScenes } from '~/composables/useMotion'
import { captureBefore, classify, travelerKeys, type Before } from '~/lib/morph/flip'
import { buildMorph, MORPH, MORPH_FOCUS, type Morph } from '~/lib/morph/timeline'

interface Pending {
  root: HTMLElement
  before: Before
  /** Claves de los valores candidatos a ancla, en orden de preferencia. */
  anchors: string[]
  animate: boolean
}

/** El último ancla, para que R y R de nuevo vuelvan exactamente al mismo lugar. */
interface Memory {
  key: string
  scrollY: number
}

/** Lo más que se espera a Martian Mono antes de cambiar la URL. */
const MONO_WAIT = 100

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const floor = () => document.querySelector('header[data-chrome]')?.getBoundingClientRect().bottom ?? 0

/** Los valores que se están leyendo: primero los que empiezan en pantalla, después los que asoman. */
function anchorKeys(before: Before, memory: Memory | null): string[] {
  const top = floor()
  const list = [...before.travelers].sort(([, a], [, b]) => a.snap.rect.top - b.snap.rect.top)
  const starts = list.filter(([, t]) => t.snap.rect.top >= top && t.snap.rect.top < window.innerHeight)
  const peeks = list.filter(([, t]) => t.snap.rect.bottom > top && t.snap.rect.top < window.innerHeight)
  const keys = [...starts, ...peeks].map(([key]) => key)
  if (memory && Math.abs(window.scrollY - memory.scrollY) <= 1 && before.travelers.has(memory.key)) keys.unshift(memory.key)
  return [...new Set(keys)]
}

export default defineNuxtPlugin({
  name: 'record-morph',
  dependsOn: ['motion'],
  setup(nuxtApp) {
    const prefs = useMotionPrefs()
    const { lenis } = useLenis()
    const router = useRouter()
    const html = document.documentElement

    let pending: Pending | null = null
    let running: Morph | null = null
    let memory: Memory | null = null
    /** Las escenas quedaron revertidas por un `record:before` que todavía no tuvo su `record:after`. */
    let reverted = false

    function scrollToY(y: number) {
      const instance = lenis.value
      if (instance) {
        instance.resize()
        instance.scrollTo(y, { immediate: true, force: true })
      }
      else window.scrollTo({ top: y, behavior: 'instant' })
      // ScrollTrigger guarda el scroll en caché: que lea el nuevo.
      ScrollTrigger.update()
    }

    /**
     * El alto del documento queda fijo desde que se mide hasta que el morph termina: ni el cambio de
     * lectura ni lo que cargue en el camino recortan el scroll mientras los valores viajan.
     */
    function lockHeight() {
      document.body.style.minHeight = `${html.scrollHeight}px`
    }

    const unlockHeight = () => document.body.style.removeProperty('min-height')

    /**
     * Lleva el primer ancla que sigue en la página a la altura que tenía y devuelve su clave. La meta se
     * calcula en coordenadas del documento y se limita al alto real de la lectura nueva: si el registro
     * es más corto, los valores viajan directo a donde van a quedar y el final no salta.
     */
    function anchor(p: Pending, keys = travelerKeys(p.root)): string | null {
      unlockHeight()
      for (const key of p.anchors) {
        const el = keys.get(key)
        if (!el?.getClientRects().length) continue
        // El rect primero: fuerza el layout sin el bloqueo (y el recorte del scroll, si lo hay).
        const top = el.getBoundingClientRect().top
        const target = window.scrollY + top - p.before.travelers.get(key)!.snap.rect.top
        const y = Math.round(Math.max(0, Math.min(target, html.scrollHeight - window.innerHeight)))
        if (Math.abs(y - window.scrollY) >= 1) scrollToY(y)
        return key
      }
      return null
    }

    function writeVista(on: boolean) {
      if (on) html.dataset.vista = 'registro'
      else delete html.dataset.vista
    }

    /** El alto libre, los ScrollTrigger medidos de nuevo y la lectura corregida si algo se corrió. */
    async function settle(p: Pending, key: string | null) {
      unlockHeight()
      await nextTick()
      ScrollTrigger.refresh()
      if (key) anchor(p)
      memory = key ? { key, scrollY: window.scrollY } : null
    }

    /**
     * Nombres y tipos del registro van en la mono, que el diseño casi no usa: si todavía no cargó, el
     * registro se mediría con la fuente de reemplazo y el morph caería corrido un cuadro después.
     */
    const mono = () => `1em ${getComputedStyle(html).getPropertyValue('--font-mono').trim() || 'monospace'}`
    const loadMono = (): Promise<boolean> => (document.fonts.check(mono())
      ? Promise.resolve(true)
      : document.fonts.load(mono()).then(() => true, () => false))
    onNuxtReady(() => loadMono())

    /**
     * La URL cambia al instante: la mono se espera solo si el morph va a animar, y como mucho
     * MONO_WAIT ms. Si no llegó, el cambio es instantáneo (sin medir con la fuente de reemplazo).
     */
    const monoReady = () => Promise.race([
      loadMono(),
      new Promise<boolean>(resolve => setTimeout(() => resolve(false), MONO_WAIT)),
    ])

    nuxtApp.hook('record:before', async ({ on }) => {
      running?.tl.progress(1)
      const animate = prefs.allowTransitions.value && await monoReady()
      const root = document.getElementById('contenido')
      if (!root) {
        reverted = true
        revertScenes()
        return
      }
      const before = captureBefore(root, on, animate)
      pending = { root, before, anchors: anchorKeys(before, memory), animate }
      lockHeight()
      // Las comillas nacen apagadas: si se apagaran después, su transición de opacidad se vería.
      if (animate) root.classList.add('quotes-off')
      reverted = true
      revertScenes()
    })

    nuxtApp.hook('record:after', async ({ on }) => {
      const p = pending
      pending = null
      reverted = false
      // data-vista sale de la ruta, no del pedido: la ruta es el estado.
      writeVista(isRecordQuery(router.currentRoute.value.query))
      if (!p) {
        armScenes()
        ScrollTrigger.refresh()
        return
      }
      // Todo hasta el primer cuadro corre en esta misma tarea: el navegador no pinta el salto.
      // Primero un ancla aproximada, sin escenas: las que deciden al armarse qué está en pantalla
      // (RevealLines no parte lo que ya se ve) miden en el scroll de la lectura nueva, no en el viejo.
      anchor(p)
      // Las escenas se arman antes de medir: el pin y la pista de Obra, la captura que crece y lo que
      // ya está en pantalla quedan como se van a ver, así el morph llega a la composición final.
      armScenes()
      ScrollTrigger.refresh()
      const keys = travelerKeys(p.root)
      const key = anchor(p, keys)
      if (!p.animate) {
        await settle(p, key)
        // Con reduced motion el estilo final llega un cuadro después: se corrige solo si hace falta.
        await frame()
        await frame()
        if (key) {
          anchor(p)
          memory = { key, scrollY: window.scrollY }
        }
        return
      }
      html.dataset.morphing = ''
      lockHeight()
      const morph = buildMorph(p.root, classify(p.root, p.before, keys), on, prefs.hyperfocus.value ? MORPH_FOCUS : MORPH)
      running = morph
      if (import.meta.dev) (window as Window & { __morph?: Morph['tl'] }).__morph = morph.tl
      morph.tl.play()
      if (!morph.tl.duration()) morph.tl.progress(1)
      await morph.done
      running = null
      delete html.dataset.morphing
      await settle(p, key)
    })

    // Una navegación o un cambio de Hiperfoco a mitad del morph lo terminan ya, sin capa.
    const finish = () => running?.tl.progress(1)
    router.beforeEach(() => {
      finish()
    })
    watch(prefs.hyperfocus, finish, { flush: 'sync' })

    // Si la navegación de R falló, record:after no llega: se devuelve lo que se tomó.
    router.afterEach((_to, _from, failure) => {
      if (!failure || !reverted) return
      pending?.root.classList.remove('quotes-off')
      pending = null
      reverted = false
      unlockHeight()
      armScenes()
    })
  },
})
