<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  modelValue?: number
  digits?: number
  bounce?: number
  stagger?: number
  blur?: number
  interactive?: boolean
  suffix?: string
}>(), {
  modelValue: 382,
  digits: 4,
  bounce: 45,
  stagger: 45,
  blur: 50,
  interactive: true,
  suffix: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const cellHeight = 46 // Bencho LC = 46
const stepPx = 12 // Bencho RC = 12

const maxVal = computed(() => 10 ** props.digits - 1)
const val = ref(props.modelValue)

interface ColumnState {
  pos: number
  vel: number
  target: number
  due: number[]
  next: number[]
}

const stripRefs = ref<(HTMLElement | null)[]>([])
function setStripRef(el: unknown, idx: number) {
  stripRefs.value[idx] = el as HTMLElement | null
}

// Inicializar columnas de dígitos (0 = unidades, 1 = decenas, ...)
function makeColumns(initial: number, count: number): ColumnState[] {
  return Array.from({ length: count }, (_, i) => {
    const target = Math.floor(initial / 10 ** i)
    return {
      pos: target,
      vel: 0,
      target,
      due: [],
      next: [],
    }
  })
}

let columns: ColumnState[] = makeColumns(props.modelValue, props.digits)
let rafId = 0
let lastT = 0

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

// Bencho spring constants
function springBounce(b: number) {
  return {
    k: 0.08 + (b / 100) * 0.16,
    d: 0.62 + (b / 100) * 0.2,
  }
}

function updateDOM() {
  columns.forEach((col, idx) => {
    const el = stripRefs.value[idx]
    if (!el) return
    const r = ((col.pos % 10) + 10) % 10
    const blurAmount = Math.min(3, Math.abs(col.vel) * 2.4) * (props.blur / 50)
    el.style.transform = `translateY(${-r * cellHeight}px)`
    el.style.filter = blurAmount > 0.15 && !prefersReduced.value && !isHyperfocus.value
      ? `blur(${blurAmount.toFixed(2)}px)`
      : ''
  })
}

function stepAnimationLoop() {
  if (rafId) return
  lastT = 0

  const loop = (n: number) => {
    const deltaRatio = lastT ? Math.min(2.5, Math.max(0, (n - lastT) / 16.67)) : 1
    lastT = n

    const { k, d } = springBounce(props.bounce)
    const now = performance.now()
    let hasMore = false

    for (const col of columns) {
      while (col.due.length && (col.due[0] ?? Infinity) <= now) {
        col.due.shift()
        col.target = col.next.shift() ?? col.target
      }
      if (col.due.length) hasMore = true

      const diff = col.target - col.pos
      if (Math.abs(diff) > 24) {
        col.pos += Math.round((diff - Math.sign(diff) * 24) / 10) * 10
      }

      col.vel += (col.target - col.pos) * k * deltaRatio
      col.vel *= d ** deltaRatio
      col.pos += col.vel * deltaRatio

      if (Math.abs(col.target - col.pos) < 0.004 && Math.abs(col.vel) < 0.004) {
        col.pos = col.target
        col.vel = 0
      }
      else {
        hasMore = true
      }
    }

    updateDOM()
    rafId = hasMore ? requestAnimationFrame(loop) : 0
  }

  rafId = requestAnimationFrame(loop)
}

function applyDelta(delta: number) {
  const current = val.value
  const next = Math.min(maxVal.value, Math.max(0, current + delta))
  if (next === current) return

  val.value = next
  emit('update:modelValue', next)

  const now = performance.now()
  columns.forEach((col, idx) => {
    const targetDigit = Math.floor(next / 10 ** idx)
    if (prefersReduced.value || isHyperfocus.value) {
      col.pos = col.target = targetDigit
      col.vel = 0
      col.due = []
      col.next = []
      return
    }
    col.due.push(now + idx * props.stagger)
    col.next.push(targetDigit)
  })

  playSound('tock', { gap: 45 })

  if (prefersReduced.value || isHyperfocus.value) {
    updateDOM()
  }
  else {
    stepAnimationLoop()
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal !== val.value) {
    const delta = newVal - val.value
    applyDelta(delta)
  }
})

watch(() => props.digits, (newDigits) => {
  columns = makeColumns(val.value, newDigits)
  updateDOM()
})

// Hold to repeat on buttons
let repeatTimer: number | null = null
let repeatStart = 0

function stopRepeat() {
  if (repeatTimer !== null) {
    clearTimeout(repeatTimer)
    repeatTimer = null
  }
}

function startRepeat(delta: number) {
  stopRepeat()
  applyDelta(delta)
  repeatStart = performance.now()

  const tick = () => {
    const elapsed = performance.now() - repeatStart
    const multiplier = elapsed > 1500 ? 10 : 1
    applyDelta(delta * multiplier)
    repeatTimer = window.setTimeout(tick, elapsed > 900 ? 55 : 90)
  }

  repeatTimer = window.setTimeout(tick, 380)
}

// Drag to spin on number area
interface DragState {
  y: number
  acc: number
  v: number
  t: number
}

let dragState: DragState | null = null
let inertiaRaf = 0

function stopInertia() {
  if (inertiaRaf) {
    cancelAnimationFrame(inertiaRaf)
    inertiaRaf = 0
  }
}

function consumeAccumulator(acc: number): number {
  const stepCount = acc > 0 ? Math.floor(acc / stepPx) : Math.ceil(acc / stepPx)
  if (stepCount !== 0) {
    applyDelta(stepCount)
  }
  return acc - stepCount * stepPx
}

function onNumPointerDown(e: PointerEvent) {
  if (!props.interactive) return
  stopInertia()
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  catch {
    // ignore pointer capture error
  }
  dragState = {
    y: e.clientY,
    acc: 0,
    v: 0,
    t: performance.now(),
  }
}

function onNumPointerMove(e: PointerEvent) {
  if (!dragState) return
  const now = performance.now()
  const dy = dragState.y - e.clientY // Drag up increases
  dragState.y = e.clientY
  const dt = Math.max(1, now - dragState.t)
  dragState.t = now
  dragState.v = dragState.v * 0.6 + (dy / dt) * 0.4
  dragState.acc = consumeAccumulator(dragState.acc + dy)
}

function onNumPointerUp(e: PointerEvent) {
  if (!dragState) return
  const currentDrag = dragState
  dragState = null
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  catch {
    // ignore pointer capture error
  }

  if (prefersReduced.value || isHyperfocus.value) return
  const elapsed = performance.now() - currentDrag.t
  let v = elapsed > 90 ? 0 : currentDrag.v * 16.67
  if (Math.abs(v) < 2) return

  let acc = currentDrag.acc
  const spin = () => {
    acc = consumeAccumulator(acc + v)
    v *= 0.94
    if (Math.abs(v) > 0.4) {
      inertiaRaf = requestAnimationFrame(spin)
    }
    else {
      inertiaRaf = 0
    }
  }
  inertiaRaf = requestAnimationFrame(spin)
}

onMounted(() => {
  checkReducedMotion()
  updateDOM()
})

onBeforeUnmount(() => {
  stopRepeat()
  stopInertia()
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
})

const activeDigitsCount = computed(() => Math.max(1, String(val.value).length))
</script>

<template>
  <div
    class="rct select-none inline-flex items-center gap-1.5"
    :data-interactive="interactive ? 'true' : undefined"
  >
    <!-- Botón Menos (Bencho .rct-btn) -->
    <button
      v-if="interactive"
      type="button"
      class="rct-btn"
      aria-label="Disminuir valor"
      @pointerdown="startRepeat(-1)"
      @pointerup="stopRepeat"
      @pointerleave="stopRepeat"
      @pointercancel="stopRepeat"
      @keydown.enter.prevent="applyDelta(-1)"
      @keydown.space.prevent="applyDelta(-1)"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>

    <!-- Superficie del odómetro con tiras de números (.rct-num) -->
    <div
      class="rct-num"
      :role="interactive ? 'spinbutton' : 'status'"
      :aria-valuenow="val"
      :aria-valuemin="0"
      :aria-valuemax="maxVal"
      :aria-label="interactive ? 'Contador giratorio. Arrastra verticalmente para cambiar.' : 'Valor actual'"
      :tabindex="interactive ? 0 : -1"
      @keydown.up.prevent="applyDelta(1)"
      @keydown.down.prevent="applyDelta(-1)"
      @pointerdown="onNumPointerDown"
      @pointermove="onNumPointerMove"
      @pointerup="onNumPointerUp"
      @pointercancel="onNumPointerUp"
    >
      <!-- Render de izquierda a derecha (columna de mayor peso a menor) -->
      <span
        v-for="(_, t) in digits"
        :key="t"
        class="rct-pair"
      >
        <!-- Columna de dígito -->
        <span
          class="rct-col"
          :data-on="(digits - 1 - t) < activeDigitsCount ? 'true' : undefined"
        >
          <span
            :ref="el => setStripRef(el, digits - 1 - t)"
            class="rct-strip"
          >
            <span v-for="digit in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]" :key="digit">
              {{ digit }}
            </span>
          </span>
        </span>

        <!-- Separador de miles si corresponde -->
        <span
          v-if="digits > 3 && (digits - 1 - t) === 3"
          class="rct-sep"
          :data-on="activeDigitsCount > 3 ? 'true' : undefined"
        >
          ,
        </span>
      </span>

      <!-- Sufijo opcional -->
      <span v-if="suffix" class="rct-suffix">
        {{ suffix }}
      </span>
    </div>

    <!-- Botón Más (Bencho .rct-btn) -->
    <button
      v-if="interactive"
      type="button"
      class="rct-btn"
      aria-label="Aumentar valor"
      @pointerdown="startRepeat(1)"
      @pointerup="stopRepeat"
      @pointerleave="stopRepeat"
      @pointercancel="stopRepeat"
      @keydown.enter.prevent="applyDelta(1)"
      @keydown.space.prevent="applyDelta(1)"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/* Bencho rolling-counter (.rct-*) exact odometer mechanics */
.rct {
  --rct-cell: 46px;
  --rct-r: 14px;
  --rct-in: 10px;
  position: relative;
  color: var(--d-ink, #f4f4f5);
  font-family: var(--font-mono, monospace);
}

.rct-btn {
  width: 38px;
  height: var(--rct-cell);
  border-radius: var(--rct-in);
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 6%, var(--d-surface-raised, #17171c));
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  color: var(--d-ink, #f4f4f5);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  flex: none;
  place-items: center;
  padding: 0;
  transition:
    scale 0.2s cubic-bezier(0.3, 0.9, 0.4, 1),
    background-color 0.16s ease,
    border-color 0.16s ease;
  display: grid;
}

.rct-btn:hover {
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 12%, var(--d-surface-raised, #17171c));
  border-color: var(--d-rule-strong, rgba(255, 255, 255, 0.15));
}

.rct-btn:active {
  transition-duration: 0.11s;
  scale: 0.92;
}

.rct-btn:focus-visible,
.rct-num:focus-visible {
  box-shadow:
    0 0 0 2px var(--d-surface, #111114),
    0 0 0 4px var(--d-sig, #ff3e00);
  outline: none;
}

.rct-num {
  height: var(--rct-cell);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  font-size: 26px;
  font-weight: 600;
  line-height: var(--rct-cell);
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  padding: 0 12px;
  display: flex;
  background: color-mix(in srgb, var(--d-surface, #111114) 80%, transparent);
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.07));
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 22%,
    black 78%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 22%,
    black 78%,
    transparent 100%
  );
}

.rct[data-interactive="false"] .rct-num {
  cursor: default;
}

.rct-pair {
  display: flex;
  align-items: center;
}

.rct-col {
  opacity: 0;
  width: 0;
  height: var(--rct-cell);
  transition:
    width 0.32s cubic-bezier(0.3, 1.2, 0.4, 1),
    opacity 0.22s ease;
  overflow: hidden;
}

.rct-col[data-on="true"] {
  opacity: 1;
  width: 0.65em;
}

.rct-strip {
  will-change: transform;
  flex-direction: column;
  align-items: center;
  display: flex;
}

.rct-strip > span {
  height: var(--rct-cell);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.rct-sep {
  opacity: 0;
  width: 0;
  height: var(--rct-cell);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    width 0.32s cubic-bezier(0.3, 1.2, 0.4, 1),
    opacity 0.22s ease;
  overflow: hidden;
  color: var(--d-faint, #71717a);
}

.rct-sep[data-on="true"] {
  opacity: 1;
  width: 0.28em;
}

.rct-suffix {
  font-size: 13px;
  font-weight: 500;
  color: var(--d-faint, #71717a);
  margin-left: 4px;
}
</style>
