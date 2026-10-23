<script setup lang="ts">
import { computed } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'

const props = withDefaults(defineProps<{
  position?: 'top' | 'bottom'
  height?: number
  strength?: number
}>(), {
  position: 'bottom',
  height: 44,
  strength: 45,
})

const { isHyperfocus } = useHyperfocus()

const LAYERS_COUNT = 6
const SCALE_FACTOR = 1.45

// Cálculo de capas ópticas progresivas exactas de Bencho
const layers = computed(() => {
  const base = 0.2 + (props.strength / 150)
  const step = 100 / (LAYERS_COUNT + 1)
  const dir = props.position === 'top' ? 'to top' : 'to bottom'

  return Array.from({ length: LAYERS_COUNT }, (_, t) => {
    const n = (t * step).toFixed(2)
    const r = ((t + 1) * step).toFixed(2)
    const i = ((t + 2) * step).toFixed(2)
    const end = ((t + 3) * step).toFixed(2)

    const mask = t === LAYERS_COUNT - 1
      ? `linear-gradient(${dir}, transparent ${n}%, #000 ${r}%)`
      : `linear-gradient(${dir}, transparent ${n}%, #000 ${r}%, #000 ${i}%, transparent ${end}%)`

    const blurPx = (base * Math.pow(SCALE_FACTOR, t)).toFixed(2)

    return {
      blurPx,
      mask,
    }
  })
})
</script>

<template>
  <div
    v-if="!isHyperfocus"
    class="pbl select-none pointer-events-none"
    :class="position === 'top' ? 'pbl-top' : 'pbl-bottom'"
    :style="{ height: `${height}px` }"
    aria-hidden="true"
  >
    <span
      v-for="(layer, idx) in layers"
      :key="idx"
      class="pbl-layer"
      :style="{
        backdropFilter: `blur(${layer.blurPx}px)`,
        WebkitBackdropFilter: `blur(${layer.blurPx}px)`,
        maskImage: layer.mask,
        WebkitMaskImage: layer.mask,
      }"
    />
    <span class="pbl-tint" />
  </div>
</template>

<style scoped>
/* Bencho progressive-blur (.pbl-*) 6-layer optical gradient blur */
.pbl {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 25;
  overflow: hidden;
}

.pbl-bottom {
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pbl-top {
  top: 0;
}

.pbl-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: backdrop-filter;
}

.pbl-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pbl-bottom .pbl-tint {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    color-mix(in srgb, var(--d-paper) 25%, transparent) 40%,
    color-mix(in srgb, var(--d-paper) 70%, transparent) 80%,
    var(--d-paper) 100%
  );
}

.pbl-top .pbl-tint {
  background: linear-gradient(
    to top,
    transparent 0%,
    color-mix(in srgb, var(--d-paper) 25%, transparent) 40%,
    color-mix(in srgb, var(--d-paper) 70%, transparent) 80%,
    var(--d-paper) 100%
  );
}

@media print {
  .pbl {
    display: none !important;
  }
}
</style>
