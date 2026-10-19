<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'
import AppIcon, { type IconName } from '~/components/ui/AppIcon.vue'

export interface DockItem {
  key: string
  label: string
  icon?: IconName | string
  to?: string
  count?: string
}

const props = withDefaults(defineProps<{
  items: DockItem[]
  modelValue?: string
  magnify?: number
  spread?: number
  lift?: number
}>(), {
  modelValue: undefined,
  magnify: 1.34,
  spread: 2,
  lift: 7,
})

const emit = defineEmits<{
  'update:modelValue': [key: string]
  'select': [key: string]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const dockRef = ref<HTMLElement | null>(null)
const tipTextRef = ref<HTMLElement | null>(null)

const activeKey = ref(props.modelValue || props.items[0]?.key || '')
const hoveredIdx = ref<number | null>(null)
const isPointerDragging = ref(false)
const wasDragSelect = ref(false)

const tipPos = ref<{ x: number; w: number } | null>(null)
const tipReady = ref(false)

const prefersReduced = ref(false)
function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

function findClosestIndex(clientX: number): number | null {
  const dock = dockRef.value
  if (!dock) return null
  const items = dock.querySelectorAll('.gdock-item')
  if (!items.length) return null

  let bestIdx = 0
  let minDist = Infinity
  items.forEach((item, idx) => {
    const rect = item.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    const d = Math.abs(clientX - center)
    if (d < minDist) {
      minDist = d
      bestIdx = idx
    }
  })
  return bestIdx
}

function updateTip() {
  nextTick(() => {
    const dock = dockRef.value
    if (!dock || hoveredIdx.value === null) {
      tipPos.value = null
      tipReady.value = false
      return
    }

    const items = dock.querySelectorAll('.gdock-item')
    const itemEl = items[hoveredIdx.value] as HTMLElement | null
    const textEl = tipTextRef.value
    if (!itemEl || !textEl) return

    const textWidth = Math.ceil(textEl.scrollWidth) + 24
    const dockRect = dock.getBoundingClientRect()
    const itemRect = itemEl.getBoundingClientRect()
    const itemCenter = itemRect.left - dockRect.left + itemRect.width / 2

    tipPos.value = {
      x: itemCenter - textWidth / 2,
      w: textWidth,
    }
    requestAnimationFrame(() => {
      tipReady.value = true
    })
  })
}

function setHoverIndex(idx: number | null) {
  if (idx !== null && idx !== hoveredIdx.value) {
    playSound('drag', {
      at: idx / Math.max(1, props.items.length - 1),
      gap: 120,
    })
  }
  hoveredIdx.value = idx
  updateTip()
}

function onItemClick(item: DockItem, idx: number) {
  if (wasDragSelect.value) return
  if (activeKey.value !== item.key) {
    playSound('drag', { at: idx / Math.max(1, props.items.length - 1) })
    activeKey.value = item.key
    emit('update:modelValue', item.key)
    emit('select', item.key)
  }
}

// Touch and pointer interactions (Bencho exact)
function onPointerDownCapture(e: PointerEvent) {
  isPointerDragging.value = true
  wasDragSelect.value = false
  setHoverIndex(findClosestIndex(e.clientX))
}

function onPointerMoveCapture(e: PointerEvent) {
  if (e.pointerType !== 'mouse' && !isPointerDragging.value) return
  setHoverIndex(findClosestIndex(e.clientX))
}

function onPointerUpCapture(e: PointerEvent) {
  if (isPointerDragging.value && e.pointerType !== 'mouse') {
    const idx = findClosestIndex(e.clientX)
    if (idx !== null && props.items[idx]) {
      wasDragSelect.value = true
      const targetItem = props.items[idx]
      if (targetItem.key !== activeKey.value) {
        playSound('drag', { at: idx / Math.max(1, props.items.length - 1) })
        activeKey.value = targetItem.key
        emit('update:modelValue', targetItem.key)
        emit('select', targetItem.key)
      }
    }
  }
  isPointerDragging.value = false
  if (e.pointerType !== 'mouse') {
    setHoverIndex(null)
  }
}

function onPointerLeave() {
  if (!isPointerDragging.value) {
    setHoverIndex(null)
  }
}

function getGlyphStyle(idx: number) {
  if (prefersReduced.value || isHyperfocus.value) {
    return {}
  }
  const dist = hoveredIdx.value === null ? 99 : Math.abs(idx - hoveredIdx.value)
  const p = dist > props.spread ? 0 : (1 + Math.cos((Math.PI * dist) / (props.spread + 1))) / 2
  const scale = 1 + (props.magnify - 1) * p
  const liftPx = -props.lift * p

  return {
    transform: `translateY(${liftPx.toFixed(2)}px) scale(${scale.toFixed(3)})`,
  }
}

function getNearAttr(idx: number): number | undefined {
  if (hoveredIdx.value === null) return undefined
  const diff = Math.abs(idx - hoveredIdx.value)
  return diff <= 1 ? diff : undefined
}

watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal !== activeKey.value) {
    activeKey.value = newVal
  }
})

onMounted(() => {
  checkReducedMotion()
})
</script>

<template>
  <nav
    ref="dockRef"
    class="gdock select-none"
    aria-label="Dock interactivo"
    @pointerdown.capture="onPointerDownCapture"
    @pointermove.capture="onPointerMoveCapture"
    @pointerup.capture="onPointerUpCapture"
    @pointercancel.capture="onPointerLeave"
    @pointerleave="onPointerLeave"
  >
    <!-- Elementos del dock -->
    <template v-for="(item, idx) in items" :key="item.key">
      <!-- Caso enlace NuxtLink -->
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="gdock-item"
        :aria-label="item.label"
        :aria-current="activeKey === item.key ? 'page' : undefined"
        :data-near="getNearAttr(idx)"
        :data-active="activeKey === item.key ? 'true' : undefined"
        @pointerdown.stop
        @click="onItemClick(item, idx)"
      >
        <span class="gdock-glyph" :style="getGlyphStyle(idx)">
          <slot name="icon" :item="item" :index="idx">
            <AppIcon v-if="item.icon" :name="(item.icon as IconName)" :size="20" />
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
            </svg>
          </slot>
        </span>
        <span
          class="gdock-dot"
          :data-on="activeKey === item.key ? 'true' : undefined"
          aria-hidden="true"
        />
      </NuxtLink>

      <!-- Caso botón de acción -->
      <button
        v-else
        type="button"
        class="gdock-item"
        :aria-label="item.label"
        :aria-current="activeKey === item.key ? 'page' : undefined"
        :data-near="getNearAttr(idx)"
        :data-active="activeKey === item.key ? 'true' : undefined"
        @pointerdown.stop
        @click="onItemClick(item, idx)"
      >
        <span class="gdock-glyph" :style="getGlyphStyle(idx)">
          <slot name="icon" :item="item" :index="idx">
            <AppIcon v-if="item.icon" :name="(item.icon as IconName)" :size="20" />
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
            </svg>
          </slot>
        </span>
        <span
          class="gdock-dot"
          :data-on="activeKey === item.key ? 'true' : undefined"
          aria-hidden="true"
        />
      </button>
    </template>

    <!-- Píldora de tooltip viajera (.gdock-tip) -->
    <span
      class="gdock-tip font-mono"
      aria-hidden="true"
      :data-on="hoveredIdx !== null && tipPos !== null ? 'true' : undefined"
      :data-ready="tipReady ? 'true' : undefined"
      :style="tipPos ? {
        width: `${tipPos.w}px`,
        transform: `translateX(${tipPos.x}px)`,
      } : undefined"
    >
      <span ref="tipTextRef">
        {{ hoveredIdx !== null ? (items[hoveredIdx]?.label ?? '') : '' }}
      </span>
    </span>
  </nav>
</template>

<style scoped>
/* Bencho dock (.gdock-*) macOS raised cosine magnification & travelling pill */
.gdock {
  background: color-mix(in srgb, var(--d-surface, #111114) 84%, transparent);
  border: 1px solid var(--d-rule-strong, rgba(255, 255, 255, 0.12));
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border-radius: 18px;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  position: relative;
  gap: 3px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
}

.gdock-item {
  width: 44px;
  height: 44px;
  color: var(--d-ink, #f4f4f5);
  opacity: 0.52;
  cursor: pointer;
  background: transparent;
  border: 0;
  place-items: center;
  transition: opacity 0.22s ease;
  display: grid;
  position: relative;
  border-radius: 10px;
  padding: 0;
}

.gdock-glyph {
  transform-origin: 50% 100%;
  place-items: center;
  transition: transform 0.22s cubic-bezier(0.32, 0.72, 0.24, 1);
  display: grid;
}

.gdock-item[data-near="1"] {
  opacity: 0.76;
}

.gdock-item[data-near="0"],
.gdock-item[data-active="true"] {
  opacity: 1;
}

.gdock-item:focus-visible {
  outline: 1.5px solid var(--d-sig, #ff3e00);
  outline-offset: 3px;
}

/* Punto activo en la base del item */
.gdock-dot {
  background: var(--d-sig, #ff3e00);
  opacity: 0;
  border-radius: 50%;
  width: 3.5px;
  height: 3.5px;
  margin-left: -1.75px;
  transition:
    opacity 0.22s ease,
    transform 0.42s cubic-bezier(0.24, 1.34, 0.38, 1);
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: scale(0.4);
}

.gdock-dot[data-on="true"] {
  opacity: 1;
  transform: scale(1);
  box-shadow: 0 0 6px var(--d-sig, #ff3e00);
}

/* Travelling tooltip pill */
.gdock-tip {
  background: var(--d-ink, #f4f4f5);
  color: var(--d-surface, #111114);
  height: 28px;
  line-height: 28px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  z-index: 20;
  border-radius: 999px;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition:
    transform 0.16s cubic-bezier(0.22, 1, 0.36, 1),
    width 0.16s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
  display: inline-flex;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.gdock-tip > span {
  flex: none;
  padding: 0 12px;
}

.gdock-tip:not([data-ready="true"]) {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.gdock-tip[data-on="true"] {
  opacity: 1;
}
</style>
