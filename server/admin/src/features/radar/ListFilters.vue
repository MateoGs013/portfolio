<script setup lang="ts" generic="T, F extends string">
/**
 * Filtros de una lista como texto con su cuenta: «Todas 4 · Borradores 2 · …». Cada uno es una
 * dirección (?filtro=), así que son enlaces con aria-current: recargar o compartir deja el mismo
 * filtro. El activo va en --ink con una línea debajo, como en la demo.
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { ListFilter } from './model'

const props = defineProps<{
  filters: readonly ListFilter<T, F>[]
  rows: readonly T[]
  active: F
  /** El filtro que no se escribe en la dirección. */
  fallback: F
  label: string
}>()

const route = useRoute()

const links = computed(() => props.filters.map(filter => ({
  id: filter.id,
  label: filter.label,
  count: props.rows.filter(filter.test).length,
  to: { path: route.path, query: { ...route.query, filtro: filter.id === props.fallback ? undefined : filter.id } },
})))
</script>

<template>
  <nav :aria-label="label" class="flex flex-wrap gap-x-6 gap-y-2">
    <RouterLink
      v-for="(link, index) in links"
      :key="link.id"
      :to="link.to"
      replace
      :aria-current="link.id === active ? 'true' : undefined"
      :style="{ '--i': index }"
      class="inline-flex animate-rise items-baseline gap-1.5 border-b pb-1 text-body no-underline stagger transition-colors duration-120 ease-e hover:text-ink"
      :class="link.id === active ? 'border-ink text-ink' : 'border-transparent text-faint'"
    >
      {{ link.label }}
      <span class="text-meta text-faint tabular-nums">{{ link.count }}</span>
    </RouterLink>
  </nav>
</template>
