<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

export interface LineSidebarItem {
  key: string
  num: string
  label: string
  count?: string
  to?: RouteLocationRaw
  shortcut?: string
  isRoot?: boolean
}

const props = withDefaults(defineProps<{
  items: LineSidebarItem[]
  activeKey: string
  reach?: number
  length?: number
}>(), {
  reach: 52,
  length: 48,
})

const emit = defineEmits<{
  select: [item: LineSidebarItem, index: number]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const rowRefs = ref<(HTMLElement | null)[]>([])
const tickRefs = ref<(HTMLElement | null)[]>([])

// Física exacta de Bencho line-sidebar (rM):
// pull[i] += (Math.max(bell(i + 0.5 - pointerRow), i === current ? 1 : 0) - pull[i]) * ease
const state = {
  y: null as number | null,
  pull: new Float32Array(0),
  tick: new Float32Array(0),
  raf: 0,
}

function ensureBuffers() {
  const n = props.items.length
  if (state.pull.length !== n) {
    state.pull = new Float32Array(n)
    state.tick = new Float32Array(Math.max(0, n - 1))
    const activeIdx = props.items.findIndex(i => i.key === props.activeKey)
    if (activeIdx >= 0) state.pull[activeIdx] = 1
  }
}

function setRowRef(el: unknown, idx: number) {
  rowRefs.value[idx] = (el as { $el?: HTMLElement })?.$el ?? (el as HTMLElement | null)
}

function setTickRef(el: unknown, idx: number) {
  tickRefs.value[idx] = el as HTMLElement | null
}

function bell(dist: number): number {
  const spread = 0.6 + (props.reach / 100) * 2.4
  return Math.exp(-((dist / spread) ** 2))
}

function applyStyles() {
  const reachOut = 8 + (props.length / 100) * 18
  state.pull.forEach((p, idx) => {
    const row = rowRefs.value[idx]
    if (row) {
      row.style.setProperty('--p', p.toFixed(3))
      row.style.setProperty('--len', `${(10 + p * reachOut).toFixed(1)}px`)
    }
  })
  state.tick.forEach((t, idx) => {
    const tick = tickRefs.value[idx]
    if (tick) {
      tick.style.width = `${(5 + t * reachOut * 0.55).toFixed(1)}px`
    }
  })
}

function scheduleTick() {
  if (!import.meta.client || state.raf) return
  ensureBuffers()

  if (isHyperfocus.value || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const activeIdx = props.items.findIndex(i => i.key === props.activeKey)
    for (let i = 0; i < state.pull.length; i++) {
      state.pull[i] = i === activeIdx ? 1 : 0
    }
    for (let i = 0; i < state.tick.length; i++) {
      state.tick[i] = 0
    }
    applyStyles()
    return
  }

  let prevTime = performance.now()
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - prevTime) / 1000)
    prevTime = now
    const ease = 1 - Math.exp(-dt * 14)
    let moving = false
    const activeIdx = props.items.findIndex(i => i.key === props.activeKey)

    for (let i = 0; i < state.pull.length; i++) {
      const pointerPull = state.y === null ? 0 : bell(i + 0.5 - state.y)
      const target = Math.max(pointerPull, i === activeIdx ? 1 : 0)
      const current = state.pull[i] ?? 0
      const next = current + (target - current) * ease
      state.pull[i] = next
      if (Math.abs(target - next) > 0.002) moving = true
    }

    for (let i = 0; i < state.tick.length; i++) {
      const target = state.y === null ? 0 : bell(i + 1 - state.y) * 0.8
      const current = state.tick[i] ?? 0
      const next = current + (target - current) * ease
      state.tick[i] = next
      if (Math.abs(target - next) > 0.002) moving = true
    }

    applyStyles()
    state.raf = moving || state.y !== null ? requestAnimationFrame(loop) : 0
  }

  state.raf = requestAnimationFrame(loop)
}

function onPointerMove(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const rect = el.getBoundingClientRect()
  state.y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * props.items.length
  scheduleTick()
}

function onPointerLeave() {
  state.y = null
  scheduleTick()
}

function onRowClick(item: LineSidebarItem, idx: number) {
  if (item.key !== props.activeKey) {
    playSound('click', {
      at: props.items.length > 1 ? idx / (props.items.length - 1) : 0.5,
      gap: 30,
    })
  }
  emit('select', item, idx)
}

watch(() => [props.activeKey, props.items.length], () => {
  ensureBuffers()
  scheduleTick()
})

onMounted(() => {
  ensureBuffers()
  applyStyles()
  scheduleTick()
})

onBeforeUnmount(() => {
  if (state.raf) {
    cancelAnimationFrame(state.raf)
    state.raf = 0
  }
})
</script>

<template>
  <div
    class="lsb-list flex flex-col w-full select-none"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <div
      v-for="(item, idx) in items"
      :key="item.key"
      class="lsb-slot relative h-[34px] flex items-center"
    >
      <NuxtLink
        :ref="el => setRowRef(el, idx)"
        :to="item.to || '/'"
        class="lsb-row group relative w-full h-[28px] px-2 rounded-md flex items-center gap-2 no-underline cursor-pointer"
        :data-on="item.key === activeKey || undefined"
        :aria-current="item.key === activeKey ? 'page' : undefined"
        @click="onRowClick(item, idx)"
      >
        <!-- Regla magnética de Bencho (lsb-line) -->
        <span
          class="lsb-line flex-none h-[1.5px] rounded-full transition-colors duration-150"
          :class="item.key === activeKey ? 'bg-sig shadow-[0_0_6px_var(--d-sig)]' : 'bg-current opacity-65'"
          aria-hidden="true"
        />

        <!-- Índice tabular que se inclina con --p -->
        <span class="lsb-num font-mono text-[10.5px] tabular-nums shrink-0">
          {{ item.num }}
        </span>

        <!-- Nombre que se inclina calc(var(--p) * 5px) -->
        <span class="lsb-name font-sans text-[13px] tracking-[-0.01em] truncate flex-1">
          {{ item.label }}
        </span>

        <!-- Atajo en hover + contador tabular limpio -->
        <span class="ml-auto flex items-center gap-1.5 shrink-0">
          <kbd
            v-if="item.shortcut"
            class="opacity-0 group-hover:opacity-100 font-mono text-[9.5px] text-faint px-1 py-0.5 rounded bg-paper/70 border border-rule transition-opacity duration-150"
          >
            {{ item.shortcut }}
          </kbd>
          <span
            v-if="item.count"
            class="font-mono text-[10.5px] tabular-nums transition-colors duration-150"
            :class="item.key === activeKey ? 'text-ink font-medium' : 'text-faint group-hover:text-dim'"
          >
            {{ item.count }}
          </span>
        </span>
      </NuxtLink>

      <!-- Tick intermedio de regla entre filas (Bencho .lsb-tick) -->
      <span
        v-if="idx < items.length - 1"
        :ref="el => setTickRef(el, idx)"
        class="lsb-tick pointer-events-none absolute left-2 top-[31px] h-[1px]"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
/* Bencho line-sidebar (.lsb-*) exact CSS variables and color-mix */
.lsb-row {
  --p: 0;
  --len: 10px;
  color: color-mix(in srgb, var(--d-ink) calc(52% + var(--p) * 48%), var(--d-surface));
  transition: background-color 0.15s ease;
}

.lsb-row:hover {
  background: color-mix(in srgb, var(--d-ink) 4%, transparent);
}

.lsb-row[data-on] {
  background: var(--d-surface-raised);
}

.lsb-line {
  width: var(--len, 10px);
}

.lsb-num,
.lsb-name {
  translate: calc(var(--p, 0) * 5px) 0;
}

.lsb-num {
  color: color-mix(in srgb, var(--d-ink) calc(34% + var(--p) * 44%), var(--d-surface));
}

.lsb-row[data-on] .lsb-num {
  color: var(--d-sig);
}

.lsb-row[data-on] .lsb-name {
  font-weight: 500;
  color: var(--d-ink);
}

.lsb-tick {
  width: 5px;
  background: color-mix(in srgb, var(--d-ink) 20%, transparent);
}
</style>
