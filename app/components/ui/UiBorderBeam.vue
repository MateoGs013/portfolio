<script setup lang="ts">
/**
 * UiBorderBeam — Rayo de Borde Láser Continuo
 * Inspirado en Magic UI & Linear 2026.
 * Dibuja una partícula de luz con estela que viaja a lo largo del perímetro del contenedor.
 * Desactivado automáticamente en Hyperfocus o prefers-reduced-motion.
 */
import { useHyperfocus } from '~/composables/useHyperfocus'

withDefaults(defineProps<{
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}>(), {
  size: 140,
  duration: 7,
  borderWidth: 1.5,
  colorFrom: 'var(--d-sig, #ff3e00)',
  colorTo: 'var(--d-ink, #ffffff)',
  delay: 0,
})

const { isHyperfocus } = useHyperfocus()
</script>

<template>
  <div
    v-if="!isHyperfocus"
    class="border-beam-container pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
    aria-hidden="true"
  >
    <div
      class="border-beam"
      :style="{
        '--beam-size': `${size}px`,
        '--beam-duration': `${duration}s`,
        '--beam-delay': `${delay}s`,
        '--beam-width': `${borderWidth}px`,
        '--beam-from': colorFrom,
        '--beam-to': colorTo,
      }"
    />
  </div>
</template>

<style scoped>
.border-beam-container {
  padding: var(--beam-width, 1.5px);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.border-beam {
  position: absolute;
  aspect-ratio: 1 / 1;
  width: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 280deg,
    var(--beam-from, #ff3e00) 330deg,
    var(--beam-to, #ffffff) 360deg
  );
  animation: border-beam-spin var(--beam-duration, 7s) linear infinite;
  animation-delay: var(--beam-delay, 0s);
  filter: drop-shadow(0 0 6px var(--beam-from, #ff3e00));
}

@keyframes border-beam-spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .border-beam {
    animation: none !important;
    display: none !important;
  }
}
</style>
