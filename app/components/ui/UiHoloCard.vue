<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

const props = withDefaults(defineProps<{
  as?: string
  maxTilt?: number
  glare?: boolean
  foil?: boolean
  disabled?: boolean
}>(), {
  as: 'div',
  maxTilt: 9,
  glare: true,
  foil: true,
  disabled: false,
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const cardRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const px = ref(50)
const py = ref(50)

// Tilt spring physics
const targetRot = { x: 0, y: 0 }
const curRot = ref({ x: 0, y: 0 })
let rafId = 0
let lastTime = 0

const isDisabled = computed(() => props.disabled || isHyperfocus.value)

function stepSpring(now: number) {
  if (!import.meta.client) return

  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now

  // Bencho spring formula: c = 1 - 0.002^dt
  const c = 1 - Math.pow(0.002, dt)
  curRot.value.x += (targetRot.x - curRot.value.x) * c
  curRot.value.y += (targetRot.y - curRot.value.y) * c

  const isRest = Math.abs(targetRot.x - curRot.value.x) < 0.01 && Math.abs(targetRot.y - curRot.value.y) < 0.01

  if (isHovered.value || !isRest) {
    rafId = requestAnimationFrame(stepSpring)
  }
  else {
    rafId = 0
  }
}

function startSpring() {
  if (!rafId && import.meta.client) {
    lastTime = performance.now()
    rafId = requestAnimationFrame(stepSpring)
  }
}

function onPointerMove(e: PointerEvent) {
  if (isDisabled.value || !cardRef.value) return

  const rect = cardRef.value.getBoundingClientRect()
  const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

  px.value = Math.round(nx * 100)
  py.value = Math.round(ny * 100)

  // rotateX is driven by Y displacement, rotateY by X displacement
  targetRot.x = (0.5 - ny) * props.maxTilt * 2
  targetRot.y = (nx - 0.5) * props.maxTilt * 2

  if (!isHovered.value) {
    isHovered.value = true
    playSound('tock', { gap: 100 })
  }
  startSpring()
}

function onPointerLeave() {
  if (isDisabled.value) return
  isHovered.value = false
  targetRot.x = 0
  targetRot.y = 0
  startSpring()
}

function onClick(e: MouseEvent) {
  playSound('press')
  emit('click', e)
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    // skip tilt on reduced motion
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <component
    :is="as"
    ref="cardRef"
    class="mb-holo-room select-none"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @click="onClick"
  >
    <div
      class="mb-holo relative rounded-2xl"
      :data-on="isHovered || undefined"
      :style="{
        transform: !isDisabled ? `rotateX(${curRot.x.toFixed(2)}deg) rotateY(${curRot.y.toFixed(2)}deg)` : undefined,
        '--px': `${px}%`,
        '--py': `${py}%`,
        '--sx2': (curRot.y * 1.2).toFixed(2),
        '--sy2': (-curRot.x * 1.2).toFixed(2),
      }"
    >
      <div class="mb-holo-face relative rounded-2xl overflow-hidden bg-card border border-rule">
        <!-- Card Slot Content -->
        <slot />

        <!-- Holographic Foil Film -->
        <span v-if="foil && !isDisabled" class="holo-foil" aria-hidden="true" />

        <!-- Specular Glare -->
        <span v-if="glare && !isDisabled" class="holo-glare" aria-hidden="true" />

        <!-- Specular Rim Edge Mask -->
        <span v-if="glare && !isDisabled" class="holo-rim" aria-hidden="true" />

        <!-- Prismatic Iris Sheen -->
        <span v-if="foil && !isDisabled" class="holo-iris" aria-hidden="true" />

        <!-- Fine Tactile Grain -->
        <span v-if="!isDisabled" class="holo-grain" aria-hidden="true" />
      </div>
    </div>
  </component>
</template>

<style scoped>
.mb-holo-room {
  perspective: 900px;
  position: relative;
  display: block;
}

.mb-holo {
  transform-style: preserve-3d;
  position: relative;
  border-radius: inherit;
  transition: box-shadow 0.48s ease, transform 0.08s linear;
}

.mb-holo-face {
  position: relative;
  border-radius: inherit;
  overflow: hidden;
  backface-visibility: hidden;
  transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.48s ease;
}

.mb-holo[data-on] .mb-holo-face {
  box-shadow:
    0 4px 12px rgba(23, 24, 26, 0.08),
    calc(var(--sx2, 0) * -1.5px) calc(20px + var(--sy2, 0) * -1.5px) 45px rgba(23, 24, 26, 0.18);
}

/* Foil Sheen */
.holo-foil {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    115deg,
    transparent 20%,
    transparent 30%,
    rgba(230, 234, 240, 0.45) 42%,
    rgba(255, 255, 255, 0.8) 48%,
    rgba(210, 216, 226, 0.45) 54%,
    transparent 68%
  ) 0 0 / 250% 250%;
  background-position: var(--px) var(--py);
  mix-blend-mode: soft-light;
  opacity: 0;
  transition: opacity 0.48s ease;
}

.mb-holo[data-on] .holo-foil {
  opacity: 0.65;
}

/* Specular Glare */
.holo-glare {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--px) var(--py), rgba(255, 255, 255, 0.3), transparent 52%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.48s ease;
}

.mb-holo[data-on] .holo-glare {
  opacity: 1;
}

/* Specular Rim Mask */
.holo-rim {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: radial-gradient(120% 120% at var(--px) var(--py), rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.1) 60%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: 0;
  transition: opacity 0.48s ease;
}

.mb-holo[data-on] .holo-rim {
  opacity: 0.85;
}

/* Prismatic Iris */
.holo-iris {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(125deg, #cfe3ff 0%, #e2d6ff 25%, #cfe3ff 50%, #e2d6ff 75%, #cfe3ff 100%) 0 0 / 260% 260%;
  background-position: var(--px) var(--py);
  -webkit-mask-image: radial-gradient(circle 180px at var(--px) var(--py), #000, transparent 80%);
  mask-image: radial-gradient(circle 180px at var(--px) var(--py), #000, transparent 80%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.48s ease;
}

.mb-holo[data-on] .holo-iris {
  opacity: 0.22;
}

/* Fine Grain */
.holo-grain {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: inherit;
  mix-blend-mode: overlay;
  opacity: 0.12;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-size: 160px 160px;
  transition: opacity 0.48s ease;
}

.mb-holo[data-on] .holo-grain {
  opacity: 0.2;
}

@media (prefers-reduced-motion: reduce) {
  .mb-holo {
    transform: none !important;
  }
}
</style>
