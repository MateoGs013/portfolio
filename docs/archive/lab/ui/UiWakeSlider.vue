<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  modelValue?: number
  bars?: number
  wake?: number
  label?: string
  unit?: string
}>(), {
  modelValue: 65,
  bars: 32,
  wake: 60,
  label: '',
  unit: '%',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

const count = computed(() => Math.round(clamp(props.bars, 12, 64)))
const val = ref(clamp(props.modelValue, 0, 100))

const trackRef = ref<HTMLElement | null>(null)
const barRefs = ref<(HTMLElement | null)[]>([])
function setBarRef(el: unknown, idx: number) {
  barRefs.value[idx] = el as HTMLElement | null
}

const state = {
  energy: new Float32Array(count.value),
  down: false,
  lastX: 0,
  lastT: 0,
  speed: 0,
  raf: 0,
  at: val.value / 100,
  lastBar: -1,
}

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

function ensureEnergy() {
  state.energy = new Float32Array(count.value)
}

function startRaf() {
  if (state.raf || prefersReduced.value || isHyperfocus.value) return
  let lastNow = performance.now()

  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - lastNow) / 1000)
    lastNow = now
    let hasEnergy = false
    const decay = Math.exp(-dt * 6.5)

    for (let i = 0; i < state.energy.length; i++) {
      const nextE = (state.energy[i] ?? 0) * decay
      if (nextE < 0.002) {
        state.energy[i] = 0
      }
      else {
        state.energy[i] = nextE
        hasEnergy = true
      }

      const el = barRefs.value[i]
      if (el) {
        el.style.transform = `scaleY(${(1 + (state.energy[i] ?? 0) * 1.6).toFixed(3)})`
      }
    }

    state.raf = hasEnergy || state.down ? requestAnimationFrame(loop) : 0
  }

  state.raf = requestAnimationFrame(loop)
}

function getRatioFromClientX(clientX: number): number {
  if (!trackRef.value) return 0
  const rect = trackRef.value.getBoundingClientRect()
  return (clientX - rect.left) / rect.width
}

function applyRatio(ratio: number, speed: number) {
  const r = clamp(ratio, 0, 1)
  const n = count.value
  const prevBar = Math.round(state.at * (n - 1))
  const currBar = Math.round(r * (n - 1))
  state.at = r

  const push = (1 - Math.exp(-speed / 900)) * (props.wake / 60)
  const minBar = Math.min(prevBar, currBar)
  const maxBar = Math.max(prevBar, currBar)
  for (let i = minBar; i <= maxBar; i++) {
    state.energy[i] = Math.max(state.energy[i] ?? 0, push)
  }

  if (currBar !== state.lastBar) {
    state.lastBar = currBar
    playSound('notch', { at: r, gap: 28 })
  }

  const nextVal = Math.round(r * 100)
  if (nextVal !== val.value) {
    val.value = nextVal
    emit('update:modelValue', nextVal)
  }

  startRaf()
}

function onPointerDown(e: PointerEvent) {
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  catch {
    // ignore pointer capture error
  }
  state.down = true
  state.lastX = e.clientX
  state.lastT = performance.now()
  state.speed = 0
  applyRatio(getRatioFromClientX(e.clientX), 0)
}

function onPointerMove(e: PointerEvent) {
  if (!state.down) return
  const now = performance.now()
  const dt = Math.max(0.008, (now - state.lastT) / 1000)
  const instSpeed = Math.abs(e.clientX - state.lastX) / dt
  state.speed = state.speed * 0.5 + instSpeed * 0.5
  state.lastX = e.clientX
  state.lastT = now
  applyRatio(getRatioFromClientX(e.clientX), state.speed)
}

function onPointerUp(e: PointerEvent) {
  state.down = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  catch {
    // ignore pointer capture error
  }
}

function onKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 10 : 1
  let next: number | null = null

  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    next = val.value + step
  }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    next = val.value - step
  }
  else if (e.key === 'Home') {
    next = 0
  }
  else if (e.key === 'End') {
    next = 100
  }

  if (next !== null) {
    e.preventDefault()
    applyRatio(clamp(next, 0, 100) / 100, 600)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal !== val.value) {
    val.value = clamp(newVal, 0, 100)
    state.at = val.value / 100
  }
})

watch(() => props.bars, () => {
  ensureEnergy()
})

onMounted(() => {
  checkReducedMotion()
  ensureEnergy()
})

onBeforeUnmount(() => {
  if (state.raf) {
    cancelAnimationFrame(state.raf)
    state.raf = 0
  }
})

const activeIndex = computed(() => Math.round((val.value / 100) * (count.value - 1)))
</script>

<template>
  <div class="wks select-none inline-flex items-center justify-center gap-3">
    <!-- Etiqueta previa o espaciador de balance para centrado simétrico -->
    <span v-if="label" class="wks-label font-mono">
      {{ label }}
    </span>
    <span
      v-else
      class="wks-flank font-mono text-[11px] select-none invisible"
      aria-hidden="true"
    >
      {{ val }}{{ unit }}
    </span>

    <!-- Pista de barras cinéticas (Bencho .wks-track) -->
    <div
      ref="trackRef"
      class="wks-track"
      role="slider"
      tabindex="0"
      :aria-label="label || 'Nivel de ajuste'"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="val"
      :style="{
        width: `${count * 7 - 4}px`,
        height: '48px',
      }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeyDown"
    >
      <span
        v-for="(_, idx) in count"
        :key="idx"
        :ref="el => setBarRef(el, idx)"
        class="wks-bar"
        :data-on="val > 0 && idx <= activeIndex ? 'true' : undefined"
      />
    </div>

    <!-- Valor actual numérico con unidad -->
    <span class="wks-value font-mono text-[11px]">
      {{ val }}{{ unit }}
    </span>
  </div>
</template>

<style scoped>
/* Bencho wake-slider (.wks-*) kinetic decay bar slider */
.wks {
  color: var(--d-ink, #f4f4f5);
  position: relative;
}

.wks-label {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--d-faint, #71717a);
  letter-spacing: 0.02em;
}

.wks-track {
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 8px;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  display: flex;
  padding: 0 4px;
  background: color-mix(in srgb, var(--d-surface, #111114) 75%, transparent);
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  transition: border-color 0.2s ease;
}

.wks-track:hover {
  border-color: var(--d-rule-strong, rgba(255, 255, 255, 0.16));
}

.wks-track:focus-visible {
  outline: 2px solid var(--d-sig, #ff3e00);
  outline-offset: 3px;
}

.wks-bar {
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 18%, var(--d-surface-raised, #17171c));
  transform-origin: 50% 50%;
  border-radius: 3px;
  flex: none;
  width: 3px;
  height: 20px;
  transition: background-color 0.16s ease;
  will-change: transform;
}

.wks-bar[data-on="true"] {
  background: var(--d-sig, #ff3e00);
  box-shadow: 0 0 6px color-mix(in srgb, var(--d-sig, #ff3e00) 40%, transparent);
}

.wks-value,
.wks-flank {
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  min-width: 4ch;
  font-size: 13px;
  font-weight: 600;
}

.wks-value {
  color: var(--d-ink, #f4f4f5);
}
</style>
