<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'

const props = withDefaults(defineProps<{
  url?: string
  title?: string
  compact?: boolean
}>(), {
  url: '',
  title: 'Share Dossier',
  compact: true,
})

const emit = defineEmits<{
  share: [format: string]
}>()

const { playSound } = useBenchoSound()

const pillRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const isCopied = ref(false)
const isExpanded = ref(false)
const hoveredIndex = ref<number | null>(null)
const inputValue = ref('')

const resolvedUrl = computed(() => {
  if (props.url) return props.url
  if (import.meta.client && typeof window !== 'undefined') {
    return window.location.href
  }
  return 'https://mateosonzogni.com'
})

interface StackNode {
  id: string
  initials: string
  name: string
  sub: string
  live: boolean
  gradient: string
}

const NODES: StackNode[] = [
  {
    id: 'ms',
    initials: 'MS',
    name: 'Mateo Sonzogni',
    sub: 'Lead Architect · Live',
    live: true,
    gradient: 'radial-gradient(circle at 35% 70%, #ff551c, #ff3e00 60%, #b82600)',
  },
  {
    id: 'pg',
    initials: 'PG',
    name: 'PostgreSQL 17.2',
    sub: 'Relational Core · 0ms',
    live: true,
    gradient: 'radial-gradient(circle at 65% 30%, #38bdf8, #0284c7 55%, #0369a1)',
  },
  {
    id: 'ai',
    initials: 'AI',
    name: 'Eros / Reasoning',
    sub: 'Trace Copilot · Active',
    live: true,
    gradient: 'radial-gradient(circle at 40% 40%, #c084fc, #9333ea 55%, #6b21a8)',
  },
]

const SPREAD = 8
const AVATAR_SIZE = 36
const AVATAR_STEP = 26

// Parting de avatares alrededor del cursor (Bencho exact)
function getNodeOffset(idx: number): number {
  if (hoveredIndex.value === null || hoveredIndex.value === idx) return 0
  return idx < hoveredIndex.value ? -SPREAD : SPREAD
}

// Tooltip viajero único (.shp-tip)
interface TooltipState {
  x: number
  title: string
  sub?: string
  live?: boolean
}

const tooltip = ref<TooltipState | null>(null)
const isTooltipActive = ref(false)
let tooltipTimer = 0
let copyResetTimer = 0

function computeRelativeCenterX(el: HTMLElement): number {
  const container = pillRef.value
  if (!container) return 0
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return (elRect.left - containerRect.left) + elRect.width / 2
}

function showTooltip(targetEl: HTMLElement, title: string, sub?: string, live?: boolean) {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  const x = computeRelativeCenterX(targetEl)
  tooltip.value = { x, title, sub, live }
  isTooltipActive.value = true
}

function hideTooltip() {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  tooltipTimer = window.setTimeout(() => {
    isTooltipActive.value = false
    hoveredIndex.value = null
  }, 140)
}

function onNodeEnter(idx: number, e: Event) {
  hoveredIndex.value = idx
  const node = NODES[idx]
  if (!node) return
  showTooltip(e.currentTarget as HTMLElement, node.name, node.sub, node.live)
}

function onNodeLeave() {
  hideTooltip()
}

function onLinkEnter(e: MouseEvent) {
  if (isCopied.value) return
  showTooltip(e.currentTarget as HTMLElement, 'Copiar enlace', 'Al portapapeles')
}

function copyLink(e: MouseEvent) {
  if (!import.meta.client) return
  navigator.clipboard?.writeText(resolvedUrl.value).catch(() => {})
  isCopied.value = true
  playSound('pop')

  showTooltip(e.currentTarget as HTMLElement, '¡Enlace copiado!', 'Listo para compartir')

  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = window.setTimeout(() => {
    isCopied.value = false
  }, 1600)
}

function openExpandable() {
  isExpanded.value = true
  playSound('press')
  hideTooltip()
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function closeExpandable() {
  if (!isExpanded.value) return
  isExpanded.value = false
  inputValue.value = ''
  playSound('off')
}

function submitCitation() {
  const text = inputValue.value.trim() || 'Sonzogni, M. (2026). Portfolio Relacional & Arquitectura de Software.'
  if (import.meta.client) {
    navigator.clipboard?.writeText(text).catch(() => {})
  }
  playSound('chime')
  emit('share', text)
  isExpanded.value = false
  inputValue.value = ''
}

function onPointerDownOutside(e: PointerEvent) {
  if (!isExpanded.value) return
  const pill = pillRef.value
  if (pill && !pill.contains(e.target as Node)) {
    closeExpandable()
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('pointerdown', onPointerDownOutside)
  }
})

onBeforeUnmount(() => {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  if (copyResetTimer) clearTimeout(copyResetTimer)
  if (import.meta.client) {
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})
</script>

<template>
  <div
    ref="pillRef"
    class="shp select-none"
    :class="{ 'shp-is-expanded': isExpanded }"
  >
    <!-- Tooltip viajero único (Bencho .shp-tip) -->
    <div
      class="shp-tip"
      :data-on="isTooltipActive ? 'true' : undefined"
      :style="tooltip ? { left: `${tooltip.x.toFixed(1)}px` } : undefined"
      aria-hidden="true"
    >
      <div v-if="tooltip" class="shp-tip-in font-mono">
        <b class="truncate">{{ tooltip.title }}</b>
        <span v-if="tooltip.sub">
          <i v-if="tooltip.live" class="shp-dot" />
          {{ tooltip.sub }}
        </span>
      </div>
    </div>

    <!-- Píldora contenedora -->
    <div
      class="shp-pill"
      :data-inviting="isExpanded ? 'true' : undefined"
    >
      <!-- Stack de avatares interactivos que se abren en abanico -->
      <div
        class="shp-stack"
        :style="{
          width: `${AVATAR_SIZE + (NODES.length - 1) * AVATAR_STEP}px`,
        }"
        @mouseleave="onNodeLeave"
      >
        <span
          v-for="(node, idx) in NODES"
          :key="node.id"
          class="shp-face"
          tabindex="0"
          :data-on="hoveredIndex === idx ? 'true' : undefined"
          :aria-label="`${node.name}, ${node.sub}`"
          :style="{
            left: `${idx * AVATAR_STEP}px`,
            zIndex: hoveredIndex === idx ? 20 : NODES.length - idx,
            transform: `translateX(${getNodeOffset(idx)}px) scale(${hoveredIndex === idx ? 1.08 : 1})`,
            background: node.gradient,
          }"
          @mouseenter="e => onNodeEnter(idx, e)"
          @focus="e => onNodeEnter(idx, e)"
          @blur="onNodeLeave"
        >
          <b class="font-mono">{{ node.initials }}</b>
          <i v-if="node.live" class="shp-live" aria-hidden="true" />
        </span>
      </div>

      <!-- Botón de copiar enlace con metamorfosis checkmark -->
      <button
        type="button"
        class="shp-btn shp-link"
        :data-done="isCopied ? 'true' : undefined"
        :aria-label="isCopied ? 'Enlace copiado' : 'Copiar enlace'"
        @mouseenter="onLinkEnter"
        @mouseleave="hideTooltip"
        @click="copyLink"
      >
        <span class="shp-glyph shp-chain" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        <span class="shp-glyph shp-tick" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </button>

      <!-- Acción expandible inline (Cite / Share) con apertura elástica -->
      <div
        class="shp-invite"
        :data-open="isExpanded ? 'true' : undefined"
      >
        <!-- Botón contraído -->
        <button
          type="button"
          class="shp-btn shp-inv font-mono"
          :tabindex="isExpanded ? -1 : 0"
          aria-label="Abrir panel de cita y exportación"
          @click="openExpandable"
        >
          <span>Cite / Share</span>
        </button>

        <!-- Formulario expandido -->
        <form
          class="shp-form"
          :aria-hidden="!isExpanded"
          @submit.prevent="submitCitation"
        >
          <input
            ref="inputRef"
            v-model="inputValue"
            class="shp-input font-mono"
            type="text"
            placeholder="BibTeX, APA, o nota..."
            :tabindex="isExpanded ? 0 : -1"
            aria-label="Formato de cita"
            @keydown.esc.stop="closeExpandable"
          >
          <button
            type="submit"
            class="shp-send"
            :tabindex="isExpanded ? 0 : -1"
            aria-label="Copiar cita formal"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Bencho share-pill (.shp-*) 1:1 port */
.shp {
  display: inline-flex;
  position: relative;
  align-items: flex-end;
  justify-content: center;
  box-sizing: border-box;
}

.shp-pill {
  background: var(--d-surface, #111114);
  border: 1px solid var(--d-rule-strong, rgba(255, 255, 255, 0.12));
  border-radius: 999px;
  color: var(--d-ink, #f4f4f5);
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  display: inline-flex;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  position: relative;
}

/* Stack de avatares */
.shp-stack {
  height: 36px;
  margin: 0 2px;
  position: relative;
}

.shp-face {
  width: 36px;
  height: 36px;
  box-shadow: 0 0 0 2px var(--d-surface, #111114);
  cursor: pointer;
  border-radius: 50%;
  outline: none;
  place-items: center;
  transition:
    transform 0.22s cubic-bezier(0.24, 1.34, 0.38, 1),
    scale 0.22s cubic-bezier(0.24, 1.34, 0.38, 1);
  display: grid;
  position: absolute;
  top: 0;
  will-change: transform;
}

.shp-face:focus-visible {
  box-shadow: 0 0 0 2px var(--d-surface, #111114), 0 0 0 4px var(--d-sig, #ff3e00);
}

.shp-face b {
  color: #fff;
  letter-spacing: -0.01em;
  font-size: 11px;
  font-weight: 700;
}

.shp-live {
  width: 8px;
  height: 8px;
  box-shadow: 0 0 0 2px var(--d-surface, #111114);
  background: #22c55e;
  border-radius: 50%;
  position: absolute;
  bottom: -1px;
  right: -1px;
}

/* Botones genéricos de la píldora */
.shp-btn {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  height: 34px;
  color: var(--d-ink, #f4f4f5);
  border: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.16s ease,
    transform 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.shp-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.shp-btn:active {
  transform: scale(0.96);
}

.shp-btn:focus-visible {
  outline: 2px solid var(--d-sig, #ff3e00);
  outline-offset: 2px;
}

/* Botón de copiar enlace */
.shp-link {
  width: 34px;
  place-items: center;
  position: relative;
  overflow: hidden;
  transition:
    width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    margin 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease;
}

.shp-pill[data-inviting="true"] .shp-link {
  opacity: 0;
  pointer-events: none;
  width: 0;
  margin-right: -6px;
}

.shp-glyph {
  grid-area: 1 / 1;
  display: grid;
  place-items: center;
  transition:
    opacity 0.16s ease,
    transform 0.22s cubic-bezier(0.24, 1.34, 0.38, 1);
}

.shp-tick {
  opacity: 0;
  transform: scale(0.5);
  color: #22c55e;
}

.shp-link[data-done="true"] .shp-chain {
  opacity: 0;
  transform: scale(0.5);
}

.shp-link[data-done="true"] .shp-tick {
  opacity: 1;
  transform: scale(1);
}

/* Acción expandible (Cite / Share) */
.shp-invite {
  border-radius: 999px;
  width: 88px;
  height: 34px;
  position: relative;
  transition: width 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.shp-invite[data-open="true"] {
  width: 204px;
}

.shp-inv {
  width: 100%;
  font-size: 11px;
  font-weight: 600;
  padding: 0 10px;
  white-space: nowrap;
  position: absolute;
  inset: 0;
  transition: opacity 0.16s ease;
}

.shp-invite[data-open="true"] .shp-inv {
  opacity: 0;
  pointer-events: none;
}

/* Formulario desplegado dentro de la misma pastilla */
.shp-form {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0;
  pointer-events: none;
  align-items: center;
  gap: 4px;
  padding: 0 4px 0 10px;
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  transition: opacity 0.22s ease;
}

.shp-invite[data-open="true"] .shp-form {
  opacity: 1;
  pointer-events: auto;
  transition-delay: 0.1s;
}

.shp-input {
  width: 0;
  min-width: 0;
  height: 100%;
  color: var(--d-ink, #f4f4f5);
  background: transparent;
  border: 0;
  outline: none;
  flex: 1 1 0%;
  font-size: 11px;
}

.shp-input::placeholder {
  color: var(--d-faint, #71717a);
}

.shp-send {
  border-radius: 50%;
  cursor: pointer;
  background: var(--d-sig, #ff3e00);
  width: 26px;
  height: 26px;
  color: #fff;
  border: 0;
  outline: none;
  flex: none;
  place-items: center;
  display: grid;
  transition: transform 0.16s ease, background-color 0.16s ease;
}

.shp-send:hover {
  background: var(--d-sig-hover, #ff551c);
}

.shp-send:active {
  transform: scale(0.92);
}

/* Tooltip viajero único (.shp-tip) */
.shp-tip {
  opacity: 0;
  pointer-events: none;
  z-index: 40;
  position: absolute;
  bottom: 50px;
  transform: translate(-50%, 4px);
  transition:
    left 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease,
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: left, opacity, transform;
}

.shp-tip[data-on="true"] {
  opacity: 1;
  transform: translate(-50%, 0);
}

.shp-tip-in {
  color: #fff;
  white-space: nowrap;
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.shp-tip-in b {
  font-size: 11px;
  font-weight: 600;
  display: block;
}

.shp-tip-in span {
  color: #a1a1aa;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  margin-top: 2px;
}

.shp-dot {
  background: #22c55e;
  border-radius: 50%;
  width: 5px;
  height: 5px;
  flex: none;
}
</style>
