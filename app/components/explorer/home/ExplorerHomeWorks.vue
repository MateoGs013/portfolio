<script setup lang="ts">
import UiSegmentedSwitch from '~/components/ui/UiSegmentedSwitch.vue'
import UiBorderBeam from '~/components/ui/UiBorderBeam.vue'
import UiClickSpark from '~/components/ui/UiClickSpark.vue'
import UiCursorWorkList, { type CursorWorkItem } from '~/components/ui/UiCursorWorkList.vue'
import AppIcon from '~/components/ui/AppIcon.vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { pad } from '~/lib/explorer'

export interface HomeWorkProject {
  idx: string
  slug: string
  title: string
  to: string
  cover: string
  status: string
  year: string
  orgDesc: string
  summary: string
  chips: string[]
}

defineProps<{
  projects: HomeWorkProject[]
  cursorProjects: CursorWorkItem[]
  projectCountBadge: string
}>()

const selectedWorkMode = ref<'reel' | 'grid'>('grid')
const { playSound } = useBenchoSound()
const { isEs, tr } = usePortfolioLocale()
</script>

<template>
  <section aria-label="Producción destacada" class="flex flex-col gap-5 sm:gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2.5">
        <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
          {{ isEs ? 'OBRA SELECCIONADA' : 'SELECTED WORKS' }}
        </span>
        <span class="font-mono text-[11px] text-faint">({{ pad(projects.length) }})</span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Selector de Vista: Galería Arquitectónica (Buser 2-Col) vs Índice (Snellenberg Table) -->
        <UiSegmentedSwitch
          v-model="selectedWorkMode"
          :options="[
            { value: 'grid', label: isEs ? 'Galería (2-Col)' : 'Gallery (2-Col)' },
            { value: 'reel', label: isEs ? 'Índice Tabular' : 'Table Index' }
          ]"
        />

        <NuxtLink
          to="/projects"
          class="group inline-flex items-center gap-1.5 font-mono text-[11px] text-ink hover:text-sig no-underline transition-colors ml-1 uppercase tracking-wider"
        >
          <span>{{ tr.home.swViewAll }} ({{ projectCountBadge }})</span>
          <AppIcon name="arrow-right" :size="11" class="text-sig transition-transform duration-200 group-hover:translate-x-0.5" />
        </NuxtLink>
      </div>
    </div>

    <!-- Modo 1 (Default): Galería Arquitectónica de 2 Columnas (Daniele Buser Pure Frame Pattern 1:1) -->
    <div v-if="selectedWorkMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
      <article
        v-for="p in projects"
        :key="p.slug"
        class="buser-project-frame group relative rounded-[2px] p-5 sm:p-7 flex flex-col justify-between gap-6 overflow-hidden transition-[box-shadow,border-color] duration-300 hover:shadow-2xl hover:border-rule-strong border border-rule bg-surface/40 hover:bg-surface"
        @mouseenter="playSound('notch')"
      >
        <UiBorderBeam
          :size="160"
          :duration="7.5"
          :border-width="1.5"
          color-from="#ff3e00"
          color-to="var(--d-ink, #ffffff)"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        />
        <UiClickSpark :spark-count="6" :spark-size="5" :spark-radius="20" class="h-full flex flex-col">
          <NuxtLink
            :to="p.to"
            :data-row="p.slug"
            class="flex flex-col h-full justify-between gap-6 no-underline text-inherit focus:outline-none"
          >
            <!-- Contenedor Superior: Mockup 16:10 Puro con Parallax de Scroll Óptico y Badge Flotante -->
            <div class="relative aspect-[16/10] w-full overflow-hidden rounded-[2px] bg-black/60 group/mockup">
              <img
                v-if="p.cover"
                :src="p.cover"
                :alt="p.title"
                class="w-full h-full object-cover scale-[1.05] transition-transform duration-700 ease-out group-hover:scale-[1.10]"
                loading="lazy"
              >
              <div v-else class="w-full h-full flex flex-col justify-between p-6 bg-surface-raised">
                <span class="font-mono text-[10px] opacity-60 uppercase">{{ p.year }}</span>
                <span class="font-sans text-[22px] font-semibold">{{ p.title }}</span>
              </div>

              <!-- Badge Flotante Táctil Awwwards ("VER CASO ↗") -->
              <div class="absolute bottom-3 right-3 pointer-events-none z-10 transition-all duration-200 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper/90 backdrop-blur-md border border-rule-strong text-ink font-mono text-[11px] font-semibold shadow-lg">
                  <span>{{ isEs ? 'VER CASO' : 'VIEW CASE' }}</span>
                  <span class="text-sig">↗</span>
                </span>
              </div>

              <!-- Gradiente Sutil de Profundidad al Hover -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            <!-- Pie Arquitectónico Puro: Solo Título Grande a la Izquierda + 4 Líneas de Stack Vertical a la Derecha -->
            <div class="flex items-end justify-between gap-4 pt-1">
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <h3 class="m-0 font-sans text-[clamp(22px,2.5vw,32px)] font-semibold tracking-[-0.035em] leading-[1.05] group-hover:text-sig transition-colors">
                  {{ p.title }}
                </h3>
              </div>

              <!-- Columna Derecha: Stack Vertical Alineado a la Derecha (Cero Pill Borders, Estilo Daniele Buser) -->
              <ul v-if="p.chips && p.chips.length" class="flex flex-col items-end text-right list-none m-0 p-0 shrink-0 font-mono text-[10px] leading-[1.45] uppercase tracking-[0.06em] opacity-70">
                <li v-for="chip in p.chips.slice(0, 4)" :key="chip">
                  {{ chip }}
                </li>
              </ul>
            </div>
          </NuxtLink>
        </UiClickSpark>
      </article>
    </div>

    <!-- Modo 2: Índice Tabular Awwwards con Ventana Flotante por Resorte (Dennis Snellenberg) -->
    <div v-else class="w-full">
      <UiCursorWorkList :items="cursorProjects" />
    </div>
  </section>
</template>
