<script lang="ts">
import gsap from 'gsap'
import type { InjectionKey, Ref } from 'vue'

/** Una línea del popover; `lang="es"` si quedó sin traducir. */
export interface PeekLine {
  text: string
  lang?: string
}

export interface PeekContent {
  heading: string
  lines: PeekLine[]
}

/** Lo que usa cada disparador (CasePeekTrigger) para abrir, mover y cerrar el único popover. */
export interface PeekApi {
  activeId: Readonly<Ref<string | null>>
  /** Abre en `anchor` o, si ya hay otro abierto, viaja hasta él. `pinned`: lo abrió un click o una tecla. */
  show: (id: string, content: PeekContent, anchor: HTMLElement, pinned: boolean) => void
  /** El puntero salió: se cierra en un momento, salvo que esté fijado o vuelva. */
  leave: (id: string) => void
  toggle: (id: string, content: PeekContent, anchor: HTMLElement) => void
}

export const PEEK_KEY: InjectionKey<PeekApi> = Symbol('case-peek')
</script>

<script setup lang="ts">
/**
 * Asomar (docs/diseno.md §2): un solo popover para todo el caso. Crece desde su ancla (scale .96 → 1,
 * blur 2 px → 0, 260 ms `expo.out`) y, si está abierto y se pasa a otra ancla, viaja y cambia de tamaño
 * en 340 ms sin cerrarse: el marco se mueve con `transform`, el fondo escala y el texto nuevo se funde.
 * Se ubica debajo de todo el valor (`[data-peek-group]`), así no tapa a los vecinos de la lista.
 *
 * Es solo visual (`aria-hidden`): cada disparador lleva su texto en un `aria-describedby` que ya viene
 * en el SSR. Esc lo cierra antes de salir del Hiperfoco (useEscapeLayer). Con reduced motion o
 * Hiperfoco aparece sin animar. Suena el tic al abrir, no al viajar.
 */
const OPEN_S = 0.26
const TRAVEL_S = 0.34
const CLOSE_S = 0.16
/** Separación entre el valor y el popover. */
const GAP = 10
/** Margen contra los bordes del caso. */
const EDGE = 16
/** Tiempo para cruzar del ancla al popover sin que se cierre. */
const LEAVE_MS = 180

const root = useTemplateRef<HTMLElement>('root')
const panel = useTemplateRef<HTMLElement>('panel')
const plate = useTemplateRef<HTMLElement>('plate')
const body = useTemplateRef<HTMLElement>('body')

const activeId = ref<string | null>(null)
const content = shallowRef<PeekContent | null>(null)
const pinned = ref(false)

const prefs = useMotionPrefs()
const { tick } = useSound()
const animated = computed(() => prefs.allowTransitions.value && !prefs.hyperfocus.value)
const { add } = useMotion(root, () => undefined)

let anchor: HTMLElement | null = null
let leaveTimer = 0
/** Cada apertura invalida a la anterior que todavía esperaba el render. */
let run = 0
let place = { x: 0, y: 0 }

function reset() {
  activeId.value = null
  content.value = null
  pinned.value = false
  anchor = null
}

function stopTweens() {
  gsap.killTweensOf([panel.value, plate.value, body.value])
}

/** Debajo de todo el valor, alineado con el ancla y sin salirse del caso. */
function measure(target: HTMLElement, el: HTMLElement, box: HTMLElement) {
  const group = target.closest<HTMLElement>('[data-peek-group]') ?? target
  const r = box.getBoundingClientRect()
  const x = target.getBoundingClientRect().left - r.left
  const y = group.getBoundingClientRect().bottom - r.top + GAP
  return { x: Math.max(EDGE, Math.min(x, r.width - el.offsetWidth - EDGE)), y }
}

async function show(id: string, next: PeekContent, target: HTMLElement, pin: boolean) {
  clearTimeout(leaveTimer)
  if (activeId.value === id) {
    pinned.value ||= pin
    return
  }
  const el = panel.value
  const box = root.value
  if (!el || !box) return
  // Si estaba viajando, sale desde donde se lo ve ahora, no desde su destino anterior.
  const from = activeId.value
    ? { x: place.x + Number(gsap.getProperty(el, 'x')), y: place.y + Number(gsap.getProperty(el, 'y')), w: el.offsetWidth, h: el.offsetHeight }
    : null
  const current = ++run
  stopTweens()
  activeId.value = id
  content.value = next
  pinned.value = pin
  anchor = target
  await nextTick()
  if (current !== run || !panel.value) return
  // Se mide con todo el ancho disponible: pegado a un borde, el ancho se encogería.
  el.style.left = '0px'
  place = measure(target, el, box)
  el.style.left = `${place.x}px`
  el.style.top = `${place.y}px`
  if (!from) tick(1200)
  if (!animated.value) {
    gsap.set([el, plate.value, body.value], { clearProps: 'transform,opacity,filter' })
    return
  }
  add(() => {
    if (!from) {
      gsap.set([plate.value, body.value], { clearProps: 'transform,opacity' })
      gsap.fromTo(el, { opacity: 0, scale: 0.96, filter: 'blur(2px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: OPEN_S, ease: 'expo.out', clearProps: 'filter' })
      return
    }
    const w = el.offsetWidth || 1
    const h = el.offsetHeight || 1
    gsap.set(el, { opacity: 1, scale: 1, filter: 'none' })
    gsap.fromTo(el, { x: from.x - place.x, y: from.y - place.y }, { x: 0, y: 0, duration: TRAVEL_S, ease: 'expo.out' })
    gsap.fromTo(plate.value, { scaleX: from.w / w, scaleY: from.h / h }, { scaleX: 1, scaleY: 1, duration: TRAVEL_S, ease: 'expo.out' })
    gsap.fromTo(body.value, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.08, ease: 'power2.out' })
  })
}

function close() {
  clearTimeout(leaveTimer)
  run++
  const el = panel.value
  if (!activeId.value) return
  if (!el || !animated.value) return reset()
  stopTweens()
  add(() => gsap.to(el, {
    opacity: 0,
    scale: 0.98,
    duration: CLOSE_S,
    ease: 'power2.in',
    onComplete: () => {
      reset()
      gsap.set(el, { clearProps: 'transform,opacity,filter' })
    },
  }))
}

function closeNow() {
  clearTimeout(leaveTimer)
  run++
  stopTweens()
  reset()
}

const keep = () => clearTimeout(leaveTimer)

function leaveSoon() {
  if (pinned.value) return
  clearTimeout(leaveTimer)
  leaveTimer = window.setTimeout(close, LEAVE_MS)
}

const leave = (id: string) => {
  if (activeId.value === id) leaveSoon()
}

function toggle(id: string, next: PeekContent, target: HTMLElement) {
  if (activeId.value === id && pinned.value) close()
  else void show(id, next, target, true)
}

provide(PEEK_KEY, { activeId, show, leave, toggle })

useEscapeLayer({
  isOpen: () => activeId.value !== null,
  close: () => {
    const focusInside = anchor?.contains(document.activeElement)
    const target = anchor
    close()
    if (focusInside) target?.querySelector<HTMLElement>('button')?.focus()
  },
})

/** Un toque fuera de las anclas y del popover lo cierra. */
function onPointerDown(e: PointerEvent) {
  if (!activeId.value || !(e.target instanceof Element)) return
  if (panel.value?.contains(e.target) || e.target.closest('[data-peek-anchor]')) return
  close()
}

/** Solo un cambio de ancho lo cierra: en el teléfono la barra de direcciones cambia el alto al scrollear. */
let lastWidth = 0
function onResize() {
  if (window.innerWidth === lastWidth) return
  lastWidth = window.innerWidth
  closeNow()
}

const nuxtApp = useNuxtApp()
onMounted(() => {
  lastWidth = window.innerWidth
  document.addEventListener('pointerdown', onPointerDown, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
})
// El registro cambia el DOM de las anclas: el popover no sobrevive al cambio.
const unhook = nuxtApp.hook('record:before', closeNow)
onBeforeUnmount(() => {
  unhook()
  clearTimeout(leaveTimer)
  document.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div ref="root" class="relative">
    <slot />
    <div
      v-show="activeId"
      ref="panel"
      aria-hidden="true"
      class="absolute top-0 left-0 z-30 w-max max-w-[min(22rem,calc(100vw-2rem))] origin-top-left will-change-transform"
      @pointerenter="keep"
      @pointerleave="leaveSoon"
    >
      <div ref="plate" class="absolute inset-0 origin-top-left rounded-[3px] border border-rule bg-surface shadow-[0_18px_48px_rgb(0_0_0/0.28)]" />
      <div v-if="content" ref="body" class="relative flex flex-col gap-1 px-4 py-3 text-s">
        <p class="text-xs text-dim">
          {{ content.heading }}
        </p>
        <p v-for="(line, i) in content.lines" :key="i" :lang="line.lang" class="text-ink">
          {{ line.text }}
        </p>
      </div>
    </div>
  </div>
</template>
