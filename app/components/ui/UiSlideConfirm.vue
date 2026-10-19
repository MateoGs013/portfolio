<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  label?: string
  confirmedLabel?: string
  width?: number
  disabled?: boolean
}>(), {
  label: 'Deslizá para transmitir',
  confirmedLabel: 'Transmitido · 200 OK',
  width: 280,
  disabled: false,
})

const emit = defineEmits<{
  confirm: []
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const trackRef = ref<HTMLElement | null>(null)

// Constantes exactas de Bencho slide-confirm
const TRACK_HEIGHT = 56
const HANDLE_SIZE = 48
const PADDING = 4

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

const clampedWidth = computed(() => clamp(Math.round(props.width), 220, 380))
const travel = computed(() => clampedWidth.value - (PADDING * 2) - HANDLE_SIZE)
const threshold = computed(() => travel.value * 0.85)

const posX = ref(0)
const morphX = ref(0)
const isHeld = ref(false)
const isConfirmed = ref(false)
const isHovering = ref(false)

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

// Bencho spring: stiffness 380, damping 34
const STIFFNESS = 380
const DAMPING = 34
let springRaf = 0
let velPos = 0
let velMorph = 0
let lastSpringTime = 0
let targetPos = 0
let targetMorph = 0
let resetTimer = 0

function runSpringLoop() {
  if (springRaf) return
  lastSpringTime = performance.now()

  const loop = (now: number) => {
    const dt = Math.min(0.033, (now - lastSpringTime) / 1000)
    lastSpringTime = now

    if (prefersReduced.value || isHyperfocus.value) {
      posX.value = targetPos
      morphX.value = targetMorph
      velPos = 0
      velMorph = 0
      springRaf = 0
      return
    }

    // Spring for posX
    const forcePos = -STIFFNESS * (posX.value - targetPos) - DAMPING * velPos
    velPos += forcePos * dt
    posX.value += velPos * dt

    // Spring for morphX
    const forceMorph = -STIFFNESS * (morphX.value - targetMorph) - DAMPING * velMorph
    velMorph += forceMorph * dt
    morphX.value += velMorph * dt

    const diffPos = Math.abs(posX.value - targetPos)
    const diffMorph = Math.abs(morphX.value - targetMorph)
    const isMoving = Math.abs(velPos) > 0.3 || Math.abs(velMorph) > 0.3

    if (diffPos < 0.25 && diffMorph < 0.25 && !isMoving) {
      posX.value = targetPos
      morphX.value = targetMorph
      velPos = 0
      velMorph = 0
      springRaf = 0
    }
    else {
      springRaf = requestAnimationFrame(loop)
    }
  }

  springRaf = requestAnimationFrame(loop)
}

function springPosTo(target: number) {
  targetPos = target
  runSpringLoop()
}

function springMorphTo(target: number) {
  targetMorph = target
  runSpringLoop()
}

// Bencho exact morph: width = HANDLE_SIZE + clamp(morphX - posX, 0, travel)
const gripWidth = computed(() => {
  const extra = clamp(morphX.value - posX.value, 0, travel.value)
  return HANDLE_SIZE + extra
})

// Wash width behind grip
const washWidth = computed(() => {
  return clamp(posX.value + gripWidth.value, 0, clampedWidth.value - (PADDING * 2))
})

// Opacity of label fading as slider advances
const labelOpacity = computed(() => {
  if (isConfirmed.value) return 0
  const factor = travel.value * 0.55
  return clamp(1 - (posX.value / factor), 0, 1)
})

let grab: number | null = null
let moved = false
let activePointerId: number | null = null

function onPointerDown(e: PointerEvent) {
  if (props.disabled || isConfirmed.value || e.button !== 0) return

  activePointerId = e.pointerId
  try {
    trackRef.value?.setPointerCapture(e.pointerId)
  }
  catch {
    // ignore
  }

  isHeld.value = true
  grab = null
  moved = false
  playSound('click')
}

function onPointerMove(e: PointerEvent) {
  if (!isHeld.value || activePointerId !== e.pointerId || isConfirmed.value) return
  const track = trackRef.value
  if (!track) return

  const rect = track.getBoundingClientRect()
  const localX = e.clientX - rect.left - PADDING - (HANDLE_SIZE / 2)

  // Bencho rule: offset captured on FIRST MOVE, never on pointerdown!
  if (grab === null) {
    grab = localX - posX.value
    return
  }

  const raw = clamp(localX - grab, 0, travel.value)
  if (Math.abs(raw - posX.value) > 0.5) {
    moved = true
  }
  posX.value = raw
}

function commit() {
  isConfirmed.value = true
  playSound('chime')
  emit('confirm')

  // Bencho Morph: morphX moves to travel while posX springs to 0
  targetMorph = travel.value
  morphX.value = posX.value
  springPosTo(0)
  springMorphTo(travel.value)

  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    isConfirmed.value = false
    targetMorph = 0
    targetPos = 0
    springMorphTo(0)
    springPosTo(0)
  }, 1600)
}

function onPointerUp(e: PointerEvent) {
  if (!isHeld.value || activePointerId !== e.pointerId) return
  isHeld.value = false
  activePointerId = null

  try {
    trackRef.value?.releasePointerCapture(e.pointerId)
  }
  catch {
    // ignore
  }

  if (posX.value >= threshold.value && !isConfirmed.value) {
    commit()
  }
  else {
    if (moved) {
      playSound('off')
    }
    springPosTo(0)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (props.disabled || isConfirmed.value) return

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    const next = clamp(posX.value + 24, 0, travel.value)
    posX.value = next
    if (next >= threshold.value) {
      commit()
    }
  }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    commit()
  }
  else if (e.key === 'Escape' || e.key === 'ArrowLeft') {
    e.preventDefault()
    springPosTo(0)
  }
}

onMounted(() => {
  checkReducedMotion()
})

onBeforeUnmount(() => {
  if (springRaf) {
    cancelAnimationFrame(springRaf)
    springRaf = 0
  }
  if (resetTimer) {
    clearTimeout(resetTimer)
  }
})
</script>

<template>
  <div
    class="sld select-none"
    :style="{
      width: `${clampedWidth}px`,
      height: `${TRACK_HEIGHT}px`,
    }"
  >
    <div
      ref="trackRef"
      class="sld-track"
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="Math.round((posX / (travel || 1)) * 100)"
      :data-held="isHeld ? 'true' : undefined"
      :data-done="isConfirmed ? 'true' : undefined"
      :data-disabled="disabled ? 'true' : undefined"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeyDown"
    >
      <!-- Lavado de color detrás de la corredera (.sld-wash) -->
      <i
        class="sld-wash"
        aria-hidden="true"
        :style="{
          width: `${washWidth.toFixed(1)}px`,
          borderRadius: `${(TRACK_HEIGHT / 2) - PADDING}px`,
        }"
      />

      <!-- Texto instruccional principal (.sld-say) -->
      <span
        class="sld-say font-mono"
        :style="{ opacity: labelOpacity.toFixed(3) }"
      >
        {{ label }}
      </span>

      <!-- Mango deslizante con metamorfosis Bencho (.sld-grip) -->
      <button
        type="button"
        class="sld-grip"
        tabindex="-1"
        :aria-label="isConfirmed ? confirmedLabel : label"
        :style="{
          transform: `translateX(${posX.toFixed(1)}px)`,
          width: `${gripWidth.toFixed(1)}px`,
          borderRadius: `${(TRACK_HEIGHT / 2) - PADDING}px`,
        }"
        @mouseenter="isHovering = true"
        @mouseleave="isHovering = false"
      >
        <!-- Flecha guía en estado reposo/arrastre -->
        <span
          class="sld-arrow"
          :style="{
            opacity: isConfirmed ? 0 : 1,
            transform: isConfirmed ? 'scale(0.5)' : 'scale(1)',
          }"
          aria-hidden="true"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>

        <!-- Confirmación transmitida -->
        <span
          class="sld-done font-mono"
          :style="{
            opacity: isConfirmed ? 1 : 0,
            transform: isConfirmed ? 'scale(1)' : 'scale(0.7)',
          }"
          aria-hidden="true"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span class="truncate">{{ confirmedLabel }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Bencho slide-confirm (.sld-*) 1:1 port */
.sld {
  box-sizing: border-box;
  font-family: var(--font-text, system-ui, sans-serif);
  color: var(--d-ink, #f4f4f5);
  display: inline-block;
  position: relative;
}

.sld-track {
  box-sizing: border-box;
  background: var(--d-surface, #111114);
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 28px;
  box-shadow: inset 0 0 0 1px var(--d-rule-strong, rgba(255, 255, 255, 0.1));
  overflow: hidden;
  outline: none;
  transition: box-shadow 0.2s ease;
}

.sld-track:focus-visible {
  box-shadow: inset 0 0 0 1px var(--d-rule-strong, rgba(255, 255, 255, 0.1)), 0 0 0 2px var(--d-sig, #ff3e00);
}

.sld-track[data-disabled="true"] {
  opacity: 0.45;
  pointer-events: none;
}

/* Lavado de fondo detrás del grip */
.sld-wash {
  background: rgba(255, 62, 0, 0.16);
  z-index: 1;
  pointer-events: none;
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  transition: background-color 0.22s ease;
}

.sld-track[data-done="true"] .sld-wash {
  background: var(--d-sig, #ff3e00);
}

/* Texto instructivo central */
.sld-say {
  color: var(--d-dim, #9898a0);
  pointer-events: none;
  white-space: nowrap;
  place-items: center;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  display: grid;
  position: absolute;
  inset: 0;
  z-index: 2;
  will-change: opacity;
}

/* Mango con metamorfosis Bencho */
.sld-grip {
  background: var(--d-ink, #f4f4f5);
  color: #09090b;
  height: 48px;
  cursor: grab;
  pointer-events: auto;
  transform-origin: 0% 50%;
  z-index: 5;
  border: 0;
  padding: 0 14px;
  transition: background-color 0.16s ease;
  position: absolute;
  top: 4px;
  left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  will-change: transform, width;
}

.sld-track[data-held="true"] .sld-grip {
  cursor: grabbing;
}

.sld-track[data-done="true"] .sld-grip {
  background: var(--d-sig, #ff3e00);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(255, 62, 0, 0.5);
}

/* Icono y texto de confirmación */
.sld-arrow,
.sld-done {
  letter-spacing: -0.01em;
  white-space: nowrap;
  pointer-events: none;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  display: flex;
  position: absolute;
  inset: 0;
  transition:
    opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.sld-done {
  color: #ffffff;
  padding: 0 16px;
}
</style>
