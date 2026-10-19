<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  collection?: string
  recordSlug?: string | null
  recordCount?: number
  apiHealthy?: boolean
  latencyMs?: number
}>(), {
  collection: 'db',
  recordSlug: null,
  recordCount: 8,
  apiHealthy: true,
  latencyMs: 11,
})

const { isHyperfocus, toggleHyperfocus } = useHyperfocus()
const { playSound, toggleSound, soundEnabled } = useBenchoSound()

const isOpen = ref(false)
const copied = ref(false)
const islandRef = ref<HTMLElement | null>(null)

// Dimensiones exactas de Bencho Dynamic Island
const COMPACT = { w: 168, h: 30, r: 15 }
const EXPANDED = { w: 336, h: 92, r: 22 }

const currentW = ref(COMPACT.w)
const currentH = ref(COMPACT.h)
const currentR = ref(COMPACT.r)

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

// 2nd-order damped spring: stiffness 380, damping 28, mass 0.9
const STIFFNESS = 380
const DAMPING = 28
const MASS = 0.9

let rafId = 0
let lastTime = 0
let velW = 0
let velH = 0
let velR = 0

function runSpring() {
  if (rafId) return
  lastTime = performance.now()

  const loop = (now: number) => {
    const dt = Math.min(0.033, (now - lastTime) / 1000)
    lastTime = now

    const target = isOpen.value ? EXPANDED : COMPACT

    if (prefersReduced.value || isHyperfocus.value) {
      currentW.value = target.w
      currentH.value = target.h
      currentR.value = target.r
      velW = 0
      velH = 0
      velR = 0
      rafId = 0
      return
    }

    // Width spring
    const forceW = -STIFFNESS * (currentW.value - target.w) - DAMPING * velW
    velW += (forceW / MASS) * dt
    currentW.value += velW * dt

    // Height spring
    const forceH = -STIFFNESS * (currentH.value - target.h) - DAMPING * velH
    velH += (forceH / MASS) * dt
    currentH.value += velH * dt

    // Radius spring
    const forceR = -STIFFNESS * (currentR.value - target.r) - DAMPING * velR
    velR += (forceR / MASS) * dt
    currentR.value += velR * dt

    const diffW = Math.abs(currentW.value - target.w)
    const diffH = Math.abs(currentH.value - target.h)
    const diffR = Math.abs(currentR.value - target.r)
    const moving = Math.abs(velW) > 0.3 || Math.abs(velH) > 0.3 || Math.abs(velR) > 0.3

    if (diffW < 0.25 && diffH < 0.25 && diffR < 0.25 && !moving) {
      currentW.value = target.w
      currentH.value = target.h
      currentR.value = target.r
      velW = 0
      velH = 0
      velR = 0
      rafId = 0
    }
    else {
      rafId = requestAnimationFrame(loop)
    }
  }

  rafId = requestAnimationFrame(loop)
}

function toggleIsland() {
  if (isOpen.value) {
    closeIsland()
  }
  else {
    openIsland()
  }
}

function openIsland() {
  if (isOpen.value) return
  isOpen.value = true
  playSound('expand')
  runSpring()
}

function closeIsland() {
  if (!isOpen.value) return
  isOpen.value = false
  playSound('off')
  runSpring()
}

const activeSql = computed(() => {
  const slugClause = props.recordSlug ? ` WHERE slug = '${props.recordSlug}'` : ''
  return `SELECT * FROM ${props.collection}${slugClause} LIMIT ${props.recordCount};`
})

function copySql() {
  if (!import.meta.client) return
  navigator.clipboard?.writeText(activeSql.value).catch(() => {})
  copied.value = true
  playSound('copied')
  setTimeout(() => {
    copied.value = false
  }, 1600)
}

function onAudioAction() {
  toggleSound()
}

function onZenAction() {
  toggleHyperfocus()
  playSound('tock')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    e.stopPropagation()
    closeIsland()
  }
}

function onPointerDownOutside(e: PointerEvent) {
  if (!isOpen.value) return
  const el = islandRef.value
  if (el && !el.contains(e.target as Node)) {
    closeIsland()
  }
}

onMounted(() => {
  checkReducedMotion()
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
    document.addEventListener('pointerdown', onPointerDownOutside)
  }
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})
</script>

<template>
  <div
    ref="islandRef"
    class="dyn select-none"
    :class="{ 'dyn-is-open': isOpen }"
  >
    <div
      role="button"
      tabindex="0"
      class="dyn-pill"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? 'Cerrar Dynamic Island de PostgreSQL' : 'Abrir métricas de PostgreSQL'"
      :style="{
        width: `${currentW.toFixed(1)}px`,
        height: `${currentH.toFixed(1)}px`,
        borderRadius: `${currentR.toFixed(1)}px`,
      }"
      @click="toggleIsland"
      @keydown.enter.self="toggleIsland"
      @keydown.space.prevent.self="toggleIsland"
    >
      <div class="dyn-in">
        <!-- Estado Compacto (168px x 30px x 15px) -->
        <div
          class="dyn-compact"
          :class="isOpen ? 'dyn-fade-exit' : 'dyn-fade-enter'"
          :aria-hidden="isOpen ? 'true' : undefined"
        >
          <!-- Punto de estado latente / pulsing dot -->
          <span
            class="dyn-dot"
            :class="apiHealthy ? 'dyn-dot-healthy' : 'dyn-dot-warning'"
            aria-hidden="true"
          />

          <!-- Identificador de motor -->
          <span class="dyn-engine font-mono">PG-17</span>

          <!-- Latencia tabular -->
          <span class="dyn-latency font-mono">
            {{ latencyMs }}ms
          </span>

          <!-- Barras de actividad animadas (Bencho .dyn-bars) -->
          <div class="dyn-bars" data-on="true" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <!-- Estado Expandido (336px x 92px x 22px) -->
        <div
          class="dyn-open"
          :class="isOpen ? 'dyn-fade-enter' : 'dyn-fade-exit'"
          :aria-hidden="!isOpen ? 'true' : undefined"
          @click.stop
        >
          <!-- Fila superior: Estado PG-17 y métricas -->
          <div class="dyn-open-head">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="dyn-dot"
                :class="apiHealthy ? 'dyn-dot-healthy' : 'dyn-dot-warning'"
                aria-hidden="true"
              />
              <span class="dyn-title font-mono truncate">
                PostgreSQL 17.2 · {{ apiHealthy ? 'Online' : 'Degraded' }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="dyn-tag font-mono">
                {{ recordCount }} rows
              </span>
              <span class="dyn-latency font-mono">
                {{ latencyMs }}ms
              </span>
            </div>
          </div>

          <!-- Consulta SQL en vivo -->
          <div class="dyn-sql-box font-mono" :title="activeSql">
            <code class="dyn-sql-code">{{ activeSql }}</code>
          </div>

          <!-- Fila de acciones rápidas -->
          <div class="dyn-open-actions">
            <button
              type="button"
              class="dyn-btn font-mono"
              :class="{ 'dyn-btn-active': copied }"
              aria-label="Copiar consulta SQL actual"
              @click.stop="copySql"
            >
              <svg
                v-if="!copied"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <svg
                v-else
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{{ copied ? 'Copiado' : 'Copy SQL' }}</span>
            </button>

            <button
              type="button"
              class="dyn-btn font-mono"
              :class="{ 'dyn-btn-active': soundEnabled }"
              :aria-label="soundEnabled ? 'Silenciar audio de Bencho' : 'Activar audio de Bencho'"
              @click.stop="onAudioAction"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path v-if="soundEnabled" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <line v-else x1="23" x2="17" y1="9" y2="15" />
              </svg>
              <span>{{ soundEnabled ? 'Audio ON' : 'Audio OFF' }}</span>
            </button>

            <button
              type="button"
              class="dyn-btn font-mono"
              :class="{ 'dyn-btn-active': isHyperfocus }"
              :aria-label="isHyperfocus ? 'Desactivar modo Hiperfoco' : 'Activar modo Hiperfoco'"
              @click.stop="onZenAction"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Zen {{ isHyperfocus ? 'ON' : 'H' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bencho dynamic-island (.dyn-*) 1:1 damped spring port */
.dyn {
  display: inline-flex;
  position: relative;
  align-items: center;
  justify-content: center;
  z-index: 60;
  box-sizing: border-box;
}

.dyn-pill {
  color: #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  justify-content: center;
  align-items: center;
  padding: 0;
  display: flex;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  outline: none;
  transition: border-color 0.16s ease;
}

.dyn-pill:focus-visible {
  border-color: var(--d-sig, #ff3e00);
  box-shadow: 0 0 0 2px var(--d-sig, #ff3e00), 0 10px 32px rgba(0, 0, 0, 0.5);
}

.dyn-in {
  display: flex;
  position: absolute;
  inset: 0;
}

/* Crossfade con escala y blur Bencho */
.dyn-compact,
.dyn-open {
  position: absolute;
  inset: 0;
  transition:
    opacity 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform, filter;
}

.dyn-fade-enter {
  opacity: 1;
  transform: scale(1);
  filter: blur(0px);
  pointer-events: auto;
}

.dyn-fade-exit {
  opacity: 0;
  transform: scale(0.92);
  filter: blur(6px);
  pointer-events: none;
}

/* Contenido Compacto */
.dyn-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  gap: 8px;
}

.dyn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}

.dyn-dot-healthy {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  animation: pulse-dot 2.2s infinite ease-in-out;
}

.dyn-dot-warning {
  background: #e5a00d;
  box-shadow: 0 0 8px rgba(229, 160, 13, 0.6);
  animation: pulse-dot 1.4s infinite ease-in-out;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.85); }
}

.dyn-engine {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f4f4f5;
}

.dyn-latency {
  font-variant-numeric: tabular-nums;
  font-size: 10.5px;
  color: #a1a1aa;
}

/* Barras animadas Bencho (.dyn-bars) */
.dyn-bars {
  align-items: center;
  gap: 2px;
  height: 12px;
  display: inline-flex;
}

.dyn-bars i {
  background: #22c55e;
  border-radius: 1px;
  width: 2.5px;
  height: 4px;
  transition: height 0.22s;
}

.dyn-bars[data-on] i {
  animation: 0.9s ease-in-out infinite alternate dyn-bar;
}

.dyn-bars[data-on] i:nth-child(2) {
  animation-duration: 0.7s;
  animation-delay: -0.3s;
}

.dyn-bars[data-on] i:nth-child(3) {
  animation-duration: 1.1s;
  animation-delay: -0.5s;
}

.dyn-bars[data-on] i:nth-child(4) {
  animation-duration: 0.8s;
  animation-delay: -0.2s;
}

@keyframes dyn-bar {
  0% { height: 3px; }
  100% { height: 11px; }
}

/* Contenido Expandido */
.dyn-open {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
  text-align: left;
}

.dyn-open-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dyn-title {
  font-size: 11px;
  font-weight: 600;
  color: #f4f4f5;
}

.dyn-tag {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 10px;
  color: #d4d4d8;
}

.dyn-sql-box {
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 3px 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.dyn-sql-code {
  font-size: 10px;
  color: #22c55e;
  letter-spacing: -0.01em;
}

.dyn-open-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dyn-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 9.5px;
  color: #d4d4d8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.dyn-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.dyn-btn-active {
  background: rgba(255, 62, 0, 0.16);
  border-color: rgba(255, 62, 0, 0.4);
  color: #ff3e00;
}

@media (prefers-reduced-motion: reduce) {
  .dyn-bars[data-on] i {
    animation: none;
    height: 6px;
  }
  .dyn-dot-healthy,
  .dyn-dot-warning {
    animation: none;
  }
}
</style>
