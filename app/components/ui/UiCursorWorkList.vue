<script setup lang="ts">
/**
 * UiCursorWorkList — Awwwards Interactive Project Index with Floating Spring Preview
 * Inspirado en los repositorios de Olivier Larose / Dennis Snellenberg / Studio Freight.
 * Al mover el cursor sobre las filas numeradas de proyectos, una ventana flotante con
 * física de resorte amortiguado sigue al puntero mientras el carrete vertical de imágenes
 * se desliza con cubic-bezier(0.76, 0, 0.24, 1).
 */
import type { RouteLocationRaw } from 'vue-router'

export interface CursorWorkItem {
  slug: string
  num: string
  title: string
  role: string
  year: string | number
  status: string
  cover: string
  to: RouteLocationRaw
  chips?: string[]
  orgDesc?: string
  summary?: string
}

defineProps<{
  items: CursorWorkItem[]
}>()

const { isHyperfocus } = useHyperfocus()
const { playSound } = useBenchoSound()
const { isEs } = usePortfolioLocale()

const containerRef = ref<HTMLElement | null>(null)
const activeIdx = ref<number | null>(null)
const lastValidIdx = ref(0)

// Coordenadas del puntero y física de resorte para la ventana flotante
const targetX = ref(0)
const targetY = ref(0)
const curX = ref(0)
const curY = ref(0)
const tiltDeg = ref(0)

let rafId = 0

function tickSpring() {
  if (!import.meta.client) return

  const dx = targetX.value - curX.value
  const dy = targetY.value - curY.value

  curX.value += dx * 0.18
  curY.value += dy * 0.18
  tiltDeg.value = Math.max(-5, Math.min(5, dx * 0.045))

  if (activeIdx.value !== null || Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
    rafId = requestAnimationFrame(tickSpring)
  }
  else {
    rafId = 0
  }
}

function startSpring() {
  if (!rafId && import.meta.client) {
    rafId = requestAnimationFrame(tickSpring)
  }
}

function onPointerMove(e: PointerEvent) {
  if (!containerRef.value || isHyperfocus.value) return
  const rect = containerRef.value.getBoundingClientRect()
  targetX.value = e.clientX - rect.left
  targetY.value = e.clientY - rect.top
  startSpring()
}

function onRowEnter(idx: number, e: MouseEvent) {
  if (isHyperfocus.value) return
  const wasNull = activeIdx.value === null
  activeIdx.value = idx
  lastValidIdx.value = idx
  playSound('tock', { gap: 55 })

  if (wasNull && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    targetX.value = e.clientX - rect.left
    targetY.value = e.clientY - rect.top
    curX.value = targetX.value
    curY.value = targetY.value
  }
  startSpring()
}

function onListLeave() {
  activeIdx.value = null
  tiltDeg.value = 0
}

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div
    ref="containerRef"
    class="cwl relative w-full select-none group/cwl"
    @pointermove="onPointerMove"
    @mouseleave="onListLeave"
  >
    <!-- Encabezado Arquitectónico de 4 Columnas (Dennis Snellenberg Table Index) -->
    <div class="hidden sm:grid sm:grid-cols-12 gap-4 pb-2.5 px-3 sm:px-4 border-b border-rule font-mono text-[10px] text-dim uppercase tracking-[0.12em]">
      <span class="col-span-5">{{ isEs ? 'CLIENTE / PROYECTO' : 'CLIENT / PROJECT' }}</span>
      <span class="col-span-3">{{ isEs ? 'UBICACIÓN & ORG' : 'LOCATION & ORG' }}</span>
      <span class="col-span-3">{{ isEs ? 'SERVICIOS & STACK' : 'SERVICES & STACK' }}</span>
      <span class="col-span-1 text-right">{{ isEs ? 'AÑO' : 'YEAR' }}</span>
    </div>

    <!-- Filas Editoriales estilo Awwwards / Dennis Snellenberg -->
    <div class="divide-y divide-rule border-b border-rule">
      <NuxtLink
        v-for="(item, idx) in items"
        :key="item.slug"
        :to="item.to"
        :data-row="item.slug"
        class="cwl-row group/row relative grid grid-cols-1 sm:grid-cols-12 sm:items-center gap-2 sm:gap-4 py-4 sm:py-5 px-3 sm:px-4 no-underline text-inherit transition-all duration-300"
        :class="activeIdx !== null && activeIdx !== idx ? 'opacity-40' : 'opacity-100'"
        @mouseenter="e => onRowEnter(idx, e)"
        @focus="activeIdx = idx; lastValidIdx = idx"
        @blur="activeIdx = null"
        @click="playSound('press')"
      >
        <!-- Indicador lateral quirúrgico en hover -->
        <span
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-sig rounded-r transition-all duration-300"
          :class="activeIdx === idx ? 'h-8 opacity-100' : 'h-0 opacity-0'"
          aria-hidden="true"
        />

        <!-- Col 1-5: Índice + Título Monumental -->
        <div class="sm:col-span-5 flex items-baseline gap-3.5 min-w-0 transition-transform duration-300 ease-out group-hover/row:translate-x-2">
          <span class="font-mono text-[11px] text-dim tabular-nums shrink-0">
            {{ item.num }}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="m-0 font-sans text-[19px] sm:text-[23px] font-semibold tracking-[-0.03em] text-ink group-hover/row:text-sig transition-colors duration-200 truncate">
                {{ item.title }}
              </h3>
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="item.status === 'LIVE' ? 'bg-green' : 'bg-amber'"
                :title="item.status"
              />
            </div>
            <p v-if="item.summary" class="m-0 mt-0.5 font-sans text-[12.5px] text-dim line-clamp-1 sm:hidden">
              {{ item.summary }}
            </p>
          </div>
        </div>

        <!-- Col 6-8: Ubicación & Organización -->
        <div class="sm:col-span-3 hidden sm:flex items-center min-w-0 font-sans text-[13px] text-dim truncate">
          <span class="truncate">{{ item.orgDesc || item.role }}</span>
        </div>

        <!-- Col 9-11: Servicios & Stack (Texto limpio sin bordes de píldora) -->
        <div class="sm:col-span-3 hidden sm:flex items-center min-w-0 font-mono text-[11px] text-dim truncate">
          <span v-if="item.chips && item.chips.length" class="truncate uppercase tracking-wider">
            {{ item.chips.slice(0, 3).join(' · ') }}
          </span>
          <span v-else class="truncate">{{ item.role }}</span>
        </div>

        <!-- Col 12: Año + Flecha -->
        <div class="sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 font-mono text-[12px] text-ink tabular-nums">
          <span class="sm:hidden text-dim text-[11px] truncate">{{ item.orgDesc || item.role }}</span>
          <div class="flex items-center gap-2">
            <span>{{ item.year }}</span>
            <span class="text-dim group-hover/row:text-sig group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5 transition-all duration-200" aria-hidden="true">↗</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Ventana Flotante con Carrete Vertical Seguido por Cursor (Olivier Larose Effect) -->
    <div
      v-if="!isHyperfocus && items.length"
      class="cwl-modal hidden lg:block pointer-events-none absolute top-0 left-0 z-30 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_28px_70px_rgba(0,0,0,0.75)]"
      :data-open="activeIdx !== null || undefined"
      :style="{
        transform: `translate3d(${curX - 155}px, ${Math.max(12, curY - 105)}px, 0) rotate(${tiltDeg.toFixed(2)}deg) scale(${activeIdx !== null ? 1 : 0.72})`,
      }"
      aria-hidden="true"
    >
      <!-- Carrete vertical que se desplaza según activeIdx -->
      <div
        class="cwl-reel w-full h-full"
        :style="{
          transform: `translate3d(0, -${lastValidIdx * 100}%, 0)`,
        }"
      >
        <div
          v-for="item in items"
          :key="`preview-${item.slug}`"
          class="relative w-full h-full overflow-hidden bg-surface"
        >
          <img
            v-if="item.cover"
            :src="item.cover"
            :alt="item.title"
            class="w-full h-full object-cover"
            loading="lazy"
          >
          <!-- Placeholder tipográfico cuando el proyecto aún no tiene captura -->
          <div
            v-else
            class="cwl-placeholder w-full h-full flex flex-col justify-between p-4"
          >
            <span class="font-mono text-[10px] uppercase tracking-widest text-white/60">{{ item.role }}</span>
            <span class="font-sans text-[26px] font-semibold tracking-[-0.035em] text-white leading-none">{{ item.title }}</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
          <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between font-mono text-[10px] text-white">
            <span class="px-2 py-0.5 rounded-full bg-sig text-white font-semibold uppercase tracking-wider">
              Inspect Case ↗
            </span>
            <span class="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/15">
              {{ item.num }} · {{ item.year }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cwl-modal {
  width: 310px;
  height: 196px;
  opacity: 0;
  transition:
    opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
    scale 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;
}

.cwl-modal[data-open] {
  opacity: 1;
}

.cwl-reel {
  transition: transform 480ms cubic-bezier(0.76, 0, 0.24, 1);
  will-change: transform;
}

.cwl-placeholder {
  background:
    radial-gradient(120% 90% at 85% 10%, color-mix(in srgb, var(--d-sig) 55%, transparent), transparent 60%),
    linear-gradient(160deg, #17171c, #0a0a0c);
}
</style>
