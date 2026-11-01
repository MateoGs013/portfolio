<script setup lang="ts">
/**
 * Las cuatro etapas de una vacante: Análisis, Mensaje, CV y Postular. Cada una es su dirección (la
 * ruta es el estado), así que son enlaces con aria-current y no pestañas de panel; el subrayado en
 * --sig viaja 300 ms entre ellas, solo con transform.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { job as t } from './dictJob'
import { STAGES, type Stage } from './model'

const props = defineProps<{
  jobId: string
  stage: Stage
}>()

const links = computed(() => STAGES.map(stage => ({
  stage,
  label: t.stages[stage],
  to: `/busqueda/vacantes/${encodeURIComponent(props.jobId)}/${stage}`,
})))

const bar = ref<HTMLElement | null>(null)
const underline = ref({ x: 0, w: 0, ready: false })

function place(): void {
  const el = bar.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!el) return
  underline.value = { x: el.offsetLeft, w: el.offsetWidth, ready: underline.value.w > 0 }
}

let observer: ResizeObserver | null = null
onMounted(() => {
  place()
  observer = new ResizeObserver(place)
  if (bar.value) observer.observe(bar.value)
  void document.fonts?.ready.then(place)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.stage, () => void nextTick(place))

const underlineStyle = computed(() => ({
  transform: `translateX(${underline.value.x}px) scaleX(${underline.value.w / 100})`,
  opacity: underline.value.w ? 1 : 0,
}))
</script>

<template>
  <nav
    ref="bar"
    :aria-label="t.stagesLabel"
    class="relative flex gap-7 overflow-x-auto border-b border-rule [scrollbar-width:none]"
  >
    <RouterLink
      v-for="link in links"
      :key="link.stage"
      :to="link.to"
      :aria-current="link.stage === stage ? 'page' : undefined"
      class="shrink-0 pt-2 pb-3 text-row font-[420] whitespace-nowrap no-underline transition-colors duration-120 ease-e hover:text-ink focus-visible:-outline-offset-2"
      :class="link.stage === stage ? 'text-ink' : 'text-faint'"
    >
      {{ link.label }}
    </RouterLink>
    <span
      class="pointer-events-none absolute bottom-0 left-0 h-0.5 w-[100px] origin-left bg-sig"
      :class="underline.ready ? 'transition-transform duration-300 ease-e' : ''"
      :style="underlineStyle"
      aria-hidden="true"
    />
  </nav>
</template>
