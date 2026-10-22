<script setup lang="ts">
/**
 * UiClickSpark — Chispas Geométricas al Clic
 * Inspirado en React Bits / Vue Bits (vue-bits.dev).
 * Genera un estallido sutil de micro-chispas radiales desde el punto exacto del clic.
 * Respeta reduced-motion, Hyperfocus y reproduce audio procedural Bencho.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  enableAudio?: boolean
}>(), {
  sparkColor: 'var(--d-sig, #ff3e00)',
  sparkSize: 8,
  sparkRadius: 24,
  sparkCount: 8,
  duration: 420,
  enableAudio: true,
})

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

let sparks: Spark[] = []
let animId: number | null = null

function draw(now: number) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  sparks = sparks.filter((s) => {
    const elapsed = now - s.startTime
    if (elapsed >= props.duration) return false

    const progress = elapsed / props.duration
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const dist = easeOut * props.sparkRadius
    const currentLen = (1 - progress) * props.sparkSize

    const x1 = s.x + Math.cos(s.angle) * dist
    const y1 = s.y + Math.sin(s.angle) * dist
    const x2 = s.x + Math.cos(s.angle) * (dist + currentLen)
    const y2 = s.y + Math.sin(s.angle) * (dist + currentLen)

    ctx.save()
    ctx.strokeStyle = props.sparkColor
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.globalAlpha = 1 - progress
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.restore()

    return true
  })

  if (sparks.length > 0) {
    animId = requestAnimationFrame(draw)
  }
  else {
    animId = null
  }
}

function handleClick(e: MouseEvent) {
  if (isHyperfocus.value || !canvasRef.value || !rootRef.value) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const rect = rootRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top

  const now = performance.now()
  for (let i = 0; i < props.sparkCount; i++) {
    const angle = (i / props.sparkCount) * 2 * Math.PI + (Math.random() - 0.5) * 0.3
    sparks.push({
      x: clickX,
      y: clickY,
      angle,
      startTime: now,
    })
  }

  if (props.enableAudio) {
    playSound('pop', { gap: 40 })
  }

  if (!animId) {
    animId = requestAnimationFrame(draw)
  }
}

function updateCanvasSize() {
  if (!rootRef.value || !canvasRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  canvasRef.value.width = rect.width
  canvasRef.value.height = rect.height
}

let resizeObs: ResizeObserver | null = null

onMounted(() => {
  if (import.meta.client && rootRef.value) {
    updateCanvasSize()
    resizeObs = new ResizeObserver(updateCanvasSize)
    resizeObs.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  resizeObs?.disconnect()
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative inline-block"
    @click="handleClick"
  >
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 z-30"
      aria-hidden="true"
    />
    <slot />
  </div>
</template>
