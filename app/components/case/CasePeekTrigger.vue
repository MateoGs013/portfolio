<script setup lang="ts">
/**
 * Un ancla de Asomar (CasePeek): envuelve el valor (una tecnología, una métrica) y le suma su botón.
 *
 * - Con puntero fino, apuntar el ancla lo asoma y salir lo cierra; el botón queda para el teclado y
 *   aparece al enfocarlo (sr-only hasta entonces).
 * - En táctil el botón se ve: un toque abre y otro cierra (`aria-expanded`).
 * - Sin líneas no hay nada que asomar: queda el valor solo.
 * - El texto del popover viaja también en un `aria-describedby` que trae el SSR: el lector lo lee al
 *   enfocar el botón y, sin JS, el contenido sigue en el HTML.
 */
import { PEEK_KEY, type PeekLine } from './CasePeek.vue'

const props = withDefaults(defineProps<{
  heading: string
  lines: PeekLine[]
  /** Nombre accesible del botón: «Asomar: GSAP». */
  label: string
  /** Etiqueta de la raíz (`li` dentro de una lista). */
  as?: string
  /** Ubicación del botón dentro del ancla. */
  buttonClass?: string
}>(), { as: 'span', buttonClass: '' })

const peek = inject(PEEK_KEY, null)
const id = useId()
const descId = `${id}-peek`
const root = useTemplateRef<HTMLElement>('root')

const content = computed(() => ({ heading: props.heading, lines: props.lines }))
const open = computed(() => peek?.activeId.value === id)

/** Cada línea se lee como una oración, sin duplicar el punto que ya trae. */
const sentence = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}.`)

function onEnter(e: PointerEvent) {
  if (e.pointerType === 'mouse' && root.value && props.lines.length) peek?.show(id, content.value, root.value, false)
}

function onLeave(e: PointerEvent) {
  if (e.pointerType === 'mouse') peek?.leave(id)
}

function onClick() {
  if (root.value) peek?.toggle(id, content.value, root.value)
}
</script>

<template>
  <component :is="as" ref="root" data-peek-anchor @pointerenter="onEnter" @pointerleave="onLeave">
    <slot />
    <button
      v-if="lines.length"
      type="button"
      :aria-label="label"
      :aria-expanded="open"
      :aria-describedby="descId"
      :class="buttonClass"
      class="inline-grid size-6 shrink-0 cursor-pointer coarse:-my-2.5 coarse:-me-2.5 coarse:size-11 place-items-center rounded-full text-faint transition-[color,rotate] duration-300 ease-expo hover:text-ink aria-expanded:rotate-45 aria-expanded:text-ink fine:not-focus-visible:sr-only"
      @click="onClick"
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" class="size-2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M6 1.5v9M1.5 6h9" />
      </svg>
    </button>
    <span v-if="lines.length" :id="descId" class="sr-only">
      {{ sentence(heading) }}<template v-for="(line, i) in lines" :key="i">{{ ' ' }}<span :lang="line.lang">{{ sentence(line.text) }}</span></template>
    </span>
  </component>
</template>
