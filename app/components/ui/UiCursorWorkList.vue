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
    <!-- Filas Editoriales estilo Awwwards / Dennis Snellenberg -->
    <div class="divide-y divide-rule border-y border-rule">
      <NuxtLink
        v-for="(item, idx) in items"
        :key="item.slug"
        :to="item.to"
        :data-row="item.slug"
        class="cwl-row group/row relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 py-4 sm:py-5 px-3 sm:px-5 no-underline text-inherit transition-all duration-300"
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

        <!-- Izquierda: Índice + Título Cinético + Organización -->
        <div class="flex items-baseline gap-3.5 sm:gap-5 min-w-0 transition-transform duration-300 ease-out group-hover/row:translate-x-2.5">
          <span class="font-mono text-[11px] sm:text-[12px] text-sig font-semibold tabular-nums shrink-0">
            {{ item.num }}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h3 class="m-0 font-sans text-[18px] sm:text-[22px] md:text-[25px] font-semibold tracking-[-0.03em] text-ink group-hover/row:text-sig transition-colors duration-200">
                {{ item.title }}
              </h3>
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-rule bg-paper/70 font-mono text-[9.5px] uppercase"
                :class="item.status === 'LIVE' ? 'text-green' : 'text-amber'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="item.status === 'LIVE' ? 'bg-green' : 'bg-amber'" />
                {{ item.status }}
              </span>
            </div>
            <p v-if="item.summary" class="m-0 mt-0.5 font-sans text-[12.5px] sm:text-[13px] text-dim line-clamp-1 max-w-[62ch]">
              {{ item.summary }}
            </p>
          </div>
        </div>

        <!-- Derecha: Stack Chips + Rol + Año + Flecha Magnética -->
        <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 shrink-0 transition-transform duration-300 ease-out group-hover/row:-translate-x-1.5">
          <div v-if="item.chips && item.chips.length" class="hidden xl:flex items-center gap-1.5">
            <span
              v-for="chip in item.chips.slice(0, 3)"
              :key="chip"
              class="px-2 py-0.5 rounded-md bg-surface border border-rule font-mono text-[10px] text-dim"
            >
              {{ chip }}
            </span>
          </div>

          <div class="flex items-center gap-3 font-mono text-[11px] text-dim tabular-nums">
            <span class="hidden md:inline text-faint max-w-[180px] truncate">{{ item.role }}</span>
            <span class="text-ink font-medium">{{ item.year }}</span>
            <span class="w-7 h-7 rounded-full border border-rule bg-surface inline-flex items-center justify-center text-dim group-hover/row:bg-sig group-hover/row:text-on-sig group-hover/row:border-sig group-hover/row:rotate-45 transition-all duration-200">
              ↗
            </span>
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
        transform: `translate3d(${curX - 155}px, ${curY - 105}px, 0) rotate(${tiltDeg.toFixed(2)}deg) scale(${activeIdx !== null ? 1 : 0.72})`,
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
