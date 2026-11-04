<script setup lang="ts">
/**
 * Las filas de Tendencias: el título de la nota grande a la izquierda y a la derecha la fuente, el
 * sitio al que lleva el enlace, el estado, la afinidad y la fecha real en que la detectó el radar
 * (sin fecha, no se inventa una). Es un listbox: un enlace adentro de una opción no se alcanza con
 * el teclado, así que la nota original se abre desde el registro.
 */
import type { Trend } from '@shared/radarContracts'
import { computed, ref } from 'vue'
import Listbox from '../../ui/Listbox.vue'
import type { ListboxItem } from '../../ui/listbox'
import Mono from '../../ui/Mono.vue'
import StatusDot from '../../ui/StatusDot.vue'
import { radar } from './dict'
import { hostOf, relevanceOf, shortDay, sourceOf, trendStatusOf, trendTitle } from './model'

const props = defineProps<{ trends: readonly Trend[] }>()

const emit = defineEmits<{ open: [row: Trend, title: HTMLElement | null] }>()
const active = defineModel<string | null>('active', { default: null })

interface Row extends ListboxItem {
  key: string
  trend: Trend
  host: string | null
  relevance: string | null
  day: string | null
}

const rows = computed<Row[]>(() => props.trends.map(row => ({
  key: row.id,
  title: trendTitle(row),
  meta: sourceOf(row),
  trend: row,
  host: hostOf(row),
  relevance: relevanceOf(row),
  day: shortDay(row.detected_at),
})))

const root = ref<HTMLElement | null>(null)

function onActivate(row: Row): void {
  const title = root.value?.querySelector<HTMLElement>(`[data-title="${CSS.escape(row.key)}"]`) ?? null
  emit('open', row.trend, title)
}
</script>

<template>
  <div ref="root">
    <Listbox v-model:active="active" :items="rows" :label="radar.listLabel" @activate="onActivate">
      <template #default="{ item }">
        <span
          class="w-fit max-w-full min-w-0 text-list text-ink transition-transform duration-700 ease-e wrap-break-word group-hover/row:translate-x-3.5"
          :data-title="item.key"
        >{{ item.title }}</span>
        <span class="flex flex-wrap items-baseline justify-start gap-x-4.5 gap-y-1 text-left text-body text-dim lg:justify-end lg:text-right">
          <span v-if="item.meta">{{ item.meta }}</span>
          <Mono v-if="item.host" size="label" class="text-faint">{{ item.host }}</Mono>
          <StatusDot :tone="trendStatusOf(item.trend).tone" :label="trendStatusOf(item.trend).label" />
          <span v-if="item.relevance" class="text-dim tabular-nums">{{ item.relevance }}</span>
          <span v-if="item.day" class="shrink-0 text-faint tabular-nums">{{ item.day }}</span>
        </span>
      </template>
    </Listbox>
  </div>
</template>
