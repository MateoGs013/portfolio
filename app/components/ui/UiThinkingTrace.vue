<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  steps?: string[]
  pace?: number
  autoStart?: boolean
  titleThinking?: string
  titleDone?: string
}>(), {
  steps: undefined,
  pace: 950,
  autoStart: true,
  titleThinking: 'Thinking',
  titleDone: 'Thought for',
})

const defaultSteps = [
  'Parsing relational graph query: analyzing edges across projects and schemas.',
  'Verifying zero layout shift and tactile spring resonance at 60fps.',
  'Optimizing full-text search vector weights and fallback resilience.',
  'Compiling verified payload: architectural validation complete.',
]

const stepsList = computed(() => (props.steps && props.steps.length > 0 ? props.steps : defaultSteps))

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const stepCount = ref(0)
const isThinking = ref(false)
const isOpen = ref(true)
const elapsedSec = ref(0)
const bodyHeight = ref(0)
const stepsOlRef = ref<HTMLOListElement | null>(null)
const timers: number[] = []

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers.length = 0
}

function measureHeight() {
  nextTick(() => {
    if (stepsOlRef.value) {
      bodyHeight.value = stepsOlRef.value.scrollHeight
    }
  })
}

function startReasoning() {
  clearTimers()
  stepCount.value = 0
  isThinking.value = true
  isOpen.value = true

  const steps = stepsList.value
  const t0 = performance.now()

  if (prefersReduced.value || isHyperfocus.value) {
    stepCount.value = steps.length
    isThinking.value = false
    elapsedSec.value = 1
    measureHeight()
    return
  }

  steps.forEach((_, i) => {
    timers.push(window.setTimeout(() => {
      stepCount.value = i + 1
      measureHeight()
    }, 300 + i * props.pace))
  })

  const totalTime = 300 + steps.length * props.pace

  timers.push(window.setTimeout(() => {
    isThinking.value = false
    elapsedSec.value = Math.max(1, Math.round((performance.now() - t0) / 1000))
    measureHeight()
  }, totalTime))

  timers.push(window.setTimeout(() => {
    isOpen.value = false
  }, totalTime + 700))
}

function toggleOpen() {
  if (isThinking.value) return
  isOpen.value = !isOpen.value
  playSound(isOpen.value ? 'expand' : 'press')
  measureHeight()
}

function onReplay() {
  playSound('press')
  startReasoning()
}

watch(() => props.steps, () => {
  startReasoning()
})

onMounted(() => {
  checkReducedMotion()
  if (props.autoStart) {
    startReasoning()
  }
  else {
    stepCount.value = stepsList.value.length
    isThinking.value = false
    isOpen.value = false
    elapsedSec.value = 2
    measureHeight()
  }
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<template>
  <div
    class="thk select-none"
    :data-thinking="isThinking ? 'true' : undefined"
    :data-reduced="prefersReduced || isHyperfocus ? 'true' : undefined"
  >
    <div class="thk-card">
      <!-- Header interactivo con Bencho .thk-word shimmer y chevron -->
      <div class="thk-head">
        <button
          type="button"
          class="thk-title"
          :aria-expanded="isOpen"
          :disabled="isThinking"
          @click="toggleOpen"
        >
          <!-- Shimmer word clip -->
          <span class="thk-word font-mono">
            {{ isThinking ? titleThinking : `${titleDone} ${elapsedSec}s` }}
          </span>

          <!-- Chevron animado -->
          <svg
            class="thk-chev"
            :data-open="isOpen ? 'true' : undefined"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <span
          v-if="isThinking"
          class="thk-pulse-dot"
          aria-hidden="true"
        />
      </div>

      <!-- Cuerpo colapsable animado por altura exacta (.thk-body) -->
      <div
        class="thk-body"
        :style="{ height: isOpen ? `${bodyHeight}px` : '0px' }"
      >
        <ol ref="stepsOlRef" class="thk-steps">
          <li
            v-for="(step, idx) in stepsList.slice(0, stepCount)"
            :key="idx"
            :data-now="isThinking && idx === stepCount - 1 ? 'true' : undefined"
          >
            <span class="thk-step-text">{{ step }}</span>
          </li>
        </ol>
      </div>

      <!-- Botón Replay (.thk-again) -->
      <button
        type="button"
        class="thk-again"
        :data-on="!isThinking ? 'true' : undefined"
        :tabindex="isThinking ? -1 : 0"
        @click="onReplay"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        <span>Replay</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Bencho thinking (.thk-*) exact reasoning trace CSS */
.thk {
  width: 100%;
  max-width: 380px;
  --thk-r: 12px;
  --thk-mute: var(--d-faint, #71717a);
  --thk-line: color-mix(in srgb, var(--d-ink, #f4f4f5) 12%, transparent);
  font-family: var(--font-mono, monospace);
}

.thk-card {
  padding: 4px 0 0;
  position: relative;
}

.thk-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
}

.thk-title {
  color: inherit;
  font: inherit;
  cursor: pointer;
  letter-spacing: -0.01em;
  background: transparent;
  border: 0;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  display: inline-flex;
}

.thk-title:disabled {
  cursor: default;
}

.thk-title:focus-visible {
  box-shadow: 0 0 0 2px var(--d-sig, #ff3e00);
  border-radius: 4px;
  outline: none;
}

/* Bencho shimmer word clip */
.thk[data-thinking="true"] .thk-word {
  background: linear-gradient(
    90deg,
    var(--thk-mute) 0%,
    var(--thk-mute) 35%,
    var(--d-ink, #f4f4f5) 50%,
    var(--thk-mute) 65%,
    var(--thk-mute) 100%
  ) 0 0 / 250% 100%;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: 1.6s linear infinite thk-shine;
}

.thk:not([data-thinking="true"]) .thk-word {
  color: var(--thk-mute);
  animation: none;
}

@keyframes thk-shine {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -150% 0;
  }
}

.thk-chev {
  color: var(--thk-mute);
  transition: rotate 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.thk-chev[data-open="true"] {
  rotate: 90deg;
}

.thk-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--d-sig, #ff3e00);
  box-shadow: 0 0 8px var(--d-sig, #ff3e00);
  animation: thk-dot-pulse 1.2s ease-in-out infinite;
}

@keyframes thk-dot-pulse {
  0%, 100% { opacity: 0.35; scale: 0.85; }
  50% { opacity: 1; scale: 1.2; }
}

/* Body transition with scrollHeight */
.thk-body {
  transition: height 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.thk-steps {
  margin: 0;
  padding: 10px 0 4px 2px;
  list-style: none;
}

.thk-steps li {
  color: var(--thk-mute);
  letter-spacing: 0;
  padding: 0 0 12px 20px;
  font-size: 11.5px;
  line-height: 18px;
  transition: color 0.42s;
  animation: 0.46s cubic-bezier(0.22, 1, 0.36, 1) both thk-in;
  position: relative;
}

@keyframes thk-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.thk-steps li:last-child {
  padding-bottom: 4px;
}

/* Timeline dot */
.thk-steps li::before {
  content: "";
  background: var(--thk-line);
  border-radius: 50%;
  width: 5px;
  height: 5px;
  transition: background-color 0.42s;
  position: absolute;
  top: 6.5px;
  left: 1px;
}

/* Timeline vertical line */
.thk-steps li:not(:last-child)::after {
  content: "";
  background: var(--thk-line);
  width: 1px;
  position: absolute;
  top: 15px;
  bottom: -4px;
  left: 3px;
}

/* Active thinking step */
.thk-steps li[data-now="true"] {
  color: var(--d-ink, #f4f4f5);
}

.thk-steps li[data-now="true"]::before {
  background: var(--d-sig, #ff3e00);
  box-shadow: 0 0 6px var(--d-sig, #ff3e00);
}

/* Replay button */
.thk-again {
  border-radius: 8px;
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 5%, var(--d-surface-raised, #17171c));
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  height: 30px;
  color: var(--d-ink, #f4f4f5);
  font: inherit;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  letter-spacing: 0;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 0 12px 0 10px;
  font-size: 11.5px;
  font-weight: 500;
  transition:
    opacity 0.22s,
    translate 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    scale 0.16s,
    background-color 0.16s;
  display: inline-flex;
  translate: 0 4px;
}

.thk-again[data-on="true"] {
  opacity: 1;
  pointer-events: auto;
  translate: 0;
}

.thk-again:hover {
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 10%, var(--d-surface-raised, #17171c));
  border-color: var(--d-rule-strong, rgba(255, 255, 255, 0.14));
}

.thk-again:active {
  scale: 0.96;
}

.thk-again:focus-visible {
  box-shadow: 0 0 0 2px var(--d-sig, #ff3e00);
  outline: none;
}

/* Reduced motion overrides */
.thk[data-reduced="true"] .thk-word,
.thk[data-reduced="true"] .thk-steps li {
  animation: none !important;
}

.thk[data-reduced="true"] .thk-body {
  transition-duration: 0.05s !important;
}
</style>
