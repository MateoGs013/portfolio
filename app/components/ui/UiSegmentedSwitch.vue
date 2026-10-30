<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'

export interface SegmentedOption {
  value: string
  label: string
  shortLabel?: string
  ariaLabel?: string
  shortcut?: string
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: SegmentedOption[]
  ariaLabel?: string
  size?: 'sm' | 'md'
  bounce?: number
  expandLabel?: boolean
}>(), {
  ariaLabel: 'Selector de vista',
  size: 'sm',
  bounce: 50,
  expandLabel: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { isHyperfocus } = useHyperfocus()

const tabRefs = ref<(HTMLButtonElement | null)[]>([])
const tileRef = ref<HTMLSpanElement | null>(null)

// Estado físico del resorte de 2.º orden de Bencho (tab-bar RI)
const springState = {
  x: 0,
  w: 0,
  vx: 0,
  vw: 0,
  raf: 0,
  lastTime: 0,
  settledFrames: 0,
}

const activeIndex = computed(() => {
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  return idx >= 0 ? idx : 0
})

function setTabRef(el: unknown, idx: number) {
  tabRefs.value[idx] = el as HTMLButtonElement | null
}

function snapTile() {
  const btn = tabRefs.value[activeIndex.value]
  const tile = tileRef.value
  if (!btn || !tile) return
  springState.x = btn.offsetLeft
  springState.w = btn.offsetWidth
  springState.vx = 0
  springState.vw = 0
  tile.style.transform = `translate3d(${btn.offsetLeft}px, 0, 0)`
  tile.style.width = `${btn.offsetWidth}px`
}

function animateSpring() {
  if (!import.meta.client) return
  const tile = tileRef.value
  const btn = tabRefs.value[activeIndex.value]
  if (!tile || !btn) return

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced || isHyperfocus.value) {
    snapTile()
    return
  }

  if (springState.raf) cancelAnimationFrame(springState.raf)
  springState.lastTime = 0
  springState.settledFrames = 0

  const dampingRatio = 1 - Math.max(0, Math.min(100, props.bounce)) * 0.0055
  const c = 2 * Math.sqrt(260) * dampingRatio

  const step = (now: number) => {
    const targetBtn = tabRefs.value[activeIndex.value]
    if (!targetBtn || !tileRef.value) return

    const dt = springState.lastTime ? Math.min(0.032, (now - springState.lastTime) / 1000) : 1 / 60
    springState.lastTime = now

    const targetX = targetBtn.offsetLeft
    const targetW = targetBtn.offsetWidth

    springState.vx += (260 * (targetX - springState.x) - c * springState.vx) * dt
    springState.vw += (260 * (targetW - springState.w) - c * springState.vw) * dt
    springState.x += springState.vx * dt
    springState.w += springState.vw * dt

    tileRef.value.style.transform = `translate3d(${springState.x.toFixed(2)}px, 0, 0)`
    tileRef.value.style.width = `${springState.w.toFixed(2)}px`

    const isClose = Math.abs(targetX - springState.x) < 0.2
      && Math.abs(targetW - springState.w) < 0.2
      && Math.abs(springState.vx) < 2
      && Math.abs(springState.vw) < 2

    springState.settledFrames = isClose ? springState.settledFrames + 1 : 0

    if (springState.settledFrames < 6) {
      springState.raf = requestAnimationFrame(step)
    }
    else {
      tileRef.value.style.transform = `translate3d(${targetX}px, 0, 0)`
      tileRef.value.style.width = `${targetW}px`
      springState.x = targetX
      springState.w = targetW
      springState.vx = 0
      springState.vw = 0
      springState.raf = 0
    }
  }

  springState.raf = requestAnimationFrame(step)
}

function selectOption(value: string) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}

function onKeyDown(e: KeyboardEvent) {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!dir || !props.options.length) return
  e.preventDefault()
  const nextIdx = (activeIndex.value + dir + props.options.length) % props.options.length
  const nextOpt = props.options[nextIdx]
  if (nextOpt) {
    selectOption(nextOpt.value)
    tabRefs.value[nextIdx]?.focus()
  }
}

watch(() => props.modelValue, () => {
  nextTick(() => animateSpring())
})

onMounted(() => {
  nextTick(() => snapTile())
})

onBeforeUnmount(() => {
  if (springState.raf) cancelAnimationFrame(springState.raf)
})
</script>

<template>
  <div
    role="tablist"
    :aria-label="ariaLabel"
    class="tbb relative inline-flex items-center p-[3px] bg-paper/90 border border-rule rounded-lg select-none"
    :class="size === 'md' ? 'h-9' : 'h-8'"
  >
    <!-- Tile deslizante con física de resorte real de Bencho (260 stiffness) -->
    <span
      ref="tileRef"
      class="tbb-tile pointer-events-none absolute top-[3px] bottom-[3px] left-0 rounded-[5px] bg-surface-raised border border-rule-strong shadow-xs will-change-[transform,width]"
      :style="{
        width: `${100 / Math.max(options.length, 1)}%`,
        transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
      }"
      aria-hidden="true"
    />

    <button
      v-for="(opt, idx) in options"
      :key="opt.value"
      :ref="el => setTabRef(el, idx)"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      :aria-label="opt.ariaLabel || opt.label"
      :tabindex="modelValue === opt.value ? 0 : -1"
      :data-on="modelValue === opt.value || undefined"
      class="tbb-tab relative z-10 inline-flex items-center justify-center gap-1.5 px-2.5 h-full font-mono uppercase tracking-wider cursor-pointer transition-colors duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-sig focus-visible:outline-offset-1 rounded-[5px]"
      :class="[
        size === 'md' ? 'text-[11px]' : 'text-[10.5px]',
        modelValue === opt.value
          ? 'text-ink font-semibold'
          : 'text-dim hover:text-ink/80 font-medium',
      ]"
      @click="selectOption(opt.value)"
      @keydown="onKeyDown"
    >
      <span class="w-1 h-1 rounded-full transition-colors duration-150 shrink-0" :class="modelValue === opt.value ? 'bg-sig' : 'bg-transparent'" />
      <span v-if="!expandLabel" class="whitespace-nowrap">
        <span v-if="opt.shortLabel" class="sm:hidden">{{ opt.shortLabel }}</span>
        <span :class="{ 'hidden sm:inline': !!opt.shortLabel }">{{ opt.label }}</span>
      </span>
      <span v-else class="tbb-name">
        <span>{{ opt.label }}</span>
      </span>
      <kbd
        v-if="opt.shortcut"
        class="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-paper/60 text-faint border border-rule leading-none"
      >
        {{ opt.shortcut }}
      </kbd>
    </button>
  </div>
</template>

<style scoped>
/* Bencho tab-bar (.tbb-*) grid-template-columns label expansion */
.tbb-name {
  display: grid;
  grid-template-columns: 0fr;
  transition: grid-template-columns 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.tbb-name > span {
  white-space: nowrap;
  opacity: 0;
  overflow: hidden;
  translate: -6px 0;
  transition:
    opacity 0.16s,
    translate 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.tbb-tab[data-on] .tbb-name {
  grid-template-columns: 1fr;
}

.tbb-tab[data-on] .tbb-name > span {
  opacity: 1;
  translate: 0 0;
  transition:
    opacity 0.32s 0.1s,
    translate 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.1s;
}
</style>
