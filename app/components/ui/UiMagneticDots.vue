<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  width?: number
  height?: number
  pull?: number
  radius?: number
  spring?: number
  initialShape?: 'Lines' | 'Dots'
  spacing?: number
}>(), {
  width: 240,
  height: 160,
  pull: 50,
  radius: 55,
  spring: 50,
  initialShape: 'Lines',
  spacing: 12,
})

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentShape = ref<'Lines' | 'Dots'>(props.initialShape)

interface DotPoint {
  rx: number
  ry: number
  x: number
  y: number
  vx: number
  vy: number
  a: number
  va: number
}

const points: DotPoint[] = []
const dotRadius = 1.15 // Bencho ZE = 1.15

let cursor: { x: number; y: number } | null = null
let rafId = 0
let isRunning = false
let isIntersecting = true
let lastTime = 0
let shapeInterp = props.initialShape === 'Lines' ? 1 : 0
let inkColor = '#f4f4f5'
let observer: IntersectionObserver | null = null

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

function buildGrid() {
  points.length = 0
  const sp = props.spacing
  const w = props.width
  const h = props.height
  const padX = sp
  const padY = sp

  for (let y = padY; y <= h - padY; y += sp) {
    for (let x = padX; x <= w - padX; x += sp) {
      points.push({
        rx: x,
        ry: y,
        x,
        y,
        vx: 0,
        vy: 0,
        a: 0,
        va: 0,
      })
    }
  }
}

function updateColor() {
  if (import.meta.client && canvasRef.value) {
    const computedColor = getComputedStyle(canvasRef.value).color
    if (computedColor) inkColor = computedColor
  }
}

function renderFrame(now: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dt = Math.min(0.033, lastTime ? (now - lastTime) / 1000 : 0.016)
  lastTime = now

  const reach = 30 + (props.radius / 100) * 110
  const pullFactor = (props.pull / 100) * 0.7
  const E = 60 + (props.spring / 100) * 340
  const D = 2 * Math.sqrt(E) * 0.42

  const targetV = currentShape.value === 'Lines' ? 1 : 0
  shapeInterp += (targetV - shapeInterp) * (1 - Math.exp(-dt * 9))
  if (Math.abs(targetV - shapeInterp) < 0.002) shapeInterp = targetV
  const isTransitioning = shapeInterp !== targetV

  ctx.clearRect(0, 0, props.width, props.height)
  ctx.fillStyle = inkColor
  ctx.strokeStyle = inkColor
  ctx.lineCap = 'round'

  let hasMotion = false

  for (const p of points) {
    let tx = p.rx
    let ty = p.ry
    let angle = 0
    let influence = 0

    if (cursor) {
      const dx = cursor.x - p.rx
      const dy = cursor.y - p.ry
      const dist = Math.hypot(dx, dy)
      if (dist < reach) {
        const u = 1 - dist / reach
        influence = u * u * (3 - 2 * u) // Bencho smoothstep
        tx = p.rx + dx * pullFactor * influence
        ty = p.ry + dy * pullFactor * influence
        angle = Math.atan2(dy, dx)
      }
    }

    p.vx += (E * (tx - p.x) - D * p.vx) * dt
    p.vy += (E * (ty - p.y) - D * p.vy) * dt
    p.x += p.vx * dt
    p.y += p.vy * dt

    let da = (influence > 0 ? angle : 0) - p.a
    da = Math.atan2(Math.sin(da), Math.cos(da))
    p.va += (E * da * (influence > 0 ? 1 : 0.6) - D * p.va) * dt
    p.a += p.va * dt

    if (
      Math.abs(p.vx) + Math.abs(p.vy) > 0.02
      || Math.abs(tx - p.x) + Math.abs(ty - p.y) > 0.05
      || Math.abs(p.va) > 0.01
    ) {
      hasMotion = true
    }

    const stretch = Math.min(1, Math.hypot(p.x - p.rx, p.y - p.ry) / 12 + influence * 0.6)

    if (shapeInterp > 0) {
      // Lines mode: dashes lean toward pointer
      const lineLen = (3 + 4 * stretch) * shapeInterp
      const rx = Math.cos(p.a) * lineLen
      const ry = Math.sin(p.a) * lineLen
      ctx.lineWidth = (1.4 + 0.6 * stretch) * shapeInterp + dotRadius * 2 * (1 - shapeInterp)
      ctx.beginPath()
      ctx.moveTo(p.x - rx, p.y - ry)
      ctx.lineTo(p.x + rx, p.y + ry)
      ctx.stroke()
    }
    else {
      // Dots mode: velocity stretched ellipses
      const speed = Math.hypot(p.vx, p.vy) / 60
      ctx.beginPath()
      if (speed < 0.3) {
        ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2)
      }
      else {
        const r = Math.min(2.6, 1 + speed * 0.12)
        ctx.ellipse(p.x, p.y, dotRadius * r, dotRadius / Math.sqrt(r), Math.atan2(p.vy, p.vx), 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }

  if ((hasMotion || cursor || isTransitioning) && isIntersecting && !prefersReduced.value && !isHyperfocus.value) {
    rafId = requestAnimationFrame(renderFrame)
  }
  else {
    isRunning = false
  }
}

function requestFrame() {
  if (isRunning || !isIntersecting) return
  isRunning = true
  lastTime = performance.now()
  rafId = requestAnimationFrame(renderFrame)
}

function getPointerCoords(e: PointerEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) / rect.width) * props.width,
    y: ((e.clientY - rect.top) / rect.height) * props.height,
  }
}

function onPointerMove(e: PointerEvent) {
  cursor = getPointerCoords(e)
  requestFrame()
}

function onPointerLeave() {
  cursor = null
  requestFrame()
}

function onPointerDown(e: PointerEvent) {
  cursor = getPointerCoords(e)
  currentShape.value = currentShape.value === 'Lines' ? 'Dots' : 'Lines'
  playSound('press')
  requestFrame()
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !import.meta.client) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(props.width * dpr)
  canvas.height = Math.round(props.height * dpr)

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
  }

  updateColor()
  buildGrid()
  requestFrame()
}

watch([() => props.width, () => props.height, () => props.spacing], () => {
  initCanvas()
})

onMounted(() => {
  checkReducedMotion()
  initCanvas()

  if (import.meta.client && canvasRef.value && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      isIntersecting = entry.isIntersecting
      if (isIntersecting) requestFrame()
    })
    observer.observe(canvasRef.value)
  }
})

onBeforeUnmount(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div
    class="mdg-wrap select-none inline-flex items-center justify-center relative cursor-pointer"
    :style="{ width: `${width}px`, height: `${height}px` }"
    title="Haz clic para alternar entre Líneas y Puntos"
  >
    <canvas
      ref="canvasRef"
      class="mdg-canvas"
      :style="{ width: `${width}px`, height: `${height}px` }"
      role="img"
      aria-label="Campo magnético de puntos interactivos. Pasa el cursor por encima o haz clic para alternar forma."
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerLeave"
      @pointerdown="onPointerDown"
    />

    <!-- Indicador de modo en la esquina inferior derecha -->
    <span class="mdg-badge font-mono" aria-hidden="true">
      {{ currentShape }}
    </span>
  </div>
</template>

<style scoped>
/* Bencho magnetic-dots (.mdg) canvas styling */
.mdg-wrap {
  position: relative;
  border-radius: 12px;
  background: color-mix(in srgb, var(--d-surface, #111114) 70%, transparent);
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  overflow: hidden;
  color: var(--d-ink, #f4f4f5);
  transition: border-color 0.2s ease;
}

.mdg-wrap:hover {
  border-color: var(--d-rule-strong, rgba(255, 255, 255, 0.16));
}

.mdg-canvas {
  display: block;
  touch-action: none;
  color: inherit;
}

.mdg-badge {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--d-faint, #71717a);
  pointer-events: none;
  background: color-mix(in srgb, var(--d-surface-raised, #17171c) 80%, transparent);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.06));
}
</style>
