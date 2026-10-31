<script setup lang="ts">
/**
 * La galería de Obra (Deslizar y Seguir, docs/diseno.md §2). El SSR la entrega como grilla (dos
 * columnas desde 768 px, una debajo y en Hiperfoco): así se lee sin JS, con reduced motion y en táctil
 * angosto, y ninguna tarjeta queda recortada. Con movimiento ambiental y desde 768 px, JS la vuelve una
 * pista horizontal que mueve el scroll vertical:
 *
 * - `pin` del escenario interno (nunca de la raíz del componente, que Vue tiene que poder sacar), con
 *   `scrub: .8`, `invalidateOnRefresh` y una barra de progreso de 1 px.
 * - Parallax de cada imagen dentro de su marco (±5 %, `containerAnimation`).
 * - `skewX` por velocidad de scroll con `quickTo` (tope ±6°), que vuelve a 0 al frenar y antes de
 *   navegar, así la foto de la view transition sale derecha.
 * - Foco con Tab o j/k en una tarjeta fuera de cuadro: el scroll (Lenis si está) la trae a la vista.
 *
 * Las tarjetas miden lo mismo en la grilla y en la pista (con tope, así en pantallas anchas asoma la
 * tercera, como en el prototipo): la primera fila no salta al hidratar. La pista se fija cuando su
 * centro llega al centro de la pantalla, o al cargar si en una pantalla alta ya lo pasó (`clamp`). Al
 * filtrar, las que quedan se acomodan con FLIP (600 ms `expo.out`; 220 ms en Hiperfoco) y las que entran
 * suben 10 px. Al imprimir la pista se apaga: Obra se imprime como grilla.
 */
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ProjectSummary } from '~/lib/api'

const props = defineProps<{
  projects: readonly ProjectSummary[]
}>()

const SKEW_MAX = 6
/** Grados por px/s de velocidad: el −velocity × .18 del prototipo, con la velocidad por cuadro de Lenis. */
const SKEW_PER_SPEED = 0.003
const PARALLAX = 5
const SCRUB = 0.8

const { t } = useLocale()
const { scrollTo } = useLenis()
const router = useRouter()

const root = useTemplateRef<HTMLElement>('root')
const stage = useTemplateRef<HTMLElement>('stage')
const track = useTemplateRef<HTMLElement>('track')
const bar = useTemplateRef<HTMLElement>('bar')

const slugs = computed(() => props.projects.map(p => p.slug).join(' '))

/** Lo que la escena hace antes y después de que Vue cambie las tarjetas (filtrar). */
let beforeChange: (() => void) | null = null
let afterChange: (() => void) | null = null
watch(slugs, () => beforeChange?.(), { flush: 'pre' })
watch(slugs, () => afterChange?.(), { flush: 'post' })

const items = () => [...(track.value?.children ?? [])] as HTMLElement[]
const layers = (selector: string) => items().map(li => li.querySelector<HTMLElement>(selector)).filter(el => el !== null)

interface Horizontal {
  /** Las tarjetas cambiaron: parallax nuevo y medidas nuevas. */
  rebuild: () => void
  destroy: () => void
}

/** La pista horizontal. Crea todo dentro de la escena: revertirla deshace el pin y su espaciador. */
function horizontal(el: HTMLElement, pinned: HTMLElement, list: HTMLElement, add: <T>(fn: () => T) => T): Horizontal {
  el.dataset.track = ''
  const dist = () => Math.max(0, list.scrollWidth - pinned.clientWidth)
  const tween = gsap.to(list, { x: () => -dist(), ease: 'none' })

  let skews = layers('[data-motion="skew"]')
  const lean = { v: 0 }
  const toLean = gsap.quickTo(lean, 'v', { duration: 0.6, ease: 'power3', onUpdate: () => gsap.set(skews, { skewX: lean.v }) })
  const setBar = bar.value ? gsap.quickSetter(bar.value, 'scaleX') : null
  let leaving = false

  const st = ScrollTrigger.create({
    trigger: list,
    // En una pantalla alta el centro de la pista ya pasó el de la pantalla al cargar: sin clamp el
    // inicio sería negativo y la página cargaría adentro del pin, con la primera tarjeta recortada.
    start: 'clamp(center center)',
    end: () => `+=${dist()}`,
    pin: pinned,
    scrub: SCRUB,
    animation: tween,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      setBar?.(self.progress)
      if (!leaving) toLean(gsap.utils.clamp(-SKEW_MAX, SKEW_MAX, -self.getVelocity() * SKEW_PER_SPEED))
    },
    onToggle: (self) => {
      if (!self.isActive) toLean(0)
    },
  })

  let parallax: gsap.core.Tween[] = []
  function buildParallax() {
    parallax.forEach((p) => {
      p.scrollTrigger?.kill()
      p.kill()
    })
    parallax = layers('[data-motion="parallax"]').map(layer => gsap.fromTo(layer, { xPercent: -PARALLAX }, {
      xPercent: PARALLAX,
      ease: 'none',
      scrollTrigger: { trigger: layer.closest('li'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
    }))
  }
  buildParallax()

  const settle = () => toLean(0)
  ScrollTrigger.addEventListener('scrollEnd', settle)

  // La foto de salida de la view transition se toma con las tarjetas derechas.
  const offBefore = router.beforeEach((to, from) => {
    if (to.path === from.path) return
    leaving = true
    gsap.killTweensOf(lean)
    lean.v = 0
    gsap.set(skews, { skewX: 0 })
  })
  const offAfter = router.afterEach((_to, _from, failure) => {
    if (failure) leaving = false
  })

  /** Una tarjeta enfocada con teclado fuera de cuadro: el scroll lleva la pista hasta centrarla. El
   *  foco del click no mueve nada (la portada se está midiendo para la view transition). */
  function reveal(e: FocusEvent) {
    if (!(e.target instanceof Element) || !e.target.matches(':focus-visible')) return
    const li = e.target.closest('li')
    if (!li || li.parentElement !== list) return
    const r = li.getBoundingClientRect()
    if (r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight) return
    const d = dist()
    const progress = d ? gsap.utils.clamp(0, 1, (li.offsetLeft + li.offsetWidth / 2 - pinned.clientWidth / 2) / d) : 0
    scrollTo(st.start + progress * (st.end - st.start))
  }
  list.addEventListener('focusin', reveal)

  requestAnimationFrame(() => ScrollTrigger.refresh())

  return {
    rebuild() {
      skews = layers('[data-motion="skew"]')
      add(buildParallax)
      ScrollTrigger.refresh()
    },
    destroy() {
      ScrollTrigger.removeEventListener('scrollEnd', settle)
      list.removeEventListener('focusin', reveal)
      offBefore()
      offAfter()
      gsap.killTweensOf(lean)
      parallax.forEach(p => p.revert())
      st.kill(true)
      tween.revert()
      gsap.set(skews, { clearProps: 'transform' })
      setBar?.(0)
      delete el.dataset.track
    },
  }
}

useMotion(root, ({ el, desktop, ambient, transitions, hyperfocus, add }) => {
  const pinned = stage.value
  const list = track.value
  if (!pinned || !list) return

  // Con dos tarjetas o menos la grilla ya es la pista: no hay nada que desplazar.
  const wantsRail = () => desktop && ambient && list.children.length > 2
  let rail = wantsRail() ? horizontal(el, pinned, list, add) : null

  let state: Flip.FlipState | null = null
  beforeChange = () => {
    state = transitions ? Flip.getState(items()) : null
  }
  afterChange = () => {
    if (rail && !wantsRail()) {
      rail.destroy()
      rail = null
      ScrollTrigger.refresh()
    }
    else if (!rail && wantsRail()) rail = add(() => horizontal(el, pinned, list, add))
    else rail?.rebuild()
    if (!state) return
    const from = state
    state = null
    const duration = hyperfocus ? 0.22 : 0.6
    add(() => Flip.from(from, {
      targets: items(),
      duration,
      ease: 'expo.out',
      onEnter: entering => gsap.fromTo(entering, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration, ease: 'expo.out' }),
    }))
  }

  // Impresa, la pista sería dos tarjetas recortadas y un escenario fijo en cada hoja: se vuelve grilla.
  const offPrint = () => {
    rail?.destroy()
    rail = null
  }
  const onPrint = () => {
    if (!rail && wantsRail()) rail = add(() => horizontal(el, pinned, list, add))
  }
  window.addEventListener('beforeprint', offPrint)
  window.addEventListener('afterprint', onPrint)

  return () => {
    window.removeEventListener('beforeprint', offPrint)
    window.removeEventListener('afterprint', onPrint)
    beforeChange = null
    afterChange = null
    rail?.destroy()
  }
})
</script>

<template>
  <section
    ref="root"
    :aria-label="t('work.gallery')"
    class="group/gallery [--card-w:min(calc((100cqw-2*var(--pad)-var(--gal-gap))/2),42vw,46rem,calc((100svh-13rem)*1.6))] [--gal-gap:clamp(1.5rem,4vw,4rem)]"
  >
    <div ref="stage" class="@container group-data-[track]/gallery:overflow-x-clip">
      <ul
        ref="track"
        data-motion="track"
        class="relative grid gap-x-(--gal-gap) gap-y-[clamp(3rem,9vh,6rem)] px-pad md:grid-cols-2 focus-mode:md:grid-cols-1 group-data-[track]/gallery:flex group-data-[track]/gallery:w-max"
      >
        <li
          v-for="(p, i) in projects"
          :key="p.slug"
          :data-flip-id="p.slug"
          class="min-w-0 group-data-[track]/gallery:w-(--card-w) group-data-[track]/gallery:flex-none"
        >
          <WorkCard :project="p" :eager="i < 2" :priority="i === 0" />
        </li>
      </ul>
      <div data-ornament aria-hidden="true" class="relative mx-pad mt-[clamp(1.5rem,5vh,3rem)] hidden h-px bg-rule group-data-[track]/gallery:block">
        <i ref="bar" class="absolute inset-0 origin-left scale-x-0 bg-ink" />
      </div>
    </div>
  </section>
</template>
