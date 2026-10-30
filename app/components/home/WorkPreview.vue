<script setup lang="ts">
/**
 * Vista previa de la obra del inicio (Seguir, docs/diseno.md §2; movimiento.html, `.preview`): una
 * caja 16:10 con la tira de portadas de las obras, que sigue al cursor sobre las filas. Va 32 px a la
 * derecha del puntero sin salirse de la pantalla, con lerp .14 y un giro de hasta ±8° según la
 * velocidad; entra en 0,5 s `expo.out` desde escala .8, sale en 0,35 s y cambia de obra deslizando la
 * tira (0,7 s `expo.out`). Con reduced motion sigue al puntero sin lerp, sin giro y sin deslizar.
 *
 * Solo con puntero fino y sin Hiperfoco (en táctil la fila trae su miniatura). Es decorativa
 * (`aria-hidden`) y se oculta en Hiperfoco e impresión (`data-hf="hide"`). Al hacer click en una fila,
 * el plugin de elementos compartidos nombra `cover` a la imagen visible de la caja `[data-preview]`
 * (cada una lleva `data-preview-cover` con la ruta de su obra): la imagen se vuelve la portada del caso.
 *
 * La controla HomeSelectedWork con `show(índice, evento)` y `hide()`.
 */
import gsap from 'gsap'
import type { ProjectSummary } from '~/lib/api'

const props = defineProps<{
  projects: readonly ProjectSummary[]
}>()

/** Distancia al cursor y margen contra el borde derecho de la pantalla, en px. */
const OFFSET = 32
const EDGE = 24
const MAX_TILT = 8
const TILT = 0.06

const prefs = useMotionPrefs()
const { follow, snap } = useCursor()
const router = useRouter()

const active = computed(() => prefs.ready.value && prefs.fine.value && !prefs.hyperfocus.value)
const items = computed(() => props.projects.map(p => ({
  slug: p.slug,
  title: p.title,
  cover: p.media.find(m => m.role === 'COVER' && m.kind === 'IMAGE') ?? null,
})))

const root = useTemplateRef<HTMLElement>('root')

interface Controls {
  show: (index: number, e: PointerEvent) => void
  hide: () => void
}

let controls: Controls | null = null

useMotion(root, ({ el, motion, add }) => {
  const box = el.querySelector<HTMLElement>('[data-preview]')
  const strip = el.querySelector<HTMLElement>('[data-strip]')
  if (!box || !strip) return

  gsap.set(el, { yPercent: -50 })
  gsap.set(box, { opacity: 0, scale: 0.8 })
  const setX = gsap.quickSetter(el, 'x', 'px')
  const setY = gsap.quickSetter(el, 'y', 'px')
  const setTilt = gsap.quickSetter(el, 'rotation', 'deg')
  let unfollow: (() => void) | null = null
  let shown = -1

  /** El borde izquierdo de la caja: a la derecha del cursor, sin salirse de la pantalla. */
  const left = (x: number) => Math.min(x + OFFSET, window.innerWidth - el.offsetWidth - EDGE)

  function place(x: number, y: number, vx: number) {
    setX(left(x))
    setY(y)
    setTilt(motion ? gsap.utils.clamp(-MAX_TILT, MAX_TILT, vx * TILT) : 0)
  }

  function slide(index: number, instant: boolean) {
    const y = -index * box!.offsetHeight
    add(() => gsap.to(strip!, { y, duration: instant || !motion ? 0 : 0.7, ease: 'expo.out', overwrite: true }))
  }

  function show(index: number, e: PointerEvent) {
    const first = !unfollow
    if (first) {
      snap(e)
      place(e.clientX, e.clientY, 0)
      unfollow = follow(f => (motion ? place(f.sx, f.sy, f.vx) : place(f.x, f.y, 0)))
      add(() => gsap.to(box!, { opacity: 1, scale: 1, duration: motion ? 0.5 : 0, ease: 'expo.out', overwrite: true }))
    }
    if (index !== shown) slide(index, first)
    shown = index
  }

  function stop() {
    unfollow?.()
    unfollow = null
  }

  function hide() {
    if (!unfollow) return
    shown = -1
    add(() => gsap.to(box!, { opacity: 0, scale: 0.8, duration: motion ? 0.35 : 0, ease: 'power2.out', overwrite: true, onComplete: stop }))
  }

  controls = { show, hide }
  // La caja se queda en la foto de salida de la view transition (su imagen viaja) y se va con la página.
  const offRoute = router.afterEach(stop)

  return () => {
    controls = null
    offRoute()
    stop()
  }
})

defineExpose({
  show: (index: number, e: PointerEvent) => controls?.show(index, e),
  hide: () => controls?.hide(),
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="active && items.length"
        ref="root"
        aria-hidden="true"
        data-hf="hide"
        class="pointer-events-none fixed top-0 left-0 z-15 aspect-[16/10] w-[min(26rem,30vw)]"
      >
        <div data-preview class="size-full overflow-hidden rounded-[3px] opacity-0">
          <div data-strip>
            <template v-for="item in items" :key="item.slug">
              <MediaImage
                v-if="item.cover"
                :media="item.cover"
                decorative
                loading="eager"
                fetchpriority="low"
                sizes="26rem"
                :data-preview-cover="`/projects/${item.slug}`"
                class="block aspect-[16/10] w-full object-cover"
              />
              <div
                v-else
                :data-preview-cover="`/projects/${item.slug}`"
                class="flex aspect-[16/10] w-full items-end bg-surface p-4 text-xl text-ink"
              >
                {{ item.title }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>
