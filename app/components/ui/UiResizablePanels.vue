<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  shutThreshold?: number
  storageKey?: string
}>(), {
  initialWidth: 220,
  minWidth: 172,
  maxWidth: 320,
  shutThreshold: 96,
  storageKey: 'sonzogni-sidebar-w',
})

const emit = defineEmits<{
  'update:width': [w: number]
  'update:collapsed': [collapsed: boolean]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const containerRef = ref<HTMLElement | null>(null)
const dividerRef = ref<HTMLElement | null>(null)

const sidebarWidth = ref(props.initialWidth)
const isDragging = ref(false)
const isHovering = ref(false)
const lastSavedWidth = ref(props.initialWidth)

const isCollapsed = computed(() => sidebarWidth.value <= 0)

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

// Bencho spring physics: stiffness 380, damping 34
const STIFFNESS = 380
const DAMPING = 34
let springRaf = 0
let springVel = 0
let lastSpringTime = 0

function springTo(target: number, onDone?: () => void) {
  if (springRaf) {
    cancelAnimationFrame(springRaf)
    springRaf = 0
  }

  if (prefersReduced.value || isHyperfocus.value) {
    sidebarWidth.value = target
    springVel = 0
    emit('update:width', target)
    emit('update:collapsed', target <= 0)
    onDone?.()
    return
  }

  lastSpringTime = performance.now()

  const step = (now: number) => {
    const dt = Math.min(0.033, (now - lastSpringTime) / 1000)
    lastSpringTime = now

    const force = -STIFFNESS * (sidebarWidth.value - target) - DAMPING * springVel
    springVel += force * dt
    sidebarWidth.value += springVel * dt

    const diff = Math.abs(sidebarWidth.value - target)
    if (diff < 0.25 && Math.abs(springVel) < 0.3) {
      sidebarWidth.value = target
      springVel = 0
      springRaf = 0
      emit('update:width', target)
      emit('update:collapsed', target <= 0)
      onDone?.()
    }
    else {
      emit('update:width', Math.round(sidebarWidth.value))
      springRaf = requestAnimationFrame(step)
    }
  }

  springRaf = requestAnimationFrame(step)
}

// Drag state tracking
interface DragSession {
  pointerId: number
  startX: number
  startWidth: number
  lastRaw: number
  lastTime: number
  velocity: number
}

let session: DragSession | null = null

function calculateResistance(raw: number): number {
  if (raw >= props.minWidth) {
    return Math.min(props.maxWidth, raw)
  }
  // Bencho: under minWidth, resist at 1/3 of travel
  return Math.max(0, props.minWidth - (props.minWidth - raw) / 3)
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  if (springRaf) {
    cancelAnimationFrame(springRaf)
    springRaf = 0
  }

  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  catch {
    // ignore
  }

  session = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startWidth: sidebarWidth.value,
    lastRaw: sidebarWidth.value,
    lastTime: performance.now(),
    velocity: 0,
  }

  isDragging.value = true
  playSound('press')
}

function onPointerMove(e: PointerEvent) {
  if (!session || session.pointerId !== e.pointerId) return

  const delta = e.clientX - session.startX
  const raw = session.startWidth + delta

  const now = performance.now()
  const dt = Math.max(1, now - session.lastTime)
  const instVel = ((raw - session.lastRaw) / dt) * 1000
  session.velocity = session.velocity * 0.4 + instVel * 0.6
  session.lastRaw = raw
  session.lastTime = now

  const effective = calculateResistance(raw)
  sidebarWidth.value = effective
  emit('update:width', Math.round(effective))
}

function onPointerUp(e: PointerEvent) {
  if (!session || session.pointerId !== e.pointerId) return
  const currentSession = session
  session = null
  isDragging.value = false

  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  catch {
    // ignore
  }

  const raw = currentSession.lastRaw
  const isFlick = currentSession.velocity < -700
  const shouldShut = raw < props.shutThreshold || isFlick

  if (shouldShut) {
    playSound('notch')
    springTo(0, () => {
      emit('update:collapsed', true)
    })
  }
  else {
    const finalTarget = Math.min(props.maxWidth, Math.max(raw, props.minWidth))
    lastSavedWidth.value = finalTarget
    if (import.meta.client) {
      try {
        localStorage.setItem(props.storageKey, String(finalTarget))
      }
      catch {
        // ignore
      }
    }
    springTo(finalTarget, () => {
      emit('update:collapsed', false)
    })
  }
}

function toggleCollapse() {
  playSound('notch')
  if (sidebarWidth.value > 0) {
    springTo(0)
  }
  else {
    const restoreW = lastSavedWidth.value > props.minWidth ? lastSavedWidth.value : props.initialWidth
    springTo(restoreW)
  }
}

function onKeyDown(e: KeyboardEvent) {
  const step = e.shiftKey ? 16 : 8
  let target: number | null = null

  if (e.key === 'ArrowLeft') {
    if (sidebarWidth.value <= props.minWidth) {
      target = 0
    }
    else {
      target = Math.max(props.minWidth, sidebarWidth.value - step)
    }
  }
  else if (e.key === 'ArrowRight') {
    if (sidebarWidth.value <= 0) {
      target = lastSavedWidth.value || props.initialWidth
    }
    else {
      target = Math.min(props.maxWidth, sidebarWidth.value + step)
    }
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    toggleCollapse()
    return
  }
  else if (e.key === 'Home') {
    target = props.minWidth
  }
  else if (e.key === 'End') {
    target = props.maxWidth
  }

  if (target !== null) {
    e.preventDefault()
    playSound('notch')
    if (target > 0) {
      lastSavedWidth.value = target
      if (import.meta.client) {
        try {
          localStorage.setItem(props.storageKey, String(target))
        }
        catch {
          // ignore
        }
      }
    }
    springTo(target)
  }
}

onMounted(() => {
  checkReducedMotion()
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem(props.storageKey)
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= props.minWidth && parsed <= props.maxWidth) {
          sidebarWidth.value = parsed
          lastSavedWidth.value = parsed
          emit('update:width', parsed)
        }
      }
    }
    catch {
      // ignore
    }
  }
})

onBeforeUnmount(() => {
  if (springRaf) {
    cancelAnimationFrame(springRaf)
    springRaf = 0
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="rzp"
    :data-drag="isDragging ? 'true' : undefined"
  >
    <!-- Panel Lateral / Sidebar Slot -->
    <div
      class="rzp-pane-sidebar"
      :style="{
        width: `${sidebarWidth.toFixed(1)}px`,
      }"
      :aria-hidden="isCollapsed ? 'true' : undefined"
    >
      <slot
        name="sidebar"
        :width="sidebarWidth"
        :collapsed="isCollapsed"
      />
    </div>

    <!-- Divisor vertical Bencho (.rzp-div) -->
    <div
      ref="dividerRef"
      class="rzp-div"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-label="Separador de panel redimensionable"
      :aria-valuenow="Math.round(sidebarWidth)"
      :aria-valuemin="0"
      :aria-valuemax="maxWidth"
      :data-live="isDragging ? 'true' : undefined"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerenter="isHovering = true"
      @pointerleave="isHovering = false"
      @keydown="onKeyDown"
    >
      <!-- Grip central Bencho (.rzp-grip) -->
      <span class="rzp-grip" aria-hidden="true" />

      <!-- Badge de lectura tabular de ancho en tiempo real -->
      <span
        v-if="isDragging || isHovering"
        class="rzp-badge font-mono"
        aria-hidden="true"
      >
        {{ Math.round(sidebarWidth) }} px
      </span>
    </div>

    <!-- Panel de contenido principal / Default Slot -->
    <div class="rzp-pane-content">
      <slot :collapsed="isCollapsed" />
    </div>
  </div>
</template>

<style scoped>
/* Bencho resizable-panels (.rzp-*) 1:1 port */
.rzp {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  font-family: var(--font-text, system-ui, sans-serif);
  color: var(--d-ink, #f4f4f5);
}

.rzp[data-drag="true"] {
  cursor: col-resize;
}

.rzp-pane-sidebar {
  height: 100%;
  flex: none;
  overflow: hidden;
  position: relative;
  will-change: width;
}

.rzp-pane-content {
  flex: 1 1 0%;
  min-width: 0;
  height: 100%;
  position: relative;
  overflow: auto;
}

/* Divisor interactivo Bencho (.rzp-div) */
.rzp-div {
  background: var(--d-rule, rgba(255, 255, 255, 0.08));
  cursor: col-resize;
  touch-action: none;
  z-index: 20;
  outline: none;
  flex: none;
  width: 1px;
  position: relative;
  transition: background-color 0.16s ease;
}

/* Zona táctil de 16px sobre el divisor de 1px */
.rzp-div:before {
  content: "";
  position: absolute;
  inset: 0 -8px;
  z-index: 1;
}

/* Pastilla grip (.rzp-grip) */
.rzp-grip {
  background: var(--d-faint, #71717a);
  opacity: 0;
  pointer-events: none;
  border-radius: 999px;
  width: 4px;
  height: 20px;
  transition:
    opacity 0.16s ease,
    height 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.16s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.rzp-div:hover,
.rzp-div[data-live="true"] {
  background: var(--d-faint, #71717a);
}

.rzp-div:hover .rzp-grip,
.rzp-div[data-live="true"] .rzp-grip,
.rzp-div:focus-visible .rzp-grip {
  opacity: 1;
}

.rzp-div[data-live="true"] .rzp-grip {
  background: var(--d-sig, #ff3e00);
  height: 28px;
}

.rzp-div:focus-visible {
  background: var(--d-sig, #ff3e00);
}

.rzp-div:focus-visible .rzp-grip {
  background: var(--d-sig, #ff3e00);
}

/* Badge flotante tabular con lectura de píxeles */
.rzp-badge {
  position: absolute;
  top: 14px;
  left: 12px;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--d-ink, #f4f4f5);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  padding: 2px 7px;
  border-radius: 6px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  z-index: 30;
  animation: badge-fade 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes badge-fade {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1023px) {
  .rzp-pane-sidebar,
  .rzp-div {
    display: none !important;
  }
}

@media print {
  .rzp,
  .rzp-pane-content {
    display: block !important;
    height: auto !important;
    overflow: visible !important;
  }
  .rzp-pane-sidebar,
  .rzp-div {
    display: none !important;
  }
}
</style>
