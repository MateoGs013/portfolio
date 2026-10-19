<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHyperfocus } from '~/composables/useHyperfocus'
import { useBenchoSound } from '~/composables/useBenchoSound'

export interface FolderPreviewItem {
  id: string
  title: string
  subtitle?: string
  image?: string
  badge?: string
}

const props = withDefaults(defineProps<{
  items?: FolderPreviewItem[]
  spread?: number
  label?: string
  count?: string | number
  compact?: boolean
}>(), {
  items: undefined,
  spread: 9,
  label: undefined,
  count: undefined,
  compact: false,
})

const emit = defineEmits<{
  select: [item: FolderPreviewItem]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()

const defaultItems: FolderPreviewItem[] = [
  { id: 'relational', title: 'Relational Graph', subtitle: 'PostgreSQL / Prisma 7', badge: 'v2.4' },
  { id: 'hyperfocus', title: 'Hyperfocus Kernel', subtitle: 'Zero Noise Monospace', badge: 'Zen' },
  { id: 'bento', title: 'Bento Lab Micro', subtitle: 'Tactile Motion Physics', badge: 'Craft' },
]

const itemsList = computed(() => (props.items && props.items.length > 0 ? props.items : defaultItems))
const countDisplay = computed(() => props.count ?? itemsList.value.length)

const isOpen = ref(false)
const hoveredIdx = ref<number | null>(null)
const prefersReduced = ref(false)
const brokenImages = ref<Record<number, boolean>>({})

function checkReducedMotion() {
  if (import.meta.client && window.matchMedia) {
    prefersReduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}

onMounted(() => {
  checkReducedMotion()
})

function onFolderEnter() {
  if (!isOpen.value) {
    isOpen.value = true
    playSound('slide')
  }
}

function onFolderLeave() {
  isOpen.value = false
  hoveredIdx.value = null
}

function onCardEnter(idx: number) {
  if (isOpen.value) {
    hoveredIdx.value = idx
    playSound('poke')
  }
}

function onCardLeave(idx: number) {
  if (hoveredIdx.value === idx) {
    hoveredIdx.value = null
  }
}

function onCardClick(item: FolderPreviewItem) {
  playSound('press')
  emit('select', item)
}

const midIndex = computed(() => (itemsList.value.length - 1) / 2)

function getCardStyle(idx: number) {
  const s = midIndex.value || 1
  const l = idx - s
  const rotDeg = isOpen.value ? (l / s) * props.spread : l * 4
  const delayMs = Math.abs(l) * 35
  const z = isOpen.value
    ? 10 - Math.abs(Math.round(l)) + (hoveredIdx.value === idx ? 10 : 0)
    : idx

  return {
    '--a': `${rotDeg.toFixed(2)}deg`,
    '--d': prefersReduced.value || isHyperfocus.value ? '0ms' : `${delayMs}ms`,
    'zIndex': z,
  }
}
</script>

<template>
  <div
    class="fdr select-none"
    :data-open="isOpen ? 'true' : undefined"
    :data-compact="compact ? 'true' : undefined"
    :data-reduced="prefersReduced || isHyperfocus ? 'true' : undefined"
    @pointerenter="onFolderEnter"
    @pointerleave="onFolderLeave"
  >
    <div class="fdr-stage">
      <!-- Bencho .fdr-back con pestaña superior de carpeta -->
      <div class="fdr-back" aria-hidden="true">
        <span v-if="countDisplay !== undefined" class="fdr-tab-count">
          {{ countDisplay }}
        </span>
      </div>

      <!-- Tarjetas abanico fanning out -->
      <button
        v-for="(item, idx) in itemsList"
        :key="item.id || idx"
        type="button"
        class="fdr-card"
        :data-lift="hoveredIdx === idx ? 'true' : undefined"
        :tabindex="isOpen ? 0 : -1"
        :aria-label="item.title"
        :style="getCardStyle(idx)"
        @pointerenter="onCardEnter(idx)"
        @pointerleave="onCardLeave(idx)"
        @focus="hoveredIdx = idx"
        @blur="hoveredIdx = null"
        @click="onCardClick(item)"
      >
        <div v-if="item.image && !brokenImages[idx]" class="fdr-card-img">
          <img :src="item.image" :alt="item.title" draggable="false" @error="brokenImages[idx] = true">
        </div>
        <div v-else class="fdr-card-content">
          <div class="fdr-card-top">
            <span v-if="item.badge" class="fdr-badge">{{ item.badge }}</span>
            <span class="fdr-index">#0{{ idx + 1 }}</span>
          </div>
          <div class="fdr-card-meta">
            <span class="fdr-title">{{ item.title }}</span>
            <span v-if="item.subtitle" class="fdr-sub">{{ item.subtitle }}</span>
          </div>
        </div>
      </button>

      <!-- Flap frontal esmerilado que se inclina hacia adelante al abrirse -->
      <div class="fdr-front" aria-hidden="true">
        <div class="fdr-front-sheen" />
        <div v-if="label" class="fdr-front-label">
          <span class="fdr-front-text">{{ label }}</span>
          <span class="fdr-front-line" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bencho folder (.fdr-*) exact pivot & spring mechanics */
.fdr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  isolation: isolate;
}

.fdr-stage {
  width: 260px;
  height: 220px;
  position: relative;
  overflow: visible;
}

.fdr[data-compact="true"] .fdr-stage {
  width: 180px;
  height: 160px;
}

/* Back flap of folder */
.fdr-back {
  background: color-mix(in srgb, var(--d-surface-raised, #17171c) 88%, var(--d-sig, #ff3e00) 12%);
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  border-radius: 6px 18px 18px 18px;
  width: 200px;
  height: 136px;
  position: absolute;
  top: 74px;
  left: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
}

.fdr[data-compact="true"] .fdr-back {
  width: 146px;
  height: 104px;
  top: 50px;
  left: 17px;
  border-radius: 4px 14px 14px 14px;
}

/* Folder tab (:before in Bencho) */
.fdr-back::before {
  content: "";
  background: inherit;
  border-top: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  border-left: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  border-right: 1px solid var(--d-rule, rgba(255, 255, 255, 0.08));
  border-radius: 8px 8px 0 0;
  width: 72px;
  height: 18px;
  position: absolute;
  top: -15px;
  left: 0;
}

.fdr[data-compact="true"] .fdr-back::before {
  width: 52px;
  height: 14px;
  top: -12px;
}

.fdr-tab-count {
  position: absolute;
  top: -14px;
  left: 10px;
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 600;
  color: var(--d-faint, #71717a);
  letter-spacing: 0.02em;
  z-index: 1;
}

.fdr[data-compact="true"] .fdr-tab-count {
  top: -11px;
  left: 8px;
  font-size: 9px;
}

/* Cards fanning out */
.fdr-card {
  background: var(--d-surface, #111114);
  color: var(--d-ink, #f4f4f5);
  cursor: pointer;
  transform-origin: 50% 340px;
  width: 116px;
  height: 114px;
  transform: rotate(var(--a)) translateY(0);
  transition:
    transform 0.56s cubic-bezier(0.24, 1.34, 0.38, 1) var(--d),
    translate 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    scale 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s ease;
  border: 1px solid var(--d-rule-strong, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  padding: 0;
  position: absolute;
  top: 50px;
  left: calc(50% - 58px);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  text-align: left;
}

.fdr[data-compact="true"] .fdr-card {
  transform-origin: 50% 240px;
  width: 86px;
  height: 84px;
  top: 36px;
  left: calc(50% - 43px);
  border-radius: 9px;
}

.fdr[data-open="true"] .fdr-card {
  transform: rotate(var(--a)) translateY(-78px);
}

.fdr[data-compact="true"][data-open="true"] .fdr-card {
  transform: rotate(var(--a)) translateY(-56px);
}

.fdr-card[data-lift="true"] {
  translate: 0 -10px;
  scale: 1.04;
  border-color: var(--d-sig, #ff3e00);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
}

.fdr[data-compact="true"] .fdr-card[data-lift="true"] {
  translate: 0 -7px;
  scale: 1.03;
}

.fdr-card:focus-visible {
  outline: 2px solid var(--d-sig, #ff3e00);
  outline-offset: 2px;
}

/* Reduced motion overrides */
.fdr[data-reduced="true"] .fdr-card,
.fdr[data-reduced="true"] .fdr-front {
  transition-duration: 0.05s !important;
  transition-delay: 0s !important;
}

.fdr-card-img {
  width: 100%;
  height: 100%;
}

.fdr-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  display: block;
}

.fdr-card-content {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
}

.fdr[data-compact="true"] .fdr-card-content {
  padding: 7px;
}

.fdr-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.fdr-badge {
  font-family: var(--font-mono, monospace);
  font-size: 8.5px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--d-sig, #ff3e00) 14%, transparent);
  color: var(--d-sig, #ff3e00);
  border: 1px solid color-mix(in srgb, var(--d-sig, #ff3e00) 24%, transparent);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.fdr[data-compact="true"] .fdr-badge {
  font-size: 7.5px;
  padding: 1.5px 3px;
}

.fdr-index {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  color: var(--d-faint, #71717a);
}

.fdr-card-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fdr-title {
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--d-ink, #f4f4f5);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fdr[data-compact="true"] .fdr-title {
  font-size: 9px;
}

.fdr-sub {
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  color: var(--d-dim, #9898a0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fdr[data-compact="true"] .fdr-sub {
  font-size: 8px;
}

/* Frosted front flap */
.fdr-front {
  z-index: 30;
  background: color-mix(in srgb, var(--d-surface, #111114) 75%, transparent);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border: 1px solid var(--d-rule, rgba(255, 255, 255, 0.12));
  transform-origin: 50% 100%;
  border-radius: 12px;
  width: 212px;
  height: 110px;
  transition: transform 0.56s cubic-bezier(0.24, 1.34, 0.38, 1);
  position: absolute;
  top: 100px;
  left: 24px;
  pointer-events: none;
  overflow: hidden;
}

.fdr[data-compact="true"] .fdr-front {
  width: 156px;
  height: 82px;
  top: 72px;
  left: 12px;
  border-radius: 9px;
}

.fdr[data-open="true"] .fdr-front {
  transform: perspective(520px) rotateX(-24deg);
}

.fdr-front-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.02) 40%,
    transparent 100%
  );
  pointer-events: none;
}

.fdr-front-label {
  position: absolute;
  bottom: 10px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fdr-front-text {
  font-family: var(--font-mono, monospace);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--d-faint, #71717a);
}

.fdr-front-line {
  flex: 1;
  height: 1px;
  background: color-mix(in srgb, var(--d-ink, #f4f4f5) 12%, transparent);
}
</style>
