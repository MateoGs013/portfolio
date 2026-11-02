<script setup lang="ts">
/**
 * La hoja real del CV (GET /hunter/cv/:id/html?measure=1&ticket=…) en un iframe aislado
 * (sandbox="allow-scripts", sin allow-same-origin), al ancho de A4 y escalada para entrar en su
 * lugar. Al cargar, la hoja se mide y avisa por postMessage {type:'cv-measure', heightMm, pages}:
 * con eso el marco toma el alto justo y la etapa dice si entra en una página.
 */
import type { CvMeasure } from '@shared/hunterContracts'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  url: string
  title: string
  /** Ancho máximo de la hoja en pantalla, en px (794 es A4 a 96 ppp). */
  maxWidth?: number
}>(), { maxWidth: 794 })

const emit = defineEmits<{ measure: [value: Pick<CvMeasure, 'heightMm' | 'pages'>] }>()

const A4_PX = 794
const PAGE_PX = 1123
const MM = 96 / 25.4
/** Márgenes de arriba y abajo de la hoja (los del @page): el contenido medido más esto es la página. */
const MARGINS_MM = 21

const frame = ref<HTMLIFrameElement | null>(null)
const box = ref<HTMLElement | null>(null)
const width = ref(A4_PX)
const heightPx = ref(PAGE_PX)
const loaded = ref(false)

const scale = computed(() => Math.min(1, props.maxWidth / A4_PX, width.value / A4_PX))
const boxStyle = computed(() => ({ width: `${A4_PX * scale.value}px`, height: `${heightPx.value * scale.value}px` }))
const frameStyle = computed(() => ({ width: `${A4_PX}px`, height: `${heightPx.value}px`, transform: `scale(${scale.value})` }))

function onMessage(event: MessageEvent): void {
  if (!frame.value || event.source !== frame.value.contentWindow) return
  const data = event.data as Partial<CvMeasure> | null
  if (!data || data.type !== 'cv-measure' || typeof data.heightMm !== 'number') return
  heightPx.value = Math.max(PAGE_PX, Math.ceil((data.heightMm + MARGINS_MM) * MM))
  emit('measure', { heightMm: data.heightMm, pages: typeof data.pages === 'number' ? data.pages : 1 })
}

let observer: ResizeObserver | null = null
onMounted(() => {
  addEventListener('message', onMessage)
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = entry.contentRect.width
  })
  const parent = box.value?.parentElement
  // El ancho real ya al montar: sin esperar al observer, la hoja no asoma a 794 px en un teléfono.
  if (parent) {
    width.value = parent.clientWidth || A4_PX
    observer.observe(parent)
  }
})
onBeforeUnmount(() => {
  removeEventListener('message', onMessage)
  observer?.disconnect()
})
</script>

<template>
  <div class="grid w-full place-items-start">
    <div ref="box" class="relative overflow-hidden rounded-media bg-ink shadow-dialog transition-opacity duration-200 ease-e" :class="loaded ? 'opacity-100' : 'opacity-0'" :style="boxStyle">
      <iframe
        ref="frame"
        :src="url"
        :title="title"
        sandbox="allow-scripts"
        referrerpolicy="no-referrer"
        class="absolute top-0 left-0 block origin-top-left border-0 bg-ink"
        :style="frameStyle"
        data-cv-sheet
        @load="loaded = true"
      />
    </div>
  </div>
</template>
