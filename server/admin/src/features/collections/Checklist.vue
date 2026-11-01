<script setup lang="ts">
/**
 * Lo que conviene tener antes de publicar, ítem por ítem con su punto y su palabra. Cada faltante lleva
 * a su campo con ?campo= (el editor abre la sección y pone el foco ahí). Los ítems los da el modelo.
 */
import { RouterLink, useRoute } from 'vue-router'
import type { ChecklistItem } from '../../models/types'
import Icon from '../../ui/Icon.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { collections } from './dict'

defineProps<{ items: readonly ChecklistItem[] }>()
defineEmits<{ navigate: [] }>()

const route = useRoute()
const t = collections.publish
</script>

<template>
  <ul class="m-0 grid list-none gap-0 border-t border-rule p-0">
    <li
      v-for="item in items"
      :key="item.id"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-rule py-2.5"
    >
      <span class="grid gap-0.5">
        <span class="text-body" :class="item.done ? 'text-dim' : 'text-ink'">{{ item.label }}</span>
        <StatusDot :tone="item.done ? 'ok' : 'wip'" :label="item.done ? t.done : t.pending" />
      </span>
      <RouterLink
        v-if="!item.done"
        :to="{ query: { ...route.query, campo: item.field } }"
        class="inline-flex items-center gap-1 rounded-control text-label text-dim no-underline transition-colors duration-120 ease-e hover:text-ink"
        @click="$emit('navigate')"
      >
        {{ t.complete }}
        <Icon name="arrow-right" :size="14" />
        <span class="sr-only">: {{ item.label }}</span>
      </RouterLink>
    </li>
  </ul>
</template>
