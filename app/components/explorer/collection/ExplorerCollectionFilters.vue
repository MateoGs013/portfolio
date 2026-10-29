<script setup lang="ts">
import { routeFor } from '~/lib/path'

defineProps<{
  head: string
  projectCounts: { all: string; live: string; wip: string }
  stackCategoryCounts: {
    all: number
    framework: number
    backend: number
    data: number
    tooling: number
    motion: number
  }
  hasStatusFilter: boolean
  isStatusLive: boolean
  isStatusWip: boolean
  activeCategoryFilter: string | null
}>()

const { isEs, tr } = usePortfolioLocale()
</script>

<template>
  <div>
    <!-- Barra de Filtros de Proyectos con Superíndices Tabulares (Awwwards Index Filters) -->
    <div v-if="head === 'projects'" class="flex items-center justify-between gap-3 py-3 my-3 border-b border-rule flex-wrap w-full min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink
          :to="routeFor(['projects'])"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="!hasStatusFilter ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>{{ tr.collection.filterAll }}</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ projectCounts.all }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['projects'], { status: 'LIVE' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline inline-flex items-center gap-1.5 shrink-0"
          :class="isStatusLive ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-green" />
          <span>{{ tr.collection.filterLive }}</span>
          <sup class="font-mono text-[9.5px] opacity-75">{{ projectCounts.live }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['projects'], { status: 'WIP' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline inline-flex items-center gap-1.5 shrink-0"
          :class="isStatusWip ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber" />
          <span>{{ tr.collection.filterWip }}</span>
          <sup class="font-mono text-[9.5px] opacity-75">{{ projectCounts.wip }}</sup>
        </NuxtLink>
      </div>
      <div class="text-faint font-mono text-[11px] hidden md:block">
        {{ isEs ? 'PostgreSQL 17 · Lighthouse 98+' : 'PostgreSQL 17 · Lighthouse 98+' }}
      </div>
    </div>

    <!-- Barra de Filtros de Categorías para Stack (Awwwards Index Filters) -->
    <div v-if="head === 'stack'" class="flex items-center justify-between gap-3 py-3 my-3 border-b border-rule flex-wrap w-full min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink
          :to="routeFor(['stack'])"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="!activeCategoryFilter ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>{{ isEs ? 'TODAS' : 'ALL' }}</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.all }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['stack'], { category: 'framework' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="activeCategoryFilter === 'FRAMEWORK' ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>FRAMEWORKS</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.framework }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['stack'], { category: 'backend' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="activeCategoryFilter === 'BACKEND' ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>BACKEND</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.backend }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['stack'], { category: 'data' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="activeCategoryFilter === 'DATA' ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>DATA</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.data }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['stack'], { category: 'motion' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="activeCategoryFilter === 'MOTION' ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>MOTION</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.motion }}</sup>
        </NuxtLink>
        <NuxtLink
          :to="routeFor(['stack'], { category: 'tooling' })"
          class="font-sans text-[12px] px-3 py-1 rounded-full transition-all duration-150 no-underline shrink-0"
          :class="activeCategoryFilter === 'TOOLING' ? 'bg-ink text-paper font-semibold shadow-xs' : 'text-dim hover:text-ink bg-surface border border-rule'"
        >
          <span>TOOLING</span>
          <sup class="font-mono text-[9.5px] opacity-75 ml-0.5">{{ stackCategoryCounts.tooling }}</sup>
        </NuxtLink>
      </div>
      <div class="text-faint font-mono text-[11px] hidden md:block">
        {{ isEs ? 'PostgreSQL 17 ACID · 22 Tecnologías' : 'PostgreSQL 17 ACID · 22 Technologies' }}
      </div>
    </div>
  </div>
</template>
