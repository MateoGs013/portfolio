<script setup lang="ts">
/**
 * Un video de la base (`Media` de tipo VIDEO): WebM y MP4, póster, mudo, en bucle y `playsinline`.
 * Corre solo mientras se ve (IntersectionObserver al 35 %) y según el modo:
 *
 * - `autoplay`: arranca solo (la portada del caso); es el único con `preload="auto"`.
 * - `in-view`: arranca al entrar en pantalla (los videos de la galería).
 * - `hover`: arranca al apuntar o enfocar la tarjeta o fila que lo contiene. En táctil pasa a `in-view`,
 *   salvo que el navegador pida ahorrar datos.
 *
 * Arrancar solo es ambiental (docs/diseno.md §6): con reduced motion, Hiperfoco o ahorro de datos se ve
 * el póster y nada arranca sin que lo pidan. El SSR nunca pinta `autoplay`: decide el cliente.
 * Pausa visible (WCAG 2.2.2): un botón sobre el video, abajo a la izquierda (las capturas suelen tener
 * su propio botón flotante abajo a la derecha). Dentro de un enlace no puede haber un botón,
 * así que ahí lo que arranca solo se detiene a los 5 s (el margen que da la pauta).
 */
import type { Media } from '~/lib/api'
import type { VtName } from '~/composables/useMotion'

type Mode = 'hover' | 'in-view' | 'autoplay'

const props = withDefaults(defineProps<{
  media: Media
  mode?: Mode
  vt?: VtName
  /** Dónde se escucha el hover: el contenedor interactivo más cercano. */
  hoverTarget?: string
  /** Va sobre una imagen que ya lo describe: el lector no lo anuncia dos veces. */
  decorative?: boolean
}>(), { mode: 'in-view', vt: undefined, hoverTarget: '[data-card], [data-row], [data-view], a', decorative: false })

/** Lo visible que tiene que estar para correr. */
const THRESHOLD = 0.35
/** Al dejar de apuntar, el video se funde antes de pausarse. */
const HOVER_PAUSE_MS = 500
/** WCAG 2.2.2: lo que se mueve solo y no se puede pausar dura 5 s o menos. */
const UNPAUSABLE_MS = 5000

const { t, langAttr } = useLocale()
const prefs = useMotionPrefs()

const root = useTemplateRef<HTMLElement>('root')
const video = useTemplateRef<HTMLVideoElement>('video')

const mounted = ref(false)
const inLink = ref(false)
const visible = ref(false)
const hovered = ref(false)
const playing = ref(false)
const capped = ref(false)
/** Lo que pidió la persona con el botón: manda sobre lo automático. */
const choice = ref<'auto' | 'play' | 'pause'>('auto')

/** El disparador real en este dispositivo. */
const trigger = computed<Mode | 'none'>(() => {
  if (!prefs.ready.value) return 'none'
  if (props.mode !== 'hover' || prefs.fine.value) return props.mode
  return prefs.saveData.value ? 'none' : 'in-view'
})

const ambient = computed(() => prefs.allowAmbient.value && !prefs.saveData.value)
const automatic = computed(() => ambient.value && (trigger.value === 'autoplay' || trigger.value === 'in-view'))
const controls = computed(() => mounted.value && !inLink.value)

const shouldPlay = computed(() => {
  if (!visible.value || choice.value === 'pause') return false
  if (choice.value === 'play') return true
  if (trigger.value === 'hover') return prefs.allowAmbient.value && hovered.value
  return automatic.value && !capped.value
})

const preload = computed(() => (props.mode === 'autoplay' && automatic.value ? 'auto' : 'none'))

let pauseTimer = 0
let capTimer = 0

function start(el: HTMLVideoElement) {
  clearTimeout(pauseTimer)
  el.muted = true
  el.preload = 'auto'
  el.play().catch(() => {})
  // Sin botón posible, lo automático se detiene solo a los 5 s.
  if (!controls.value && choice.value === 'auto' && trigger.value !== 'hover') {
    clearTimeout(capTimer)
    capTimer = window.setTimeout(() => {
      capped.value = true
    }, UNPAUSABLE_MS)
  }
}

function stop(el: HTMLVideoElement, delay: number) {
  clearTimeout(capTimer)
  clearTimeout(pauseTimer)
  if (delay) pauseTimer = window.setTimeout(() => el.pause(), delay)
  else el.pause()
}

watch([shouldPlay, video], ([on, el]) => {
  if (!el || !mounted.value) return
  if (on) start(el)
  else stop(el, trigger.value === 'hover' ? HOVER_PAUSE_MS : 0)
})

// Al apagarse lo ambiental (Hiperfoco, reduced motion) lo que corría solo vuelve al póster
// (docs/diseno.md §5), no se queda quieto en el cuadro en que estaba. load() descarta lo cargado y
// vuelve a mostrar el póster; lo que la persona arrancó con el botón sigue siendo suyo.
watch(ambient, (on) => {
  const el = video.value
  if (on || !el || !mounted.value || choice.value !== 'auto') return
  stop(el, 0)
  if (props.media.poster && el.currentTime > 0) el.load()
})

function toggle() {
  choice.value = playing.value ? 'pause' : 'play'
}

let observer: IntersectionObserver | null = null
let hoverEl: Element | null = null
const onEnter = () => (hovered.value = true)
const onLeave = (e: Event) => {
  const next = (e as PointerEvent | FocusEvent).relatedTarget
  if (!(next instanceof Node && hoverEl?.contains(next))) hovered.value = false
}

onMounted(() => {
  const el = root.value
  if (!el) return
  inLink.value = !!el.closest('a, button')
  hoverEl = el.closest(props.hoverTarget) ?? el
  hoverEl.addEventListener('pointerenter', onEnter)
  hoverEl.addEventListener('pointerleave', onLeave)
  hoverEl.addEventListener('focusin', onEnter)
  hoverEl.addEventListener('focusout', onLeave)
  observer = new IntersectionObserver(([entry]) => {
    visible.value = !!entry?.isIntersecting
    if (!visible.value) capped.value = false
  }, { threshold: THRESHOLD })
  observer.observe(el)
  mounted.value = true
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  hoverEl?.removeEventListener('pointerenter', onEnter)
  hoverEl?.removeEventListener('pointerleave', onLeave)
  hoverEl?.removeEventListener('focusin', onEnter)
  hoverEl?.removeEventListener('focusout', onLeave)
  clearTimeout(pauseTimer)
  clearTimeout(capTimer)
  video.value?.pause()
})
</script>

<template>
  <!-- data-playing: corre y se lo quiere ver; quien lo usa funde el video sobre la captura. -->
  <div ref="root" class="relative" :data-playing="playing && shouldPlay ? '' : undefined">
    <video
      ref="video"
      class="block size-full object-cover"
      muted
      loop
      playsinline
      :poster="media.poster ?? undefined"
      :preload="preload"
      :width="media.width"
      :height="media.height"
      :aria-label="!decorative && media.alt || undefined"
      :aria-hidden="!decorative && media.alt ? undefined : 'true'"
      :lang="langAttr(media, 'alt')"
      :data-vt="vt"
      @playing="playing = true"
      @pause="playing = false"
    >
      <source v-if="media.srcWebm" :src="media.srcWebm" type="video/webm">
      <source :src="media.src" type="video/mp4">
    </video>
    <button
      v-if="controls"
      type="button"
      data-chrome
      :aria-label="playing ? t('motion.pause') : t('motion.play')"
      class="absolute start-3 bottom-3 grid size-11 place-items-center rounded-full bg-black/60 text-white transition-colors duration-200 hover:bg-black/80"
      @click="toggle"
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" class="size-4" fill="currentColor">
        <path v-if="playing" d="M4 3h3v10H4zM9 3h3v10H9z" />
        <path v-else d="M5 2.5v11l9-5.5z" />
      </svg>
    </button>
  </div>
</template>
