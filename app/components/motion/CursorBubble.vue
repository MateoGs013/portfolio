<script setup lang="ts">
/**
 * Burbuja «Ver caso» (Seguir, docs/diseno.md §2): un círculo de 5,5 rem que acompaña al cursor sobre
 * todo `[data-view]` (tarjetas y filas). Crece y se encoge con `quickTo` en la escala; al salir se
 * esconde con un timeout corto que se cancela si el puntero entra en otro `[data-view]`, así pasar de
 * una tarjeta a la vecina no parpadea. Solo existe con puntero fino y movimiento ambiental: en táctil,
 * con reduced motion o en Hiperfoco no se monta. Es decorativa: el enlace ya dice adónde va.
 */
import gsap from 'gsap'

/** Cuánto espera antes de esconderse al salir de un `[data-view]`. */
const HIDE_DELAY_MS = 80
/** Cuánto tarda en encogerse antes de dejar de seguir al cursor. */
const SHRINK_MS = 500

const { t } = useLocale()
const prefs = useMotionPrefs()
const { follow, snap } = useCursor()
const router = useRouter()

const active = computed(() => prefs.ready.value && prefs.fine.value && prefs.allowAmbient.value)
const bubble = useTemplateRef<HTMLElement>('bubble')

useMotion(bubble, ({ el, fine, ambient }) => {
  if (!fine || !ambient) return

  gsap.set(el, { scale: 0 })
  // quickTo no admite el atajo `scale`: se mueven los dos ejes juntos.
  const scaleX = gsap.quickTo(el, 'scaleX', { duration: 0.5, ease: 'expo.out' })
  const scaleY = gsap.quickTo(el, 'scaleY', { duration: 0.5, ease: 'expo.out' })
  const scale = (to: number) => {
    scaleX(to)
    scaleY(to)
  }
  const setX = gsap.quickSetter(el, 'x', 'px')
  const setY = gsap.quickSetter(el, 'y', 'px')
  let unfollow: (() => void) | null = null
  let hideTimer = 0
  let stopTimer = 0

  function show(e: PointerEvent) {
    clearTimeout(hideTimer)
    clearTimeout(stopTimer)
    if (!unfollow) {
      snap(e)
      setX(e.clientX)
      setY(e.clientY)
      unfollow = follow((frame) => {
        setX(frame.sx)
        setY(frame.sy)
      })
    }
    scale(1)
  }

  function stopFollowing() {
    unfollow?.()
    unfollow = null
  }

  function hide(delay = HIDE_DELAY_MS) {
    clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => {
      scale(0)
      stopTimer = window.setTimeout(stopFollowing, SHRINK_MS)
    }, delay)
  }

  const viewOf = (target: EventTarget | null) => (target instanceof Element ? target.closest('[data-view]') : null)
  const onOver = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && viewOf(e.target)) show(e)
  }
  const onOut = (e: PointerEvent) => {
    const from = viewOf(e.target)
    if (from && from !== viewOf(e.relatedTarget)) hide()
  }

  document.addEventListener('pointerover', onOver, { passive: true })
  document.addEventListener('pointerout', onOut, { passive: true })
  // Al navegar se va enseguida: la foto de salida de la view transition no la lleva.
  const offRoute = router.beforeEach(() => {
    clearTimeout(hideTimer)
    gsap.set(el, { scale: 0 })
    stopFollowing()
  })

  return () => {
    document.removeEventListener('pointerover', onOver)
    document.removeEventListener('pointerout', onOut)
    offRoute()
    clearTimeout(hideTimer)
    clearTimeout(stopTimer)
    stopFollowing()
  }
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="active"
        ref="bubble"
        aria-hidden="true"
        data-hf="hide"
        class="pointer-events-none fixed top-0 left-0 z-35 -mt-11 -ml-11 grid size-22 place-items-center rounded-full bg-ink text-xs font-title text-bg [transform:scale(0)]"
      >
        {{ t('motion.viewCase') }}
      </div>
    </Teleport>
  </ClientOnly>
</template>
