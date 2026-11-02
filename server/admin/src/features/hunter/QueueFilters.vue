<script setup lang="ts">
/**
 * Filtros de la cola como texto con su cuenta: «Por revisar 4 · Compatibles 2 · …». Cada uno es una
 * dirección (?filtro=), así que son enlaces con aria-current: recargar o compartir deja el mismo filtro.
 * El activo va en --ink con una línea debajo, como en la demo.
 */
import type { HunterJob } from '@shared/hunterContracts'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { hunter } from './dict'
import { DEFAULT_FILTER, QUEUE_FILTERS, type QueueFilter } from './model'

const props = defineProps<{
  jobs: readonly HunterJob[]
  active: QueueFilter
}>()

const route = useRoute()

const filters = computed(() => QUEUE_FILTERS.map(filter => ({
  ...filter,
  count: props.jobs.filter(filter.test).length,
  to: { path: route.path, query: { ...route.query, filtro: filter.id === DEFAULT_FILTER ? undefined : filter.id } },
})))
</script>

<template>
  <nav :aria-label="hunter.filters.label" class="flex flex-wrap gap-x-6 gap-y-2">
    <RouterLink
      v-for="(filter, index) in filters"
      :key="filter.id"
      :to="filter.to"
      replace
      :aria-current="filter.id === active ? 'true' : undefined"
      :style="{ '--i': index }"
      class="inline-flex animate-rise items-baseline gap-1.5 border-b pb-1 text-body no-underline stagger transition-colors duration-120 ease-e hover:text-ink"
      :class="filter.id === active ? 'border-ink text-ink' : 'border-transparent text-faint'"
    >
      {{ filter.label }}
      <span class="text-meta text-faint tabular-nums">{{ filter.count }}</span>
    </RouterLink>
  </nav>
</template>
