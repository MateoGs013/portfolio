<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

const props = withDefaults(defineProps<{
  autoPlay?: boolean
  speed?: number
  dimensionLabel?: string
}>(), {
  autoPlay: true,
  speed: 65,
  dimensionLabel: undefined,
})

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const containerRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)

// Beats: 'rest' | 'plan' | 'reveal' | 'done'
// Default to 'done' for SSR resilience so content is immediately accessible
const beat = ref<'rest' | 'plan' | 'reveal' | 'done'>('done')

interface RuleMeasurement {
  x: number
  y: number
  w: number
  h: number
  i: number
}

interface BoxMeasurement {
  x: number
  y: number
  w: number
  h: number
  r: number
  i: number
}

interface Measurements {
  rules: RuleMeasurement[]
  boxes: BoxMeasurement[]
  w: number
  h: number
}

const measurements = ref<Measurements | null>(null)
const SA = 12
const xA = 1800

const k = computed(() => {
  const s = Math.max(0, Math.min(100, props.speed))
  return 2 ** ((50 - s) / 50)
})

const patternId = ref(`bpl-dots-${Math.random().toString(36).slice(2, 8)}`)
const filterId = ref(`bpl-blur-${Math.random().toString(36).slice(2, 8)}`)
const maskId = ref(`bpl-soft-${Math.random().toString(36).slice(2, 8)}`)

const timeouts: number[] = []

function clearTimeouts() {
  timeouts.forEach(t => clearTimeout(t))
  timeouts.length = 0
}

function measureCard() {
  if (!import.meta.client || !cardRef.value) return

  const card = cardRef.value
  const cardRect = card.getBoundingClientRect()
  const scale = (card.offsetWidth > 0 ? cardRect.width / card.offsetWidth : 1) || 1

  const rel = (r: DOMRect) => ({
    x: (r.left - cardRect.left) / scale,
    y: (r.top - cardRect.top) / scale,
    w: r.width / scale,
    h: r.height / scale,
  })

  const rules: RuleMeasurement[] = []
  const boxes: BoxMeasurement[] = []
  let seq = 0

  // 1. Text lines marked with [data-bp-text]
  const textEls = card.querySelectorAll('[data-bp-text]')
  if (textEls.length > 0) {
    textEls.forEach((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = Array.from(range.getClientRects())
      for (const rect of rects) {
        if (rect.width < 2) continue
        const r = rel(rect)
        rules.push({
          x: r.x,
          y: r.y + r.h / 2,
          w: r.w,
          h: Math.max(6, Math.min(10, Math.round(r.h / 2))),
          i: seq++,
        })
      }
    })
  }

  // 2. Boxes marked with [data-bp-box]
  const boxEls = card.querySelectorAll('[data-bp-box]')
  if (boxEls.length > 0) {
    boxEls.forEach((el) => {
      const r = rel(el.getBoundingClientRect())
      const radiusStr = getComputedStyle(el).borderTopLeftRadius
      const radius = Math.min(r.w / 2, r.h / 2, parseFloat(radiusStr) || 8)
      boxes.push({
        ...r,
        r: radius,
        i: seq++,
      })
    })
  }

  // 3. Fallback: If no explicit data-bp attributes, auto-sample key header & body elements
  if (rules.length === 0 && boxes.length === 0) {
    const candidateEls = card.querySelectorAll('h1, h2, h3, h4, p, button, a')
    candidateEls.forEach((el, idx) => {
      if (idx > 5) return
      const r = rel(el.getBoundingClientRect())
      if (r.w > 20 && r.h > 10) {
        rules.push({
          x: r.x,
          y: r.y + r.h / 2,
          w: r.w,
          h: Math.max(6, Math.min(10, Math.round(r.h / 2))),
          i: seq++,
        })
      }
    })
  }

  measurements.value = {
    rules,
    boxes,
    w: card.offsetWidth || 300,
    h: card.offsetHeight || 200,
  }
}

function runSequence() {
  if (!import.meta.client || isHyperfocus.value) {
    beat.value = 'done'
    return
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    beat.value = 'done'
    return
  }

  clearTimeouts()
  measureCard()
  beat.value = 'rest'

  const pVal = k.value

  timeouts.push(window.setTimeout(() => {
    beat.value = 'plan'
  }, 50))

  timeouts.push(window.setTimeout(() => {
    beat.value = 'reveal'
  }, 50 + xA * pVal))

  timeouts.push(window.setTimeout(() => {
    beat.value = 'done'
  }, 50 + 2600 * pVal))
}

function replay() {
  playSound('slide')
  runSequence()
}

defineExpose({
  replay,
})

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!import.meta.client) return

  measureCard()

  if (props.autoPlay && !isHyperfocus.value) {
    if (containerRef.value) {
      observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) {
          runSequence()
          observer?.disconnect()
        }
      }, { threshold: 0.25 })
      observer.observe(containerRef.value)
    }
    else {
      runSequence()
    }
  }
})

onBeforeUnmount(() => {
  clearTimeouts()
  observer?.disconnect()
})

const ruleStaggerMs = computed(() => {
  if (!measurements.value) return 40
  const count = measurements.value.rules.length + measurements.value.boxes.length
  return (xA * k.value * 0.7) / Math.max(1, count)
})
</script>

<template>
  <div
    ref="containerRef"
    class="bpl group/bp relative select-none w-full"
    :data-beat="beat"
    :style="{ '--bpl-k': k }"
  >
    <!-- Blueprint Plan SVG Grid and Line Vectors -->
    <svg
      v-if="measurements && beat !== 'done'"
      class="bpl-plan"
      :width="measurements.w"
      :height="measurements.h"
      :viewBox="`0 0 ${measurements.w} ${measurements.h}`"
      aria-hidden="true"
    >
      <defs>
        <!-- Dot Pattern -->
        <pattern
          :id="patternId"
          :width="SA"
          :height="SA"
          patternUnits="userSpaceOnUse"
        >
          <circle :cx="SA / 2" :cy="SA / 2" r="1" class="bpl-dot" />
        </pattern>

        <!-- Soft Vignette Blur Filter -->
        <filter
          :id="filterId"
          filterUnits="userSpaceOnUse"
          x="-160"
          y="-160"
          :width="measurements.w + 320"
          :height="measurements.h + 320"
        >
          <feGaussianBlur stdDeviation="22" />
        </filter>

        <!-- Soft Radial Mask for Guides -->
        <mask
          :id="maskId"
          maskUnits="userSpaceOnUse"
          x="-160"
          y="-160"
          :width="measurements.w + 320"
          :height="measurements.h + 320"
        >
          <rect
            x="-64"
            y="-64"
            :width="measurements.w + 128"
            :height="measurements.h + 128"
            rx="50"
            fill="#fff"
            :filter="`url(#${filterId})`"
          />
        </mask>
      </defs>

      <!-- Background Architectural Dot Grid -->
      <rect
        class="bpl-grid"
        x="-100"
        y="-100"
        :width="measurements.w + 200"
        :height="measurements.h + 200"
        :fill="`url(#${patternId})`"
        :mask="`url(#${maskId})`"
      />

      <!-- Border Frame & Technical Guides -->
      <g class="bpl-frame">
        <rect
          x="0.5"
          y="0.5"
          :width="measurements.w - 1"
          :height="measurements.h - 1"
          rx="16"
        />
        <g :mask="`url(#${maskId})`">
          <line x1="-80" y1="0.5" :x2="measurements.w + 80" y2="0.5" class="bpl-guide" />
          <line x1="-80" :y1="measurements.h - 0.5" :x2="measurements.w + 80" :y2="measurements.h - 0.5" class="bpl-guide" />
          <line x1="0.5" y1="-80" x2="0.5" :y2="measurements.h + 80" class="bpl-guide" />
          <line :x1="measurements.w - 0.5" y1="-80" :x2="measurements.w - 0.5" :y2="measurements.h + 80" class="bpl-guide" />
        </g>
        <text
          :x="measurements.w / 2"
          :y="measurements.h + 18"
          text-anchor="middle"
          class="bpl-label font-mono"
          font-size="10"
        >
          {{ dimensionLabel || `${Math.round(measurements.w)} × ${Math.round(measurements.h)} px` }}
        </text>
      </g>

      <!-- Measured Staggered Rule Wireframes -->
      <g
        v-for="rule in measurements.rules"
        :key="`r-${rule.i}`"
        class="bpl-rule"
        :style="{
          '--d': `${180 + rule.i * ruleStaggerMs}ms`,
          '--w': `${rule.w}px`,
        }"
      >
        <rect
          :x="rule.x"
          :y="rule.y - rule.h / 2"
          :width="rule.w"
          :height="rule.h"
          :rx="rule.h / 2"
        />
        <rect
          class="bpl-caret"
          :x="rule.x + rule.w + 4"
          :y="rule.y - rule.h / 2 - 2"
          width="2"
          :height="rule.h + 4"
          rx="1"
        />
      </g>

      <!-- Measured Box Wireframes -->
      <g
        v-for="box in measurements.boxes"
        :key="`b-${box.i}`"
        class="bpl-box"
        :style="{
          '--d': `${180 + box.i * ruleStaggerMs}ms`,
        }"
      >
        <rect
          :x="box.x"
          :y="box.y"
          :width="box.w"
          :height="box.h"
          :rx="box.r"
        />
      </g>
    </svg>

    <!-- Real Card Content (Wrapped Slot) -->
    <div
      ref="cardRef"
      class="bpl-card relative w-full rounded-2xl overflow-hidden"
    >
      <slot />

      <!-- Corner CAD Replay Badge -->
      <button
        v-if="!isHyperfocus"
        type="button"
        class="bpl-cad-badge absolute bottom-2.5 right-3 z-10 opacity-75 hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-rule bg-paper/85 backdrop-blur-sm text-[10px] font-mono text-dim hover:text-sig hover:border-sig/40 cursor-pointer"
        title="Replay CAD Blueprint Trace"
        @click.stop="replay"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span v-if="measurements" class="hidden sm:inline text-faint">{{ Math.round(measurements.w) }}×{{ Math.round(measurements.h) }}px ·</span>
        <span>CAD</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.bpl {
  font-family: var(--font-ui, sans-serif);
  color: var(--d-ink, #17181a);
  --bpl-dot: color-mix(in srgb, var(--d-ink, #17181a) 14%, transparent);
  --bpl-line: color-mix(in srgb, var(--d-ink, #17181a) 32%, var(--d-card, #fff));
  --bpl-guide: color-mix(in srgb, var(--d-ink, #17181a) 20%, var(--d-card, #fff));
  --bpl-bar: color-mix(in srgb, var(--d-sig, #ff3e00) 18%, transparent);
  --bpl-ink: color-mix(in srgb, var(--d-ink, #17181a) 60%, var(--d-card, #fff));
  --bpl-out: cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.bpl-plan {
  z-index: 2;
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
}

.bpl-dot {
  fill: var(--bpl-dot);
}

.bpl-grid,
.bpl-frame,
.bpl-rule,
.bpl-box {
  opacity: 0;
}

.bpl-frame rect {
  fill: none;
  stroke: var(--bpl-line);
  stroke-width: 1px;
  stroke-dasharray: 2 4;
}

.bpl-guide {
  stroke: var(--bpl-guide);
  stroke-width: 1px;
  stroke-dasharray: 2 4;
}

.bpl-label {
  fill: var(--bpl-ink);
  letter-spacing: 0.05em;
}

.bpl-rule > rect:first-child {
  fill: var(--bpl-bar);
}

.bpl-caret {
  fill: var(--d-sig, #ff3e00);
  opacity: 0;
}

.bpl-box > rect:first-child {
  fill: none;
  stroke: var(--bpl-line);
  stroke-width: 1px;
  stroke-dasharray: 3 3;
}

/* Beat = plan */
.bpl[data-beat="plan"] :is(.bpl-grid, .bpl-frame) {
  opacity: 1;
  transition: opacity calc(0.22s * var(--bpl-k)) ease;
}

.bpl[data-beat="plan"] .bpl-frame {
  transition-delay: calc(80ms * var(--bpl-k));
}

.bpl-rule {
  clip-path: inset(-4px 100% -4px -4px);
}

.bpl[data-beat="plan"] .bpl-rule {
  opacity: 1;
  clip-path: inset(-4px);
  transition: clip-path calc(0.42s * var(--bpl-k)) var(--bpl-out), opacity 0.16s;
  transition-delay: calc(var(--d) * var(--bpl-k));
}

.bpl[data-beat="plan"] .bpl-caret {
  opacity: 1;
  transition: opacity calc(0.16s * var(--bpl-k)) ease;
  transition-delay: calc((var(--d) + 0.36s) * var(--bpl-k));
}

.bpl[data-beat="plan"] .bpl-box {
  opacity: 1;
  transition: opacity calc(0.22s * var(--bpl-k)) ease;
  transition-delay: calc(var(--d) * var(--bpl-k));
}

/* Beat = reveal */
.bpl[data-beat="reveal"] :is(.bpl-grid, .bpl-frame, .bpl-rule, .bpl-box),
.bpl[data-beat="reveal"] .bpl-caret {
  opacity: 1;
}

.bpl[data-beat="reveal"] .bpl-rule {
  clip-path: inset(-4px);
}

.bpl[data-beat="reveal"] .bpl-plan {
  opacity: 0;
  filter: blur(2px);
  transition: opacity calc(0.6s * var(--bpl-k)) ease calc(0.16s * var(--bpl-k)),
    filter calc(0.6s * var(--bpl-k)) ease calc(0.16s * var(--bpl-k));
}

/* Card Wipe Animation */
.bpl-card {
  box-sizing: border-box;
  position: relative;
}

.bpl[data-beat="rest"] .bpl-card,
.bpl[data-beat="plan"] .bpl-card {
  opacity: 0;
  -webkit-mask: linear-gradient(#000 20%, transparent 80%) 0 100% / 100% 300% no-repeat;
  mask: linear-gradient(#000 20%, transparent 80%) 0 100% / 100% 300% no-repeat;
}

.bpl[data-beat="reveal"] .bpl-card {
  opacity: 1;
  -webkit-mask: linear-gradient(#000 20%, transparent 80%) 0 0 / 100% 300% no-repeat;
  mask: linear-gradient(#000 20%, transparent 80%) 0 0 / 100% 300% no-repeat;
  transition: mask-position calc(0.6s * var(--bpl-k)) ease,
    -webkit-mask-position calc(0.6s * var(--bpl-k)) ease,
    opacity calc(0.6s * var(--bpl-k)) ease;
}

.bpl[data-beat="done"] .bpl-card {
  opacity: 1;
  -webkit-mask: none;
  mask: none;
}

@media (prefers-reduced-motion: reduce) {
  .bpl * {
    transition-duration: 0.05s !important;
    animation: none !important;
  }
}
</style>
