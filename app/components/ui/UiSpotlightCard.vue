<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'

interface Props {
  as?: string
  spotlightColor?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  disabled: false,
  spotlightColor: undefined,
})

const { isHyperfocus } = useHyperfocus()
const prefersReducedMotion = ref(false)
const cardRef = ref<HTMLElement | null>(null)
let rafId: number | null = null

const isEffectDisabled = computed(() => {
  return props.disabled || isHyperfocus.value || prefersReducedMotion.value
})

let mediaQueryList: MediaQueryList | null = null
const onMediaChange = (e: MediaQueryListEvent) => {
  prefersReducedMotion.value = e.matches
}

onMounted(() => {
  if (import.meta.client && typeof window !== 'undefined') {
    mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQueryList.matches
    mediaQueryList.addEventListener?.('change', onMediaChange)
  }
})

onBeforeUnmount(() => {
  if (rafId !== null && import.meta.client) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (mediaQueryList) {
    mediaQueryList.removeEventListener?.('change', onMediaChange)
  }
})

function onMouseMove(event: MouseEvent) {
  if (isEffectDisabled.value || !cardRef.value) return

  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }

  const clientX = event.clientX
  const clientY = event.clientY

  rafId = requestAnimationFrame(() => {
    if (!cardRef.value) return
    const rect = cardRef.value.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    cardRef.value.style.setProperty('--spot-x', `${x}px`)
    cardRef.value.style.setProperty('--spot-y', `${y}px`)
    cardRef.value.style.setProperty('--spot-opacity', '1')
  })
}

function onMouseEnter() {
  if (isEffectDisabled.value || !cardRef.value) return
  cardRef.value.style.setProperty('--spot-opacity', '1')
}

function onMouseLeave() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (cardRef.value) {
    cardRef.value.style.setProperty('--spot-opacity', '0')
  }
}

const cardStyle = computed(() => {
  const styles: Record<string, string> = {
    '--spot-opacity': '0',
  }
  if (props.spotlightColor) {
    styles['--spot-color'] = props.spotlightColor
  }
  return styles
})

const overlayStyle = computed(() => ({
  opacity: 'var(--spot-opacity, 0)',
  background: `radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spot-color, rgba(255, 62, 0, 0.09)), transparent 70%)`,
}))
</script>

<template>
  <component
    :is="as"
    ref="cardRef"
    class="ui-spotlight-card relative overflow-hidden"
    :style="cardStyle"
    @mousemove="onMouseMove"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      v-if="!isEffectDisabled"
      class="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 ui-spotlight-overlay"
      :style="overlayStyle"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .ui-spotlight-overlay {
    display: none !important;
  }
}
</style>
