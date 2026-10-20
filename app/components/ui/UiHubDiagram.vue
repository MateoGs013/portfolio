<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

export interface HubNode {
  id: string
  label: string
  metric?: string
  icon?: string
}

const props = withDefaults(defineProps<{
  coreLabel?: string
  nodes?: HubNode[]
  spread?: number
  height?: number
}>(), {
  coreLabel: 'PG-17 Core',
  nodes: () => [
    { id: 'nuxt', label: 'Nuxt 4 SSR', metric: '18ms SSR', icon: 'zap' },
    { id: 'express', label: 'Express 5', metric: 'REST & SSE', icon: 'code' },
    { id: 'postgres', label: 'Postgres 17', metric: 'ACID / JSONB', icon: 'db' },
    { id: 'prisma', label: 'Prisma 7', metric: 'TypeSafe ORM', icon: 'grid' },
    { id: 'eros', label: 'Eros AI', metric: 'Autonomous Agent', icon: 'target' },
    { id: 'playwright', label: 'Playwright', metric: 'Multi-Viewport', icon: 'check' },
  ],
  spread: 118,
  height: 240,
})

const emit = defineEmits<{
  select: [node: HubNode]
}>()

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const containerRef = ref<HTMLElement | null>(null)
const width = ref(380)
const hoveredIdx = ref<number | null>(null)

interface Packet {
  id: number
  from: number
  a: string
  len: string
}

let packetSeq = 0
const packets = ref<Packet[]>([])
const timeouts: number[] = []
let intervalId: number | null = null
let resizeObs: ResizeObserver | null = null

const n = computed(() => Math.max(3, Math.min(8, props.nodes.length)))
const cx = computed(() => width.value / 2)
const cy = computed(() => props.height / 2)

function nodePos(index: number) {
  const count = n.value
  // Distribución hexagonal simétrica: 2 nodos arriba, 2 en los flancos, 2 abajo
  const a = -Math.PI / 3 + (index / count) * 2 * Math.PI
  return {
    x: Math.round(Math.cos(a) * (props.spread * 1.08) * 10) / 10,
    y: Math.round(Math.sin(a) * (props.spread * 0.66) * 10) / 10,
  }
}

function firePacket(nodeIdx: number) {
  if (isHyperfocus.value || !import.meta.client) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const pos = nodePos(nodeIdx)
  const angle = Math.atan2(pos.y, pos.x)
  const len = Math.hypot(pos.x, pos.y)
  const id = ++packetSeq

  packets.value.push({
    id,
    from: nodeIdx,
    a: `${angle}rad`,
    len: `${len}px`,
  })

  const tId = window.setTimeout(() => {
    packets.value = packets.value.filter(p => p.id !== id)
  }, 720)
  timeouts.push(tId)
}

function onNodeHover(index: number) {
  hoveredIdx.value = index
  playSound('tock', { gap: 60 })
  firePacket(index)
}

function onNodeLeave(index: number) {
  if (hoveredIdx.value === index) {
    hoveredIdx.value = null
  }
}

function onNodeClick(index: number) {
  const node = props.nodes[index]
  if (node) {
    playSound('press')
    firePacket(index)
    emit('select', node)
  }
}

onMounted(() => {
  if (!import.meta.client) return

  if (containerRef.value) {
    width.value = containerRef.value.offsetWidth || 380
    resizeObs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          width.value = entry.contentRect.width
        }
      }
    })
    resizeObs.observe(containerRef.value)
  }

  // Auto-packet runner: fires periodic packet when idle
  intervalId = window.setInterval(() => {
    if (document.hidden || hoveredIdx.value !== null || isHyperfocus.value) return
    const randomIdx = Math.floor(Math.random() * n.value)
    firePacket(randomIdx)
  }, 1900)
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
  timeouts.forEach(t => clearTimeout(t))
  resizeObs?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="hub relative select-none w-full overflow-hidden"
    :data-hot="hoveredIdx !== null || undefined"
    :style="{
      height: `${height}px`,
      '--hub-r': '10px',
    }"
  >
    <!-- Hairline Spokes SVG -->
    <svg class="hub-lines" :width="width" :height="height" aria-hidden="true">
      <line
        v-for="(node, idx) in nodes.slice(0, n)"
        :key="node.id"
        :x1="Math.round(cx * 10) / 10"
        :y1="Math.round(cy * 10) / 10"
        :x2="Math.round((cx + nodePos(idx).x) * 10) / 10"
        :y2="Math.round((cy + nodePos(idx).y) * 10) / 10"
        :data-on="hoveredIdx === idx || undefined"
      />
    </svg>

    <!-- Animated Packets running along spokes -->
    <span
      v-for="p in packets"
      :key="p.id"
      class="hub-packet"
      :style="{
        '--a': p.a,
        '--len': p.len,
        '--t': '720ms',
        left: `${cx}px`,
        top: `${cy}px`,
      }"
    />

    <!-- Central Core Hub -->
    <div
      class="hub-core"
      :style="{ left: `${cx}px`, top: `${cy}px` }"
      aria-hidden="true"
    >
      <transition name="hub-fade" mode="out-in">
        <div
          v-if="hoveredIdx !== null && nodes[hoveredIdx]"
          :key="`metric-${hoveredIdx}`"
          class="hub-icon flex flex-col items-center justify-center px-1"
        >
          <span class="font-mono text-[10px] uppercase tracking-wider text-sig font-bold">
            {{ nodes[hoveredIdx]?.label.split(' ')[0] }}
          </span>
          <span class="font-mono text-[9px] text-faint truncate max-w-[62px]">
            {{ nodes[hoveredIdx]?.metric || 'Active' }}
          </span>
        </div>
        <div
          v-else
          key="default-core"
          class="hub-icon flex flex-col items-center justify-center px-1"
        >
          <svg class="text-sig mb-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
            <path d="M3 12A9 3 0 0 0 21 12" />
          </svg>
          <span class="font-mono text-[9px] font-medium text-ink uppercase tracking-tight">
            {{ coreLabel }}
          </span>
        </div>
      </transition>
    </div>

    <!-- Node Satellite Pills -->
    <button
      v-for="(node, idx) in nodes.slice(0, n)"
      :key="node.id"
      type="button"
      class="hub-node"
      :data-on="hoveredIdx === idx || undefined"
      :style="{
        left: `${cx + nodePos(idx).x}px`,
        top: `${cy + nodePos(idx).y}px`,
        transform: hoveredIdx === idx ? 'translate(-50%, -50%) scale(1.06)' : 'translate(-50%, -50%)',
      }"
      @pointerenter="onNodeHover(idx)"
      @pointerleave="onNodeLeave(idx)"
      @focus="onNodeHover(idx)"
      @blur="onNodeLeave(idx)"
      @click="onNodeClick(idx)"
    >
      <span class="hub-bullet" :data-on="hoveredIdx === idx || undefined" aria-hidden="true" />
      <span class="hub-label font-mono text-[11px] font-medium tracking-tight">{{ node.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.hub {
  --hub-ink: var(--d-ink, #17181a);
  --hub-slab: var(--d-card, #ffffff);
  --hub-mute: color-mix(in srgb, var(--hub-ink) 50%, var(--hub-slab));
  --hub-line: color-mix(in srgb, var(--hub-ink) 12%, transparent);
  --hub-ease: cubic-bezier(0.22, 1, 0.36, 1);
  color: var(--hub-ink);
}

.hub-lines {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}

.hub-lines line {
  stroke: var(--hub-line);
  stroke-width: 1.5px;
  stroke-linecap: round;
  transition: stroke 0.22s, opacity 0.22s;
}

.hub-lines line[data-on] {
  stroke: var(--d-sig, #ff3e00);
  stroke-width: 2px;
}

.hub[data-hot] .hub-lines line:not([data-on]) {
  opacity: 0.35;
}

.hub-core {
  border-radius: min(var(--hub-r), 14px);
  background: var(--hub-slab);
  z-index: 3;
  width: 46px;
  height: 46px;
  margin: -23px 0 0 -23px;
  display: flex;
  position: absolute;
  box-shadow: 0 0 0 1px var(--d-border, rgba(0, 0, 0, 0.08)), 0 4px 12px rgba(0, 0, 0, 0.05);
}

.hub-icon {
  animation: hub-swap 0.32s var(--hub-ease) both;
}

@keyframes hub-swap {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.hub-packet {
  background: linear-gradient(to right, var(--d-sig, #ff3e00), transparent);
  transform-origin: 0;
  z-index: 1;
  pointer-events: none;
  width: 42px;
  height: 2px;
  animation: hub-go var(--t) cubic-bezier(0.55, 0, 0.45, 1) both;
  border-radius: 1px;
  margin-top: -1px;
  position: absolute;
}

@keyframes hub-go {
  0% {
    transform: rotate(var(--a)) translateX(calc(var(--len) - 36px));
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: rotate(var(--a)) translateX(24px);
    opacity: 0;
  }
}

.hub-node {
  border-radius: var(--hub-r);
  background: var(--hub-slab);
  height: 26px;
  color: var(--hub-ink);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
  z-index: 2;
  transition: opacity 0.22s ease, transform 0.22s var(--hub-ease), box-shadow 0.22s ease;
  letter-spacing: -0.01em;
  border: 0;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  display: inline-flex;
  position: absolute;
  transform: translate(-50%, -50%);
  -webkit-transform: translate(-50%, -50%);
  translate: -50% -50%;
  box-shadow: 0 0 0 1px var(--d-border, rgba(0, 0, 0, 0.08)), 0 1px 3px rgba(0, 0, 0, 0.04);
}

.hub-label {
  font-size: 10px;
}

.hub-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hub-mute);
  transition: background-color 0.22s;
}

.hub-bullet[data-on] {
  background: var(--d-sig, #ff3e00);
}

.hub-node[data-on] {
  transform: translate(-50%, -50%) scale(1.06);
  box-shadow: 0 0 0 1.5px var(--d-sig, #ff3e00), 0 4px 14px rgba(255, 62, 0, 0.16);
}

.hub[data-hot] .hub-node:not([data-on]) {
  opacity: 0.45;
}

.hub-node:focus-visible {
  box-shadow: 0 0 0 2px var(--d-sig, #ff3e00);
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .hub-packet {
    display: none !important;
  }
  .hub-icon {
    animation: none !important;
  }
  .hub-node {
    transition: none !important;
  }
}
</style>
